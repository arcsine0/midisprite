import { MidiImportPanel } from "../features/midi-import/MidiImportPanel";
import { PreviewPanel } from "../features/preview/PreviewPanel";

export function App() {
  return (
    <main className="studio-shell" data-theme="dark">
      <aside aria-label="Controls" className="studio-sidebar">
        <header className="studio-brand">
          <h1>Midisprite</h1>
        </header>
        <div className="studio-sidebar-scroll">
          <MidiImportPanel />
        </div>
      </aside>
      <PreviewPanel />
    </main>
  );
}
