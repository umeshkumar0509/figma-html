import { useEffect, useRef } from "react";
import { useEmailStore } from "../store/useEmailStore";
import TurnMessage from "./TurnMessage";

export default function ConversationThread() {
  const turns = useEmailStore((s) => s.turns);
  const activeTurnId = useEmailStore((s) => s.activeTurnId);
  const setActiveTurn = useEmailStore((s) => s.setActiveTurn);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto code-scroll py-2">
      {turns.map((turn) => (
        <TurnMessage key={turn.id} turn={turn} isActive={turn.id === activeTurnId} onSelect={setActiveTurn} />
      ))}
    </div>
  );
}
