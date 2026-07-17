import { useState } from "react";
import { Eye, Code2, Download, Copy, Check, RotateCcw } from "lucide-react";
import { useEmailStore } from "../store/useEmailStore";
import { downloadHtmlFile, copyToClipboard } from "../utils/fileHelpers";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-white text-heading shadow-sm" : "text-body hover:text-heading"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export default function RightPanel() {
  const turns = useEmailStore((s) => s.turns);
  const activeTurnId = useEmailStore((s) => s.activeTurnId);
  const activeTab = useEmailStore((s) => s.activeTab);
  const setActiveTab = useEmailStore((s) => s.setActiveTab);
  const reset = useEmailStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  const activeTurn = turns.find((t) => t.id === activeTurnId);
  const showTopBar = activeTurn?.status === "done";

  const handleCopy = async () => {
    const ok = await copyToClipboard(activeTurn.html);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {showTopBar && (
        <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-1 rounded-lg bg-panel p-1">
            <TabButton active={activeTab === "preview"} onClick={() => setActiveTab("preview")} icon={Eye} label="Preview" />
            <TabButton active={activeTab === "code"} onClick={() => setActiveTab("code")} icon={Code2} label="Code" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-body transition hover:border-accent-400 hover:text-accent-700"
            >
              <RotateCcw size={14} />
              New
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-body transition hover:border-accent-400 hover:text-accent-700"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => downloadHtmlFile(activeTurn.html, "email-template.html")}
              className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-600"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto bg-panel">
        {!activeTurn && <EmptyState />}
        {activeTurn?.status === "working" && <LoadingState message={activeTurn.statusMessage} />}
        {activeTurn?.status === "error" && <ErrorState message={activeTurn.error} />}
        {activeTurn?.status === "done" &&
          (activeTab === "preview" ? (
            <div className="flex justify-center px-6 py-8">
              <div className="w-full max-w-[640px] rounded-lg border border-border bg-white p-4 shadow-sm">
                <iframe
                  title="Email preview"
                  srcDoc={activeTurn.html}
                  sandbox=""
                  className="h-[720px] w-full rounded border border-border-soft"
                />
              </div>
            </div>
          ) : (
            <pre className="code-scroll h-full overflow-auto p-5 text-[13px] leading-relaxed">
              <code className="whitespace-pre-wrap break-words font-mono text-heading">{activeTurn.html}</code>
            </pre>
          ))}
      </div>
    </div>
  );
}
