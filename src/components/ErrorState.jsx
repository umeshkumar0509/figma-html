import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEmailStore } from "../store/useEmailStore";

export default function ErrorState({ message }) {
  const reset = useEmailStore((s) => s.reset);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
        <AlertTriangle size={26} className="text-red-500" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-heading">Generation failed</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-body">{message}</p>
      <button
        onClick={reset}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-body transition hover:border-accent-400 hover:text-accent-700"
      >
        <RotateCcw size={14} />
        Start over
      </button>
    </div>
  );
}
