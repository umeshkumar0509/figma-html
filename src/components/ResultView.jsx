import { useState } from "react";
import { Eye, Code2, Download, Copy, Check, RotateCcw } from "lucide-react";
import { useEmailStore } from "../store/useEmailStore";
import { downloadHtmlFile, copyToClipboard } from "../utils/fileHelpers";

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

export default function ResultView() {
  const activeTab = useEmailStore((s) => s.activeTab);
  const setActiveTab = useEmailStore((s) => s.setActiveTab);
  const generatedHtml = useEmailStore((s) => s.generatedHtml);
  const reset = useEmailStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(generatedHtml);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="flex h-full flex-col">
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
            onClick={() => downloadHtmlFile(generatedHtml, "email-template.html")}
            className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-600"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-panel">
        {activeTab === "preview" ? (
          <div className="flex justify-center px-6 py-8">
            <div className="w-full max-w-[640px] rounded-lg border border-border bg-white p-4 shadow-sm">
              <iframe
                title="Email preview"
                srcDoc={generatedHtml}
                sandbox=""
                className="h-[720px] w-full rounded border border-border-soft"
              />
            </div>
          </div>
        ) : (
          <pre className="code-scroll h-full overflow-auto p-5 text-[13px] leading-relaxed">
            <code className="whitespace-pre-wrap break-words font-mono text-heading">{generatedHtml}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
