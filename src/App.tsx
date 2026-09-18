import React, { useState, useRef, useEffect, useMemo } from 'react';
import staticModelList from './data/models.json';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task?: string;
  tier: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
  perspectives?: Record<string, string>;
}

export default function App() {
  const [models, setModels] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>("ag/gemini-3.8-flash-high");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  const [isComboActive, setIsComboActive] = useState(false);
  const [comboPreset, setComboPreset] = useState("epic");
  const [enableFallback, setEnableFallback] = useState(false);
  const [enableRoundRobin, setEnableRoundRobin] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Selamat datang di X AWD v2. Antarmuka telah diperbarui dengan Bootstrap 5 Dark Design, isolasi model Combo independen, dan dukungan penempelan gambar screenshot langsung.",
      model: "X AWD Enterprise",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExecuting]);

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
      content: userText + (currentImg ? " [Lampiran Gambar]" : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsExecuting(true);

    try {
      const payloadMessages = messages.map(m => ({ role: m.role, content: m.content }));
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
        data = { success: false, error: rawText.slice(0, 200) || "Gagal mengurai respons" };
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
            content: `Gagal: ${data.error || "Terjadi kesalahan gateway"}`,
            model: "Error",
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
          content: `Koneksi gagal: ${err.message}`,
          model: "Error",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container-fluid p-0 d-flex flex-column vh-100 justify-content-between" style={{ maxWidth: '960px' }}>
      
      {/* Bootstrap 5 Navbar Header */}
      <nav className="navbar navbar-expand glass-card border-0 border-bottom px-3 py-2">
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary px-2 py-2 fs-6 rounded-3 shadow-sm">X AWD</span>
            <button
              onClick={() => setIsComboActive(!isComboActive)}
              className={`btn btn-sm rounded-pill fw-bold px-3 ${isComboActive ? 'btn-warning shadow' : 'btn-outline-warning'}`}
            >
              <i className="bi bi-lightning-charge-fill me-1"></i>
              {isComboActive ? 'Combo ON' : 'Combo Epic'}
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            {!isComboActive && (
              <button onClick={() => setIsDropdownOpen(true)} className="btn btn-sm btn-dark border rounded-pill px-3 text-truncate" style={{ maxWidth: '170px' }}>
                <i className="bi bi-cpu me-1 text-primary"></i>
                {activeModel.name}
              </button>
            )}
            <button onClick={() => setMessages([messages[0]])} className="btn btn-sm btn-outline-secondary rounded-pill">
              <i className="bi bi-plus-lg"></i> Baru
            </button>
          </div>
        </div>
      </nav>

      {/* Toolbar Kontrol Bootstrap Switches */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2 glass-card border-0 border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="fallbackSwitch"
              checked={enableFallback}
              onChange={e => setEnableFallback(e.target.checked)}
            />
            <label className={`form-check-label small fw-semibold ${enableFallback ? 'text-success' : 'text-secondary'}`} htmlFor="fallbackSwitch">
              Smart Fallback
            </label>
          </div>

          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="rrSwitch"
              checked={enableRoundRobin}
              onChange={e => setEnableRoundRobin(e.target.checked)}
            />
            <label className={`form-check-label small fw-semibold ${enableRoundRobin ? 'text-info' : 'text-secondary'}`} htmlFor="rrSwitch">
              Round Robin
            </label>
          </div>
        </div>

        {isComboActive && (
          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-warning">Preset:</span>
            <select
              className="form-select form-select-sm bg-dark text-warning border-warning rounded-3"
              value={comboPreset}
              onChange={e => setComboPreset(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="epic">⚡ Epic Frontier (Astra/Dawn/Sonnet)</option>
              <option value="ultra">⚡ Ultra Apex (Grok/Opus/Qwen)</option>
              <option value="high">⚡ High Logic (Terra/Gemini/DeepSeek)</option>
              <option value="medium">⚡ Medium Balanced (Luna/Gemini/GPT-4o)</option>
              <option value="low">⚡ Low Speed (Lite/Mini/Haiku)</option>
            </select>
          </div>
        )}
      </div>

      {/* Chat Messages Body */}
      <div className="chat-box p-3 flex-grow-1">
        {messages.map(msg => (
          <div key={msg.id} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div className={`p-3 shadow-sm ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`} style={{ maxWidth: '85%' }}>
              <div className="d-flex justify-content-between small opacity-75 mb-1 gap-3">
                <span className="fw-bold">{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                <span>{msg.timestamp}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{msg.content}</div>

              {/* Accordion Perspektif 3 Engine */}
              {msg.perspectives && Object.keys(msg.perspectives).length > 0 && (
                <div className="mt-3">
                  <button
                    className="btn btn-sm btn-outline-warning w-100 text-start rounded-3"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#persp-${msg.id}`}
                  >
                    <i className="bi bi-diagram-3-fill me-1"></i> Rincian 3 Perspektif Engine
                  </button>
                  <div className="collapse mt-2" id={`persp-${msg.id}`}>
                    <div className="card card-body bg-black border-secondary p-2">
                      {Object.entries(msg.perspectives).map(([eng, text]) => (
                        <div key={eng} className="mb-2 p-2 rounded bg-dark border border-secondary-subtle">
                          <div className="fw-bold text-info small mb-1">{eng}</div>
                          <div className="small text-light">{text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isExecuting && (
          <div className="d-flex mb-3 justify-content-start">
            <div className="p-3 bubble-ai shadow-sm text-secondary small">
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              X AWD sedang merumuskan respons...
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Screenshot Paste Preview */}
      {attachedImage && (
        <div className="px-3 py-2 bg-dark border-top d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <img src={attachedImage} alt="Attachment" className="rounded border border-success" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
            <span className="small text-success fw-bold">Screenshot siap dikirim</span>
          </div>
          <button onClick={() => setAttachedImage(null)} className="btn btn-sm btn-link text-danger text-decoration-none">Batal</button>
        </div>
      )}

      {/* Footer Input Bar */}
      <div className="p-3 glass-card border-0 border-top">
        <div className="input-group">
          <button
            onClick={() => setIsAttachOpen(true)}
            className="btn btn-outline-secondary rounded-circle me-2 d-flex align-items-center justify-content-center"
            style={{ width: '48px', height: '48px' }}
            type="button"
          >
            <i className={`bi ${attachedImage ? 'bi-check2 text-success fs-5' : 'bi-plus-lg fs-5'}`}></i>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) {
                const r = new FileReader();
                r.onload = () => setAttachedImage(r.result as string);
                r.readAsDataURL(f);
              }
            }}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <textarea
            className="form-control rounded-4 bg-dark text-light border-secondary px-3 py-2"
            rows={2}
            placeholder={isComboActive ? "Ketik prompt untuk konsensus Combo..." : "Ketik pesan untuk X AWD..."}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onPaste={handlePasteClipboard}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            disabled={isExecuting || (!inputPrompt.trim() && !attachedImage)}
            onClick={handleSend}
            className="btn btn-primary rounded-circle ms-2 d-flex align-items-center justify-content-center"
            style={{ width: '48px', height: '48px' }}
            type="button"
          >
            <i className="bi bi-send-fill fs-6"></i>
          </button>
        </div>
      </div>

      {/* Action Sheet Modal Multimodal */}
      {isAttachOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setIsAttachOpen(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content glass-card text-light rounded-4">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title fw-bold">Pilih Aksi & Lampiran</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsAttachOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2 text-center mb-3">
                  {[
                    { name: "Kamera", icon: "bi-camera" },
                    { name: "Gambar", icon: "bi-image" },
                    { name: "Files", icon: "bi-folder2-open" },
                    { name: "Drive", icon: "bi-cloud-arrow-up" }
                  ].map(item => (
                    <div key={item.name} className="col-3">
                      <button
                        onClick={() => {
                          setIsAttachOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="btn btn-dark border border-secondary rounded-4 w-100 py-3 d-flex flex-column align-items-center gap-1"
                      >
                        <i className={`bi ${item.icon} fs-4 text-primary`}></i>
                        <span className="small">{item.name}</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="list-group list-group-flush rounded-3">
                  {[
                    { name: "Chat", desc: "Mode dialog terstruktur", icon: "bi-chat-dots" },
                    { name: "Voices", desc: "Sintesis audio & suara", icon: "bi-mic" },
                    { name: "Video", desc: "Analisis frame visual", icon: "bi-camera-video" },
                    { name: "Canvas", desc: "Editor dokumen & kode", icon: "bi-brush" }
                  ].map(f => (
                    <button
                      key={f.name}
                      onClick={() => {
                        setIsAttachOpen(false);
                        setInputPrompt(prev => `[${f.name}] ${prev}`);
                      }}
                      className="list-group-item list-group-item-action bg-transparent text-light border-secondary d-flex align-items-center gap-3 py-2"
                    >
                      <i className={`bi ${f.icon} fs-5 text-warning`}></i>
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
        </div>
      )}

      {/* Model Picker Modal */}
      {isDropdownOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setIsDropdownOpen(false)}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content glass-card text-light rounded-4">
              <div className="modal-header border-secondary">
                <h6 className="modal-title fw-bold">Pilih Model (118 Model)</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsDropdownOpen(false)}></button>
              </div>
              <div className="modal-body p-3">
                <input
                  type="text"
                  placeholder="Cari nama atau ID model..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-control bg-dark text-light border-secondary mb-3 rounded-3"
                  autoFocus
                />
                <div className="d-flex gap-1 flex-wrap mb-3">
                  {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'FREE'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`btn btn-sm rounded-pill ${selectedTier === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="list-group list-group-flush">
                  {filteredModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`list-group-item list-group-item-action bg-transparent text-light border-secondary-subtle d-flex justify-content-between align-items-center py-2 ${selectedModel === m.id ? 'active' : ''}`}
                    >
                      <div>
                        <div className="fw-semibold small">{m.name}</div>
                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{m.id}</div>
                      </div>
                      <span className="badge text-bg-secondary">{m.tier}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
