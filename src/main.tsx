import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight, Brain, ChevronRight,
  FolderKanban, LayoutDashboard, Menu, Plus,
  Sparkles, LogOut, Bot, ImageIcon, MessageSquareText
} from "lucide-react";
import "./styles.css";

const nav = [
  ["Overview", <LayoutDashboard />],
  ["AI Studio", <Brain />],
  ["Projects", <FolderKanban />],
  ["Automation", <Sparkles />]
];

const textModels = [
  { id: "Comku", label: "AWD Standard (ChatGPT Style)" },
  { id: "ag/gemini-3.8-flash-high", label: "AWD Pro (High Reasoning)" },
  { id: "ag/claude-opus-4-6-thinking", label: "AWD Deep Thinking (Opus)" },
  { id: "ag/claude-sonnet-4-6", label: "AWD Sonnet Agent" }
];

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState("Overview");

  // Mode: 'text' atau 'image'
  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Comku");
  const [aiResponse, setAiResponse] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    setGeneratedImage("");

    try {
      if (mode === "text") {
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, model: selectedModel })
        });
        const data = await res.json();
        setAiResponse(data.reply || data.error || "Tidak ada balasan.");
      } else {
        // Mode Gambar (Flux AI)
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImage(data.imageUrl);
        } else {
          setAiResponse(data.error || "Gagal membuat gambar.");
        }
      }
    } catch (e: any) {
      setAiResponse("Error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  };

  if (checkingAuth) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080b14", color: "#6366f1" }}>Memuat ruang kerja AWD...</div>;
  }

  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brandmark">X</div>
          <b>XAWD</b>
          <button className="icon close" onClick={() => setMobile(false)}>✕</button>
        </div>
        <button className="newBtn"><Plus /> Ruang Kerja Baru</button>
        <div className="nav">
          {nav.map(([label, icon]) => (
            <button key={label as string} className={active === label ? "navItem active" : "navItem"} onClick={() => { setActive(label as string); setMobile(false); }}>
              {icon}
              <span>{label as string}</span>
            </button>
          ))}
        </div>
        <div className="sidebarBottom">
          <div className="profile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="avatar">{currentUser?.email?.[0]?.toUpperCase() || "A"}</div>
              <div style={{ overflow: "hidden" }}>
                <b style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.email?.split("@")[0] || "Akun AWD"}</b>
                <small>{currentUser?.email || "Online"}</small>
              </div>
            </div>
            <button onClick={handleLogout} title="Keluar" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="icon menu" onClick={() => setMobile(true)}><Menu /></button>
          <div className="crumb">{active} <ChevronRight /> <span>AWD Command</span></div>
          <div className="headerActions">
            <div className="avatar">{currentUser?.email?.[0]?.toUpperCase() || "A"}</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">WORKSPACE CERDAS AWD</span>
              <h1>Bangun sesuatu yang bermakna.</h1>
              <p>Buat percakapan cerdas atau generate gambar 3D / realistis langsung dari sini.</p>
            </div>
          </div>

          <section className="aiPanel">
            <div className="aiTop" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div className="aiTitle">
                <div className="aiIcon"><Sparkles /></div>
                <div><b>AWD Command Center</b><small>{mode === "text" ? "Mode Obrolan & Analisis" : "Mode Generator Gambar (Flux)"}</small></div>
              </div>

              {/* Switcher Tab: Text vs Image */}
              <div style={{ display: "flex", background: "#121422", padding: "4px", borderRadius: "10px", gap: "4px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => { setMode("text"); setGeneratedImage(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: mode === "text" ? "#6366f1" : "transparent",
                    color: "#fff", border: "none", padding: "6px 12px", borderRadius: "7px", cursor: "pointer", fontSize: "12px", fontWeight: "600"
                  }}
                >
                  <MessageSquareText size={14} /> Teks
                </button>
                <button
                  onClick={() => { setMode("image"); setAiResponse(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: mode === "image" ? "#6366f1" : "transparent",
                    color: "#fff", border: "none", padding: "6px 12px", borderRadius: "7px", cursor: "pointer", fontSize: "12px", fontWeight: "600"
                  }}
                >
                  <ImageIcon size={14} /> Buat Gambar
                </button>
              </div>
            </div>

            {mode === "text" && (
              <div style={{ marginTop: "12px" }}>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  style={{
                    background: "#181b2a",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    outline: "none",
                    fontSize: "13px",
                    width: "100%"
                  }}
                >
                  {textModels.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              id="command"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={mode === "text" ? "Beritahu AWD apa yang ingin Anda analisis atau tulis..." : "Contoh: Profil 3D Pixar logo huruf X AWD bersinar, sinematik, render blender 8k..."}
              style={{ marginTop: "12px" }}
            />

            <div className="aiBottom">
              <div className="chips">
                {mode === "text" ? (
                  <>
                    <button onClick={() => setPrompt("Ringkas bahasan berikut: ")}>Ringkas</button>
                    <button onClick={() => setPrompt("Rancang skema sistem untuk: ")}>Desain Sistem</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setPrompt("Karakter 3D animasi gaya Pixar untuk profil X AWD, pencahayaan studio sinematik")}>Gaya 3D Pixar</button>
                    <button onClick={() => setPrompt("Foto futuristik logo teknologi neon X AWD, latar belakang cyber gelap 8k")}>Cyber Neon</button>
                  </>
                )}
              </div>
              <button className="run" onClick={handleExecute} disabled={aiLoading}>
                {aiLoading ? "Memproses..." : "Run"} <ArrowUpRight />
              </button>
            </div>

            {/* Hasil Output Teks */}
            {aiResponse && (
              <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "#818cf8", fontSize: "12px", fontWeight: "600" }}>
                  <Bot size={14} /> Respon AWD:
                </div>
                {aiResponse}
              </div>
            )}

            {/* Hasil Output Gambar */}
            {generatedImage && (
              <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ color: "#818cf8", fontSize: "13px", fontWeight: "600" }}>Hasil Gambar AI (Flux):</span>
                  <a href={generatedImage} download="awd-generated.jpg" style={{ color: "#6366f1", fontSize: "12px", textDecoration: "underline" }}>Unduh Gambar</a>
                </div>
                <img src={generatedImage} alt="AI Generated" style={{ maxWidth: "100%", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
