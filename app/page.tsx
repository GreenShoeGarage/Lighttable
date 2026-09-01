export default function Home() {
  return (
    <main className="instrument-shell">
      <iframe
        className="instrument-frame"
        src="/lighttable.html"
        title="LIGHTTABLE PCB manufacturing data workbench"
      />
      <noscript>
        <p>LIGHTTABLE requires JavaScript for local file parsing and rendering.</p>
      </noscript>
    </main>
  );
}
