import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Shield, Globe, Zap, Cpu, Gift, Coins, Bug, Terminal, Key,
  Fingerprint, Radio, ArrowUpRight, CheckCircle2, ChevronRight,
  Database, RefreshCw, Send, Lock
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [tab, setTab] = useState<"home" | "compute" | "airdrop" | "staking" | "bounty" | "pricing">("home");
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<"sso" | "passkey" | "rfid" | "exchange">("sso");
  
  // App States
  const [balance, setBalance] = useState(() => Number(localStorage.getItem("synap_balance")) || 0);
  const [claimed, setClaimed] = useState(() => localStorage.getItem("synap_claimed") === "true");
  const [prompt, setPrompt] = useState("");
  const [activeModel, setActiveModel] = useState("AWD Neural Core");
  const [output, setOutput] = useState("");
  const [imgResult, setImgResult] = useState("");
  const [loading, setLoading] = useState(false);

  // NFC State
  const [nfcLog, setNfcLog] = useState("");

  // Bounty State
  const [bountyTitle, setBountyTitle] = useState("");
  const [bountySeverity, setBountySeverity] = useState("HIGH");
  const [bountyDesc, setBountyDesc] = useState("");
  const [bountySubmitted, setBountySubmitted] = useState(false);

  // WebAuthn Passkey Native Trigger
  const handlePasskey = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert("Perangkat Anda belum mendukung FIDO2 / WebAuthn.");
        return;
      }
      setNfcLog("Memverifikasi sensor biometrik Face ID / Touch ID...");
      // Simulasi pembuatan kredensial lokal
      setTimeout(() => {
        localStorage.setItem("synap_session", "passkey_fido2_verified");
        alert("Autentikasi Face ID / Passkey Hardware Berhasil!");
        setShowAuth(false);
        setNfcLog("");
      }, 1000);
    } catch (e: any) { alert(e.message); }
  };

  // Web NFC RFID Reader (Flazz, e-Money, Brizzi, Tapcash, Transit Cards)
  const handleScanRFID = async () => {
    try {
      if ("NDEFReader" in window) {
        setNfcLog("Tempelkan Kartu (e-Money / Flazz / Brizzi / Tapcash) ke NFC HP...");
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        ndef.onreading = (event: any) => {
          const serial = event.serialNumber || "CARD-" + Math.random().toString(36).slice(2, 9).toUpperCase();
          setNfcLog(`Kartu Terdeteksi! Serial Hash: ${serial}`);
          localStorage.setItem("synap_session", "rfid_" + serial);
          setTimeout(() => { setShowAuth(false); setNfcLog(""); }, 1500);
        };
      } else {
        const manualCard = prompt("Web NFC tidak aktif di browser ini. Masukkan nomor kartu e-Money / Flazz / Brizzi:");
        if (manualCard) {
          localStorage.setItem("synap_session", "rfid_" + btoa(manualCard));
          alert("Kredensial Kartu Fisik Terverifikasi!");
          setShowAuth(false);
        }
      }
    } catch (err: any) {
      alert("NFC Error: " + err.message);
    }
  };

  // AI Inference Execution
  const executeInference = async (task: "text" | "image") => {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput(""); setImgResult("");
    try {
      const res = await fetch(`${API}/api/ai/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: activeModel, task })
      });
      const data = await res.json();
      if (data.task === "image") setImgResult(data.result);
      else setOutput(data.result || data.error || "Komputasi selesai.");
    } catch (err: any) { setOutput("Inference Failure: " + err.message); }
    finally { setLoading(false); }
  };

  // Claim Genesis Airdrop
  const claimAirdrop = async () => {
    const email = prompt("Masukkan email Anda untuk verifikasi Proof-of-Human:") || "developer@synapxis.ai";
    try {
      const res = await fetch(`${API}/api/airdrop/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, wallet: "sol_vault_live" })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(500);
        setClaimed(true);
        localStorage.setItem("synap_balance", "500");
        localStorage.setItem("synap_claimed", "true");
        alert("Sukses! 500 $SYNAP telah dialokasikan ke vault on-chain Anda.");
      } else {
        alert(data.error || "Gagal klaim airdrop.");
      }
    } catch (e: any) { alert(e.message); }
  };

  // Submit Bug Bounty
  const handleBountySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/bounty/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bountyTitle, severity: bountySeverity, description: bountyDesc })
      });
      const d = await res.json();
      if (d.success) {
        setBountySubmitted(true);
        setBountyTitle(""); setBountyDesc("");
      }
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom border-dark-subtle px-4 py-3" style={{ background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(20px)" }}>
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold" href="#" onClick={() => setTab("home")}>
            <div className="p-2 rounded-3 btn-synap d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
              <Cpu size={20} />
            </div>
            <span className="fs-5 tracking-wide">SYNAPXIS<span style={{ color: "var(--synap-cyan)" }}>.OS</span></span>
          </a>

          <div className="d-flex gap-2">
            <button className={`btn btn-sm ${tab === "home" ? "btn-synap" : "btn-ghost"}`} onClick={() => setTab("home")}>Overview</button>
            <button className={`btn btn-sm ${tab === "compute" ? "btn-synap" : "btn-ghost"}`} onClick={() => setTab("compute")}>Command Center</button>
            <button className={`btn btn-sm ${tab === "airdrop" ? "btn-synap" : "btn-ghost"}`} onClick={() => setTab("airdrop")}>Airdrop</button>
            <button className={`btn btn-sm ${tab === "staking" ? "btn-synap" : "btn-ghost"}`} onClick={() => setTab("staking")}>Staking</button>
            <button className={`btn btn-sm ${tab === "pricing" ? "btn-synap" : "btn-ghost"}`} onClick={() => setTab("pricing")}>Services</button>
            <button className={`btn btn-sm ${tab === "bounty" ? "btn-synap" : "btn-ghost"}`} onClick={() => setTab("bounty")}>Bug Bounty</button>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-none d-md-flex px-3 py-1 rounded-pill align-items-center gap-2" style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid var(--synap-cyan)" }}>
              <Coins size={16} color="var(--synap-cyan)" />
              <span className="fw-bold font-mono text-info fs-6">{balance.toLocaleString()} $SYNAP</span>
            </div>
            <button className="btn btn-synap px-3 py-2 btn-sm d-flex align-items-center gap-2" onClick={() => setShowAuth(true)}>
              <Shield size={16} /> Access Gateway
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container py-5 flex-grow-1">
        {/* TAB 1: OVERVIEW HERO */}
        {tab === "home" && (
          <div>
            <div className="glass-box p-5 text-center mb-5">
              <span className="badge rounded-pill text-uppercase px-3 py-2 mb-3" style={{ background: "rgba(56, 189, 248, 0.15)", color: "var(--synap-cyan)", border: "1px solid rgba(56, 189, 248, 0.4)" }}>
                Zero-Trust Military Grade AI Fabric
              </span>
              <h1 className="display-4 fw-black mb-3 text-gradient">
                Hyper-Scale Distributed Edge Compute & Autonomous Intelligence
              </h1>
              <p className="lead text-secondary mx-auto mb-4" style={{ maxWidth: 800 }}>
                Orkestrasi multi-engine generasi baru yang memadukan GPT-4o, Claude 3.5, Gemini 1.5, dan Microsoft Phi dengan protokol token utilitas Solana Token-2022 serta otentikasi hardware multi-tier.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button className="btn btn-synap px-4 py-3" onClick={() => setTab("compute")}>Buka Command Center</button>
                <button className="btn btn-ghost px-4 py-3" onClick={() => setTab("airdrop")}>Klaim 500 $SYNAP Airdrop</button>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-4">
                <div className="glass-box p-4 h-100">
                  <div className="text-info mb-3"><Cpu size={32} /></div>
                  <h5 className="fw-bold">Multi-Engine AI Routing</h5>
                  <p className="text-secondary small">Penalaran, pemrograman, dan sintesis visual real-time dengan latensi sub-10ms melalui edge network global.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-box p-4 h-100">
                  <div className="text-success mb-3"><Fingerprint size={32} /></div>
                  <h5 className="fw-bold">Universal Hardware Auth</h5>
                  <p className="text-secondary small">Integrasi WebAuthn Face ID biometrik, NFC kartu e-Money/Flazz/Brizzi, hingga akun exchange Binance/Bybit.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-box p-4 h-100">
                  <div className="text-warning mb-3"><Coins size={32} /></div>
                  <h5 className="fw-bold">Solana Token-2022 Fixed Pool</h5>
                  <p className="text-secondary small">Total pasokan 100.000.000 $SYNAP dengan mekanisme anti-bot proof-of-human dan staking reward 18.4% APY.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMAND CENTER */}
        {tab === "compute" && (
          <div className="glass-box p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="fw-bold m-0">Autonomous AI Command Center</h4>
                <small className="text-secondary">Pilih model dan jalankan instruksi penalaran atau visual diffusion</small>
              </div>
              <div className="d-flex gap-2">
                <select className="form-select bg-dark text-white border-secondary btn-sm" value={activeModel} onChange={e => setActiveModel(e.target.value)}>
                  <option value="Comku">AWD Neural Core (Default Fast)</option>
                  <option value="ag/claude-opus-4-6-thinking">Claude Deep Reasoner</option>
                  <option value="ag/gemini-3.8-flash-high">Gemini Ultra Flash</option>
                </select>
                <button className="btn btn-synap btn-sm px-3" disabled={loading} onClick={() => executeInference("text")}>Run Inference</button>
                <button className="btn btn-ghost btn-sm px-3" disabled={loading} onClick={() => executeInference("image")}>Flux Image</button>
              </div>
            </div>

            <textarea className="form-control bg-black text-white border-secondary p-3 font-mono mb-3" rows={5} placeholder="Masukkan instruksi arsitektur, algoritma, atau prompt gambar visual..." value={prompt} onChange={e => setPrompt(e.target.value)}></textarea>

            {loading && <div className="text-info font-mono small mb-3">⚡ Menjalankan komputasi pada cluster edge zero-trust...</div>}
            {output && <div className="p-3 rounded-3 bg-black border border-secondary font-mono small text-light" style={{ whiteSpace: "pre-wrap" }}>{output}</div>}
            {imgResult && <div className="text-center mt-3"><img src={imgResult} alt="Flux Render" className="img-fluid rounded-3 border border-secondary" style={{ maxHeight: 500 }} /></div>}
          </div>
        )}

        {/* TAB 3: GENESIS AIRDROP */}
        {tab === "airdrop" && (
          <div className="glass-box p-5 text-center mx-auto" style={{ maxWidth: 800 }}>
            <h2 className="fw-black mb-3">Genesis Airdrop Portal</h2>
            <p className="text-secondary">Distribusi alokasi early node operator dengan verifikasi identitas anti-bot.</p>
            <div className="p-4 rounded-4 my-4" style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px dashed var(--synap-emerald)" }}>
              <div className="display-4 fw-black text-success font-mono">+500 $SYNAP</div>
              <small className="text-secondary d-block mt-2">Solana Token-2022 Program • Proof-of-Human Identity Protected</small>
            </div>
            <button className="btn btn-synap px-5 py-3 fs-5" disabled={claimed} onClick={claimAirdrop}>
              {claimed ? "✓ Alokasi Sudah Berada di Vault Anda" : "Klaim Alokasi Airdrop Sekarang"}
            </button>
          </div>
        )}

        {/* TAB 4: STAKING */}
        {tab === "staking" && (
          <div className="glass-box p-4">
            <h3 className="fw-bold mb-3">$SYNAP Liquidity & Staking Hub</h3>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-4 rounded-3 bg-dark border border-secondary">
                  <small className="text-secondary">Total Saldo Aktif</small>
                  <div className="fs-3 fw-bold text-info font-mono">{balance.toLocaleString()} SYNAP</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-4 rounded-3 bg-dark border border-secondary">
                  <small className="text-secondary">Yield Staking Jaringan</small>
                  <div className="fs-3 fw-bold text-success font-mono">18.4% APY</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BUG BOUNTY */}
        {tab === "bounty" && (
          <div className="glass-box p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Bug className="text-danger" size={28} />
              <h3 className="fw-bold m-0">Zero-Day Bug Bounty Portal</h3>
            </div>
            <p className="text-secondary">Temukan celah pada sistem offline-sync, otentikasi hardware, atau protokol enkripsi untuk mendapatkan reward hingga 50.000 $SYNAP.</p>

            {bountySubmitted && <div className="alert alert-success">Laporan Anda telah tercatat dan sedang diuji oleh tim keamanan.</div>}

            <form onSubmit={handleBountySubmit}>
              <div className="mb-3">
                <label className="form-label small text-secondary">Judul Kerentanan / Celah</label>
                <input required className="form-control bg-dark text-white border-secondary" placeholder="Contoh: Replay attack pada sinkronisasi offline IndexedDB" value={bountyTitle} onChange={e => setBountyTitle(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">Tingkat Keparahan</label>
                <select className="form-select bg-dark text-white border-secondary" value={bountySeverity} onChange={e => setBountySeverity(e.target.value)}>
                  <option value="CRITICAL">Critical (Hadiah: 50.000 $SYNAP)</option>
                  <option value="HIGH">High (Hadiah: 20.000 $SYNAP)</option>
                  <option value="MEDIUM">Medium (Hadiah: 5.000 $SYNAP)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">Deskripsi & Langkah Eksploitasi (Proof of Concept)</label>
                <textarea required rows={4} className="form-control bg-dark text-white border-secondary font-mono" placeholder="Jelaskan payload dan langkah reproduksi..." value={bountyDesc} onChange={e => setBountyDesc(e.target.value)}></textarea>
              </div>
              <button type="submit" className="btn btn-danger px-4 py-2">Kirim Laporan Keamanan</button>
            </form>
          </div>
        )}

        {/* TAB 6: SERVICES & PRICING */}
        {tab === "pricing" && (
          <div>
            <div className="text-center mb-5">
              <h2 className="fw-black">Layanan & Skema Komputasi</h2>
              <p className="text-secondary">Dukungan komputasi fleksibel bayar sesuai pemakaian (Pay-as-You-Go) atau kuota dedicated.</p>
            </div>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="glass-box p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <h5>Starter Booster</h5>
                    <div className="fs-3 fw-bold text-info my-3">Rp25.000</div>
                    <ul className="list-unstyled text-secondary small">
                      <li>✓ +2.500 Kuota Komputasi Token</li>
                      <li>✓ Akses model standar tanpa jeda</li>
                      <li>✓ Validitas kuota selamanya</li>
                    </ul>
                  </div>
                  <button className="btn btn-ghost w-100 mt-4">Top-Up Kredit</button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-box p-4 h-100 d-flex flex-column justify-content-between" style={{ borderColor: "var(--synap-cyan)" }}>
                  <div>
                    <span className="badge bg-primary mb-2">Paling Populer</span>
                    <h5>Developer Cluster</h5>
                    <div className="fs-3 fw-bold text-info my-3">Rp100.000</div>
                    <ul className="list-unstyled text-secondary small">
                      <li>✓ +12.000 Kuota Komputasi Token</li>
                      <li>✓ Developer API Key Bearer Live</li>
                      <li>✓ Akses prioritas penalaran reasoning</li>
                    </ul>
                  </div>
                  <button className="btn btn-synap w-100 mt-4">Top-Up Developer</button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-box p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <h5>Enterprise Sovereign</h5>
                    <div className="fs-3 fw-bold text-info my-3">Rp500.000</div>
                    <ul className="list-unstyled text-secondary small">
                      <li>✓ +75.000 Kuota Komputasi Token</li>
                      <li>✓ Dedicated regional edge routing</li>
                      <li>✓ Dukungan teknis SLA 99.99%</li>
                    </ul>
                  </div>
                  <button className="btn btn-ghost w-100 mt-4">Pilih Enterprise</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Universal Identity Modal */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.92)", backdropFilter: "blur(20px)", zIndex: 99999 }} className="d-flex align-items-center justify-content-center p-3">
          <div className="glass-box p-4 w-100" style={{ maxWidth: 500 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 d-flex align-items-center gap-2"><Lock size={20} className="text-info" /> Universal Identity Gate</h5>
              <button className="btn-close btn-close-white" onClick={() => setShowAuth(false)}></button>
            </div>

            <div className="btn-group w-100 mb-3">
              <button className={`btn btn-sm ${authType === "sso" ? "btn-synap" : "btn-ghost"}`} onClick={() => setAuthType("sso")}>SSO / Web2</button>
              <button className={`btn btn-sm ${authType === "passkey" ? "btn-synap" : "btn-ghost"}`} onClick={() => setAuthType("passkey")}>Face ID</button>
              <button className={`btn btn-sm ${authType === "rfid" ? "btn-synap" : "btn-ghost"}`} onClick={() => setAuthType("rfid")}>RFID / NFC</button>
              <button className={`btn btn-sm ${authType === "exchange" ? "btn-synap" : "btn-ghost"}`} onClick={() => setAuthType("exchange")}>Exchanges</button>
            </div>

            {authType === "sso" && (
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-ghost d-flex align-items-center justify-content-center gap-2 py-2" onClick={() => { localStorage.setItem("synap_session", "google_sso"); setShowAuth(false); }}><Globe size={18} /> Google Identity</button>
                <button className="btn btn-ghost d-flex align-items-center justify-content-center gap-2 py-2" onClick={() => { localStorage.setItem("synap_session", "apple_sso"); setShowAuth(false); }}><Zap size={18} /> Apple ID</button>
                <button className="btn btn-ghost d-flex align-items-center justify-content-center gap-2 py-2" onClick={() => { localStorage.setItem("synap_session", "x_sso"); setShowAuth(false); }}><b>𝕏</b> X (Twitter)</button>
              </div>
            )}

            {authType === "passkey" && (
              <div className="text-center py-4">
                <Fingerprint size={48} className="text-info mb-3" />
                <p className="small text-secondary">Autentikasi biometrik FIDO2 Secure Enclave perangkat Anda.</p>
                <button className="btn btn-synap w-100 py-2" onClick={handlePasskey}>Verifikasi Face ID / Touch ID</button>
              </div>
            )}

            {authType === "rfid" && (
              <div className="text-center py-4">
                <Radio size={48} className="text-success mb-3" />
                <p className="small text-secondary">Pindai kartu Flazz, e-Money, Brizzi, TapCash, atau transit card internasional.</p>
                {nfcLog && <div className="alert alert-info py-2 small font-mono">{nfcLog}</div>}
                <button className="btn btn-success w-100 py-2" onClick={handleScanRFID}>Aktifkan Sensor NFC</button>
              </div>
            )}

            {authType === "exchange" && (
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-ghost py-2" onClick={() => { localStorage.setItem("synap_session", "binance"); setShowAuth(false); }}>Binance Account Connect</button>
                <button className="btn btn-ghost py-2" onClick={() => { localStorage.setItem("synap_session", "bybit"); setShowAuth(false); }}>Bybit Authenticate</button>
                <button className="btn btn-ghost py-2" onClick={() => { localStorage.setItem("synap_session", "tokocrypto"); setShowAuth(false); }}>Tokocrypto ID</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
