import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown, Trash2 } from "lucide-react";
import { useEmailStore } from "../store/useEmailStore";

export default function Header() {
  const savedTemplates = useEmailStore((s) => s.savedTemplates);
  const loadSavedTemplate = useEmailStore((s) => s.loadSavedTemplate);
  const deleteSavedTemplate = useEmailStore((s) => s.deleteSavedTemplate);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-border bg-cream px-6 py-3.5 shrink-0">
      <div className="flex items-center font-semibold text-lg tracking-tight select-none">
        <span className="text-brand-blue">&lt;</span>
        <span className="text-ink">mailr</span>
        <span className="text-brand-blue">/&gt;</span>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium text-heading shadow-sm transition hover:border-accent-400 hover:text-accent-700"
        >
          <FileText size={16} className="text-muted" />
          Select Template
          <ChevronDown size={16} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            {savedTemplates.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Templates you generate will be saved here.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto code-scroll">
                {savedTemplates.map((t) => (
                  <li
                    key={t.id}
                    className="group flex items-center justify-between gap-2 border-b border-border-soft px-3.5 py-2.5 last:border-b-0 hover:bg-panel"
                  >
                    <button
                      onClick={() => {
                        loadSavedTemplate(t.id);
                        setOpen(false);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-heading">{t.name}</p>
                      <p className="text-xs text-muted">{new Date(t.createdAt).toLocaleString()}</p>
                    </button>
                    <button
                      onClick={() => deleteSavedTemplate(t.id)}
                      className="shrink-0 rounded-md p-1.5 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
