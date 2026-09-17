import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Terminal, Gift, Coins, Users, CreditCard,
  Share2, Fingerprint, Radio, LogOut, Sparkles, Copy, Check,
  Zap, Shield, Globe, ChevronRight, Activity, ArrowUpRight,
  Database, RefreshCw, Layers
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [showAuth, setShowAuth] = useState(false);
  const [authMethod, setAuthMethod] = useState<"sso" | "passkey" | "rfid" | "direct">("sso");
  const [emailInput, setEmailInput] = useState("");
  const [rfidVal, setRfidVal] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // System States
  const [balance, setBalance] = useState(() => Number(localStorage.getItem("awd_bal")) || 1250);
  const [claimed, setClaimed] = useState(() => localStorage.getItem("awd_claimed") === "true");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [computing, setComputing] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [keyName, setKeyName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("xawd_token");
    if (token) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setUser(d.user); else localStorage.removeItem("xawd_token"); })
        .catch(() => {});
    }
  }, []);

  const handleLogin = async (provider: string, emailArg?: string) => {
    setAuthLoading(true);
    try {
      const email = emailArg || emailInput.trim() || `operator_${Date.now().toString(36)}@xawd.my.id`;
      const res = await fetch(`${API}/api/auth/quick-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, provider })
      });
      const d = await res.json();
      if (d.success) {
        localStorage.setItem("xawd_token", d.token);
        setUser(d.user);
        setShowAuth(false);
      } else {
        alert(d.error || "Gagal autentikasi");
      }
    } catch (e: any) {
      alert("Koneksi gagal: " + e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const executeCompute = async (type: "text" | "image") => {
    if (!prompt.trim()) return;
    setComputing(true);
    setOutput("");
    setImgUrl("");
    try {
      const ep = type === "image" ? "/api/ai/image" : "/api/ai/run";
      const token = localStorage.getItem("xawd_token") || "";
      const r = await fetch(`${API}${ep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(type === "image" ? { prompt } : { prompt, model: "Comku" })
      });
      const d = await r.json();
      if (d.imageUrl) setImgUrl(d.imageUrl);
      else setOutput(d.reply || d.error || "Eksekusi edge selesai.");
    } catch (e: any) {
      setOutput("Kesalahan komputasi: " + e.message);
    } finally {
      setComputing(false);
    }
  };

  const claimAirdrop = () => {
    if (!user) { setShowAuth(true); return; }
    if (claimed) return;
    const next = balance + 500;
    setBalance(next);
    setClaimed(true);
    localStorage.setItem("awd_bal", next.toString());
    localStorage.setItem("awd_claimed", "true");
  };

  const createApiKey = async () => {
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
        setKeys(prev => [{ name: keyName, key: d.key }, ...prev]);
        setKeyName("");
      }
    } catch (e: any) { alert(e.message); }
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedKey(txt);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="app-container">
      {/* Modal Autentikasi Modern */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px" }}>
          <div className="card-glass" style={{ maxWidth: "440px", width: "100%", padding: "36px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ padding: "8px", background: "rgba(59, 130, 246, 0.15)", borderRadius: "10px", color: "var(--accent-cyan)" }}><Shield size={24} /></div>
              <div><h3 style={{ fontSize: "1.3rem", fontWeight: "800" }}>Identity Nexus</h3><small style={{ color: "var(--text-muted)" }}>Multi-Protocol Authentication Gate</small></div>
            </div>

            <div style={{ display: "flex", gap: "6px", background: "rgba(3, 7, 18, 0.6)", padding: "4px", borderRadius: "12px", margin: "20px 0" }}>
              {[["sso", "OAuth"], ["passkey", "Passkey"], ["rfid", "RFID Tag"], ["direct", "Direct"]].map(([m, l]) => (
                <button key={m} onClick={() => setAuthMethod(m as any)} style={{ flex: 1, padding: "8px 0", background: authMethod === m ? "var(--grad-primary)" : "transparent", border: "none", color: "#fff", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>{l}</button>
              ))}
            </div>

            {authMethod === "sso" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button onClick={() => handleLogin("Google")} disabled={authLoading} className="btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px" }}>
                  <Globe size={18} color="var(--accent-cyan)" /> Lanjutkan dengan Google Account
                </button>
                <button onClick={() => handleLogin("Apple")} disabled={authLoading} className="btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px" }}>
                  <Zap size={18} color="var(--accent-purple)" /> Lanjutkan dengan Apple ID
                </button>
              </div>
            )}

            {authMethod === "passkey" && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: "68px", height: "68px", margin: "0 auto 16px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-cyan)", border: "1px dashed var(--accent-blue)" }}><Fingerprint size={36} /></div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>Otorisasi biometrik kunci aman FIDO2 / Passkey.</p>
                <button onClick={() => handleLogin("Passkey", "passkey_node@xawd.my.id")} disabled={authLoading} className="btn-primary" style={{ width: "100%" }}>Pindai Kredensial Perangkat</button>
              </div>
            )}

            {authMethod === "rfid" && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ width: "68px", height: "68px", margin: "0 auto 16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-emerald)", border: "1px dashed var(--accent-emerald)" }}><Radio size={36} /></div>
                <input className="cyber-input" placeholder="Scan Tag atau Masukkan Serial UID..." value={rfidVal} onChange={e => setRfidVal(e.target.value)} style={{ textAlign: "center", letterSpacing: "2px", marginBottom: "12px" }} />
                <button onClick={() => handleLogin("RFID", `rfid_${rfidVal || "tag"}@xawd.my.id`)} disabled={authLoading} className="btn-primary" style={{ width: "100%", background: "linear-gradient(135deg, #10b981, #059669)" }}>Verifikasi Kunci RFID</button>
              </div>
            )}

            {authMethod === "direct" && (
              <div>
                <input className="cyber-input" type="email" placeholder="operator@perusahaan.com" value={emailInput} onChange={e => setEmailInput(e.target.value)} style={{ marginBottom: "12px" }} />
                <button onClick={() => handleLogin("Direct")} disabled={authLoading} className="btn-primary" style={{ width: "100%" }}>Kirim Magic Auth</button>
              </div>
            )}

            <button onClick={() => setShowAuth(false)} style={{ width: "100%", background: "none", border: "none", color: "var(--text-muted)", marginTop: "20px", cursor: "pointer", fontSize: "0.85rem" }}>Tutup Panel</button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-icon">X</div>
          <div><b style={{ fontSize: "1.15rem", letterSpacing: "1px" }}>XAWD OS</b><div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-emerald)" }}></span><small style={{ color: "var(--accent-emerald)", fontSize: "0.65rem", fontWeight: "700" }}>EDGE ACTIVE</small></div></div>
        </div>

        <nav className="nav-menu">
          {[
            ["overview", "Command Center", LayoutDashboard],
            ["airdrop", "Genesis Airdrop", Gift],
            ["token", "$AWD Pool", Coins],
            ["developer", "Developer Gateway", Terminal],
            ["social", "Social Community", Share2],
            ["referral", "Referral Hub", Users],
            ["billing", "Billing & Tier", CreditCard]
          ].map(([key, label, Icon]: any) => (
            <button key={key} className={`nav-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "16px", border: "1px solid var(--border-subtle)", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <b style={{ fontSize: "0.85rem", display: "block", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email?.split("@")[0] || "Guest Node"}</b>
              <small style={{ color: user ? "var(--accent-emerald)" : "var(--text-muted)", fontSize: "0.7rem" }}>{user ? "Koneksi Terverifikasi" : "Akses Publik"}</small>
            </div>
            {user ? (
              <button onClick={() => { localStorage.removeItem("xawd_token"); setUser(null); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><LogOut size={16} /></button>
            ) : (
              <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.75rem", borderRadius: "8px" }}>Login</button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-viewport">
        <header className="top-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>XAWD OS CLOUD</span><ChevronRight size={14} /><span style={{ color: "var(--accent-cyan)", fontWeight: "700" }}>{tab.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "6px 16px", borderRadius: "20px", color: "var(--accent-cyan)", fontWeight: "800", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
              💎 {balance.toLocaleString()} $AWD
            </div>
          </div>
        </header>

        <div className="content-area">
          {tab === "overview" && (
            <div>
              <div className="metric-grid">
                <div className="metric-card">
                  <small style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "700" }}>Edge Engine</small>
                  <div style={{ fontSize: "1.4rem", fontWeight: "800", marginTop: "4px", color: "var(--accent-cyan)" }}>Cloudflare D1 & AI</div>
                  <small style={{ color: "var(--accent-emerald)" }}>Sub-millisecond Latency</small>
                </div>
                <div className="metric-card">
                  <small style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "700" }}>Active Model</small>
                  <div style={{ fontSize: "1.4rem", fontWeight: "800", marginTop: "4px", color: "#fff" }}>Comku LLM & Flux</div>
                  <small style={{ color: "var(--accent-purple)" }}>Autonomous 9Router</small>
                </div>
                <div className="metric-card">
                  <small style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: "700" }}>Network Status</small>
                  <div style={{ fontSize: "1.4rem", fontWeight: "800", marginTop: "4px", color: "var(--accent-emerald)" }}>100% Operational</div>
                  <small style={{ color: "var(--text-muted)" }}>Surabaya Node</small>
                </div>
              </div>

              <div className="card-glass">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ padding: "8px", background: "rgba(59, 130, 246, 0.15)", borderRadius: "10px", color: "var(--accent-cyan)" }}><Sparkles size={20} /></div>
                    <div><b style={{ fontSize: "1.05rem" }}>Autonomous Command Center</b><small style={{ display: "block", color: "var(--text-muted)" }}>Eksekusi penalaran tingkat tinggi dan sintesis visual generative</small></div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => executeCompute("text")} disabled={computing} className="btn-primary">Jalankan Teks AI</button>
                    <button onClick={() => executeCompute("image")} disabled={computing} className="btn-secondary">Render Gambar Flux</button>
                  </div>
                </div>

                <textarea className="cyber-input" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Tuliskan prompt teknis sistem, analisis kode, instruksi arsitektur, atau deskripsi visual..." style={{ minHeight: "140px", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6" }} />

                {computing && <div style={{ marginTop: "16px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}><RefreshCw className="spin" size={16} /> Sedang mengeksekusi komputasi pada cluster edge...</div>}
                {output && <div style={{ marginTop: "20px", padding: "20px", background: "rgba(3, 7, 18, 0.75)", border: "1px solid var(--border-subtle)", borderRadius: "14px", whiteSpace: "pre-wrap", lineHeight: "1.7", fontSize: "0.92rem" }}>{output}</div>}
                {imgUrl && <div style={{ marginTop: "20px", textAlign: "center" }}><img src={imgUrl} alt="render" style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "14px", border: "1px solid var(--border-glow)" }} /></div>}
              </div>
            </div>
          )}

          {tab === "airdrop" && (
            <div className="card-glass" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
              <span style={{ padding: "6px 14px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "20px", color: "var(--accent-emerald)", fontSize: "0.8rem", fontWeight: "700" }}>COMMUNITY GENESIS PORTAL</span>
              <h2 style={{ fontSize: "2.2rem", fontWeight: "900", margin: "16px 0 8px 0" }}>Klaim Early Validator Airdrop</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "540px", margin: "0 auto 28px auto" }}>Alokasi perdana didistribusikan kepada operator node yang telah mengintegrasikan lingkungan XAWD OS.</p>
              
              <div style={{ background: "rgba(16, 185, 129, 0.04)", border: "1px dashed rgba(16, 185, 129, 0.4)", padding: "36px", borderRadius: "20px", marginBottom: "28px" }}>
                <div style={{ fontSize: "3.2rem", fontWeight: "900", color: "var(--accent-emerald)", letterSpacing: "1px" }}>+500 $AWD</div>
                <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px" }}>Diverifikasi melalui Proof-of-Action Protocol</small>
              </div>

              <button onClick={claimAirdrop} disabled={claimed} className="btn-primary" style={{ padding: "16px 36px", fontSize: "1rem", background: claimed ? "#334155" : "var(--grad-primary)" }}>
                {claimed ? "✓ Alokasi Sudah Berada di Saldo Anda" : "Klaim 500 $AWD Sekarang"}
              </button>
            </div>
          )}

          {tab === "token" && (
            <div className="card-glass" style={{ maxWidth: "900px", margin: "0 auto" }}>
              <h2>$AWD Liquidity & Utility Hub</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>Manajemen saldo aset terdesentralisasi dan alokasi staking reward pada jaringan.</p>
              
              <div className="metric-grid">
                <div className="metric-card">
                  <small style={{ color: "var(--text-muted)" }}>Saldo Dompet</small>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-cyan)", margin: "6px 0" }}>{balance.toLocaleString()} AWD</div>
                  <small style={{ color: "var(--accent-emerald)" }}>Tersedia untuk komputasi</small>
                </div>
                <div className="metric-card">
                  <small style={{ color: "var(--text-muted)" }}>Staking APR</small>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-emerald)", margin: "6px 0" }}>18.4%</div>
                  <small style={{ color: "var(--accent-cyan)" }}>Yield bulanan otomatis</small>
                </div>
              </div>
            </div>
          )}

          {tab === "developer" && (
            <div className="card-glass">
              <h2>Developer API Gateway</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>Akses instan edge cluster programmatic melalui endpoint terenkripsi.</p>
              
              <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                <input className="cyber-input" placeholder="Label Kunci (contoh: Microservice Production)" value={keyName} onChange={e => setKeyName(e.target.value)} />
                <button onClick={createApiKey} className="btn-primary" style={{ whiteSpace: "nowrap" }}>Generate Key</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {keys.map((k, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(3, 7, 18, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: "12px" }}>
                    <div><b>{k.name}</b><code style={{ display: "block", color: "var(--accent-cyan)", marginTop: "4px" }}>{k.key}</code></div>
                    <button onClick={() => copyText(k.key)} className="btn-secondary" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      {copiedKey === k.key ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />} {copiedKey === k.key ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "social" && (
            <div className="card-glass">
              <h2>Komunitas Pengembang Global</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>Terhubung dengan sesama engineer, validator, dan peluncuran produk XAWD.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {[
                  ["Discord Server", "Saluran diskusi teknis dan bot", "https://discord.gg"],
                  ["Telegram Hub", "Pemberitahuan airdrop real-time", "https://t.me"],
                  ["X / Twitter", "Berita resmi dan pembaruan arsitektur", "https://x.com"],
                  ["GitHub Ecosystem", "Source code SDK dan template", "https://github.com"]
                ].map(([title, desc, url], idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-subtle)", padding: "20px", borderRadius: "16px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.2s" }}>
                    <div><b style={{ fontSize: "1.1rem" }}>{title}</b><p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>{desc}</p></div>
                    <div style={{ marginTop: "16px", color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>Buka Hub <ArrowUpRight size={14} /></div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {tab === "referral" && (
            <div className="card-glass">
              <h2>Anti-Sybil Referral Hub</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>Dapatkan kuota komputasi dan komisi gas reward untuk setiap operator terverifikasi.</p>
              <input className="cyber-input" readOnly value={user ? `https://xawd.my.id/?ref=AWD-${user.id?.slice(0, 6).toUpperCase()}` : "Silakan login untuk mengaktifkan kode referral unik Anda"} />
            </div>
          )}

          {tab === "billing" && (
            <div className="card-glass">
              <h2>Paket Komputasi Edge</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>Tingkatkan batas komputasi dan prioritas eksekusi antrean pada sistem.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid var(--border-subtle)", padding: "28px", borderRadius: "20px" }}>
                  <b style={{ fontSize: "1.2rem" }}>Tier Plus</b>
                  <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "var(--accent-cyan)", margin: "14px 0" }}>Rp59.000<span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/bln</span></div>
                  <ul style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    <li>✓ Akses model standar tanpa antre</li>
                    <li>✓ 250 render visual Flux ultra-high</li>
                    <li>✓ Dedicated edge routing</li>
                  </ul>
                  <button className="btn-secondary" style={{ width: "100%" }}>Pilih Paket Plus</button>
                </div>

                <div style={{ background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))", border: "1px solid var(--border-glow)", padding: "28px", borderRadius: "20px", position: "relative" }}>
                  <span style={{ position: "absolute", top: "16px", right: "16px", background: "var(--grad-primary)", color: "#fff", fontSize: "0.7rem", fontWeight: "800", padding: "4px 10px", borderRadius: "20px" }}>POPULAR</span>
                  <b style={{ fontSize: "1.2rem" }}>Tier Pro Enterprise</b>
                  <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "var(--accent-purple)", margin: "14px 0" }}>Rp149.000<span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/bln</span></div>
                  <ul style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    <li>✓ Prioritas maksimum cluster 9Router</li>
                    <li>✓ Unlimited reasoning and tokens</li>
                    <li>✓ Akses Developer API live</li>
                  </ul>
                  <button className="btn-primary" style={{ width: "100%" }}>Aktivasi Pro Sekarang</button>
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
