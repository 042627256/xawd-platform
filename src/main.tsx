import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity, ArrowUpRight, Bell, Brain, ChevronRight, Command, FileText,
  FolderKanban, LayoutDashboard, Menu, MessageSquare, Plus, Search,
  ShieldCheck, Sparkles, Wallet, X, LogOut, Lock, Mail
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

      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan");
      }

      if (isRegister) {
        // Otomatis login setelah registrasi
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#080b14",
      color: "#fff",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold"
          }}>X</div>
          <span style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "1px" }}>XAWD</span>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>
          {isRegister ? "Create an account" : "Welcome back"}
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
          {isRegister ? "Sign up to start using the workspace" : "Enter your credentials to access workspace"}
        </p>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "16px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "6px" }}>Email</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@xawd.my.id"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "rgba(255,255,255,0.4)" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "6px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "rgba(255,255,255,0.4)" }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "12px",
              background: "#6366f1",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Processing..." : isRegister ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{
              background: "none",
              border: "none",
              color: "#818cf8",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
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
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080b14", color: "#6366f1" }}>
        Loading workspace...
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onAuthSuccess={(user) => setCurrentUser(user)} />;
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
            <button
              key={label as string}
              className={active === label ? "navItem active" : "navItem"}
              onClick={() => { setActive(label as string); setMobile(false); }}
            >
              {icon}
              <span>{label as string}</span>
            </button>
          ))}
        </div>
        <div className="navLabel">SYSTEM</div>
        <button className="navItem"><Wallet /><span>Wallet</span><em className="soon">Soon</em></button>
        <button className="navItem"><ShieldCheck /><span>Trust Center</span></button>
        <div className="sidebarBottom">
          <div className="plan">
            <span>Free plan</span>
            <b>18%</b>
            <div className="bar"><i /></div>
            <small>Usage resets in 12 days</small>
          </div>
          <div className="profile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="avatar">{currentUser.email?.[0]?.toUpperCase() || "U"}</div>
              <div style={{ overflow: "hidden" }}>
                <b style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email?.split("@")[0]}</b>
                <small>{currentUser.email}</small>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="icon menu" onClick={() => setMobile(true)}><Menu /></button>
          <div className="crumb">{active} <ChevronRight /> <span>workspace</span></div>
          <div className="headerActions">
            <button className="search" onClick={() => (document.getElementById("command") as any)?.focus()}>
              <Search /><span>Search</span><kbd>K</kbd>
            </button>
            <button className="icon"><Bell /></button>
            <div className="avatar">{currentUser.email?.[0]?.toUpperCase() || "U"}</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">YOUR COMMAND CENTER</span>
              <h1>Build something meaningful.</h1>
              <p>Everything you need to think, create and automate — in one calm workspace.</p>
            </div>
            <button className="primary"><Plus /> New project</button>
          </div>

          <section className="aiPanel">
            <div className="aiTop">
              <div className="aiTitle">
                <div className="aiIcon"><Sparkles /></div>
                <div><b>AI Command Center</b><small>Multi-model workspace</small></div>
              </div>
              <span className="live"><i /> Ready</span>
            </div>
            <textarea
              id="command"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Tell XAWD what you want to accomplish..."
            />
            <div className="aiBottom">
              <div className="chips">
                <button>Summarize files</button>
                <button>Build a plan</button>
                <button>Analyze data</button>
              </div>
              <button className="run" onClick={() => setSent(true)}>
                {sent ? "Prepared" : "Run"} <ArrowUpRight />
              </button>
            </div>
            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="notice"
                >
                  <Activity /> Request prepared safely. Connect a server-side provider to enable inference.
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className="sectionHead">
            <div><h2>Workspace overview</h2><span>Live product signals</span></div>
            <button className="textBtn">View all <ChevronRight /></button>
          </div>

          <section className="cards">
            {cards.map(([title, desc, meta, icon]) => (
              <motion.div whileHover={{ y: -3 }} className="card" key={title as string}>
                <div className="cardIcon">{icon}</div>
                <h3>{title as string}</h3>
                <p>{desc as string}</p>
                <div className="meta"><span>{meta as string}</span><ArrowUpRight /></div>
              </motion.div>
            ))}
          </section>

          <section className="lower">
            <div className="activity">
              <div className="sectionHead"><div><h2>Recent activity</h2><span>Across your workspace</span></div></div>
              {[
                "AI workflow prepared",
                "New project created",
                "Security check completed"
              ].map((x, i) => (
                <div className="activityRow" key={x}>
                  <div className="dot" />
                  {i === 0 ? <MessageSquare /> : i === 1 ? <FolderKanban /> : <ShieldCheck />}
                  <div><b>{x}</b><small>{i + 2} minutes ago</small></div>
                  <ChevronRight />
                </div>
              ))}
            </div>

            <div className="health">
              <div className="sectionHead">
                <div><h2>System health</h2><span>Real-time status</span></div>
                <div className="healthScore"><span>score</span> 99.9%</div>
              </div>
              <div className="healthCard">
                <b>Everything operational</b>
                <small>Last checked just now</small>
                {["Application", "API", "Authentication", "AI Gateway"].map(x => (
                  <div className="healthRow" key={x}>
                    <span>{x}</span>
                    <span className="ok"><i /> Operational</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <div className="commandHint"><Command /> Quick command</div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
