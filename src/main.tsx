import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Cpu, Bot, Image as ImageIcon, Video, Code, Brain,
  Send, RefreshCw, CheckCircle2, Play, Layers, Sparkles
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [tab, setTab] = useState<"studio" | "agents" | "telegram" | "vault">("studio");
  
  // Studio State
  const [taskMode, setTaskMode] = useState<"chat" | "thinking" | "coding" | "image" | "video">("chat");
  const [prompt, setPrompt] = useState("");
  const [executing, setExecuting] = useState(false);
  const [textOutput, setTextOutput] = useState("");
  const [mediaOutput, setMediaOutput] = useState<string | null>(null);

  // Custom Agent Builder State
  const [agents, setAgents] = useState<any[]>([]);
  const [agentName, setAgentName] = useState("");
  const [agentRole, setAgentRole] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);

  // Telegram Info State (Read-only status dari backend)
  const [tgInfo, setTgInfo] = useState<any>(null);

  // Vault History
  const [vault, setVault] = useState<any[]>([]);

  useEffect(() => {
    loadTelegramInfo();
    loadAgents();
    loadVault();
  }, []);

  const loadTelegramInfo = async () => {
    try {
      const res = await fetch(`${API}/api/telegram/info`);
      const d = await res.json();
      setTgInfo(d);
    } catch (_) {}
  };

  const loadAgents = async () => {
    try {
      const res = await fetch(`${API}/api/agents`);
      const d = await res.json();
      setAgents(d.agents || []);
    } catch (_) {}
  };

  const loadVault = async () => {
    try {
      const res = await fetch(`${API}/api/vault`);
      const d = await res.json();
      setVault(d.outputs || []);
    } catch (_) {}
  };

  const executeStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setExecuting(true);
    setTextOutput("");
    setMediaOutput(null);

    try {
      const res = await fetch(`${API}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskMode, prompt })
      });
      const d = await res.json();
      if (d.task === "image" || d.task === "video") {
        setMediaOutput(d.result);
      } else {
        setTextOutput(d.result || d.error || "Selesai dieksekusi.");
      }
      loadVault();
    } catch (err: any) {
      setTextOutput("Error: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim() || !agentPrompt.trim()) return;
    setAgentLoading(true);
    try {
      const res = await fetch(`${API}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName, role_desc: agentRole, system_prompt: agentPrompt })
      });
      const d = await res.json();
      if (d.success) {
        setAgentName("");
        setAgentRole("");
        setAgentPrompt("");
        alert("Agent kustom X AWD berhasil dibuat!");
        loadAgents();
      }
    } catch (e: any) { alert(e.message); }
    finally { setAgentLoading(false); }
  };

  const activateAgent = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/agents/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const d = await res.json();
      if (d.success) {
        alert("Agent ini sekarang menjadi otak utama bot Telegram Anda!");
        loadAgents();
      }
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom border-dark-subtle px-4 py-3" style={{ background: "rgba(3, 7, 18, 0.9)", backdropFilter: "blur(20px)" }}>
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold" href="#">
            <div className="p-2 rounded-3 btn-xawd d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
              <Cpu size={22} />
            </div>
            <span className="fs-5 tracking-wider">X AWD<span style={{ color: "var(--xawd-cyan)" }}>.HQ</span></span>
          </a>

          <div className="d-flex gap-2 flex-wrap">
            <button className={`btn btn-sm ${tab === "studio" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => setTab("studio")}>
              <Sparkles size={14} className="me-1" /> Multi-Modal Studio
            </button>
            <button className={`btn btn-sm ${tab === "agents" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => setTab("agents")}>
              <Brain size={14} className="me-1" /> Custom Agent Builder
            </button>
            <button className={`btn btn-sm ${tab === "telegram" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => { setTab("telegram"); loadTelegramInfo(); }}>
              <Bot size={14} className="me-1" /> Status Bot Telegram
            </button>
            <button className={`btn btn-sm ${tab === "vault" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => { setTab("vault"); loadVault(); }}>
              <Layers size={14} className="me-1" /> Vault & History
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="px-3 py-1 rounded-pill d-flex align-items-center gap-2" style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid var(--xawd-cyan)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: tgInfo?.connected ? "var(--xawd-emerald)" : "#f59e0b" }}></span>
              <span className="small font-mono text-info fw-bold">{tgInfo?.connected ? `@${tgInfo.bot?.username}` : "Bot Standby"}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-4 flex-grow-1">
        {/* 1. STUDIO (CHAT, THINKING, CODING, IMAGE, VIDEO) */}
        {tab === "studio" && (
          <div className="xawd-box p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h4 className="fw-bold m-0">X AWD Sovereign Multi-Modal Studio</h4>
                <small className="text-secondary">Eksekusi Penalaran, Koding, Visual Flux, dan Video dalam satu ruang kendali</small>
              </div>

              <div className="btn-group">
                <button className={`btn btn-sm ${taskMode === "chat" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => setTaskMode("chat")}>💬 Chat</button>
                <button className={`btn btn-sm ${taskMode === "thinking" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => setTaskMode("thinking")}>🧠 Berpikir</button>
                <button className={`btn btn-sm ${taskMode === "coding" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => setTaskMode("coding")}>💻 Koding</button>
                <button className={`btn btn-sm ${taskMode === "image" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => setTaskMode("image")}>🎨 Gambar Flux</button>
                <button className={`btn btn-sm ${taskMode === "video" ? "btn-xawd" : "btn-xawd-outline"}`} onClick={() => setTaskMode("video")}>🎬 Video</button>
              </div>
            </div>

            <form onSubmit={executeStudio} className="mb-4">
              <div className="mb-3">
                <textarea
                  rows={5}
                  required
                  className="form-control bg-black text-white border-secondary font-mono p-3"
                  placeholder={
                    taskMode === "chat" ? "Tanyakan apa saja untuk dijawab langsung oleh agen..." :
                    taskMode === "thinking" ? "Masukkan topik analitis yang butuh pemecahan mendalam dan penalaran berlapis..." :
                    taskMode === "coding" ? "Instruksikan kode, debug error, atau buat arsitektur sistem software..." :
                    taskMode === "image" ? "Tulis deskripsi detail gambar yang ingin dirender (misal: mobil sport masa depan melaju di jalanan basah malam hari)..." :
                    "Tulis prompt skenario video yang ingin digenerate..."
                  }
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                ></textarea>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-secondary font-mono">Edge Cluster: Cloudflare Active</span>
                <button type="submit" disabled={executing} className="btn btn-xawd px-4 py-2">
                  {executing ? "Sedang Memproses..." : <><Send size={16} className="me-2" /> Jalankan {taskMode.toUpperCase()}</>}
                </button>
              </div>
            </form>

            {executing && <div className="text-info font-mono small my-3">⚡ Menjalankan komputasi neural pada cluster edge...</div>}

            {textOutput && (
              <div className="p-3 rounded-3 bg-black border border-secondary font-mono small text-light mt-3" style={{ whiteSpace: "pre-wrap" }}>
                {textOutput}
              </div>
            )}

            {mediaOutput && taskMode === "image" && (
              <div className="text-center mt-3">
                <img src={mediaOutput} alt="Flux Render" className="img-fluid rounded-3 border border-secondary" style={{ maxHeight: 500 }} />
              </div>
            )}

            {mediaOutput && taskMode === "video" && (
              <div className="text-center mt-3">
                <video controls autoPlay loop className="w-100 rounded-3 border border-secondary" style={{ maxHeight: 480 }}>
                  <source src={mediaOutput} type="video/mp4" />
                </video>
              </div>
            )}
          </div>
        )}

        {/* 2. CUSTOM AGENT BUILDER */}
        {tab === "agents" && (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="xawd-box p-4">
                <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Brain size={22} className="text-info" /> Buat Persona Agent X AWD
                </h4>
                <p className="text-secondary small mb-4">Rancang agen pribadi yang bertindak sebagai otak utama saat Anda chatting di web ataupun di Telegram.</p>

                <form onSubmit={createAgent}>
                  <div className="mb-3">
                    <label className="form-label small text-secondary">Nama Agent</label>
                    <input required className="form-control bg-dark text-white border-secondary" placeholder="Contoh: X AWD Master Strategist" value={agentName} onChange={e => setAgentName(e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary">Peran Singkat</label>
                    <input className="form-control bg-dark text-white border-secondary" placeholder="Contoh: Spesialis koding dan penalaran cepat" value={agentRole} onChange={e => setAgentRole(e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary">System Prompt (Instruksi Berpikir & Perilaku)</label>
                    <textarea required rows={6} className="form-control bg-dark text-white border-secondary font-mono small" placeholder="Tentukan kepribadian dan aturan berpikir agent ini. Contoh: 'Kamu adalah agen pribadi saya. Jawab selalu to-the-point, logis, terstruktur, dan gunakan bahasa Indonesia yang lugas...'" value={agentPrompt} onChange={e => setAgentPrompt(e.target.value)}></textarea>
                  </div>

                  <button type="submit" disabled={agentLoading} className="btn btn-xawd w-100 py-2">
                    {agentLoading ? "Menyimpan Agent..." : "Simpan Agent Kustom"}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="xawd-box p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold m-0">Daftar Agent Buatan Anda ({agents.length})</h4>
                  <button className="btn btn-sm btn-xawd-outline" onClick={loadAgents}><RefreshCw size={14} /></button>
                </div>
                <p className="text-secondary small mb-4">Klik "Jadikan Otak Telegram" pada agent yang ingin Anda aktifkan untuk membalas chat di bot.</p>

                {agents.length === 0 && (
                  <div className="text-center py-5 text-secondary">Belum ada agent kustom. Buat agent pertama di form sebelah kiri!</div>
                )}

                <div className="d-flex flex-column gap-3">
                  {agents.map(agt => (
                    <div key={agt.id} className="p-3 rounded-3 bg-dark border border-secondary d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <b className="fs-5">{agt.name}</b>
                          {agt.is_active === 1 && (
                            <span className="badge bg-success small">OTAK TELEGRAM AKTIF</span>
                          )}
                        </div>
                        <p className="text-secondary small my-1">{agt.role_desc}</p>
                        <div className="p-2 rounded bg-black mt-2 font-mono small text-secondary border border-dark" style={{ maxHeight: 90, overflowY: "auto" }}>
                          {agt.system_prompt}
                        </div>
                      </div>

                      <div className="ms-3">
                        <button
                          className={`btn btn-sm ${agt.is_active === 1 ? "btn-success" : "btn-xawd"}`}
                          onClick={() => activateAgent(agt.id)}
                        >
                          {agt.is_active === 1 ? "✓ Terhubung ke Bot" : "Jadikan Otak Telegram"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. STATUS BOT TELEGRAM (READ-ONLY, BEBAS INPUT TOKEN) */}
        {tab === "telegram" && (
          <div className="xawd-box p-4 mx-auto" style={{ maxWidth: 800 }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Bot className="text-info" size={32} />
              <h4 className="fw-bold m-0">Status Bot Telegram X AWD</h4>
            </div>
            <p className="text-secondary small mb-4">
              Konfigurasi token dan chat ID telah dipasang langsung melalui perintah terminal Termux. Tidak ada form sensitif di halaman website ini.
            </p>

            <div className="p-4 rounded-3 bg-dark border border-secondary mb-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <small className="text-secondary d-block">Status Sambungan Webhook</small>
                  <b className={`fs-5 ${tgInfo?.connected ? "text-success" : "text-warning"}`}>
                    {tgInfo?.connected ? "✓ Aktif & Terhubung ke Telegram" : "Menunggu Inisialisasi"}
                  </b>
                  {tgInfo?.bot && (
                    <div className="text-info font-mono small mt-2">
                      Bot: <b>@{tgInfo.bot.username}</b> ({tgInfo.bot.first_name})
                    </div>
                  )}
                </div>
                <button className="btn btn-sm btn-xawd-outline" onClick={loadTelegramInfo}><RefreshCw size={14} /> Refresh</button>
              </div>
            </div>

            <div className="p-3 rounded-3 bg-dark border border-secondary">
              <h6 className="fw-bold text-info mb-2">Panduan Penggunaan Perintah di Bot:</h6>
              <ul className="small text-secondary m-0 ps-3">
                <li><code>/start</code> - Cek status bot dan daftar menu</li>
                <li><code>/image &lt;deskripsi&gt;</code> - Membuat gambar Flux dan mengirim foto langsung ke chat</li>
                <li><code>/video &lt;skenario&gt;</code> - Membuat klip video neural</li>
                <li><code>/think &lt;topik&gt;</code> - Meminta bot berpikir mendalam dan menganalisis solusi</li>
                <li><code>/code &lt;tugas&gt;</code> - Meminta bot menuliskan kode atau memperbaiki script</li>
                <li><code>&lt;chat biasa&gt;</code> - Berbincang santai menggunakan persona Agent yang Anda buat di web</li>
              </ul>
            </div>
          </div>
        )}

        {/* 4. VAULT OUTPUT & HISTORY */}
        {tab === "vault" && (
          <div className="xawd-box p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold m-0">X AWD Output Vault & History</h4>
              <button className="btn btn-sm btn-xawd-outline" onClick={loadVault}><RefreshCw size={14} /> Refresh</button>
            </div>
            <p className="text-secondary small mb-4">Semua hasil komputasi (gambar, video, koding, dan penalaran) dari website maupun Telegram tersimpan rapi di sini.</p>

            {vault.length === 0 && <div className="text-center py-5 text-secondary">Belum ada output yang tersimpan.</div>}

            <div className="row g-3">
              {vault.map(item => (
                <div key={item.id} className="col-md-6">
                  <div className="p-3 rounded-3 bg-dark border border-secondary h-100">
                    <div className="d-flex justify-content-between align-items-center text-secondary small mb-2">
                      <span className="badge bg-primary text-uppercase">{item.task_type}</span>
                      <span className="font-mono">{new Date(item.created_at).toLocaleTimeString()} ({item.source})</span>
                    </div>
                    <div className="text-info small mb-2 font-mono"><b>Prompt:</b> {item.prompt}</div>
                    <div className="text-light small font-mono bg-black p-2 rounded border border-dark" style={{ maxHeight: 150, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                      {item.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
