import Header from "./components/Header";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-cream">
      <Header />
      <main className="flex min-h-0 flex-1">
        <LeftPanel />
        <RightPanel />
      </main>
    </div>
  );
}
