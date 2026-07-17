import { Loader2 } from "lucide-react";

const FULL_PIPELINE_STEPS = [
  "Reading screenshot…",
  "Analyzing layout, colors & typography…",
  "Compiling the HTML email template…",
];

export default function LoadingState({ message }) {
  const activeIndex = FULL_PIPELINE_STEPS.indexOf(message);
  const isFullPipeline = activeIndex !== -1;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-100 bg-accent-50">
        <Loader2 size={26} className="animate-spin text-accent-600" strokeWidth={2} />
      </div>
      <h2 className="text-lg font-semibold text-heading">{message || "Working…"}</h2>
      {isFullPipeline && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {FULL_PIPELINE_STEPS.map((step, i) => (
            <li
              key={step}
              className={
                i < activeIndex
                  ? "text-body line-through decoration-muted/60"
                  : i === activeIndex
                  ? "font-medium text-accent-700"
                  : "text-muted"
              }
            >
              {step}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
