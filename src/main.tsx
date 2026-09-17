import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, LayoutDashboard, Terminal, Gift, Coins, Users, CreditCard,
  Share2, Fingerprint, Radio, LogOut, Sparkles, Copy, Check,
  Shield, Globe, ChevronRight, ArrowUpRight, Zap, Play
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [balance, setBalance] = useState(1250);
  const [claimed, setClaimed] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [computing, setComputing] = useState(false);
  const [keys, setKeys] = useState([]);
  const [keyName, setKeyName] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("xawd_token");
    if (t) {
      fetch(API + "/api/auth/me", { headers: { Authorization: "Bearer " + t } })
        .then(r => r.json())
        .then(d => { if (d.user) setUser(d.user); })
        .catch(() => {});
    }
  }, []);

  const triggerOAuth = (p) => {
    window.location.href = API + "/api/auth/oauth/" + p;
  };

  const directAuth = (name) => {
    const t = "xawd_" + name.toLowerCase() + "_" + Date.now();
    localStorage.setItem("xawd_token", t);
    setUser({ id: "usr_" + name.toLowerCase(), email: name.toLowerCase() + "@xawd.my.id", role: "developer" });
    setShowAuth(false);
  };

  const runCompute = async (type) => {
    if (!prompt.trim()) return;
    setComputing(true);
    setOutput(""); setImgUrl("");
    try {
      const ep = type === "image" ? "/api/ai/image" : "/api/ai/run";
      const t = localStorage.getItem("xawd_token") || "";
      const r = await fetch(API + ep, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
        body: JSON.stringify(type === "image" ? { prompt } : { prompt, model: "Comku" })
      });
      const d = await r.json();
      if (d.imageUrl) setImgUrl(d.imageUrl);
      else setOutput(d.reply || d.error || "Komputasi edge selesai.");
    } catch(e) { setOutput("Koneksi gagal: " + e.message); }
    finally { setComputing(false); }
  };

  return (
    <div className="app-container">
      {/* Modal Multi-Auth SSO */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 }}>
          <div className="card-glass" style={{ maxWidth: 440, width: "100%", padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ padding: 8, background: "rgba(59, 130, 246, 0.15)", borderRadius: 10, color: "var(--accent-cyan)" }}><Shield size={24} /></div>
              <div><h3 style={{ fontSize: "1.3rem", fontWeight: "800" }}>Identity Nexus</h3><small style={{ color: "var(--text-muted)" }}>Pilih akun SSO untuk masuk secara instan</small></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
              <button onClick={() => triggerOAuth("google")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Globe size={18} color="var(--accent-cyan)" /> Lanjutkan dengan Google Account
              </button>
              <button onClick={() => triggerOAuth("apple")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Zap size={18} color="var(--accent-purple)" /> Lanjutkan dengan Apple ID
              </button>
              <button onClick={() => triggerOAuth("x")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <b>𝕏</b> Lanjutkan dengan X (Twitter)
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <button onClick={() => triggerOAuth("facebook")} className="btn-secondary" style={{ padding: 10, fontSize: 13 }}>Facebook</button>
                <button onClick={() => triggerOAuth("instagram")} className="btn-secondary" style={{ padding: 10, fontSize: 13 }}>Instagram</button>
                <button onClick={() => triggerOAuth("tiktok")} className="btn-secondary" style={{ padding: 10, fontSize: 13 }}>TikTok</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => directAuth("Passkey")} className="btn-secondary" style={{ padding: 10, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Fingerprint size={16} /> Passkey</button>
                <button onClick={() => directAuth("RFID")} className="btn-secondary" style={{ padding: 10, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Radio size={16} /> RFID Scan</button>
              </div>
            </div>
            <button onClick={() => setShowAuth(false)} style={{ width: "100%", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>Batal</button>
          </div>
        </div>
      )}

      {/* Sidebar Navigasi */}
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-icon">X</div>
          <div><b style={{ fontSize: "1.15rem", letterSpacing: 1 }}>XAWD OS</b><div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-emerald)" }}></span><small style={{ color: "var(--accent-emerald)", fontSize: "0.65rem", fontWeight: 700 }}>EDGE PRODUCTION</small></div></div>
        </div>

        <nav className="nav-menu">
          {[
            ["home", "Beranda Utama", Home],
            ["overview", "Command Center", LayoutDashboard],
            ["airdrop", "Genesis Airdrop", Gift],
            ["token", "$AWD Pool", Coins],
            ["developer", "Developer Gateway", Terminal],
            ["social", "Social Community", Share2],
            ["referral", "Referral Hub", Users],
            ["billing", "Billing & Tier", CreditCard]
          ].map(([k, l, Icon]) => (
            <button key={k} className={"nav-btn " + (tab === k ? "active" : "")} onClick={() => setTab(k)}>
              <Icon size={18} /><span>{l}</span>
            </button>
          ))}
        </nav>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 16, borderRadius: 16, border: "1px solid var(--border-subtle)", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <b style={{ fontSize: "0.85rem", display: "block" }}>{user?.email?.split("@")[0] || "Guest Node"}</b>
              <small style={{ color: user ? "var(--accent-emerald)" : "var(--text-muted)", fontSize: "0.7rem" }}>{user ? "Online • Terhubung" : "Belum Login"}</small>
            </div>
            {user ? (
              <button onClick={() => { localStorage.removeItem("xawd_token"); setUser(null); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><LogOut size={16} /></button>
            ) : (
              <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.75rem", borderRadius: 8 }}>Login</button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        <header className="top-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>XAWD NETWORK</span><ChevronRight size={14} /><span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{tab.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "6px 16px", borderRadius: 20, color: "var(--accent-cyan)", fontWeight: 800, fontSize: "0.85rem" }}>
              💎 {balance.toLocaleString()} $AWD
            </div>
          </div>
        </header>

        <div className="content-area">
          {/* 1. HALAMAN BERANDA / LANDING HERO UTAMA */}
          {tab === "home" && (
            <div>
              <div className="card-glass" style={{ textAlign: "center", padding: "60px 24px", marginBottom: 32 }}>
                <span style={{ padding: "6px 16px", background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.4)", borderRadius: 20, color: "var(--accent-cyan)", fontSize: "0.8rem", fontWeight: 800 }}>NEXT-GEN AUTONOMOUS CLUSTER</span>
                <h1 style={{ fontSize: "3rem", fontWeight: 900, margin: "24px 0 16px 0", background: "linear-gradient(135deg, #fff 30%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Autonomous Edge Cloud & Sovereign AI Infrastructure
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 700, margin: "0 auto 32px auto", lineHeight: 1.7 }}>
                  Platform orkestrasi model AI penalaran mendalam (Comku LLM & Flux 1.0) dengan ekosistem token utilitas terdesentralisasi, verifikasi multi-auth, dan API edge berkecepatan tinggi.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  <button onClick={() => setTab("overview")} className="btn-primary" style={{ padding: "14px 32px", fontSize: "1rem" }}><Play size={18} /> Buka Command Center</button>
                  <button onClick={() => setTab("airdrop")} className="btn-secondary" style={{ padding: "14px 32px", fontSize: "1rem" }}>Klaim Airdrop Community</button>
                </div>
              </div>

              <div className="metric-grid">
                <div className="metric-card">
                  <small style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>DUAL ENGINE AI</small>
                  <h3 style={{ fontSize: "1.3rem", margin: "8px 0" }}>Comku LLM & Flux Schnell</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Penalaran teks berakurasi tinggi dengan generator visual latensi rendah.</p>
                </div>
                <div className="metric-card">
                  <small style={{ color: "var(--accent-purple)", fontWeight: 700 }}>DECENTRALIZED ACCESS</small>
                  <h3 style={{ fontSize: "1.3rem", margin: "8px 0" }}>Multi-Auth & FIDO2</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Login sekali klik via SSO Google, Apple ID, Passkey biometrik, serta kartu RFID.</p>
                </div>
                <div className="metric-card">
                  <small style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>GAS & UTILITY</small>
                  <h3 style={{ fontSize: "1.3rem", margin: "8px 0" }}>$AWD Token & Staking</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Staking APY 18.4% dengan pembagian insentif referral anti-sybil.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMMAND CENTER AI */}
          {tab === "overview" && (
            <div>
              <div className="card-glass">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div><b style={{ fontSize: "1.1rem" }}>Dual Edge Command Center</b><small style={{ display: "block", color: "var(--text-muted)" }}>Eksekusi penalaran sistem dan render visual Flux</small></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => runCompute("text")} disabled={computing} className="btn-primary">Eksekusi Teks AI</button>
                    <button onClick={() => runCompute("image")} disabled={computing} className="btn-secondary">Render Visual Flux</button>
                  </div>
                </div>
                <textarea className="cyber-input" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Tulis instruksi arsitektur, penalaran analitis, atau prompt visual..." style={{ minHeight: 140 }} />
                {computing && <div style={{ color: "var(--accent-cyan)", marginTop: 14 }}>⚡ Menjalankan komputasi edge cluster...</div>}
                {output && <div style={{ marginTop: 20, padding: 20, background: "rgba(3, 7, 18, 0.8)", border: "1px solid var(--border-subtle)", borderRadius: 14, whiteSpace: "pre-wrap" }}>{output}</div>}
                {imgUrl && <div style={{ marginTop: 20, textAlign: "center" }}><img src={imgUrl} alt="render" style={{ maxWidth: "100%", borderRadius: 14 }} /></div>}
              </div>
            </div>
          )}

          {/* 3. AIRDROP PORTAL */}
          {tab === "airdrop" && (
            <div className="card-glass" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
              <h2>Genesis Community Airdrop</h2>
              <p style={{ color: "var(--text-muted)", margin: "12px 0 24px 0" }}>Alokasi khusus operator node yang mengintegrasikan ekosistem XAWD OS.</p>
              <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px dashed rgba(16, 185, 129, 0.4)", padding: 36, borderRadius: 20, marginBottom: 28 }}>
                <div style={{ fontSize: "3.2rem", fontWeight: 900, color: "var(--accent-emerald)" }}>+500 $AWD</div>
              </div>
              <button onClick={() => { if (!user) { setShowAuth(true); return; } if (!claimed) { setBalance(b => b + 500); setClaimed(true); } }} disabled={claimed} className="btn-primary" style={{ padding: "16px 36px" }}>
                {claimed ? "✓ Alokasi Berhasil Diklaim" : "Klaim 500 $AWD Sekarang"}
              </button>
            </div>
          )}

          {/* 4. TOKEN & STAKING */}
          {tab === "token" && (
            <div className="card-glass">
              <h2>$AWD Liquidity & Staking Hub</h2>
              <div className="metric-grid" style={{ marginTop: 20 }}>
                <div className="metric-card"><small style={{ color: "var(--text-muted)" }}>Saldo Dompet</small><div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-cyan)", margin: "6px 0" }}>{balance.toLocaleString()} AWD</div></div>
                <div className="metric-card"><small style={{ color: "var(--text-muted)" }}>Staking APR</small><div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-emerald)", margin: "6px 0" }}>18.4%</div></div>
              </div>
            </div>
          )}

          {/* 5. DEVELOPER GATEWAY */}
          {tab === "developer" && (
            <div className="card-glass">
              <h2>Developer API Gateway</h2>
              <div style={{ display: "flex", gap: 10, margin: "20px 0" }}>
                <input className="cyber-input" placeholder="Label Kunci API (contoh: Microservice Edge)" value={keyName} onChange={e => setKeyName(e.target.value)} />
                <button onClick={() => { if (!keyName.trim()) return; setKeys(prev => [{ name: keyName, key: "xawd_live_" + crypto.randomUUID().replace(/-/g, "") }, ...prev]); setKeyName(""); }} className="btn-primary" style={{ whiteSpace: "nowrap" }}>Generate Key</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {keys.map((k, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "rgba(3, 7, 18, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: 12 }}>
                    <div><b>{k.name}</b><code style={{ display: "block", color: "var(--accent-cyan)", marginTop: 4 }}>{k.key}</code></div>
                    <span style={{ color: "var(--accent-emerald)", fontSize: 13 }}>Aktif</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. SOCIAL COMMUNITY */}
          {tab === "social" && (
            <div className="card-glass">
              <h2>Komunitas Pengembang Global</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 20 }}>
                {[
                  ["Discord Server", "Saluran diskusi teknis dan bot", "https://discord.gg"],
                  ["Telegram Hub", "Notifikasi airdrop real-time", "https://t.me"],
                  ["X / Twitter", "Berita resmi dan pembaruan arsitektur", "https://x.com"],
                  ["GitHub Ecosystem", "Source code SDK dan template", "https://github.com"]
                ].map(([title, desc, url], idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-subtle)", padding: 20, borderRadius: 16, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div><b style={{ fontSize: "1.1rem" }}>{title}</b><p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>{desc}</p></div>
                    <div style={{ marginTop: 16, color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>Buka Hub <ArrowUpRight size={14} /></div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 7. REFERRAL */}
          {tab === "referral" && (
            <div className="card-glass">
              <h2>Anti-Sybil Referral Hub</h2>
              <input className="cyber-input" readOnly value={user ? "https://xawd.my.id/?ref=AWD-" + user.id.slice(0, 6).toUpperCase() : "Silakan login untuk mengaktifkan kode referral"} style={{ marginTop: 16 }} />
            </div>
          )}

          {/* 8. BILLING & PAKET */}
          {tab === "billing" && (
            <div className="card-glass">
              <h2>Paket Komputasi Edge</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 24 }}>
                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-subtle)", padding: 28, borderRadius: 20 }}>
                  <b style={{ fontSize: "1.2rem" }}>Tier Plus</b>
                  <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--accent-cyan)", margin: "14px 0" }}>Rp59.000<span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/bln</span></div>
                  <button className="btn-secondary" style={{ width: "100%" }}>Pilih Paket Plus</button>
                </div>
                <div style={{ background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))", border: "1px solid var(--border-glow)", padding: 28, borderRadius: 20 }}>
                  <b style={{ fontSize: "1.2rem" }}>Tier Pro</b>
                  <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--accent-purple)", margin: "14px 0" }}>Rp149.000<span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/bln</span></div>
                  <button className="btn-primary" style={{ width: "100%" }}>Aktivasi Pro</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
