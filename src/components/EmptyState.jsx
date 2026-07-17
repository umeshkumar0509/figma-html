import { ImageIcon } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white">
        <ImageIcon size={26} className="text-muted" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-heading">Start Generating</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-body">
        Upload a screenshot to get started — Content JSON is optional — or select a template from the dropdown
        above.
      </p>
    </div>
  );
}
