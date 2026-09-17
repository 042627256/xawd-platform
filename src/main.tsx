import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Bot, Cpu, Plus, Send, Radio, Settings, CheckCircle2,
  RefreshCw, MessageSquare, Shield, Terminal, ArrowRight,
  Trash2, Power, Play, Sliders
} from "lucide-react";
import "./styles.css";

const API = "https://api.xawd.my.id";

function App() {
  const [tab, setTab] = useState<"builder" | "telegram" | "chat" | "logs">("builder");

  // Agents State
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Agent Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("Comku");
  const [temperature, setTemperature] = useState(0.7);

  // Telegram Integration State
  const [botToken, setBotToken] = useState(() => localStorage.getItem("my_bot_token") || "");
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [whLoading, setWhLoading] = useState(false);

  // Testing Chat State
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ sender: "user" | "agent"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Logs
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agents`);
      const data = await res.json();
      setAgents(data.agents || []);
      if (data.agents && data.agents.length > 0 && !selectedAgent) {
        setSelectedAgent(data.agents[0]);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, system_prompt: systemPrompt, model, temperature })
      });
      const d = await res.json();
      if (d.success) {
        setName("");
        setDescription("");
        setSystemPrompt("");
        alert("Agent kustom berhasil dibuat dan siap diaktifkan!");
        loadAgents();
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const setTelegramAgent = async (agentId: string) => {
    try {
      const res = await fetch(`${API}/api/agents/set-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId })
      });
      const d = await res.json();
      if (d.success) {
        alert("Agent ini sekarang menjadi otak utama Bot Telegram Anda!");
        loadAgents();
      }
    } catch (e: any) { alert(e.message); }
  };

  const activateTelegramWebhook = async () => {
    if (!botToken.trim()) {
      alert("Masukkan Bot Token dari @BotFather terlebih dahulu!");
      return;
    }
    setWhLoading(true);
    try {
      localStorage.setItem("my_bot_token", botToken.trim());
      const res = await fetch(`${API}/api/telegram/set-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken.trim() })
      });
      const d = await res.json();
      setWebhookResult(d);
      if (d.success) {
        alert("Webhook Telegram Berhasil Diaktifkan! Sekarang chat bot Anda di Telegram.");
      } else {
        alert("Gagal set webhook: " + JSON.stringify(d.telegram_response));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setWhLoading(false);
    }
  };

  const testAgentChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAgent) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API}/api/agents/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: selectedAgent.id, message: userMsg })
      });
      const d = await res.json();
      setMessages(prev => [...prev, { sender: "agent", text: d.response }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { sender: "agent", text: "Error: " + e.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API}/api/telegram/logs`);
      const d = await res.json();
      setLogs(d.logs || []);
    } catch (e) {}
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom border-dark-subtle px-4 py-3" style={{ background: "rgba(3, 7, 18, 0.9)", backdropFilter: "blur(20px)" }}>
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold" href="#">
            <div className="p-2 rounded-3 btn-primary-glow d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
              <Bot size={20} />
            </div>
            <span>SYNAPXIS<span style={{ color: "var(--accent-cyan)" }}>.AGENT</span></span>
          </a>

          <div className="d-flex gap-2">
            <button className={`btn btn-sm ${tab === "builder" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => setTab("builder")}>Agent Builder</button>
            <button className={`btn btn-sm ${tab === "telegram" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => setTab("telegram")}>Telegram Connect</button>
            <button className={`btn btn-sm ${tab === "chat" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => setTab("chat")}>Uji Chat Agent</button>
            <button className={`btn btn-sm ${tab === "logs" ? "btn-primary-glow" : "btn-outline-glow"}`} onClick={() => { setTab("logs"); fetchLogs(); }}>Riwayat Telegram</button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container py-4 flex-grow-1">
        {/* 1. AGENT BUILDER (BUAT AGENT SENDIRI) */}
        {tab === "builder" && (
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="glass-box p-4">
                <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Plus size={20} className="text-info" /> Buat Agent AI Kustom
                </h4>
                <p className="text-secondary small mb-4">Rancang karakter, instruksi kerja, dan model AI sesuai spesifikasi tugas Anda.</p>

                <form onSubmit={createAgent}>
                  <div className="mb-3">
                    <label className="form-label small text-secondary">Nama Agent</label>
                    <input required className="form-control bg-dark text-white border-secondary" placeholder="Contoh: Sentinel Executive, Analis Pasar, Coder Pro" value={name} onChange={e => setName(e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary">Deskripsi Singkat</label>
                    <input className="form-control bg-dark text-white border-secondary" placeholder="Tugas utama agent ini..." value={description} onChange={e => setDescription(e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary">Pilihan Model AI</label>
                    <select className="form-select bg-dark text-white border-secondary" value={model} onChange={e => setModel(e.target.value)}>
                      <option value="Comku">AWD Neural Core (Default Cepat)</option>
                      <option value="ag/claude-opus-4-6-thinking">Claude Reasoning Specialist</option>
                      <option value="ag/gemini-3.8-flash-high">Gemini Fast Processor</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary">System Prompt (Instruksi Perilaku Agent)</label>
                    <textarea required rows={5} className="form-control bg-dark text-white border-secondary font-mono small" placeholder="Tulis instruksi bagaimana agent ini berpikir dan menjawab. Contoh: 'Kamu adalah asisten pribadi saya. Selalu jawab dalam bahasa Indonesia yang ringkas, berikan poin langsung dan analisis mendalam...'" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}></textarea>
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary-glow w-100 py-2">
                    {loading ? "Menyimpan Agent..." : "Simpan & Daftarkan Agent"}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="glass-box p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold m-0">Daftar Agent Buatan Anda ({agents.length})</h4>
                  <button className="btn btn-sm btn-outline-glow" onClick={loadAgents}><RefreshCw size={14} /></button>
                </div>
                <p className="text-secondary small mb-4">Pilih salah satu agent untuk disambungkan ke Bot Telegram Anda.</p>

                {agents.length === 0 && (
                  <div className="text-center py-5 text-secondary">Belum ada agent kustom. Buat agent pertama Anda di form sebelah kiri!</div>
                )}

                <div className="d-flex flex-column gap-3">
                  {agents.map((agt) => (
                    <div key={agt.id} className="p-3 rounded-3 bg-dark border border-secondary d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <b className="fs-5">{agt.name}</b>
                          {agt.is_active_telegram === 1 && (
                            <span className="badge bg-success small">OTAK BOT TELEGRAM AKTIF</span>
                          )}
                        </div>
                        <p className="text-secondary small my-1">{agt.description || "Tanpa deskripsi"}</p>
                        <code className="text-info small font-mono d-block mt-2">Model: {agt.model}</code>
                        <div className="p-2 rounded bg-black mt-2 font-mono small text-secondary border border-dark" style={{ maxHeight: 80, overflowY: "auto" }}>
                          {agt.system_prompt}
                        </div>
                      </div>

                      <div className="d-flex flex-column gap-2 ms-3">
                        <button className={`btn btn-sm ${agt.is_active_telegram === 1 ? "btn-success" : "btn-primary-glow"}`} onClick={() => setTelegramAgent(agt.id)}>
                          {agt.is_active_telegram === 1 ? "✓ Terkoneksi ke Telegram" : "Sambungkan ke Telegram"}
                        </button>
                        <button className="btn btn-sm btn-outline-glow" onClick={() => { setSelectedAgent(agt); setTab("chat"); }}>
                          Uji Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TELEGRAM CONNECT (KONEKSIKAN BOT) */}
        {tab === "telegram" && (
          <div className="glass-box p-4 mx-auto" style={{ maxWidth: 800 }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Bot className="text-info" size={32} />
              <h4 className="fw-bold m-0">Koneksi Bot Telegram ke Custom Agent</h4>
            </div>
            <p className="text-secondary small mb-4">
              Sistem ini akan memasang **Webhook otomatis** ke Cloudflare Edge Worker. Setiap ada pesan masuk ke bot Telegram Anda, pesan tersebut akan diproses oleh Custom Agent yang Anda pilih dan dibalas langsung secara instan.
            </p>

            <div className="mb-3">
              <label className="form-label small text-secondary">Telegram Bot Token (Didapatkan dari @BotFather di Telegram)</label>
              <input type="password" className="form-control bg-dark text-white border-secondary font-mono" placeholder="7123456789:ABCdefGhIJKlmNoPQRstuvWXyz..." value={botToken} onChange={e => setBotToken(e.target.value)} />
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary">Webhook Endpoint Otomatis (Cloudflare Pages Worker)</label>
              <input readOnly className="form-control bg-black text-info border-secondary font-mono small" value={`${API}/api/telegram/webhook`} />
            </div>

            <button className="btn btn-primary-glow w-100 py-3 mb-4" disabled={whLoading} onClick={activateTelegramWebhook}>
              {whLoading ? "Memasang Webhook ke Server Telegram..." : "Aktifkan Webhook & Sambungkan Bot Sekarang"}
            </button>

            {webhookResult && (
              <div className={`alert ${webhookResult.success ? "alert-success" : "alert-danger"}`}>
                <h6 className="fw-bold">{webhookResult.success ? "✓ Webhook Sukses Terpasang!" : "Gagal Pasang Webhook"}</h6>
                {webhookResult.bot_info && (
                  <div className="small mt-2">
                    Bot Aktif: <b>@{webhookResult.bot_info.username}</b> ({webhookResult.bot_info.first_name})
                  </div>
                )}
                <pre className="small mt-2 font-mono" style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(webhookResult.telegram_response, null, 2)}</pre>
              </div>
            )}

            <div className="p-3 rounded-3 bg-dark border border-secondary mt-3">
              <h6 className="fw-bold text-info">Cara Penggunaan:</h6>
              <ol className="small text-secondary m-0 ps-3">
                <li>Buka Telegram, buat bot baru di <b>@BotFather</b> lalu salin tokennya ke form di atas.</li>
                <li>Pilih agent buatan Anda di tab <b>Agent Builder</b> dan klik <b>"Sambungkan ke Telegram"</b>.</li>
                <li>Klik tombol <b>"Aktifkan Webhook"</b> di atas.</li>
                <li>Buka bot Anda di Telegram dan ketik pesan apa saja. Bot akan menjawab menggunakan instruksi dan karakter agent buatan Anda!</li>
              </ol>
            </div>
          </div>
        )}

        {/* 3. UJI CHAT AGENT LANGSUNG DI WEB */}
        {tab === "chat" && (
          <div className="glass-box p-4 mx-auto d-flex flex-column" style={{ maxWidth: 800, height: "75vh" }}>
            <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-secondary mb-3">
              <div>
                <h5 className="fw-bold m-0">Uji Coba Langsung: {selectedAgent?.name || "Pilih Agent"}</h5>
                <small className="text-secondary">{selectedAgent?.description || "Testing interaktif prompt"}</small>
              </div>
              <select className="form-select form-select-sm bg-dark text-white border-secondary w-auto" value={selectedAgent?.id || ""} onChange={e => setSelectedAgent(agents.find(a => a.id === e.target.value))}>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="flex-grow-1 overflow-auto p-2 d-flex flex-column gap-2 mb-3">
              {messages.length === 0 && (
                <div className="text-center my-auto text-secondary small">Kirim pesan pertama untuk menguji respon agent buatan Anda.</div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`p-3 rounded-3 font-mono small ${m.sender === "user" ? "bg-primary text-white align-self-end" : "bg-dark border border-secondary text-light align-self-start"}`} style={{ maxWidth: "80%", whiteSpace: "pre-wrap" }}>
                  <b>{m.sender === "user" ? "Anda" : selectedAgent?.name}:</b><br />
                  {m.text}
                </div>
              ))}
              {chatLoading && <div className="text-info small font-mono">Sedang berpikir...</div>}
            </div>

            <form onSubmit={testAgentChat} className="d-flex gap-2">
              <input className="form-control bg-dark text-white border-secondary font-mono" placeholder="Ketik pesan uji coba..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button type="submit" disabled={chatLoading} className="btn btn-primary-glow px-4"><Send size={16} /></button>
            </form>
          </div>
        )}

        {/* 4. RIWAYAT LOG TELEGRAM */}
        {tab === "logs" && (
          <div className="glass-box p-4 mx-auto" style={{ maxWidth: 900 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold m-0">Riwayat Percakapan Telegram</h4>
              <button className="btn btn-sm btn-outline-glow" onClick={fetchLogs}><RefreshCw size={14} /> Refresh</button>
            </div>
            <p className="text-secondary small mb-4">Log percakapan langsung antara pengguna Telegram dengan agent kustom Anda.</p>

            {logs.length === 0 && <div className="text-center py-5 text-secondary">Belum ada riwayat pesan dari Telegram.</div>}

            <div className="d-flex flex-column gap-3">
              {logs.map((lg) => (
                <div key={lg.id} className="p-3 rounded-3 bg-dark border border-secondary font-mono small">
                  <div className="d-flex justify-content-between text-secondary mb-2">
                    <span>Pengirim: <b className="text-info">{lg.sender}</b></span>
                    <span>{new Date(lg.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-warning mb-1"><b>Pesan Pengguna:</b> {lg.message}</div>
                  <div className="text-light"><b>Jawaban Agent:</b> {lg.response}</div>
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
