import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 bg-grid relative">
      {/* Ambient glow orbs */}
      <div
        className="orb-glow"
        style={{
          width: "400px",
          height: "400px",
          top: "-100px",
          right: "-100px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb-glow"
        style={{
          width: "300px",
          height: "300px",
          bottom: "10%",
          left: "20%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)",
          animationDelay: "4s",
        }}
      />

      <Sidebar />
      <main className="ml-60 min-h-screen relative">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
