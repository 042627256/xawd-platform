import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowUpRight, Bell, Brain, ChevronRight, Command, FileText,
  FolderKanban, LayoutDashboard, Menu, MessageSquare, Plus, Search,
  ShieldCheck, Sparkles, Wallet, X, LogOut, Lock, Mail, Bot
} from "lucide-react";
import "./styles.css";

const nav = [
  ["Overview", <LayoutDashboard />],
  ["AI Studio", <Brain />],
  ["Projects", <FolderKanban />],
  ["Files", <FileText />],
  ["Automation", <Sparkles />]
];

const cards = [
  ["AI Studio", "Orchestrate models, prompts and tools from one place.", "12 active workflows", <Brain />],
  ["Projects", "Keep context, files and conversations together.", "8 projects", <FolderKanban />],
  ["Automation", "Turn repeatable work into controlled workflows.", "3 running", <Sparkles />],
  ["Security", "Monitor account and system protection.", "All systems normal", <ShieldCheck />]
];

function AuthView({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses permintaan");

      if (isRegister) {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        onAuthSuccess(loginData.user);
      } else {
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080b14", color: "#fff", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "380px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>X</div>
          <span style={{ fontSize: "18px", fontWeight: "700" }}>XAWD</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>{isRegister ? "Create an account" : "Welcome back"}</h2>
        {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#fff" }} />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#fff" }} />
          <button type="submit" disabled={loading} style={{ padding: "12px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "600", cursor: "pointer" }}>{loading ? "..." : isRegister ? "Sign Up" : "Sign In"}</button>
        </form>
        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontWeight: "600" }}>{isRegister ? "Sign in" : "Register"}</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState("Overview");

  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setCurrentUser(data.user);
        fetch("/api/ai/models")
          .then(r => r.json())
          .then(m => {
            if (m.data && Array.isArray(m.data)) {
              const list = m.data.map((x: any) => x.id);
              setModels(list);
              if (list.length > 0) setSelectedModel(list[0]);
            }
          })
          .catch(() => {});
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
  };

  const handleRunAi = async () => {
    if (!prompt) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedModel })
      });
      const data = await res.json();
      setAiResponse(data.reply || data.error || "No response");
    } catch (e: any) {
      setAiResponse("Error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (checkingAuth) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080b14", color: "#6366f1" }}>Loading workspace...</div>;
  if (!currentUser) return <AuthView onAuthSuccess={setCurrentUser} />;

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
              <div className="avatar">{currentUser.email?.[0]?.toUpperCase() || "U"}</div>
              <div style={{ overflow: "hidden" }}>
                <b style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email?.split("@")[0]}</b>
                <small>{currentUser.email}</small>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="icon menu" onClick={() => setMobile(true)}><Menu /></button>
          <div className="crumb">{active} <ChevronRight /> <span>workspace</span></div>
          <div className="headerActions">
            <div className="avatar">{currentUser.email?.[0]?.toUpperCase() || "U"}</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">YOUR COMMAND CENTER</span>
              <h1>Build something meaningful.</h1>
              <p>Multi-model AI workspace connected to your 9router instance.</p>
            </div>
          </div>

          <section className="aiPanel">
            <div className="aiTop" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="aiTitle">
                <div className="aiIcon"><Sparkles /></div>
                <div><b>9router Command Center</b><small>Select model or combo below</small></div>
              </div>

              {models.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  style={{ background: "#1e1f2e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "6px 12px", borderRadius: "8px", outline: "none", fontSize: "13px" }}
                >
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter model id"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  style={{ background: "#1e1f2e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px" }}
                />
              )}
            </div>

            <textarea
              id="command"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Tell 9router what you want to generate or analyze..."
            />

            <div className="aiBottom">
              <div className="chips">
                <button onClick={() => setPrompt("Summarize this text in 3 bullet points: ")}>Summarize</button>
                <button onClick={() => setPrompt("Write a system design blueprint for: ")}>System Design</button>
                <button onClick={() => setPrompt("Analyze code performance for: ")}>Code Audit</button>
              </div>
              <button className="run" onClick={handleRunAi} disabled={aiLoading}>
                {aiLoading ? "Thinking..." : "Run"} <ArrowUpRight />
              </button>
            </div>

            {aiResponse && (
              <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "#818cf8", fontSize: "12px", fontWeight: "600" }}>
                  <Bot size={14} /> Output ({selectedModel || "default"}):
                </div>
                {aiResponse}
              </div>
            )}
          </section>

          <div className="sectionHead"><div><h2>Workspace overview</h2><span>Live product signals</span></div></div>
          <section className="cards">
            {cards.map(([title, desc, meta, icon]) => (
              <div className="card" key={title as string}>
                <div className="cardIcon">{icon}</div>
                <h3>{title as string}</h3>
                <p>{desc as string}</p>
                <div className="meta"><span>{meta as string}</span><ArrowUpRight /></div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
