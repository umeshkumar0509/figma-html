import { ImageIcon, FileJson, Loader2, AlertCircle } from "lucide-react";
import { formatBytes } from "../utils/fileHelpers";

function AttachmentChip({ name, size }) {
  const Icon = name.toLowerCase().endsWith(".json") ? FileJson : ImageIcon;
  return (
    <span className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-heading">
      <Icon size={12} className="text-muted" />
      <span className="max-w-[150px] truncate font-medium">{name}</span>
      <span className="text-muted">{formatBytes(size)}</span>
    </span>
  );
}

export default function TurnMessage({ turn, isActive, onSelect }) {
  return (
    <div className="px-4 py-3">
      {turn.attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {turn.attachments.map((a) => (
            <AttachmentChip key={a.name} name={a.name} size={a.size} />
          ))}
        </div>
      )}

      {turn.prompt && (
        <div className="mb-2 inline-block max-w-[90%] rounded-2xl rounded-tl-sm bg-bubble px-3.5 py-2.5 text-sm leading-relaxed text-heading">
          {turn.prompt}
        </div>
      )}

      <button
        onClick={() => turn.status === "done" && onSelect(turn.id)}
        disabled={turn.status !== "done"}
        className={`block w-full text-left text-sm leading-relaxed ${
          turn.status === "done" ? "cursor-pointer" : "cursor-default"
        } ${
          turn.status === "error"
            ? "text-red-600"
            : isActive
            ? "font-medium text-accent-700"
            : "text-body hover:text-heading"
        }`}
      >
        {turn.status === "working" && (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 size={13} className="animate-spin" />
            {turn.statusMessage}
          </span>
        )}
        {turn.status === "done" && <span className="whitespace-pre-line">{turn.statusMessage}</span>}
        {turn.status === "error" && (
          <span className="flex items-start gap-1.5">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            {turn.error}
          </span>
        )}
      </button>
    </div>
  );
}
