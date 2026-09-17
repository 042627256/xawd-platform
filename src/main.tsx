import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Terminal, Gift, Coins, Users, CreditCard,
  Share2, Fingerprint, Radio, LogOut, Sparkles, Copy, Check,
  Zap, Shield, Globe, Server, CheckCircle2, ChevronRight
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [showAuth, setShowAuth] = useState(false);
  const [authMethod, setAuthMethod] = useState<"sso" | "rfid" | "passkey" | "email">("sso");
  const [email, setEmail] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Dynamic States
  const [balance, setBalance] = useState(() => Number(localStorage.getItem("awd_bal")) || 1250);
  const [airdropClaimed, setAirdropClaimed] = useState(() => localStorage.getItem("awd_claimed") === "true");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [computing, setComputing] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keys, setKeys] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("xawd_token");
    if (token) {
      fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => { if (d.user) setUser(d.user); else localStorage.removeItem("xawd_token"); })
        .catch(() => {});
    }
  }, []);

  const triggerLogin = async (provider: string, customEmail?: string) => {
    setAuthLoading(true);
    try {
      const targetEmail = customEmail || email.trim() || `user_${Date.now().toString(36)}@xawd.my.id`;
      const res = await fetch(`${API}/api/auth/quick-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, provider })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("xawd_token", data.token);
        setUser(data.user);
        setShowAuth(false);
      } else {
        alert("Gagal masuk: " + (data.error || "CORS/Network error"));
      }
    } catch (err: any) {
      alert("Error Autentikasi: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAiExecute = async (mode: "text" | "image") => {
    if (!prompt.trim()) return;
    setComputing(true);
    setOutput("");
    setImgUrl("");
    try {
      const ep = mode === "image" ? "/api/ai/image" : "/api/ai/run";
      const token = localStorage.getItem("xawd_token") || "";
      const res = await fetch(`${API}${ep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(mode === "image" ? { prompt } : { prompt, model: "Comku" })
      });
      const data = await res.json();
      if (data.imageUrl) setImgUrl(data.imageUrl);
      else setOutput(data.reply || data.error || "Komputasi edge selesai.");
    } catch (err: any) {
      setOutput("Jalur komputasi gagal: " + err.message);
    } finally {
      setComputing(false);
    }
  };

  const claimGenesisAirdrop = () => {
    if (!user) { setShowAuth(true); return; }
    if (airdropClaimed) return;
    const newBal = balance + 500;
    setBalance(newBal);
    setAirdropClaimed(true);
    localStorage.setItem("awd_bal", newBal.toString());
    localStorage.setItem("awd_claimed", "true");
  };

  const generateApiKey = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!keyName.trim()) return;
    try {
      const res = await fetch(`${API}/api/developer/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName })
      });
      const d = await res.json();
      if (d.success) {
        setKeys(prev => [d.key, ...prev]);
        setKeyName("");
      }
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="app" style={{ minHeight: "100vh", display: "flex", background: "#060913", color: "#f8fafc" }}>
      {/* Modal Autentikasi Futuristik Dinamis */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3, 7, 18, 0.88)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px" }}>
          <div style={{ background: "linear-gradient(145deg, #0f172a, #0b1120)", border: "1px solid rgba(59, 130, 246, 0.4)", borderRadius: "24px", padding: "32px", maxWidth: "440px", width: "100%", boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ padding: "8px", background: "rgba(59, 130, 246, 0.15)", borderRadius: "10px", color: "#38bdf8" }}><Shield size={20} /></div>
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "700" }}>Identity Gate</h3>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "20px" }}>Pilih autentikasi terdesentralisasi atau SSO resmi.</p>

            <div style={{ display: "flex", gap: "6px", background: "#0b0f19", padding: "4px", borderRadius: "12px", marginBottom: "20px" }}>
              <button onClick={() => setAuthMethod("sso")} style={{ flex: 1, padding: "8px", background: authMethod === "sso" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "transparent", border: "none", color: "#fff", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}>SSO OAuth</button>
              <button onClick={() => setAuthMethod("passkey")} style={{ flex: 1, padding: "8px", background: authMethod === "passkey" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "transparent", border: "none", color: "#fff", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}>Passkey</button>
              <button onClick={() => setAuthMethod("rfid")} style={{ flex: 1, padding: "8px", background: authMethod === "rfid" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "transparent", border: "none", color: "#fff", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}>RFID</button>
              <button onClick={() => setAuthMethod("email")} style={{ flex: 1, padding: "8px", background: authMethod === "email" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "transparent", border: "none", color: "#fff", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}>Direct</button>
            </div>

            {authMethod === "sso" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={() => triggerLogin("Google")} disabled={authLoading} style={{ width: "100%", padding: "12px", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <Globe size={18} color="#38bdf8" /> Lanjutkan dengan Google
                </button>
                <button onClick={() => triggerLogin("Apple")} disabled={authLoading} style={{ width: "100%", padding: "12px", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <Zap size={18} color="#a855f7" /> Lanjutkan dengan Apple ID
                </button>
              </div>
            )}

            {authMethod === "passkey" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: "60px", height: "60px", margin: "0 auto 16px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", border: "1px dashed #3b82f6" }}>
                  <Fingerprint size={32} />
                </div>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "16px" }}>Pindai biometrik atau kunci keamanan perangkat keras Anda.</p>
                <button onClick={() => triggerLogin("Passkey", "passkey_node@xawd.my.id")} disabled={authLoading} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", color: "#fff", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>Otorisasi Sensor</button>
              </div>
            )}

            {authMethod === "rfid" && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ width: "60px", height: "60px", margin: "0 auto 16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", border: "1px dashed #10b981" }}>
                  <Radio size={32} />
                </div>
                <input placeholder="Tempelkan kartu RFID / Masukkan UID..." value={rfidTag} onChange={e => setRfidTag(e.target.value)} style={{ width: "100%", padding: "12px", background: "#0b0f19", border: "1px solid #334155", color: "#fff", borderRadius: "10px", marginBottom: "12px", outline: "none", textAlign: "center", letterSpacing: "2px" }} />
                <button onClick={() => triggerLogin("RFID", `rfid_${rfidTag || "card"}@xawd.my.id`)} disabled={authLoading} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>Validasi Tag RFID</button>
              </div>
            )}

            {authMethod === "email" && (
              <div>
                <input type="email" placeholder="nama@domain.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "12px", background: "#0b0f19", border: "1px solid #334155", color: "#fff", borderRadius: "10px", marginBottom: "12px", outline: "none" }} />
                <button onClick={() => triggerLogin("Email")} disabled={authLoading} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", color: "#fff", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>Masuk Sekarang</button>
              </div>
            )}

            <button onClick={() => setShowAuth(false)} style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: "16px", cursor: "pointer", fontSize: "0.85rem" }}>Tutup Jendela</button>
          </div>
        </div>
      )}

      {/* Sidebar Navigasi Cyberpunk */}
      <aside style={{ width: "260px", background: "#0a0f1d", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", paddingLeft: "8px" }}>
          <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", color: "#fff", boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)" }}>X</div>
          <div><b style={{ fontSize: "1.1rem", letterSpacing: "1px" }}>XAWD OS</b><small style={{ display: "block", color: "#38bdf8", fontSize: "0.65rem" }}>v2.4 Production</small></div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {[
            ["overview", "Command Center", LayoutDashboard],
            ["airdrop", "Genesis Airdrop", Gift],
            ["token", "$AWD Staking Pool", Coins],
            ["developer", "Developer Gateway", Terminal],
            ["social", "Social Community", Share2],
            ["referral", "Referral Hub", Users],
            ["billing", "Billing & Tier", CreditCard]
          ].map(([key, label, Icon]: any) => (
            <button key={key} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: tab === key ? "rgba(59, 130, 246, 0.12)" : "transparent", color: tab === key ? "#38bdf8" : "#94a3b8", border: tab === key ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent", cursor: "pointer", fontWeight: tab === key ? "600" : "400", transition: "all 0.2s" }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <b style={{ fontSize: "0.85rem", display: "block", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email?.split("@")[0] || "Guest Node"}</b>
              <small style={{ color: user ? "#10b981" : "#64748b", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: user ? "#10b981" : "#64748b" }}></span>
                {user ? "Online • Verified" : "Unauthenticated"}
              </small>
            </div>
            {user ? (
              <button onClick={() => { localStorage.removeItem("xawd_token"); setUser(null); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><LogOut size={16} /></button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>Login</button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Command Workspace */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ height: "68px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(10, 15, 29, 0.4)", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "0.85rem" }}>
            <span>XAWD</span><ChevronRight size={14} /><span style={{ color: "#38bdf8", fontWeight: "600" }}>{tab.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "6px 14px", borderRadius: "20px", color: "#38bdf8", fontWeight: "700", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
              💎 {balance} $AWD
            </div>
          </div>
        </header>

        <div style={{ padding: "28px", flex: 1, overflowY: "auto" }}>
          {tab === "overview" && (
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div style={{ background: "linear-gradient(145deg, #0f172a, #0b1120)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ padding: "8px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "10px", color: "#38bdf8" }}><Sparkles size={20} /></div>
                    <div><b>Autonomous Compute</b><small style={{ display: "block", color: "#64748b" }}>Comku LLM & Flux 1.0 Diffusion</small></div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleAiExecute("text")} disabled={computing} style={{ padding: "8px 16px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", color: "#fff", borderRadius: "10px", fontWeight: "600", cursor: "pointer" }}>Run Text</button>
                    <button onClick={() => handleAiExecute("image")} disabled={computing} style={{ padding: "8px 16px", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "10px", fontWeight: "600", cursor: "pointer" }}>Generate Image</button>
                  </div>
                </div>

                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Tulis instruksi kode, penalaran analitis, atau deskripsi visual..." style={{ width: "100%", height: "120px", background: "#060913", border: "1px solid #1e293b", borderRadius: "12px", padding: "14px", color: "#fff", outline: "none", resize: "vertical", fontSize: "0.9rem" }} />

                {computing && <div style={{ color: "#38bdf8", marginTop: "12px", fontSize: "0.85rem" }}>⚡ Memproses di Cloudflare edge network...</div>}
                {output && <div style={{ marginTop: "16px", padding: "16px", background: "#060913", borderRadius: "12px", border: "1px solid #1e293b", whiteSpace: "pre-wrap", fontSize: "0.9rem", lineHeight: "1.6" }}>{output}</div>}
                {imgUrl && <div style={{ marginTop: "16px", textAlign: "center" }}><img src={imgUrl} alt="render" style={{ maxWidth: "100%", borderRadius: "12px", border: "1px solid #1e293b" }} /></div>}
              </div>
            </div>
          )}

          {tab === "airdrop" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", padding: "32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2>Genesis Community Airdrop</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "24px" }}>Alokasi khusus partisipan perdana jaringan desentralisasi XAWD OS.</p>
              
              <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px dashed #10b981", padding: "28px", borderRadius: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: "600" }}>STATUS TIER 1 VALIDATOR</span>
                <div style={{ fontSize: "2.8rem", fontWeight: "900", color: "#10b981", margin: "12px 0" }}>+500 $AWD</div>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "20px" }}>Dapat diklaim langsung ke wallet sesi aktif Anda.</p>
                <button onClick={claimGenesisAirdrop} disabled={airdropClaimed} style={{ padding: "12px 32px", background: airdropClaimed ? "#334155" : "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>
                  {airdropClaimed ? "✓ Airdrop Sudah Berada di Wallet" : "Klaim 500 $AWD Sekarang"}
                </button>
              </div>
            </div>
          )}

          {tab === "token" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", padding: "32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2>$AWD Utility & Staking Pool</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "24px 0" }}>
                <div style={{ background: "#1e293b", padding: "20px", borderRadius: "14px" }}>
                  <small style={{ color: "#94a3b8" }}>Total Saldo Wallet</small>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#38bdf8", marginTop: "6px" }}>{balance} AWD</div>
                </div>
                <div style={{ background: "#1e293b", padding: "20px", borderRadius: "14px" }}>
                  <small style={{ color: "#94a3b8" }}>Staking APY Reward</small>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>18.4% APR</div>
                </div>
              </div>
            </div>
          )}

          {tab === "developer" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", padding: "32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2>Developer API Gateway</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "20px" }}>Akses programmatic ke edge router `api.xawd.my.id`.</p>
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <input placeholder="Nama API Key (contoh: Production Worker)" value={keyName} onChange={e => setKeyName(e.target.value)} style={{ flex: 1, padding: "12px", background: "#060913", border: "1px solid #334155", color: "#fff", borderRadius: "10px" }} />
                <button onClick={generateApiKey} style={{ padding: "12px 20px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", border: "none", color: "#fff", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>Buat Kunci</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {keys.map((k, i) => (
                  <div key={i} style={{ padding: "14px", background: "#060913", borderRadius: "10px", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <code style={{ color: "#38bdf8" }}>{k}</code>
                    <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Aktif</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "social" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", padding: "32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2>Komunitas & Ekosistem</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                <a href="https://discord.gg" target="_blank" style={{ padding: "20px", background: "#1e293b", borderRadius: "14px", textDecoration: "none", color: "#fff", display: "block" }}>
                  <b style={{ fontSize: "1.1rem" }}>Discord Network</b>
                  <small style={{ color: "#94a3b8", display: "block", marginTop: "4px" }}>Diskusi developer real-time</small>
                </a>
                <a href="https://t.me" target="_blank" style={{ padding: "20px", background: "#1e293b", borderRadius: "14px", textDecoration: "none", color: "#fff", display: "block" }}>
                  <b style={{ fontSize: "1.1rem" }}>Telegram Channel</b>
                  <small style={{ color: "#94a3b8", display: "block", marginTop: "4px" }}>Notifikasi airdrop & pembaruan</small>
                </a>
                <a href="https://x.com" target="_blank" style={{ padding: "20px", background: "#1e293b", borderRadius: "14px", textDecoration: "none", color: "#fff", display: "block" }}>
                  <b style={{ fontSize: "1.1rem" }}>X (Twitter)</b>
                  <small style={{ color: "#94a3b8", display: "block", marginTop: "4px" }}>Rilis resmi & ekosistem</small>
                </a>
                <a href="https://github.com" target="_blank" style={{ padding: "20px", background: "#1e293b", borderRadius: "14px", textDecoration: "none", color: "#fff", display: "block" }}>
                  <b style={{ fontSize: "1.1rem" }}>GitHub SDK</b>
                  <small style={{ color: "#94a3b8", display: "block", marginTop: "4px" }}>Open source repository</small>
                </a>
              </div>
            </div>
          )}

          {tab === "referral" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", padding: "32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2>Anti-Sybil Referral</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "20px" }}>Tautan referensi terenkripsi untuk mendapatkan bonus komputasi.</p>
              <input readOnly value={user ? `https://xawd.my.id/?ref=AWD-${user.id?.slice(0, 6).toUpperCase()}` : "Silakan login untuk mengaktifkan kode referral"} style={{ width: "100%", padding: "12px", background: "#060913", border: "1px solid #334155", color: "#fff", borderRadius: "10px" }} />
            </div>
          )}

          {tab === "billing" && (
            <div style={{ maxWidth: "800px", margin: "0 auto", background: "#0f172a", padding: "32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2>Paket Komputasi IDR</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
                  <b>Tier Plus</b>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#38bdf8", margin: "10px 0" }}>Rp59.000<span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>/bln</span></div>
                  <small style={{ color: "#94a3b8" }}>Standard models, 250 visual flux, BYOK vault unthrottled.</small>
                </div>
                <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
                  <b>Tier Pro</b>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#a855f7", margin: "10px 0" }}>Rp149.000<span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>/bln</span></div>
                  <small style={{ color: "#94a3b8" }}>Prioritas antrean 9router, agen penalaran mendalam, developer API key.</small>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
