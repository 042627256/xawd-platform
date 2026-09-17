import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight, ChevronRight, FolderKanban, LayoutDashboard, Menu,
  Sparkles, LogOut, MessageSquareText, ImageIcon, Globe, CreditCard,
  Users, Terminal, Copy, Check, User
} from "lucide-react";
import "./styles.css";

const textModels = [
  { id: "Comku", label: "AWD Standard (ChatGPT Style - Default)" },
  { id: "ag/gemini-3.8-flash-high", label: "AWD Pro Ultra (Flash High-Speed)" },
  { id: "ag/claude-opus-4-6-thinking", label: "AWD Deep Thinking (Opus)" },
  { id: "ag/claude-sonnet-4-6", label: "AWD Sonnet Agent" }
];

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [lang, setLang] = useState<string>("id");
  const [activeTab, setActiveTab] = useState("Overview");

  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Comku");
  const [aiResponse, setAiResponse] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<any>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");

  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  useEffect(() => {
    fetch("https://api.xawd.my.id/api/auth/me")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setCurrentUser(data.user);
        loadAllData();
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  const loadAllData = () => {
    fetch("https://api.xawd.my.id/api/referrals").then(res => res.json()).then(setReferralData).catch(() => {});
    fetch("https://api.xawd.my.id/api/developer/keys").then(res => res.json()).then(data => setApiKeys(data.keys || [])).catch(() => {});
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    setGeneratedImage("");

    try {
      if (mode === "text") {
        const res = await fetch("https://api.xawd.my.id/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ prompt, model: selectedModel })
        });
        const data = await res.json();
        setAiResponse(data.reply || data.error || "Tidak ada respons diterima.");
      } else {
        const res = await fetch("https://api.xawd.my.id/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        if (data.imageUrl) setGeneratedImage(data.imageUrl);
        else setAiResponse(data.error || "Gagal membuat gambar.");
      }
      loadAllData();
    } catch (e: any) {
      setAiResponse("Network error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    if (!authEmail.trim()) return;
    try {
      const res = await fetch("https://api.xawd.my.id/api/auth/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ email: authEmail })
      });
      const d = await res.json();
      if (d.success) window.location.reload();
      else alert(d.error || "Gagal login");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleCheckout = async (planTier: string) => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("https://api.xawd.my.id/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ planTier })
      });
      const data = await res.json();
      if (data.success) setActiveInvoice(data);
      else alert(data.error || "Gagal checkout");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch("https://api.xawd.my.id/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.key);
        setNewKeyName("");
        loadAllData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (checkingAuth) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f19", color: "#6366f1" }}>Memuat Lingkungan XAWD...</div>;
  }

  return (
    <div className="app">
      {/* Auth Modal */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid var(--accent-primary)", borderRadius: "16px", padding: "24px", maxWidth: "380px", width: "100%" }}>
            <h3 style={{ color: "#fff", marginBottom: "8px" }}>Masuk / Daftar Akun</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>Masukkan email Anda untuk login instan atau membuat akun baru.</p>
            <input type="email" placeholder="nama@domain.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ width: "100%", background: "#0b0f19", border: "1px solid var(--border-subtle)", color: "#fff", padding: "12px", borderRadius: "10px", marginBottom: "16px", outline: "none" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowAuth(false)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "8px", cursor: "pointer" }}>Batal</button>
              <button onClick={handleQuickLogin} style={{ flex: 1, padding: "10px", background: "var(--accent-gradient)", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Masuk</button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Invoice Modal */}
      {activeInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid var(--accent-cyan)", borderRadius: "16px", padding: "24px", maxWidth: "450px", width: "100%" }}>
            <h3 style={{ color: "#fff", marginBottom: "8px" }}>Invoice Pembayaran {activeInvoice.planTier}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>ID Transaksi: <b>{activeInvoice.invoiceId}</b></p>
            <div style={{ margin: "20px 0", padding: "16px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "12px", border: "1px dashed var(--accent-primary)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Tagihan:</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#10b981" }}>Rp{activeInvoice.amountIdr.toLocaleString("id-ID")}</div>
              <p style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "8px" }}>{activeInvoice.paymentInstructions}</p>
            </div>
            <button onClick={() => setActiveInvoice(null)} style={{ width: "100%", padding: "10px", background: "var(--accent-gradient)", border: "none", color: "#fff", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>Tutup Invoice</button>
          </div>
        </div>
      )}

      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brandmark">X</div>
          <b>XAWD</b>
          <button className="icon close" onClick={() => setMobile(false)}>✕</button>
        </div>

        <nav className="nav">
          <button className={`navItem ${activeTab === "Overview" ? "active" : ""}`} onClick={() => { setActiveTab("Overview"); setMobile(false); }}>
            <LayoutDashboard size={18} /><span>Command Center</span>
          </button>
          <button className={`navItem ${activeTab === "Developer" ? "active" : ""}`} onClick={() => { setActiveTab("Developer"); setMobile(false); }}>
            <Terminal size={18} /><span>Developer API</span>
          </button>
          <button className={`navItem ${activeTab === "Referral" ? "active" : ""}`} onClick={() => { setActiveTab("Referral"); setMobile(false); }}>
            <Users size={18} /><span>Referral Hub</span>
          </button>
          <button className={`navItem ${activeTab === "Pricing" ? "active" : ""}`} onClick={() => { setActiveTab("Pricing"); setMobile(false); }}>
            <CreditCard size={18} /><span>Paket & Billing</span>
          </button>
        </nav>

        <div className="sidebarBottom">
          <div className="profile">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="avatar">{currentUser?.email?.[0]?.toUpperCase() || "G"}</div>
              <div><b>{currentUser?.email?.split("@")[0] || "Guest"}</b><small style={{ color: currentUser ? "#10b981" : "var(--text-muted)", display: "block" }}>{currentUser ? "Terautentikasi" : "Belum Login"}</small></div>
            </div>
            {currentUser && (
              <button onClick={() => fetch("https://api.xawd.my.id/api/auth/logout", { method: "POST" }).then(() => window.location.reload())} style={{ background: "none", border: "none", color: "var(--text-muted)" }}><LogOut size={16} /></button>
            )}
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="icon menu" onClick={() => setMobile(true)} style={{ background: "none", border: "none", color: "#fff" }}><Menu size={20} /></button>
          <div className="crumb"><span>XAWD OS</span> <ChevronRight size={14} /> <span>{activeTab}</span></div>
          <div className="headerActions">
            {!currentUser ? (
              <button onClick={() => setShowAuth(true)} style={{ background: "var(--accent-gradient)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={14} /> Login / Daftar
              </button>
            ) : (
              <button onClick={() => setLang(lang === "en" ? "id" : "en")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", color: "#fff", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <Globe size={14} /> {lang.toUpperCase()}
              </button>
            )}
          </div>
        </header>

        <div className="content">
          {activeTab === "Overview" && (
            <section className="aiPanel">
              <div className="aiTop">
                <div className="aiTitle">
                  <div className="aiIcon"><Sparkles size={18} /></div>
                  <div><b>Command Center</b><small>{mode === "text" ? selectedModel : "Flux 1.0 Diffusion"}</small></div>
                </div>
                <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.8)", padding: "4px", borderRadius: "10px" }}>
                  <button onClick={() => setMode("text")} style={{ background: mode === "text" ? "var(--accent-gradient)" : "transparent", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}><MessageSquareText size={14} /> Penalaran</button>
                  <button onClick={() => setMode("image")} style={{ background: mode === "image" ? "var(--accent-gradient)" : "transparent", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}><ImageIcon size={14} /> Visual Flux</button>
                </div>
              </div>

              {mode === "text" && (
                <div style={{ marginBottom: "12px" }}>
                  <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ width: "100%", background: "rgba(15, 23, 42, 0.6)", color: "#fff", border: "1px solid var(--border-subtle)", padding: "10px 14px", borderRadius: "10px", outline: "none", fontSize: "0.85rem" }}>
                    {textModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              )}

              <textarea id="command" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={mode === "text" ? "Perintah penalaran kode atau analisis..." : "Deskripsi prompt visual gambar..."} />

              <div className="aiBottom">
                <button className="run" onClick={handleExecute} disabled={aiLoading}>{aiLoading ? "Memproses..." : "Eksekusi"} <ArrowUpRight size={16} /></button>
              </div>

              {aiResponse && <div style={{ marginTop: "18px", padding: "16px", background: "rgba(15, 23, 42, 0.8)", borderRadius: "12px", border: "1px solid var(--border-subtle)", whiteSpace: "pre-wrap" }}>{aiResponse}</div>}
              {generatedImage && <div style={{ marginTop: "18px", textAlign: "center" }}><img src={generatedImage} alt="Render" style={{ maxWidth: "100%", borderRadius: "12px" }} /></div>}
            </section>
          )}

          {activeTab === "Developer" && (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
              <h2>Developer API Keys</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>Gunakan kunci ini untuk memanggil endpoint api.xawd.my.id langsung dari aplikasi eksternal.</p>
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Nama Kunci (misal: Production Bot)" style={{ flex: 1, background: "#0b0f19", border: "1px solid var(--border-subtle)", color: "#fff", padding: "10px", borderRadius: "8px" }} />
                <button onClick={handleCreateApiKey} style={{ background: "var(--accent-primary)", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Buat Kunci Baru</button>
              </div>

              {generatedKey && (
                <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "10px", marginBottom: "20px" }}>
                  <b style={{ color: "#10b981" }}>Kunci Anda Berhasil Dibuat:</b>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <code style={{ background: "#0b0f19", padding: "8px", borderRadius: "6px", color: "#fff", flex: 1 }}>{generatedKey}</code>
                    <button onClick={() => copyToClipboard(generatedKey)} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><Copy size={16} /></button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {apiKeys.map(k => (
                  <div key={k.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px" }}>
                    <div><b>{k.name}</b><code style={{ marginLeft: "12px", color: "var(--accent-cyan)" }}>{k.prefix}</code></div>
                    <span style={{ color: "#10b981", fontSize: "0.8rem" }}>Aktif</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Referral" && (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
              <h2>Referral & Anti-Sybil Hub</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>Undang pengguna lain untuk menambah kuota komputasi.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px" }}>
                  <small style={{ color: "var(--text-muted)" }}>Total Diundang</small>
                  <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#fff" }}>{referralData?.stats?.totalInvited || 0}</div>
                </div>
                <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px" }}>
                  <small style={{ color: "var(--text-muted)" }}>Akun Terverifikasi</small>
                  <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#10b981" }}>{referralData?.stats?.verifiedAccounts || 0}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input readOnly value={referralData?.referralUrl || "Silakan login untuk mendapatkan link..."} style={{ flex: 1, background: "#0b0f19", border: "1px solid var(--border-subtle)", color: "#fff", padding: "10px", borderRadius: "8px" }} />
                <button onClick={() => copyToClipboard(referralData?.referralUrl)} disabled={!referralData?.referralUrl} style={{ background: "var(--accent-primary)", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  {copiedRef ? <Check size={16} /> : <Copy size={16} />} {copiedRef ? "Tersalin" : "Salin Link"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "Pricing" && (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
              <h2>Paket Langganan & Aktivasi Kuota</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>Pilih paket untuk mengaktifkan akses komputasi tanpa batas.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {[
                  { tier: "Plus", price: "Rp59.000/bln", desc: "Akses standard models, 250 visual flux, BYOK vault unthrottled." },
                  { tier: "Pro", price: "Rp149.000/bln", desc: "Prioritas queue 9router, Deep reasoning agent, developer API key." },
                  { tier: "Team", price: "Rp799.000/bln", desc: "Workspace bersama, 5 developer key, unlimited team seats." }
                ].map((p, idx) => (
                  <div key={idx} style={{ background: "rgba(15, 23, 42, 0.6)", padding: "20px", borderRadius: "14px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <b>{p.tier}</b>
                      <h3 style={{ margin: "10px 0", color: "var(--accent-cyan)" }}>{p.price}</h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>{p.desc}</p>
                    </div>
                    <button onClick={() => handleCheckout(p.tier)} disabled={checkoutLoading} style={{ width: "100%", padding: "10px", background: "var(--accent-primary)", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Beli Paket {p.tier}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
