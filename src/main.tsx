import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, LayoutDashboard, Terminal, Gift, Coins, Users, CreditCard,
  Share2, Fingerprint, Radio, LogOut, Sparkles, Copy, Check,
  Shield, Globe, ChevronRight, ArrowUpRight, Zap, Play, CheckCircle2
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"register" | "sso">("register");

  // Registration State
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // System & Token State
  const [balance, setBalance] = useState(() => Number(localStorage.getItem("awd_bal")) || 1250);
  const [claimed, setClaimed] = useState(() => localStorage.getItem("awd_claimed") === "true");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [computing, setComputing] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [keyName, setKeyName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("xawd_token");
    if (token) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setUser(d.user); else localStorage.removeItem("xawd_token"); })
        .catch(() => {});
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, id_number: idNumber, gender, phone, address })
      });
      const d = await res.json();
      if (d.success) {
        localStorage.setItem("xawd_token", d.token);
        setUser(d.user);
        setShowAuth(false);
      } else {
        alert(d.error || "Registration error");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSSO = async (provider: string) => {
    setAuthLoading(true);
    const mockEmail = `${provider.toLowerCase()}_node@xawd.io`;
    const mockName = `${provider} Operator`;
    try {
      const res = await fetch(`${API}/api/auth/quick-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mockEmail, provider, full_name: mockName })
      });
      const d = await res.json();
      if (d.success) {
        localStorage.setItem("xawd_token", d.token);
        setUser(d.user);
        setShowAuth(false);
      }
    } catch (e: any) { alert(e.message); }
    finally { setAuthLoading(false); }
  };

  const runCompute = async (type: "text" | "image") => {
    if (!prompt.trim()) return;
    setComputing(true);
    setOutput(""); setImgUrl("");
    try {
      const ep = type === "image" ? "/api/ai/image" : "/api/ai/run";
      const token = localStorage.getItem("xawd_token") || "";
      const res = await fetch(`${API}${ep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(type === "image" ? { prompt } : { prompt })
      });
      const d = await res.json();
      if (d.imageUrl) setImgUrl(d.imageUrl);
      else setOutput(d.reply || d.error || "Execution completed.");
    } catch (e: any) { setOutput("Inference error: " + e.message); }
    finally { setComputing(false); }
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

  return (
    <div className="app-wrapper">
      {/* Universal Identity Modal */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 }}>
          <div className="glass-panel" style={{ maxWidth: 520, width: "100%", padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Universal Identity Gateway</h3>
                <small style={{ color: "var(--text-muted)" }}>Verified Node Registration & 1-Click Access</small>
              </div>
              <div style={{ display: "flex", gap: 6, background: "rgba(3, 7, 18, 0.6)", padding: 4, borderRadius: 10 }}>
                <button onClick={() => setAuthMode("register")} style={{ padding: "6px 12px", background: authMode === "register" ? "var(--grad-brand)" : "transparent", border: "none", color: "#fff", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Register</button>
                <button onClick={() => setAuthMode("sso")} style={{ padding: "6px 12px", background: authMode === "sso" ? "var(--grad-brand)" : "transparent", border: "none", color: "#fff", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>SSO Access</button>
              </div>
            </div>

            {authMode === "register" ? (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <small style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Full Legal Name</small>
                  <input className="form-input" required placeholder="Johnathan Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <small style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>National ID / Passport</small>
                    <input className="form-input" required placeholder="A10928374..." value={idNumber} onChange={e => setIdNumber(e.target.value)} />
                  </div>
                  <div>
                    <small style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Gender</small>
                    <select className="form-input" value={gender} onChange={e => setGender(e.target.value)} style={{ background: "#060913" }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <small style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Corporate / Personal Email</small>
                    <input className="form-input" type="email" required placeholder="operator@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <small style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Contact / Mobile Number</small>
                    <input className="form-input" required placeholder="+62 812..." value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <small style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Domicile / Full Address</small>
                  <textarea className="form-input" required placeholder="Street Address, City, Region, Postal Code" value={address} onChange={e => setAddress(e.target.value)} style={{ minHeight: 70, resize: "none" }} />
                </div>
                <button type="submit" disabled={authLoading} className="btn-solid" style={{ padding: 14, marginTop: 6 }}>
                  {authLoading ? "Verifying Node..." : "Register & Issue Credentials"}
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => handleSSO("Google")} disabled={authLoading} className="btn-outline" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Globe size={18} color="var(--accent-cyan)" /> Continue with Google SSO
                </button>
                <button onClick={() => handleSSO("Apple")} disabled={authLoading} className="btn-outline" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Zap size={18} color="var(--accent-violet)" /> Continue with Apple ID
                </button>
                <button onClick={() => handleSSO("X")} disabled={authLoading} className="btn-outline" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <b>𝕏</b> Continue with X (Twitter)
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <button onClick={() => handleSSO("Facebook")} className="btn-outline" style={{ padding: 10, fontSize: 13 }}>Facebook</button>
                  <button onClick={() => handleSSO("Instagram")} className="btn-outline" style={{ padding: 10, fontSize: 13 }}>Instagram</button>
                  <button onClick={() => handleSSO("TikTok")} className="btn-outline" style={{ padding: 10, fontSize: 13 }}>TikTok</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button onClick={() => handleSSO("Passkey")} className="btn-outline" style={{ padding: 10, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Fingerprint size={16} /> Passkey</button>
                  <button onClick={() => handleSSO("RFID")} className="btn-outline" style={{ padding: 10, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Radio size={16} /> RFID Badge</button>
                </div>
              </div>
            )}

            <button onClick={() => setShowAuth(false)} style={{ width: "100%", background: "none", border: "none", color: "var(--text-muted)", marginTop: 16, cursor: "pointer", fontSize: 13 }}>Close Window</button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar-panel">
        <div className="brand-identity">
          <div className="brand-badge">X</div>
          <div><b style={{ fontSize: "1.15rem", letterSpacing: 1 }}>XAWD NEXUS</b><div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-emerald)" }}></span><small style={{ color: "var(--accent-emerald)", fontSize: "0.65rem", fontWeight: 700 }}>GLOBAL MESH ACTIVE</small></div></div>
        </div>

        <nav className="nav-group">
          {[
            ["home", "Overview & Fabric", Home],
            ["overview", "Command Center", LayoutDashboard],
            ["airdrop", "Genesis Airdrop", Gift],
            ["token", "$AWD Staking Pool", Coins],
            ["developer", "Developer Gateway", Terminal],
            ["social", "Global Community", Share2],
            ["referral", "Referral Hub", Users],
            ["billing", "Compute Fuel & Gas", CreditCard]
          ].map(([k, l, Icon]: any) => (
            <button key={k} className={"nav-link " + (tab === k ? "active" : "")} onClick={() => setTab(k)}>
              <Icon size={18} /><span>{l}</span>
            </button>
          ))}
        </nav>

        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 16, borderRadius: 16, border: "1px solid var(--border-subtle)", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <b style={{ fontSize: "0.85rem", display: "block", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name || user?.email?.split("@")[0] || "Guest Node"}</b>
              <small style={{ color: user ? "var(--accent-emerald)" : "var(--text-muted)", fontSize: "0.7rem" }}>{user ? "Verified Identity" : "Unauthenticated"}</small>
            </div>
            {user ? (
              <button onClick={() => { localStorage.removeItem("xawd_token"); setUser(null); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><LogOut size={16} /></button>
            ) : (
              <button onClick={() => setShowAuth(true)} className="btn-solid" style={{ padding: "6px 14px", fontSize: "0.75rem", borderRadius: 8 }}>Access</button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="content-viewport">
        <header className="header-glass">
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>XAWD NEXUS CLOUD</span><ChevronRight size={14} /><span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{tab.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "6px 16px", borderRadius: 20, color: "var(--accent-cyan)", fontWeight: 800, fontSize: "0.85rem" }}>
              💎 {balance.toLocaleString()} $AWD
            </div>
          </div>
        </header>

        <div className="view-body">
          {/* TAB 1: OVERVIEW & FABRIC (HOMEPAGE) */}
          {tab === "home" && (
            <div>
              <div className="glass-panel" style={{ textAlign: "center", padding: "60px 24px", marginBottom: 32 }}>
                <span style={{ padding: "6px 16px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: 20, color: "var(--accent-cyan)", fontSize: "0.8rem", fontWeight: 800 }}>HYPER-SCALE COMPUTE MESH</span>
                <h1 style={{ fontSize: "3rem", fontWeight: 900, margin: "24px 0 16px 0", background: "linear-gradient(135deg, #fff 30%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Autonomous Machine Intelligence & Global Edge Fabric
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 700, margin: "0 auto 32px auto", lineHeight: 1.7 }}>
                  Next-generation orchestration for distributed deep reasoning (AWD Neural Core) and high-throughput visual synthesis (AWD Flux Engine) backed by decentralized $AWD liquidity.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  <button onClick={() => setTab("overview")} className="btn-solid" style={{ padding: "14px 32px", fontSize: "1rem" }}><Play size={18} /> Launch Command Center</button>
                  <button onClick={() => setTab("airdrop")} className="btn-outline" style={{ padding: "14px 32px", fontSize: "1rem" }}>Claim Genesis Airdrop</button>
                </div>
              </div>

              <div className="stat-grid">
                <div className="stat-box">
                  <small style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>DUAL ENGINE INTELLIGENCE</small>
                  <h3 style={{ fontSize: "1.3rem", margin: "8px 0" }}>AWD Neural Core & Flux</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Multi-modal reasoning agent alongside real-time sub-second visual diffusion.</p>
                </div>
                <div className="stat-box">
                  <small style={{ color: "var(--accent-violet)", fontWeight: 700 }}>VERIFIED IDENTITY GATE</small>
                  <h3 style={{ fontSize: "1.3rem", margin: "8px 0" }}>Universal Multi-Auth</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Full KYC onboarding with hardware biometric FIDO2 Passkeys & RFID access.</p>
                </div>
                <div className="stat-box">
                  <small style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>GAS & NETWORK UTILITY</small>
                  <h3 style={{ fontSize: "1.3rem", margin: "8px 0" }}>$AWD Liquidity Pool</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Automated 18.4% APY staking yield with real-time anti-sybil referral rewards.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMMAND CENTER */}
          {tab === "overview" && (
            <div className="glass-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div><b style={{ fontSize: "1.1rem" }}>Autonomous Command Center</b><small style={{ display: "block", color: "var(--text-muted)" }}>AWD Neural Core LLM & Flux Visual Synthesis</small></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => runCompute("text")} disabled={computing} className="btn-solid">Execute Neural Text</button>
                  <button onClick={() => runCompute("image")} disabled={computing} className="btn-outline">Generate Flux Visual</button>
                </div>
              </div>
              <textarea className="form-input" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter machine prompt, systems architecture query, or visual diffusion description..." style={{ minHeight: 140 }} />
              {computing && <div style={{ color: "var(--accent-cyan)", marginTop: 14 }}>⚡ Routing inference to global edge nodes...</div>}
              {output && <div style={{ marginTop: 20, padding: 20, background: "rgba(3, 7, 18, 0.8)", border: "1px solid var(--border-subtle)", borderRadius: 14, whiteSpace: "pre-wrap" }}>{output}</div>}
              {imgUrl && <div style={{ marginTop: 20, textAlign: "center" }}><img src={imgUrl} alt="render" style={{ maxWidth: "100%", borderRadius: 14 }} /></div>}
            </div>
          )}

          {/* TAB 3: GENESIS AIRDROP */}
          {tab === "airdrop" && (
            <div className="glass-panel" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
              <h2>Genesis Validator Airdrop</h2>
              <p style={{ color: "var(--text-muted)", margin: "12px 0 24px 0" }}>Initial allocation distributed to verified network operators across the XAWD ecosystem.</p>
              <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px dashed rgba(16, 185, 129, 0.4)", padding: 36, borderRadius: 20, marginBottom: 28 }}>
                <div style={{ fontSize: "3.2rem", fontWeight: 900, color: "var(--accent-emerald)" }}>+500 $AWD</div>
              </div>
              <button onClick={claimAirdrop} disabled={claimed} className="btn-solid" style={{ padding: "16px 36px" }}>
                {claimed ? "✓ Allocation Deposited to Wallet" : "Claim 500 $AWD Now"}
              </button>
            </div>
          )}

          {/* TAB 4: TOKEN & STAKING */}
          {tab === "token" && (
            <div className="glass-panel">
              <h2>$AWD Liquidity & Staking Hub</h2>
              <div className="stat-grid" style={{ marginTop: 20 }}>
                <div className="stat-box"><small style={{ color: "var(--text-muted)" }}>Total Wallet Balance</small><div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-cyan)", margin: "6px 0" }}>{balance.toLocaleString()} AWD</div></div>
                <div className="stat-box"><small style={{ color: "var(--text-muted)" }}>Staking Yield APR</small><div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-emerald)", margin: "6px 0" }}>18.4%</div></div>
              </div>
            </div>
          )}

          {/* TAB 5: DEVELOPER GATEWAY */}
          {tab === "developer" && (
            <div className="glass-panel">
              <h2>Developer API Gateway</h2>
              <div style={{ display: "flex", gap: 10, margin: "20px 0" }}>
                <input className="form-input" placeholder="API Key Label (e.g., Microservice Cluster)" value={keyName} onChange={e => setKeyName(e.target.value)} />
                <button onClick={() => { if (!keyName.trim()) return; setKeys(prev => [{ name: keyName, key: "xawd_live_" + crypto.randomUUID().replace(/-/g, "") }, ...prev]); setKeyName(""); }} className="btn-solid" style={{ whiteSpace: "nowrap" }}>Generate Key</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {keys.map((k, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "rgba(3, 7, 18, 0.7)", border: "1px solid var(--border-subtle)", borderRadius: 12 }}>
                    <div><b>{k.name}</b><code style={{ display: "block", color: "var(--accent-cyan)", marginTop: 4 }}>{k.key}</code></div>
                    <span style={{ color: "var(--accent-emerald)", fontSize: 13 }}>Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: GLOBAL COMMUNITY */}
          {tab === "social" && (
            <div className="glass-panel">
              <h2>Global Developer Community</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 20 }}>
                {[
                  ["Discord Guild", "Technical discussions & automated bot mesh", "https://discord.gg"],
                  ["Telegram Broadcast", "Real-time airdrop & engine updates", "https://t.me"],
                  ["X / Twitter", "Official releases & architecture roadmaps", "https://x.com"],
                  ["GitHub Ecosystem", "Open source SDKs and integration wrappers", "https://github.com"]
                ].map(([title, desc, url], idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-subtle)", padding: 20, borderRadius: 16, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div><b style={{ fontSize: "1.1rem" }}>{title}</b><p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>{desc}</p></div>
                    <div style={{ marginTop: 16, color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>Access Node <ArrowUpRight size={14} /></div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: REFERRAL */}
          {tab === "referral" && (
            <div className="glass-panel">
              <h2>Anti-Sybil Referral Hub</h2>
              <input className="form-input" readOnly value={user ? "https://xawd.my.id/?ref=AWD-" + user.id.slice(0, 6).toUpperCase() : "Authenticate to generate your unique referral node"} style={{ marginTop: 16 }} />
            </div>
          )}

          {/* TAB 8: COMPUTE FUEL & GAS (PRICING & TOP-UP) */}
          {tab === "billing" && (
            <div className="glass-panel">
              <h2>Compute Fuel & Gas Quota</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>Flexible pay-as-you-go micro-credits & high-capacity enterprise subscription tiers.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 }}>
                {/* Free */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <b style={{ fontSize: "1.1rem" }}>Community Node</b>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", margin: "10px 0" }}>Rp0</div>
                    <ul style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: 8 }}>
                      <li>✓ Basic Neural Core access</li>
                      <li>✓ Genesis Airdrop claim</li>
                      <li>✓ Discord & Telegram developer access</li>
                    </ul>
                  </div>
                  <button className="btn-outline" style={{ width: "100%", marginTop: 20 }}>Current Status</button>
                </div>

                {/* Plus */}
                <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <b style={{ fontSize: "1.1rem" }}>Tier Plus</b>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-cyan)", margin: "10px 0" }}>Rp59.000<span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/mo</span></div>
                    <ul style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: 8 }}>
                      <li>✓ Unthrottled edge execution queue</li>
                      <li>✓ 250 high-res Flux visual generations</li>
                      <li>✓ Rate-limit bypass for standard nodes</li>
                    </ul>
                  </div>
                  <button className="btn-solid" style={{ width: "100%", marginTop: 20 }}>Activate Plus</button>
                </div>

                {/* Pro */}
                <div style={{ background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))", border: "1px solid var(--border-glow)", padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  <span style={{ position: "absolute", top: 12, right: 12, background: "var(--grad-brand)", color: "#fff", fontSize: "0.65rem", fontWeight: 800, padding: "3px 8px", borderRadius: 12 }}>POPULAR</span>
                  <div>
                    <b style={{ fontSize: "1.1rem" }}>Tier Pro</b>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-violet)", margin: "10px 0" }}>Rp149.000<span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/mo</span></div>
                    <ul style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: 8 }}>
                      <li>✓ Priority routing for Deep Reasoning Agent</li>
                      <li>✓ Live Developer API bearer access</li>
                      <li>✓ 1,000 ultra-fast Flux image syntheses</li>
                    </ul>
                  </div>
                  <button className="btn-solid" style={{ width: "100%", marginTop: 20 }}>Deploy Pro Tier</button>
                </div>

                {/* Enterprise */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <b style={{ fontSize: "1.1rem" }}>Enterprise Node</b>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-emerald)", margin: "10px 0" }}>Rp799.000<span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/mo</span></div>
                    <ul style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: 8 }}>
                      <li>✓ Dedicated regional edge cluster deployment</li>
                      <li>✓ Unlimited seats & collaborative nodes</li>
                      <li>✓ Enterprise 24/7 SLA infrastructure</li>
                    </ul>
                  </div>
                  <button className="btn-outline" style={{ width: "100%", marginTop: 20 }}>Contact Sales</button>
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
