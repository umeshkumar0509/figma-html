import { useRef } from "react";
import { ImageIcon, FileJson, Send, X, Loader2, AlertCircle } from "lucide-react";
import { useEmailStore } from "../store/useEmailStore";
import { formatBytes } from "../utils/fileHelpers";

function FileChip({ label, sublabel, onRemove, tone = "default" }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
        tone === "error" ? "border-red-200 bg-red-50 text-red-600" : "border-border bg-white text-heading"
      }`}
    >
      <span className="max-w-[140px] truncate font-medium">{label}</span>
      {sublabel && <span className="text-muted">{sublabel}</span>}
      <button onClick={onRemove} className="text-muted transition hover:text-heading" aria-label={`Remove ${label}`}>
        <X size={13} />
      </button>
    </div>
  );
}

export default function Composer() {
  const screenshotFile = useEmailStore((s) => s.screenshotFile);
  const setScreenshotFile = useEmailStore((s) => s.setScreenshotFile);
  const jsonFile = useEmailStore((s) => s.jsonFile);
  const jsonError = useEmailStore((s) => s.jsonError);
  const setJsonFile = useEmailStore((s) => s.setJsonFile);
  const promptText = useEmailStore((s) => s.promptText);
  const setPromptText = useEmailStore((s) => s.setPromptText);
  const turns = useEmailStore((s) => s.turns);
  const composerError = useEmailStore((s) => s.composerError);
  const generateTemplate = useEmailStore((s) => s.generateTemplate);

  const screenshotInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const isWorking = turns.some((t) => t.status === "working");
  const hasDoneTurn = turns.some((t) => t.status === "done" && t.html);
  const canGenerate = (Boolean(screenshotFile) || hasDoneTurn) && !isWorking;

  const handleSend = () => {
    if (!canGenerate) return;
    generateTemplate();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-panel px-4 py-3.5">
      <div className="flex flex-col gap-2.5">
        {composerError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle size={14} className="shrink-0" />
            {composerError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={screenshotInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files[0] && setScreenshotFile(e.target.files[0])}
          />
          <input
            ref={jsonInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => e.target.files[0] && setJsonFile(e.target.files[0])}
          />

          {screenshotFile && (
            <FileChip
              label={screenshotFile.name}
              sublabel={formatBytes(screenshotFile.size)}
              onRemove={() => setScreenshotFile(null)}
            />
          )}
          {jsonFile && (
            <FileChip
              label={jsonFile.name}
              sublabel={jsonError ? "invalid JSON" : formatBytes(jsonFile.size)}
              onRemove={() => setJsonFile(null)}
              tone={jsonError ? "error" : "default"}
            />
          )}

          {!screenshotFile && (
            <button
              onClick={() => screenshotInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-heading shadow-sm transition hover:border-accent-400 hover:text-accent-700"
            >
              <ImageIcon size={15} className="text-muted" />
              Screenshot
            </button>
          )}
          {!jsonFile && (
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-heading shadow-sm transition hover:border-accent-400 hover:text-accent-700"
            >
              <FileJson size={15} className="text-muted" />
              Content JSON
              <span className="text-[10px] font-normal text-muted">optional</span>
            </button>
          )}
        </div>

        <div className="flex items-end gap-2.5 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-sm focus-within:border-accent-400">
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              hasDoneTurn && !screenshotFile
                ? "Ask for a change, e.g. \"make the CTA red\"…"
                : "Describe the email template you'd like to create…"
            }
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-heading placeholder:text-muted focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!canGenerate}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-400 text-white shadow-sm transition enabled:hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Generate template"
          >
            {isWorking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        <p className="px-1 text-xs text-muted">
          {hasDoneTurn
            ? "Type to refine the current template, or attach a new screenshot to generate a separate one — the preview updates once it's ready."
            : "Upload a screenshot to analyze its design. Content JSON is optional — Gemini fills in sensible placeholder copy if you skip it."}
        </p>
      </div>
    </div>
  );
}
