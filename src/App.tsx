import React, { useState, useRef, useEffect, useMemo } from 'react';
import staticModelList from './data/models.json';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  tier: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: string;
  perspectives?: Record<string, string>;
}

export default function RootRouter() {
  const [subdomain, setSubdomain] = useState<string>("landing");

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    if (host.startsWith("app.") || window.location.search.includes("view=app")) {
      setSubdomain("app");
    } else if (host.startsWith("dash.") || window.location.search.includes("view=dash")) {
      setSubdomain("dash");
    } else {
      setSubdomain("landing");
    }
  }, []);

  if (subdomain === "landing") return <LandingPageView />;
  if (subdomain === "dash") return <DashboardView />;
  return <ChatAppView />;
}

/* =========================================================
   1. LANDING PAGE (xawd.my.id) - BOOTSTRAP 5 NEXUS THEME
========================================================= */
function LandingPageView() {
  const [modelCount, setModelCount] = useState<number>(staticModelList.length);

  useEffect(() => {
    fetch("/api/models")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setModelCount(data.data.length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Bootstrap Sticky Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark nexus-glass sticky-top py-3 px-4">
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center gap-2 fw-extrabold fs-4 m-0" href="/">
            <span className="badge rounded-3 nexus-btn-primary p-2">
              <i className="bi bi-cpu-fill fs-5"></i>
            </span>
            <span>X AWD</span>
          </a>
          
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3 text-secondary fw-semibold">
              <li className="nav-item"><a className="nav-link text-light" href="#features">Features</a></li>
              <li className="nav-item"><a className="nav-link text-light" href="#consensus">Consensus</a></li>
              <li className="nav-item"><a className="nav-link text-light" href="#models">Models Catalog</a></li>
              <li className="nav-item"><a className="nav-link text-light" href="https://dash.xawd.my.id">Dashboard</a></li>
            </ul>
            <div className="d-flex align-items-center gap-2">
              <a href="https://app.xawd.my.id" className="btn nexus-btn-primary fw-bold px-4 py-2 rounded-pill">
                Launch Studio <i className="bi bi-arrow-right-short ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header Section */}
      <header className="container text-center py-5 my-auto">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill nexus-glass text-info small fw-bold mb-4">
              <span className="spinner-grow spinner-grow-sm text-info" role="status"></span>
              Aktif &amp; Terkoneksi ke {modelCount}+ Model AI Lintas Tier
            </div>
            
            <h1 className="display-3 fw-bolder mb-3 tracking-tight">
              Automate Everything with <br />
              <span className="nexus-gradient-text">Autonomous AI Agents</span>
            </h1>
            
            <p className="lead text-secondary mx-auto mb-5" style={{ maxWidth: '720px' }}>
              Infrastruktur komputasi cerdas terpadu X AWD dengan orkestrasi consensus routing, smart fallback tanpa jeda, dan kebebasan instruksi agen mandiri.
            </p>

            <div className="d-flex justify-content-center gap-3 flex-wrap mb-5">
              <a href="https://app.xawd.my.id" className="btn nexus-btn-primary btn-lg px-4 py-3 rounded-pill fw-bold">
                Buka Chat Studio (app.xawd.my.id)
              </a>
              <a href="https://dash.xawd.my.id" className="btn btn-outline-secondary btn-lg px-4 py-3 rounded-pill fw-bold text-light">
                Monitor Operasional (dash.xawd.my.id)
              </a>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup Display */}
        <div className="row justify-content-center mt-2">
          <div className="col-12 col-xl-10">
            <div className="card nexus-glass rounded-4 shadow-lg p-3 text-start">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pb-2">
                <div className="d-flex gap-2">
                  <span className="badge rounded-circle bg-danger p-1" style={{ width: '10px', height: '10px' }}></span>
                  <span className="badge rounded-circle bg-warning p-1" style={{ width: '10px', height: '10px' }}></span>
                  <span className="badge rounded-circle bg-success p-1" style={{ width: '10px', height: '10px' }}></span>
                </div>
                <small className="text-secondary font-monospace">X AWD Unified Telemetry Node</small>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 rounded-3 bg-black border border-secondary-subtle">
                      <small className="text-secondary fw-semibold">Model Terpetakan</small>
                      <h3 className="fw-bolder text-white my-1">{modelCount}+ Engine</h3>
                      <small className="text-success"><i className="bi bi-check-circle-fill me-1"></i>Dinamis via Upstream</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 rounded-3 bg-black border border-secondary-subtle">
                      <small className="text-secondary fw-semibold">Multi-Engine Consensus</small>
                      <h3 className="fw-bolder text-warning my-1">Isolated Trio</h3>
                      <small className="text-info"><i className="bi bi-shield-check me-1"></i>Arbiter Konsensus Aktif</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 rounded-3 bg-black border border-secondary-subtle">
                      <small className="text-secondary fw-semibold">Smart Failover Protection</small>
                      <h3 className="fw-bolder text-info my-1">Auto Fallback</h3>
                      <small className="text-primary"><i className="bi bi-arrow-repeat me-1"></i>Round Robin Siap</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="container py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Arsitektur Modular Generasi Baru</h2>
          <p className="text-secondary">Dibangun di atas Cloudflare Edge dengan eksekusi bebas lag</p>
        </div>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 nexus-glass rounded-4 p-4 border-secondary-subtle">
              <i className="bi bi-lightning-charge-fill text-warning fs-1 mb-3"></i>
              <h5 className="fw-bold text-white">Isolated Trio Mode</h5>
              <p className="text-secondary small">Setiap preset combo (Epic, Ultra Apex, High Logic) terisolasi penuh tanpa risiko percampuran model.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 nexus-glass rounded-4 p-4 border-secondary-subtle">
              <i className="bi bi-file-earmark-code-fill text-primary fs-1 mb-3"></i>
              <h5 className="fw-bold text-white">AGENTS.md Persistence</h5>
              <p className="text-secondary small">Instruksi persona dan konfigurasi agen dapat diunggah via file Markdown atau teks dan tersimpan permanen.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 nexus-glass rounded-4 p-4 border-secondary-subtle">
              <i className="bi bi-camera-fill text-info fs-1 mb-3"></i>
              <h5 className="fw-bold text-white">Multimodal &amp; Clipboard Paste</h5>
              <p className="text-secondary small">Dukungan penempelan screenshot langsung dari clipboard ponsel/laptop dan pengunggahan berkas visual instan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center border-top border-secondary-subtle text-secondary small">
        <p className="m-0">&copy; 2026 X AWD Neural Architecture Platform. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

/* =========================================================
   2. DASHBOARD (dash.xawd.my.id) - BOOTSTRAP 5 ADMIN
========================================================= */
function DashboardView() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("xawd_admin_auth") === "true";
  });
  const [pinInput, setPinInput] = useState("");
  const [models, setModels] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [systemNotice, setSystemNotice] = useState(() => {
    return localStorage.getItem("xawd_global_notice") || "Semua cluster router beroperasi stabil.";
  });

  useEffect(() => {
    fetch("/api/models")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setModels(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "9999") {
      setIsAuthenticated(true);
      localStorage.setItem("xawd_admin_auth", "true");
    } else {
      alert("PIN Admin Salah!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("xawd_admin_auth");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
        <div className="card nexus-glass rounded-4 p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="text-center mb-4">
            <span className="badge rounded-3 nexus-btn-primary p-3 mb-3">
              <i className="bi bi-shield-lock-fill fs-3"></i>
            </span>
            <h4 className="fw-bold text-white">X AWD Admin Auth</h4>
            <p className="text-secondary small">Masukkan PIN otentikasi untuk membuka dasbor manajemen</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="form-control bg-black text-white border-secondary mb-3 text-center py-2 fs-5"
              placeholder="PIN Akses (9999)"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn nexus-btn-primary w-100 py-2 fw-bold rounded-3">
              Buka Konsol
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-lg-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-white m-0">X AWD Central Dashboard</h2>
          <p className="text-secondary small m-0">Pemantauan dinamis kapasitas model dan node upstream</p>
        </div>
        <div className="d-flex gap-2">
          <a href="https://app.xawd.my.id" className="btn nexus-btn-primary fw-bold rounded-pill px-3">
            Buka Studio <i className="bi bi-box-arrow-up-right ms-1"></i>
          </a>
          <button onClick={handleLogout} className="btn btn-outline-danger fw-bold rounded-pill px-3">
            Keluar
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card nexus-glass rounded-4 p-3 border-secondary-subtle">
            <span className="text-secondary small fw-bold">TOTAL MODEL TERDETEKSI</span>
            <h2 className="fw-bolder text-white my-2">{models.length} Model</h2>
            <span className="text-success small"><i className="bi bi-activity me-1"></i>Tersinkronisasi otomatis</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card nexus-glass rounded-4 p-3 border-secondary-subtle">
            <span className="text-secondary small fw-bold">UPSTREAM ROUTER</span>
            <h2 className="fw-bolder text-info my-2">Online</h2>
            <span className="text-secondary small font-monospace">Target: 9rxawd Gateway</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card nexus-glass rounded-4 p-3 border-secondary-subtle">
            <span className="text-secondary small fw-bold">STATUS FAILOVER</span>
            <h2 className="fw-bolder text-warning my-2">Siap</h2>
            <span className="text-secondary small">Smart Fallback &amp; Round Robin Siaga</span>
          </div>
        </div>
      </div>

      {/* Notice Editor */}
      <div className="card nexus-glass rounded-4 p-4 border-secondary-subtle mb-4">
        <h5 className="fw-bold text-white mb-2">Pengumuman Operasional Platform</h5>
        <textarea
          className="form-control bg-black text-white border-secondary mb-3 rounded-3"
          rows={2}
          value={systemNotice}
          onChange={e => setSystemNotice(e.target.value)}
        />
        <button
          onClick={() => { localStorage.setItem("xawd_global_notice", systemNotice); alert("Pengumuman tersimpan!"); }}
          className="btn btn-success fw-bold rounded-pill px-4 align-self-start"
        >
          Simpan Pengumuman
        </button>
      </div>

      {/* Model Inventory Table */}
      <div className="card nexus-glass rounded-4 p-4 border-secondary-subtle">
        <h5 className="fw-bold text-white mb-3">Daftar Inventaris Model ({models.length} Model)</h5>
        <div className="table-responsive" style={{ maxHeight: '420px' }}>
          <table className="table table-dark table-hover align-middle m-0">
            <thead className="table-secondary">
              <tr>
                <th>Nama Model</th>
                <th>Model Identifier</th>
                <th>Provider</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {models.map(m => (
                <tr key={m.id}>
                  <td className="fw-bold">{m.name}</td>
                  <td className="font-monospace small text-secondary">{m.id}</td>
                  <td><span className="badge text-bg-dark border border-secondary">{m.provider}</span></td>
                  <td><span className="badge bg-primary-subtle text-primary-emphasis fw-bold">{m.tier}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   3. CHAT STUDIO (app.xawd.my.id) - BOOTSTRAP 5 CHAT
========================================================= */
function ChatAppView() {
  const [models, setModels] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>("ag/gemini-3.8-flash-high");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  const [isComboActive, setIsComboActive] = useState(false);
  const [comboPreset, setComboPreset] = useState("epic");
  const [enableFallback, setEnableFallback] = useState(true);
  const [enableRoundRobin, setEnableRoundRobin] = useState(false);

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentInstructions, setAgentInstructions] = useState<string>(() => {
    return localStorage.getItem("xawd_agent_instructions") || "";
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("xawd_chat_history");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (Array.isArray(p) && p.length > 0) return p;
      } catch (_) {}
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: "X AWD Workspace aktif di app.xawd.my.id. Model diperbarui secara dinamis, mode Combo Trio terisolasi, dan berkas persona agen aktif.",
        model: "X AWD Core",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentFileRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("xawd_chat_history", JSON.stringify(messages));
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExecuting]);

  useEffect(() => {
    fetch("/api/models")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setModels(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
      const matchTier = selectedTier === "ALL" || m.tier === selectedTier;
      return matchSearch && matchTier;
    });
  }, [models, search, selectedTier]);

  const activeModel = useMemo(() => {
    return models.find(m => m.id === selectedModel) || {
      id: selectedModel,
      name: selectedModel.split("/").pop() || selectedModel,
      tier: "HIGH"
    };
  }, [models, selectedModel]);

  const handleSaveInstructions = () => {
    localStorage.setItem("xawd_agent_instructions", agentInstructions);
    setIsAgentModalOpen(false);
  };

  const handleLoadAgentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const c = reader.result as string;
      setAgentInstructions(c);
      localStorage.setItem("xawd_agent_instructions", c);
    };
    reader.readAsText(file);
  };

  const handleExportChatMarkdown = () => {
    const md = messages.map(m => `### ${m.role === 'user' ? 'Operator' : (m.model || 'X AWD')} (${m.timestamp})\n${m.content}\n`).join("\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `X_AWD_Chat_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePasteClipboard = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setAttachedImage(reader.result as string);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleSend = async () => {
    if ((!inputPrompt.trim() && !attachedImage) || isExecuting) return;

    const userText = inputPrompt.trim();
    setInputPrompt("");
    const currentImg = attachedImage;
    setAttachedImage(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText + (currentImg ? " [Screenshot Terlampir]" : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsExecuting(true);

    try {
      const payloadMessages: any[] = [];
      if (agentInstructions.trim()) {
        payloadMessages.push({ role: "system", content: agentInstructions.trim() });
      }
      messages.forEach(m => {
        payloadMessages.push({ role: m.role, content: m.content });
      });

      let newMsgContent: any = userText;
      if (currentImg) {
        newMsgContent = [
          { type: "text", text: userText || "Analisis gambar ini:" },
          { type: "image_url", image_url: { url: currentImg } }
        ];
      }
      payloadMessages.push({ role: "user", content: newMsgContent });

      const res = await fetch("/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          prompt: userText,
          model: selectedModel,
          isCombo: isComboActive,
          comboPreset,
          enableFallback,
          enableRoundRobin,
          tier: activeModel.tier || "ULTRA"
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        data = { success: false, error: rawText.slice(0, 200) || "Payload gateway tidak valid" };
      }

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.reply || "Respons kosong diterima.",
            model: data.model || activeModel.name,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            perspectives: data.perspectives
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Engine Error: ${data.error || "Gagal menghubungi engine"}`,
            model: "System",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Koneksi gateway terputus: ${err.message}`,
          model: "Error",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center vh-100 vw-100 overflow-hidden" style={{ background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15) 0%, rgba(3,7,18,0.98) 75%)" }}>
      <div className="d-flex flex-column w-100 nexus-glass" style={{ maxWidth: '960px', height: '100%' }}>
        
        {/* Header Bar */}
        <header className="navbar navbar-expand nexus-glass px-3 py-2 border-bottom border-secondary-subtle">
          <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-3 nexus-btn-primary p-2">
                <i className="bi bi-cpu-fill"></i>
              </span>
              <div>
                <span className="fw-bold text-white fs-6 d-block lh-1">X AWD Studio</span>
                <span className="text-secondary small" style={{ fontSize: '10px' }}>app.xawd.my.id</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => setIsComboActive(!isComboActive)}
                className={`btn btn-sm rounded-pill fw-bold ${isComboActive ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
              >
                ⚡ {isComboActive ? "Combo ON" : "Combo"}
              </button>
              
              <button
                onClick={() => setIsAgentModalOpen(true)}
                className={`btn btn-sm rounded-pill fw-semibold ${agentInstructions ? 'btn-primary' : 'btn-outline-secondary text-light'}`}
              >
                🤖 Agent {agentInstructions ? "✓" : ""}
              </button>

              {!isComboActive && (
                <button
                  onClick={() => setIsDropdownOpen(true)}
                  className="btn btn-sm btn-dark border border-secondary text-truncate rounded-pill text-light px-3"
                  style={{ maxWidth: '140px' }}
                >
                  {activeModel.name}
                </button>
              )}

              <button onClick={handleExportChatMarkdown} className="btn btn-sm btn-outline-secondary rounded-pill text-light" title="Ekspor Markdown">
                <i className="bi bi-download"></i>
              </button>

              <button
                onClick={() => { if(confirm("Bersihkan sesi chat saat ini?")) { setMessages([messages[0]]); localStorage.removeItem("xawd_chat_history"); } }}
                className="btn btn-sm btn-outline-secondary rounded-pill text-light"
              >
                + New
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar Switch Controller */}
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom border-secondary-subtle flex-wrap gap-2" style={{ background: "rgba(15,23,42,0.85)" }}>
          <div className="d-flex align-items-center gap-3">
            <div className="form-check form-switch m-0">
              <input className="form-check-input" type="checkbox" id="fbSwitch" checked={enableFallback} onChange={e => setEnableFallback(e.target.checked)} />
              <label className={`form-check-label small fw-bold ${enableFallback ? 'text-primary' : 'text-secondary'}`} htmlFor="fbSwitch">
                Fallback
              </label>
            </div>
            <div className="form-check form-switch m-0">
              <input className="form-check-input" type="checkbox" id="rrSwitch" checked={enableRoundRobin} onChange={e => setEnableRoundRobin(e.target.checked)} />
              <label className={`form-check-label small fw-bold ${enableRoundRobin ? 'text-info' : 'text-secondary'}`} htmlFor="rrSwitch">
                Round Robin
              </label>
            </div>
          </div>

          {isComboActive && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-warning small fw-bold">Preset:</span>
              <select className="form-select form-select-sm bg-dark text-warning border-warning rounded-3" value={comboPreset} onChange={e => setComboPreset(e.target.value)} style={{ width: 'auto' }}>
                <option value="epic">⚡ Epic Frontier (Astra/Dawn/Sonnet)</option>
                <option value="ultra">⚡ Ultra Apex (Grok/Opus/Qwen)</option>
                <option value="high">⚡ High Logic (Terra/Gemini/DeepSeek)</option>
                <option value="medium">⚡ Medium Balanced (Luna/Gemini/GPT-4o)</option>
                <option value="low">⚡ Low Speed (Lite/Mini/Haiku)</option>
              </select>
            </div>
          )}
        </div>

        {/* Messages Body */}
        <div className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-3">
          {agentInstructions && (
            <div className="p-2 rounded-3 border border-primary-subtle d-flex justify-content-between align-items-center" style={{ background: "rgba(99,102,241,0.1)" }}>
              <span className="text-info small"><i className="bi bi-robot me-1"></i> Persona agen aktif di setiap prompt</span>
              <button onClick={() => setIsAgentModalOpen(true)} className="btn btn-sm btn-link text-info p-0 text-decoration-none">Edit</button>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
              <div
                className={`p-3 rounded-4 ${msg.role === 'user' ? 'text-white' : 'text-light border border-secondary-subtle'}`}
                style={{
                  maxWidth: '86%',
                  background: msg.role === 'user' ? 'var(--nexus-gradient)' : 'rgba(17, 24, 39, 0.85)',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '18px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '18px',
                }}
              >
                <div className="d-flex justify-content-between small text-secondary mb-1 gap-3">
                  <span className="fw-bold">{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg.content}</div>

                {msg.perspectives && Object.keys(msg.perspectives).length > 0 && (
                  <div className="accordion mt-3" id={`acc-${msg.id}`}>
                    <div className="accordion-item bg-black border border-secondary">
                      <h2 className="accordion-header">
                        <button className="accordion-button collapsed bg-black text-warning py-2 small" type="button" data-bs-toggle="collapse" data-bs-target={`#col-${msg.id}`}>
                          <i className="bi bi-diagram-3-fill me-2"></i> Rincian 3 Perspektif Engine
                        </button>
                      </h2>
                      <div id={`col-${msg.id}`} className="accordion-collapse collapse">
                        <div className="accordion-body p-2 d-flex flex-column gap-2">
                          {Object.entries(msg.perspectives).map(([eng, text]) => (
                            <div key={eng} className="p-2 rounded bg-dark border border-secondary">
                              <div className="text-info small fw-bold mb-1">{eng}</div>
                              <div className="text-light small">{text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isExecuting && (
            <div className="d-flex justify-content-start">
              <div className="p-3 rounded-4 text-secondary small border border-secondary" style={{ background: 'rgba(17, 24, 39, 0.85)' }}>
                <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                X AWD sedang memproses respon cerdas...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Preview Screenshot */}
        {attachedImage && (
          <div className="px-3 py-2 bg-black border-top border-secondary d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <img src={attachedImage} alt="Attachment" className="rounded border border-success" style={{ width: '38px', height: '38px', objectFit: 'cover' }} />
              <span className="small text-success fw-bold">Screenshot siap dikirim</span>
            </div>
            <button onClick={() => setAttachedImage(null)} className="btn btn-sm btn-link text-danger text-decoration-none">✕ Batal</button>
          </div>
        )}

        {/* Footer Input */}
        <footer className="p-3 nexus-glass border-top border-secondary-subtle">
          <div className="d-flex align-items-end gap-2">
            <button
              onClick={() => setIsAttachOpen(true)}
              className="btn btn-dark border border-secondary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '48px', height: '48px', flexShrink: 0 }}
            >
              <i className={`bi ${attachedImage ? 'bi-check2 text-success fs-5' : 'bi-plus-lg fs-5'}`}></i>
            </button>

            <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setAttachedImage(r.result as string); r.readAsDataURL(f); } }} accept="image/*" style={{ display: 'none' }} />

            <textarea
              className="form-control bg-black text-white border-secondary rounded-4 px-3 py-2"
              rows={2}
              placeholder={isComboActive ? "Ketik prompt konsensus Combo..." : "Ketik pesan untuk X AWD, atau tempel/paste screenshot langsung..."}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onPaste={handlePasteClipboard}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              style={{ resize: 'none' }}
            />

            <button
              disabled={isExecuting || (!inputPrompt.trim() && !attachedImage)}
              onClick={handleSend}
              className="btn nexus-btn-primary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '48px', height: '48px', flexShrink: 0 }}
            >
              <i className="bi bi-send-fill fs-6"></i>
            </button>
          </div>
        </footer>

        {/* Modal Persona Agen */}
        {isAgentModalOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={() => setIsAgentModalOpen(false)}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content nexus-glass border-secondary rounded-4 p-3 text-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold m-0"><i className="bi bi-sliders me-2 text-primary"></i>Instruksi Agen (AGENTS.md)</h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setIsAgentModalOpen(false)}></button>
                </div>
                <p className="text-secondary small mb-2">Instruksi persona ini otomatis disuntikkan permanen ke model setiap giliran prompt.</p>

                <input type="file" ref={agentFileRef} onChange={handleLoadAgentFile} accept=".txt,.md" style={{ display: 'none' }} />
                <div className="d-flex gap-2 mb-2">
                  <button onClick={() => agentFileRef.current?.click()} className="btn btn-sm nexus-btn-primary rounded-pill px-3">
                    <i className="bi bi-file-earmark-arrow-up me-1"></i> Muat File (.txt / .md)
                  </button>
                  {agentInstructions && (
                    <button onClick={() => { setAgentInstructions(""); localStorage.removeItem("xawd_agent_instructions"); }} className="btn btn-sm btn-outline-danger rounded-pill px-3">
                      Reset
                    </button>
                  )}
                </div>

                <textarea
                  value={agentInstructions}
                  onChange={e => setAgentInstructions(e.target.value)}
                  className="form-control bg-black text-white border-secondary rounded-3 mb-3"
                  rows={6}
                  placeholder="Tulis persona agen atau sistem instruksi di sini..."
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />

                <div className="d-flex justify-content-end gap-2">
                  <button onClick={() => setIsAgentModalOpen(false)} className="btn btn-sm btn-secondary rounded-pill px-3">Tutup</button>
                  <button onClick={handleSaveInstructions} className="btn btn-sm nexus-btn-primary rounded-pill px-4">Simpan Instruksi</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pemilih Model Dinamis */}
        {isDropdownOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={() => setIsDropdownOpen(false)}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
              <div className="modal-content nexus-glass border-secondary rounded-4 p-3 text-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold m-0">Katalog Model Terdaftar ({models.length} Model)</h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setIsDropdownOpen(false)}></button>
                </div>

                <input
                  type="text"
                  placeholder="Cari model atau ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-control bg-black text-white border-secondary mb-2 rounded-3"
                  autoFocus
                />

                <div className="d-flex gap-1 flex-wrap mb-2">
                  {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'FREE'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`btn btn-sm rounded-pill ${selectedTier === t ? 'nexus-btn-primary' : 'btn-outline-secondary text-light'}`}
                      style={{ fontSize: '11px' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="d-flex flex-column gap-1 overflow-y-auto" style={{ maxHeight: '350px' }}>
                  {filteredModels.map(m => (
                    <div
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setIsDropdownOpen(false); }}
                      className={`p-2 rounded-3 d-flex justify-content-between align-items-center border border-secondary-subtle cursor-pointer ${selectedModel === m.id ? 'bg-primary-subtle text-primary-emphasis' : 'bg-dark text-light'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div className="fw-bold small">{m.name}</div>
                        <div className="text-secondary small" style={{ fontSize: '10px' }}>{m.id}</div>
                      </div>
                      <span className="badge text-bg-secondary">{m.tier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Sheet Multimodal */}
        {isAttachOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={() => setIsAttachOpen(false)}>
            <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-content nexus-glass border-secondary rounded-4 p-3 text-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold m-0">Aksi Multimodal</h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setIsAttachOpen(false)}></button>
                </div>
                <div className="row g-2 text-center mb-3">
                  {[
                    { name: "Kamera", icon: "bi-camera" },
                    { name: "Gambar", icon: "bi-image" },
                    { name: "Files", icon: "bi-folder2-open" },
                    { name: "Drive", icon: "bi-cloud-arrow-up" }
                  ].map(item => (
                    <div key={item.name} className="col-3">
                      <button
                        onClick={() => { setIsAttachOpen(false); fileInputRef.current?.click(); }}
                        className="btn btn-dark border border-secondary rounded-3 w-100 py-2 d-flex flex-column align-items-center gap-1"
                      >
                        <i className={`bi ${item.icon} text-primary fs-5`}></i>
                        <span style={{ fontSize: '10px' }}>{item.name}</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="list-group list-group-flush rounded-3">
                  {[
                    { name: "Chat", desc: "Dialog terstruktur", icon: "bi-chat-dots" },
                    { name: "Voices", desc: "Sintesis audio & suara", icon: "bi-mic" },
                    { name: "Video", desc: "Analisis frame visual", icon: "bi-camera-video" },
                    { name: "Canvas", desc: "Editor dokumen & kode", icon: "bi-brush" }
                  ].map(f => (
                    <button
                      key={f.name}
                      onClick={() => { setIsAttachOpen(false); setInputPrompt(prev => `[${f.name}] ${prev}`); }}
                      className="list-group-item list-group-item-action bg-transparent text-white border-secondary-subtle d-flex align-items-center gap-3 py-2"
                    >
                      <i className={`bi ${f.icon} text-warning`}></i>
                      <div className="text-start">
                        <div className="fw-bold small">{f.name}</div>
                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{f.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
