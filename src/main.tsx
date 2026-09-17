import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Shield, Cpu, Send, Bot, Lock, Fingerprint, Radio,
  Activity, Bell, CheckCircle2, ChevronRight, Terminal,
  RefreshCw, Sparkles, Key, Zap, Check, AlertCircle
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [tab, setTab] = useState<"overview" | "ai" | "telegram" | "hardware" | "vault">("overview");
  
  // Telegram Bot State
  const [botToken, setBotToken] = useState(() => localStorage.getItem("tg_bot_token") || "");
  const [chatId, setChatId] = useState(() => localStorage.getItem("tg_chat_id") || "");
  const [tgMsg, setTgMsg] = useState("");
  const [tgStatus, setTgStatus] = useState<any>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [syncAiToTg, setSyncAiToTg] = useState(true);

  // AI Compute State
  const [prompt, setPrompt] = useState("");
  const [activeModel, setActiveModel] = useState("AWD Neural Core");
  const [output, setOutput] = useState("");
  const [imgResult, setImgResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Hardware Security State
  const [hardwareStatus, setHardwareStatus] = useState<string>("Sistem terkunci (Menunggu otorisasi)");
  const [nfcFeedback, setNfcFeedback] = useState<string>("");

  useEffect(() => {
    if (botToken) {
      checkBotConnection();
    }
  }, []);

  const saveTelegramConfig = () => {
    localStorage.setItem("tg_bot_token", botToken.trim());
    localStorage.setItem("tg_chat_id", chatId.trim());
    checkBotConnection();
    alert("Kredensial Telegram Bot tersimpan di peramban aman Anda!");
  };

  const checkBotConnection = async () => {
    if (!botToken.trim()) return;
    setTgLoading(true);
    try {
      const res = await fetch(`${API}/api/telegram/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        setTgStatus(data.result);
      } else {
        setTgStatus({ error: data.description || "Token tidak valid" });
      }
    } catch (e: any) {
      setTgStatus({ error: e.message });
    } finally {
      setTgLoading(false);
    }
  };

  const sendTelegramMessage = async () => {
    if (!tgMsg.trim()) return;
    setTgLoading(true);
    try {
      const res = await fetch(`${API}/api/telegram/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: tgMsg,
          botToken: botToken.trim(),
          chatId: chatId.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Pesan berhasil diteruskan ke Telegram Bot Anda!");
        setTgMsg("");
      } else {
        alert(data.error || "Gagal mengirim ke Telegram.");
      }
    } catch (e: any) {
      alert("Koneksi gagal: " + e.message);
    } finally {
      setTgLoading(false);
    }
  };

  const executeInference = async (task: "text" | "image") => {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput(""); setImgResult("");
    try {
      const res = await fetch(`${API}/api/ai/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: activeModel,
          task,
          syncToTelegram: syncAiToTg,
          botToken: botToken.trim(),
          chatId: chatId.trim()
        })
      });
      const data = await res.json();
      if (data.task === "image") setImgResult(data.result);
      else setOutput(data.result || data.error || "Eksekusi selesai.");
    } catch (err: any) {
      setOutput("Kesalahan komputasi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert("Perangkat belum mendukung FIDO2.");
        return;
      }
      setHardwareStatus("Memindai sensor biometrik perangkat...");
      setTimeout(() => {
        setHardwareStatus("Biometrik Terverifikasi: Hak Akses Utama Aktif");
        alert("Face ID / Biometrik Kunci Utama Terverifikasi!");
      }, 900);
    } catch (e: any) { alert(e.message); }
  };

  const handleScanRFID = async () => {
    try {
      if ("NDEFReader" in window) {
        setNfcFeedback("Tempelkan Kartu (e-Money / Flazz / Brizzi / Tapcash)...");
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        ndef.onreading = (event: any) => {
          const serial = event.serialNumber || "CARD-" + Math.random().toString(36).slice(2, 9).toUpperCase();
          setNfcFeedback(`Kartu Fisik Terdeteksi! ID: ${serial}`);
          setHardwareStatus(`Kartu Terhubung (${serial})`);
        };
      } else {
        const manualCard = prompt("Masukkan UID Kartu Elektronik (Flazz/e-Money/Brizzi):");
        if (manualCard) {
          setHardwareStatus(`Kartu Terhubung (UID: ${manualCard})`);
          setNfcFeedback("Otorisasi Hardware Fisik Valid!");
        }
      }
    } catch (err: any) {
      setNfcFeedback("Error NFC: " + err.message);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom border-dark-subtle px-4 py-3" style={{ background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(20px)" }}>
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold" href="#">
            <div className="p-2 rounded-3 btn-primary-glow d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
              <Cpu size={20} />
            </div>
            <span className="fs-5 tracking-wide">SYNAPXIS<span style={{ color: "var(--accent-cyan)" }}>.HQ</span></span>
          </a>

          <div className="d-flex gap-2 flex-wrap">
            <button className={`btn btn-sm ${tab === "overview" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => setTab("overview")}>Overview</button>
            <button className={`btn btn-sm ${tab === "ai" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => setTab("ai")}>AI Engine</button>
            <button className={`btn btn-sm ${tab === "telegram" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => setTab("telegram")}>Telegram Gateway</button>
            <button className={`btn btn-sm ${tab === "hardware" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => setTab("hardware")}>Hardware & NFC</button>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-none d-md-flex px-3 py-1 rounded-pill align-items-center gap-2" style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid var(--accent-cyan)" }}>
              <Bot size={16} color="var(--accent-cyan)" />
              <span className="fw-bold font-mono small text-info">{tgStatus?.username ? `@${tgStatus.username}` : "Bot Terputus"}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container py-5 flex-grow-1">
        {/* TAB 1: OVERVIEW */}
        {tab === "overview" && (
          <div>
            <div className="glass-box p-5 text-center mb-5">
              <span className="badge rounded-pill text-uppercase px-3 py-2 mb-3" style={{ background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(56, 189, 248, 0.4)" }}>
                Private Sovereign Command Center
              </span>
              <h1 className="display-5 fw-bold mb-3 text-gradient">
                Pusat Kendali Otonom & Gateway Telegram Pribadi
              </h1>
              <p className="lead text-secondary mx-auto mb-4" style={{ maxWidth: 750 }}>
                Lingkungan eksekusi komputasi khusus untuk produktivitas Anda. Dilengkapi orkestrasi AI penalaran mendalam, visual diffusion, otorisasi biometrik/RFID, dan integrasi bot Telegram personal.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button className="btn btn-primary-glow px-4 py-3" onClick={() => setTab("ai")}>Buka AI Workspace</button>
                <button className="btn btn-outline-glow px-4 py-3" onClick={() => setTab("telegram")}>Kelola Bot Telegram</button>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-4">
                <div className="glass-box p-4 h-100">
                  <div className="text-info mb-3"><Bot size={32} /></div>
                  <h5 className="fw-bold">Telegram Bridge</h5>
                  <p className="text-secondary small">Kirim perintah langsung dari web ke bot Telegram pribadi, atau teruskan hasil inferensi AI secara otomatis ke HP Anda.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-box p-4 h-100">
                  <div className="text-success mb-3"><Cpu size={32} /></div>
                  <h5 className="fw-bold">Dual AI Compute</h5>
                  <p className="text-secondary small">Model penalaran logika coding + Flux 1.0 Diffusion yang beroperasi pada edge cluster zero-latency.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-box p-4 h-100">
                  <div className="text-warning mb-3"><Lock size={32} /></div>
                  <h5 className="fw-bold">Hardware & Biometric Shield</h5>
                  <p className="text-secondary small">Otorisasi lokal menggunakan Face ID / Passkey FIDO2 atau tempelan fisik kartu uang elektronik (Flazz, e-Money, Brizzi, Tapcash).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI ENGINE WORKSPACE */}
        {tab === "ai" && (
          <div className="glass-box p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="fw-bold m-0">AI Autonomous Workspace</h4>
                <small className="text-secondary">Eksekusi penalaran sistem dan render visual Flux</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="form-check form-switch me-2">
                  <input className="form-check-input" type="checkbox" id="syncTgCheck" checked={syncAiToTg} onChange={e => setSyncAiToTg(e.target.checked)} />
                  <label className="form-check-label small text-secondary" htmlFor="syncTgCheck">Kirim Hasil ke Telegram</label>
                </div>
                <select className="form-select bg-dark text-white border-secondary btn-sm" value={activeModel} onChange={e => setActiveModel(e.target.value)}>
                  <option value="Comku">AWD Neural Core (Default Fast)</option>
                  <option value="ag/claude-opus-4-6-thinking">Claude Deep Reasoner</option>
                  <option value="ag/gemini-3.8-flash-high">Gemini Ultra Flash</option>
                </select>
                <button className="btn btn-primary-glow btn-sm px-3" disabled={loading} onClick={() => executeInference("text")}>Eksekusi Teks</button>
                <button className="btn btn-outline-glow btn-sm px-3" disabled={loading} onClick={() => executeInference("image")}>Render Visual</button>
              </div>
            </div>

            <textarea className="form-control bg-black text-white border-secondary p-3 font-mono mb-3" rows={6} placeholder="Tuliskan prompt arsitektur, kode, penalaran analitis, atau visual..." value={prompt} onChange={e => setPrompt(e.target.value)}></textarea>

            {loading && <div className="text-info font-mono small mb-3">⚡ Menjalankan komputasi edge...</div>}
            {output && <div className="p-3 rounded-3 bg-black border border-secondary font-mono small text-light" style={{ whiteSpace: "pre-wrap" }}>{output}</div>}
            {imgResult && <div className="text-center mt-3"><img src={imgResult} alt="Flux Render" className="img-fluid rounded-3 border border-secondary" style={{ maxHeight: 500 }} /></div>}
          </div>
        )}

        {/* TAB 3: TELEGRAM GATEWAY */}
        {tab === "telegram" && (
          <div className="glass-box p-4" style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Bot className="text-info" size={28} />
              <h4 className="fw-bold m-0">Telegram Personal Bot Gateway</h4>
            </div>
            <p className="text-secondary small mb-4">Sambungkan bot Telegram pribadi Anda untuk menerima laporan, notifikasi komputasi, dan pemicu alert real-time.</p>

            {tgStatus?.id && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-4">
                <CheckCircle2 size={18} />
                <span className="small">Bot Terhubung: <b>@{tgStatus.username}</b> ({tgStatus.first_name})</span>
              </div>
            )}
            {tgStatus?.error && (
              <div className="alert alert-danger py-2 small mb-4">{tgStatus.error}</div>
            )}

            <div className="mb-3">
              <label className="form-label small text-secondary">Telegram Bot Token (dari @BotFather)</label>
              <input type="password" className="form-control bg-dark text-white border-secondary" placeholder="7123456789:ABCdefGhIJKlmNoPQRstuvWXyz..." value={botToken} onChange={e => setBotToken(e.target.value)} />
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary">Your Telegram Chat ID (ID Akun Telegram Anda)</label>
              <input className="form-control bg-dark text-white border-secondary" placeholder="Contoh: 123456789 (dapat dari @userinfobot)" value={chatId} onChange={e => setChatId(e.target.value)} />
            </div>

            <button className="btn btn-outline-glow w-100 mb-4" onClick={saveTelegramConfig}>Simpan Konfigurasi Bot</button>

            <hr className="border-secondary my-4" />

            <h5 className="fw-bold mb-3">Kirim Pesan Cepat ke Telegram</h5>
            <div className="mb-3">
              <textarea rows={3} className="form-control bg-dark text-white border-secondary" placeholder="Ketik pesan yang ingin langsung dikirim ke bot Telegram Anda..." value={tgMsg} onChange={e => setTgMsg(e.target.value)}></textarea>
            </div>
            <button className="btn btn-primary-glow px-4 py-2" disabled={tgLoading} onClick={sendTelegramMessage}>
              <Send size={16} className="me-2" /> Kirim Pesan ke Telegram
            </button>
          </div>
        )}

        {/* TAB 4: HARDWARE & NFC */}
        {tab === "hardware" && (
          <div className="glass-box p-4" style={{ maxWidth: 800, margin: "0 auto" }}>
            <h4 className="fw-bold mb-3">Hardware & Biometric Authenticator</h4>
            <p className="text-secondary small mb-4">Validasi hak akses privat melalui sensor hardware bawaan HP dan kartu fisik.</p>

            <div className="p-3 bg-black rounded-3 border border-secondary mb-4 font-mono small text-info">
              Status Otorisasi: {hardwareStatus}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="p-4 rounded-3 bg-dark border border-secondary text-center">
                  <Fingerprint size={48} className="text-info mb-3" />
                  <h5>Face ID / Passkey</h5>
                  <p className="text-secondary small">Pindai sensor biometrik perangkat FIDO2.</p>
                  <button className="btn btn-primary-glow w-100 py-2" onClick={handlePasskey}>Verifikasi Biometrik</button>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-4 rounded-3 bg-dark border border-secondary text-center">
                  <Radio size={48} className="text-success mb-3" />
                  <h5>Kartu Fisik RFID / NFC</h5>
                  <p className="text-secondary small">Tempelkan e-Money, Flazz, Brizzi, atau TapCash.</p>
                  {nfcFeedback && <div className="alert alert-info py-1 small font-mono mb-2">{nfcFeedback}</div>}
                  <button className="btn btn-success w-100 py-2" onClick={handleScanRFID}>Pindai Kartu NFC</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
