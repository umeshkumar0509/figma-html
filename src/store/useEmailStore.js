import { create } from "zustand";
import { readJsonFile } from "../utils/fileHelpers";
import { analyzeScreenshot, generateEmailHtml, refineEmailHtml } from "../services/geminiService";

const SAVED_TEMPLATES_KEY = "mailr.savedTemplates";

function loadSavedTemplates() {
  try {
    const raw = localStorage.getItem(SAVED_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedTemplates(templates) {
  try {
    localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // storage full or unavailable — non-fatal, just skip persistence
  }
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export const useEmailStore = create((set, get) => ({
  // --- staged composer state (not yet sent) ---
  screenshotFile: null,
  screenshotPreviewUrl: null,
  jsonFile: null,
  jsonContent: null,
  jsonError: null,
  promptText: "",
  composerError: null,

  // --- conversation ---
  // turn: { id, prompt, attachments: [{name, size}], status: 'working'|'done'|'error',
  //         statusMessage, error, designAnalysis, contentJson, html, createdAt }
  turns: [],
  activeTurnId: null,
  activeTab: "preview", // "preview" | "code"

  // --- saved templates (Select Template dropdown, persisted across sessions) ---
  savedTemplates: loadSavedTemplates(),

  setScreenshotFile: (file) => {
    const prev = get().screenshotPreviewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      screenshotFile: file,
      screenshotPreviewUrl: file ? URL.createObjectURL(file) : null,
      composerError: null,
    });
  },

  setJsonFile: async (file) => {
    if (!file) {
      set({ jsonFile: null, jsonContent: null, jsonError: null });
      return;
    }
    try {
      const content = await readJsonFile(file);
      set({ jsonFile: file, jsonContent: content, jsonError: null, composerError: null });
    } catch (err) {
      set({ jsonFile: file, jsonContent: null, jsonError: err.message });
    }
  },

  setPromptText: (text) => set({ promptText: text }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveTurn: (id) => set({ activeTab: "preview", activeTurnId: id }),

  clearComposer: () => {
    const prev = get().screenshotPreviewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      screenshotFile: null,
      screenshotPreviewUrl: null,
      jsonFile: null,
      jsonContent: null,
      jsonError: null,
      promptText: "",
    });
  },

  /** Full reset — starts a fresh conversation ("New" button). */
  reset: () => {
    const prev = get().screenshotPreviewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      screenshotFile: null,
      screenshotPreviewUrl: null,
      jsonFile: null,
      jsonContent: null,
      jsonError: null,
      promptText: "",
      composerError: null,
      turns: [],
      activeTurnId: null,
      activeTab: "preview",
    });
  },

  updateTurn: (id, patch) =>
    set((state) => ({
      turns: state.turns.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  generateTemplate: async () => {
    const { screenshotFile, jsonContent, jsonFile, promptText, turns } = get();
    const previousDoneTurn = [...turns].reverse().find((t) => t.status === "done" && t.html);
    const isRefinement = !screenshotFile && Boolean(previousDoneTurn);

    if (!screenshotFile && !previousDoneTurn) {
      set({ composerError: "Upload a reference screenshot first." });
      return;
    }
    if (jsonFile && !jsonContent) {
      set({ composerError: "The uploaded JSON file couldn't be parsed. Fix it and try again." });
      return;
    }

    const turn = {
      id: uid(),
      prompt: promptText.trim(),
      attachments: [screenshotFile, jsonFile].filter(Boolean).map((f) => ({ name: f.name, size: f.size })),
      status: "working",
      statusMessage: isRefinement ? "Applying your changes…" : "Starting…",
      error: null,
      designAnalysis: previousDoneTurn?.designAnalysis ?? null,
      contentJson: jsonContent ?? previousDoneTurn?.contentJson ?? {},
      html: null,
      createdAt: Date.now(),
    };

    set((state) => ({
      turns: [...state.turns, turn],
      activeTurnId: turn.id,
      activeTab: "preview",
      composerError: null,
    }));
    get().clearComposer();

    const onProgress = (msg) => get().updateTurn(turn.id, { statusMessage: msg });

    try {
      let html;
      let designAnalysis = turn.designAnalysis;

      if (isRefinement) {
        html = await refineEmailHtml(
          { previousHtml: previousDoneTurn.html, contentJson: turn.contentJson, userInstructions: turn.prompt },
          { onProgress }
        );
      } else {
        designAnalysis = await analyzeScreenshot(screenshotFile, { onProgress });
        html = await generateEmailHtml(
          { designAnalysis, contentJson: turn.contentJson, userInstructions: turn.prompt },
          { onProgress }
        );
      }

      get().updateTurn(turn.id, {
        status: "done",
        statusMessage: "Analysis done....\nMailer generated succesfully.",
        designAnalysis,
        html,
      });

      const templates = [
        {
          id: uid(),
          name: turn.prompt || `Template ${new Date().toLocaleString()}`,
          html,
          createdAt: Date.now(),
        },
        ...get().savedTemplates,
      ].slice(0, 20);
      set({ savedTemplates: templates });
      persistSavedTemplates(templates);
    } catch (err) {
      console.error(err);
      get().updateTurn(turn.id, {
        status: "error",
        statusMessage: null,
        error: err.message || "Something went wrong while generating the template.",
      });
    }
  },

  loadSavedTemplate: (id) => {
    const template = get().savedTemplates.find((t) => t.id === id);
    if (!template) return;
    const turn = {
      id: uid(),
      prompt: `Loaded "${template.name}"`,
      attachments: [],
      status: "done",
      statusMessage: "Analysis done....\nMailer generated succesfully.",
      error: null,
      designAnalysis: null,
      contentJson: {},
      html: template.html,
      createdAt: Date.now(),
    };
    set((state) => ({ turns: [...state.turns, turn], activeTurnId: turn.id, activeTab: "preview" }));
  },

  deleteSavedTemplate: (id) => {
    const templates = get().savedTemplates.filter((t) => t.id !== id);
    set({ savedTemplates: templates });
    persistSavedTemplates(templates);
  },
}));
