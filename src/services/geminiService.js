import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64 } from "../utils/fileHelpers";
import {
  DESIGN_ANALYSIS_PROMPT,
  buildDesignAnalysisSchema,
  buildHtmlGenerationPrompt,
  buildHtmlRefinementPrompt,
} from "./promptTemplates";

// "-latest" aliases auto-track Google's current Flash release (multimodal,
// vision-capable) so this doesn't go stale the way a pinned version does.
// Override via .env with a pinned version if you need reproducible output.
const VISION_MODEL = import.meta.env.VITE_GEMINI_VISION_MODEL || "gemini-3.5-flash";
const TEXT_MODEL = import.meta.env.VITE_GEMINI_TEXT_MODEL || "gemini-3.5-flash";

let client = null;

function getClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Add it to a .env file at the project root (see .env.example) and restart the dev server."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Strips ```html / ``` fences if the model wraps its output despite instructions. */
function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

/**
 * Google periodically retires model names/aliases with little warning.
 * Re-throw a clear, actionable message instead of a raw 404 JSON blob.
 */
function rethrowIfModelRetired(err, modelName) {
  const msg = String(err?.message || err);
  if (msg.includes("NOT_FOUND") || msg.includes("404") || msg.includes("no longer available")) {
    throw new Error(
      `Gemini rejected model "${modelName}" (retired or not available on your key's tier). ` +
        `Open https://ai.google.dev/gemini-api/docs/models, pick a current model name, and set ` +
        `VITE_GEMINI_VISION_MODEL / VITE_GEMINI_TEXT_MODEL in .env to it.`
    );
  }
  throw err;
}

/**
 * Stage 1: sends the reference screenshot to Gemini's vision model and gets
 * back a structured design-token JSON (layout, palette, type, spacing).
 */
export async function analyzeScreenshot(imageFile, { onProgress } = {}) {
  onProgress?.("Reading screenshot…");
  const { data, mimeType } = await fileToBase64(imageFile);
  const ai = getClient();

  onProgress?.("Analyzing layout, colors & typography…");
  let response;
  try {
    response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        { inlineData: { mimeType, data } },
        { text: DESIGN_ANALYSIS_PROMPT },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: buildDesignAnalysisSchema(Type),
        temperature: 0.4,
      },
    });
  } catch (err) {
    rethrowIfModelRetired(err, VISION_MODEL);
  }

  return JSON.parse(response.text);
}

/**
 * Stage 2: merges the design analysis with the content JSON and any free-text
 * instructions to produce the final table-based, inline-CSS HTML email.
 */
export async function generateEmailHtml({ designAnalysis, contentJson, userInstructions }, { onProgress } = {}) {
  const ai = getClient();
  onProgress?.("Compiling the HTML email template…");

  let response;
  try {
    response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: buildHtmlGenerationPrompt({ designAnalysis, contentJson, userInstructions }),
      config: {
        temperature: 0.3,
      },
    });
  } catch (err) {
    rethrowIfModelRetired(err, TEXT_MODEL);
  }

  return stripCodeFences(response.text);
}

/**
 * Follow-up turns (no new screenshot attached): edits the previously
 * generated HTML in place per the user's instructions, without re-running
 * the vision analysis stage.
 */
export async function refineEmailHtml({ previousHtml, contentJson, userInstructions }, { onProgress } = {}) {
  const ai = getClient();
  onProgress?.("Applying your changes…");

  let response;
  try {
    response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: buildHtmlRefinementPrompt({ previousHtml, contentJson, userInstructions }),
      config: {
        temperature: 0.3,
      },
    });
  } catch (err) {
    rethrowIfModelRetired(err, TEXT_MODEL);
  }

  return stripCodeFences(response.text);
}
