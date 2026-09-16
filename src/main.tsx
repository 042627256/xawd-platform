import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight, Brain, ChevronRight,
  FolderKanban, LayoutDashboard, Menu, Plus,
  ShieldCheck, Sparkles, Wallet, X, LogOut, Bot, SlidersHorizontal
} from "lucide-react";
import "./styles.css";

const nav = [
  ["Overview", <LayoutDashboard />],
  ["AI Studio", <Brain />],
  ["Projects", <FolderKanban />],
  ["Automation", <Sparkles />]
];

const availableModels = [
  { id: "gpt-4o-mini", label: "AWD Standard (GPT-4o Mini)" },
  { id: "gpt-4o", label: "AWD Pro (GPT-4o)" },
  { id: "claude-3-5-sonnet", label: "AWD Sonnet" },
  { id: "Comku", label: "Comku Combo" }
];

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState("Overview");

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [showCustomModel, setShowCustomModel] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleRunAi = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedModel })
      });
      const data = await res.json();
      setAiResponse(data.reply || data.error || "No response received.");
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
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080b14", color: "#6366f1" }}>Loading workspace...</div>;
  }

  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brandmark">X</div>
          <b>XAWD</b>
          <button className="icon close" onClick={() => setMobile(false)}><X /></button>
        </div>
        <button className="newBtn"><Plus /> New workspace</button>
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
                <b style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.email?.split("@")[0] || "Workspace"}</b>
                <small>{currentUser?.email || "Connected"}</small>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="icon menu" onClick={() => setMobile(true)}><Menu /></button>
          <div className="crumb">{active} <ChevronRight /> <span>AWD workspace</span></div>
          <div className="headerActions">
            <div className="avatar">{currentUser?.email?.[0]?.toUpperCase() || "A"}</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">AWD PLATFORM</span>
              <h1>Build something meaningful.</h1>
              <p>Everything you need to think, create and automate — in one calm workspace.</p>
            </div>
          </div>

          <section className="aiPanel">
            <div className="aiTop" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="aiTitle">
                <div className="aiIcon"><Sparkles /></div>
                <div><b>AWD Command Center</b><small>Intelligent multi-model system</small></div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  style={{
                    background: "#181b2a",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    outline: "none",
                    fontSize: "13px"
                  }}
                >
                  {availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowCustomModel(!showCustomModel)}
                  title="Custom / Combo Model ID"
                  style={{
                    background: showCustomModel ? "#6366f1" : "rgba(255,255,255,0.08)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "7px",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <SlidersHorizontal size={14} />
                </button>
              </div>
            </div>

            {showCustomModel && (
              <div style={{ padding: "8px 0" }}>
                <input
                  type="text"
                  placeholder="Masukkan Model ID kustom (contoh: Comku)"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "#121422",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            )}

            <textarea
              id="command"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Tell AWD what you want to accomplish..."
            />

            <div className="aiBottom">
              <div className="chips">
                <button onClick={() => setPrompt("Buatkan ringkasan singkat dalam 3 poin: ")}>Summarize</button>
                <button onClick={() => setPrompt("Rancang arsitektur sistem untuk: ")}>System Design</button>
                <button onClick={() => setPrompt("Analisis performa kode berikut: ")}>Code Audit</button>
              </div>
              <button className="run" onClick={handleRunAi} disabled={aiLoading}>
                {aiLoading ? "Thinking..." : "Run"} <ArrowUpRight />
              </button>
            </div>

            {aiResponse && (
              <div style={{
                marginTop: "16px",
                padding: "16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "#818cf8", fontSize: "12px", fontWeight: "600" }}>
                  <Bot size={14} /> Output ({selectedModel}):
                </div>
                {aiResponse}
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
