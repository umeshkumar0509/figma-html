import ConversationThread from "./ConversationThread";
import Composer from "./Composer";

export default function LeftPanel() {
  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-r border-border bg-panel">
      <ConversationThread />
      <Composer />
    </div>
  );
}
