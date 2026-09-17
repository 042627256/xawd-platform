import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Terminal, Gift, Coins, Users, CreditCard,
  Share2, Fingerprint, Radio, LogOut, FolderKanban, Copy, Check
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("ai");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [balance, setBalance] = useState(1250);
  const [airdropClaimed, setAirdropClaimed] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState("");

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  const handleLogin = (provider: string) => {
    const email = authEmail.trim() || `user_${Date.now().toString(36)}@xawd.my.id`;
    fetch(`${API}/api/auth/quick-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, provider }),
      credentials: "include"
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setUser(d.user);
          setShowAuth(false);
        } else {
          alert(d.error || "Gagal login");
        }
      })
      .catch(e => alert(e.message));
  };

  const handleAi = async (mode: "text" | "image") => {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput("");
    setImgUrl("");
    try {
      const ep = mode === "image" ? "/api/ai/image" : "/api/ai/run";
      const body = mode === "image" ? { prompt } : { prompt, model: "Comku" };
      const r = await fetch(`${API}${ep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const d = await r.json();
      if (d.imageUrl) setImgUrl(d.imageUrl);
      else setOutput(d.reply || d.error || "Selesai");
    } catch (e: any) {
      setOutput(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!apiKeyName.trim()) return;
    try {
      const r = await fetch(`${API}/api/developer/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: apiKeyName }),
        credentials: "include"
      });
      const d = await r.json();
      if (d.success) {
        setCreatedKey(d.key);
        setApiKeyName("");
      }
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="app">
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 }}>
          <div style={{ background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }}>
            <h3 style={{ color: "#fff" }}>Unified Multi-Auth</h3>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>Pilih metode login atau SSO resmi:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <button onClick={() => handleLogin("Google")} style={{ padding: 10, background: "#1e293b", color: "#fff", borderRadius: 8, border: "1px solid #334155", cursor: "pointer" }}>Google SSO</button>
              <button onClick={() => handleLogin("Apple")} style={{ padding: 10, background: "#1e293b", color: "#fff", borderRadius: 8, border: "1px solid #334155", cursor: "pointer" }}>Apple ID</button>
              <button onClick={() => handleLogin("Passkey")} style={{ padding: 10, background: "#1e293b", color: "#fff", borderRadius: 8, border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}><Fingerprint size={14} /> Passkey</button>
              <button onClick={() => handleLogin("RFID")} style={{ padding: 10, background: "#1e293b", color: "#fff", borderRadius: 8, border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}><Radio size={14} /> RFID Scan</button>
            </div>
            <input type="email" placeholder="nama@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ width: "100%", padding: 10, background: "#0b0f19", border: "1px solid #334155", color: "#fff", borderRadius: 8, marginBottom: 8 }} />
            <button onClick={() => handleLogin("MagicLink")} style={{ width: "100%", padding: 10, background: "var(--accent-gradient)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Masuk Sekarang</button>
            <button onClick={() => setShowAuth(false)} style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: 8, cursor: "pointer" }}>Tutup</button>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="brand"><div className="brandmark">X</div><b>XAWD OS</b></div>
        <nav className="nav">
          {[
            ["ai", "Command Center", LayoutDashboard],
            ["airdrop", "Airdrop Portal", Gift],
            ["token", "$AWD Ecosystem", Coins],
            ["dev", "Developer API", Terminal],
            ["workspaces", "Workspaces", FolderKanban],
            ["social", "Social Hub", Share2],
            ["ref", "Referral Hub", Users],
            ["billing", "Paket & Billing", CreditCard]
          ].map(([id, label, Icon]: any) => (
            <button key={id} className={`navItem ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebarBottom">
          <div className="profile">
            <div>
              <b>{user?.email?.split("@")[0] || "Guest Node"}</b>
              <small style={{ color: user ? "#10b981" : "#94a3b8", display: "block" }}>{user ? "Online • Verified" : "Belum Login"}</small>
            </div>
            {user ? (
              <button onClick={() => fetch(`${API}/api/auth/logout`, { method: "POST" }).then(() => window.location.reload())} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><LogOut size={16} /></button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: "var(--accent-primary)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}>Login</button>
            )}
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <div className="crumb">XAWD ECOSYSTEM &gt; {tab.toUpperCase()}</div>
          <div style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", padding: "6px 14px", borderRadius: 20, fontWeight: 700, border: "1px solid #3b82f6" }}>💎 {balance} $AWD</div>
        </header>

        <div className="content">
          {tab === "ai" && (
            <section className="aiPanel">
              <div className="aiTop">
                <b>Dual Edge Compute</b>
                <div>
                  <button onClick={() => handleAi("text")} disabled={loading} style={{ padding: "6px 12px", background: "var(--accent-primary)", color: "#fff", border: "none", borderRadius: 6, marginRight: 6, cursor: "pointer" }}>Text AI</button>
                  <button onClick={() => handleAi("image")} disabled={loading} style={{ padding: "6px 12px", background: "#1e293b", color: "#fff", border: "1px solid #334155", borderRadius: 6, cursor: "pointer" }}>Flux Image</button>
                </div>
              </div>
              <textarea id="command" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Instruksi code intelligence, penalaran, atau visual prompt..." />
              {output && <div style={{ marginTop: 12, padding: 12, background: "#0f172a", borderRadius: 8, border: "1px solid #334155", whiteSpace: "pre-wrap" }}>{output}</div>}
              {imgUrl && <div style={{ marginTop: 12, textAlign: "center" }}><img src={imgUrl} alt="render" style={{ maxWidth: "100%", borderRadius: 8 }} /></div>}
            </section>
          )}

          {tab === "airdrop" && (
            <div style={{ background: "#0f172a", padding: 24, borderRadius: 16, border: "1px solid #334155" }}>
              <h2>Genesis Airdrop Portal</h2>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Klaim alokasi awal validator komunitas XAWD.</p>
              <div style={{ padding: 20, background: "rgba(16,185,129,0.08)", border: "1px dashed #10b981", borderRadius: 12, margin: "16px 0" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>+500 $AWD Ready</div>
                <button onClick={() => { if (!user) { setShowAuth(true); return; } if (!airdropClaimed) { setBalance(b => b + 500); setAirdropClaimed(true); } }} disabled={airdropClaimed} style={{ marginTop: 12, padding: "10px 20px", background: airdropClaimed ? "#334155" : "var(--accent-gradient)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  {airdropClaimed ? "✓ Sudah Diklaim" : "Klaim Airdrop Sekarang"}
                </button>
              </div>
            </div>
          )}

          {tab === "token" && (
            <div style={{ background: "#0f172a", padding: 24, borderRadius: 16, border: "1px solid #334155" }}>
              <h2>$AWD Token & Staking Pool</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0" }}>
                <div style={{ background: "#1e293b", padding: 16, borderRadius: 10 }}>
                  <small style={{ color: "#94a3b8" }}>Saldo Wallet</small>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#38bdf8" }}>{balance} AWD</div>
                </div>
                <div style={{ background: "#1e293b", padding: 16, borderRadius: 10 }}>
                  <small style={{ color: "#94a3b8" }}>Staking APY</small>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>18.4% APR</div>
                </div>
              </div>
            </div>
          )}

          {tab === "dev" && (
            <div style={{ background: "#0f172a", padding: 24, borderRadius: 16, border: "1px solid #334155" }}>
              <h2>Developer API Gateway</h2>
              <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
                <input placeholder="Nama API key" value={apiKeyName} onChange={e => setApiKeyName(e.target.value)} style={{ flex: 1, padding: 10, background: "#0b0f19", border: "1px solid #334155", color: "#fff", borderRadius: 8 }} />
                <button onClick={createKey} style={{ padding: "10px 16px", background: "var(--accent-primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Buat Key</button>
              </div>
              {createdKey && (
                <div style={{ padding: 12, background: "rgba(16,185,129,0.1)", border: "1px solid #10b981", borderRadius: 8, color: "#10b981" }}>
                  <code>{createdKey}</code>
                </div>
              )}
            </div>
          )}

          {tab === "workspaces" && (
            <div style={{ background: "#0f172a", padding: 24, borderRadius: 16, border: "1px solid #334155" }}>
              <h2>Workspaces & Isolated Nodes</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Ruang kerja kolaboratif proyek AI terdistribusi.</p>
              <div style={{ background: "#1e293b", padding: 16, borderRadius: 10 }}>
                <b>Default Environment</b>
                <small style={{ display: "block", color: "#10b981" }}>Aktif • Edge Node Jawa Timur</small>
              </div>
            </div>
          )}

          {tab === "social" && (
            <div style={{ background: "#0f172a", padding: 24, borderRadius: 16, border: "1px solid #334155" }}>
              <h2>Social Media & Community Hub</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <a href="https://discord.gg" target="_blank" style={{ textDecoration: "none", background: "#1e293b", padding: 16, borderRadius: 10, color: "#fff" }}><b>Discord</b><small style={{ display: "block", color: "#94a3b8" }}>Komunitas Developer</small></a>
                <a href="https://t.me" target="_blank" style={{ textDecoration: "none", background: "#1e293b", padding: 16, borderRadius: 10, color: "#fff" }}><b>Telegram</b><small style={{ display: "block", color: "#94a3b8" }}>Notifikasi Airdrop</small></a>
                <a href="https://x.com" target="_blank" style={{ textDecoration: "none", background: "#1e293b", padding: 16, borderRadius: 10, color: "#fff" }}><b>X (Twitter)</b><small style={{ display: "block", color: "#94a3b8" }}>Update Rilis</small></a>
                <a href="https://github.com" target="_blank" style={{ textDecoration: "none", background: "#1e293b", padding: 16, borderRadius: 10, color: "#fff" }}><b>GitHub</b><small style={{ display: "block", color: "#94a3b8" }}>Repo & SDK</small></a>
              </div>
            </div>
          )}

          {tab === "ref" && (
            <div style={{ background: "#0f172a", padding: 24, borderRadius: 16, border: "1px solid #334155" }}>
              <h2>Anti-Sybil Referral</h2>
              <input readOnly value={user ? `https://xawd.my.id/?ref=AWD-${user.id?.slice(0, 6).toUpperCase()}` : "Login untuk link referral"} style={{ width: "100%", padding: 10, background: "#0b0f19", border: "1px solid #334155", color: "#fff", borderRadius: 8, margin: "16px 0" }} />
            </div>
          )}

          {tab === "billing" && (
            <div style={{ background: "#0f172a", padding: 24, borderRadius: 16, border: "1px solid #334155" }}>
              <h2>Paket & Billing IDR</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <div style={{ background: "#1e293b", padding: 16, borderRadius: 10 }}><b>Tier Plus</b><div style={{ color: "#38bdf8", fontSize: 20, margin: "8px 0" }}>Rp59.000/bln</div><small style={{ color: "#94a3b8" }}>Standard compute & visual flux</small></div>
                <div style={{ background: "#1e293b", padding: 16, borderRadius: 10 }}><b>Tier Pro</b><div style={{ color: "#38bdf8", fontSize: 20, margin: "8px 0" }}>Rp149.000/bln</div><small style={{ color: "#94a3b8" }}>Deep reasoning & Developer API</small></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
