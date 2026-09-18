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
      content: "X AWD siap digunakan. Mode Combo terisolasi tanpa interferensi, kendali Fallback & Round Robin aktif.",
      model: "X AWD Core",
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
            content: `Gagal: ${data.error || "Terjadi kendala pada gateway upstream"}`,
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
    <div className="app-shell">
      {/* Header Bar */}
      <div className="app-header d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary px-2 py-2 fs-6">X AWD</span>
          <button
            type="button"
            onClick={() => setIsComboActive(!isComboActive)}
            className={`btn btn-sm fw-bold rounded-pill px-3 ${isComboActive ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
          >
            ⚡ {isComboActive ? 'Combo ON' : 'Combo Epic'}
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          {!isComboActive && (
            <button
              type="button"
              onClick={() => setIsDropdownOpen(true)}
              className="btn btn-sm btn-dark border border-secondary text-truncate rounded-pill px-3"
              style={{ maxWidth: '170px' }}
            >
              {activeModel.name}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMessages([messages[0]])}
            className="btn btn-sm btn-outline-secondary rounded-pill"
          >
            + Baru
          </button>
        </div>
      </div>

      {/* Toolbar Kontrol */}
      <div className="app-toolbar d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="fbCheck"
              checked={enableFallback}
              onChange={e => setEnableFallback(e.target.checked)}
            />
            <label className={`form-check-label ${enableFallback ? 'text-success fw-bold' : 'text-secondary'}`} htmlFor="fbCheck">
              Fallback
            </label>
          </div>

          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="rrCheck"
              checked={enableRoundRobin}
              onChange={e => setEnableRoundRobin(e.target.checked)}
            />
            <label className={`form-check-label ${enableRoundRobin ? 'text-info fw-bold' : 'text-secondary'}`} htmlFor="rrCheck">
              Round Robin
            </label>
          </div>
        </div>

        {isComboActive && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-warning fw-bold">Preset:</span>
            <select
              className="form-select form-select-sm bg-dark text-warning border-secondary"
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

      {/* Chat Messages */}
      <div className="app-chat-body">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
            <div className="d-flex justify-content-between small opacity-75 mb-1 gap-3">
              <span className="fw-bold">{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

            {msg.perspectives && Object.keys(msg.perspectives).length > 0 && (
              <div className="mt-2 pt-2 border-top border-secondary">
                <div className="small fw-bold text-warning mb-2">Perspektif 3 Engine:</div>
                {Object.entries(msg.perspectives).map(([eng, text]) => (
                  <div key={eng} className="mb-2 p-2 rounded bg-black border border-secondary small">
                    <div className="text-info fw-semibold">{eng}</div>
                    <div className="text-secondary">{text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isExecuting && (
          <div className="chat-bubble bubble-ai text-secondary small">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            X AWD sedang memproses respons...
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Preview Gambar Paste */}
      {attachedImage && (
        <div className="px-3 py-2 bg-dark border-top d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <img src={attachedImage} alt="Attachment" className="rounded border border-success" style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
            <span className="small text-success fw-bold">Screenshot siap dikirim</span>
          </div>
          <button type="button" onClick={() => setAttachedImage(null)} className="btn btn-sm btn-link text-danger text-decoration-none">Batal</button>
        </div>
      )}

      {/* Footer Input */}
      <div className="app-footer">
        <div className="d-flex align-items-end gap-2">
          <button
            type="button"
            onClick={() => setIsAttachOpen(true)}
            className="btn btn-dark border border-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '44px', height: '44px', flexShrink: 0 }}
          >
            <i className={`bi ${attachedImage ? 'bi-check2 text-success' : 'bi-plus-lg'}`}></i>
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
            className="form-control chat-textarea"
            rows={2}
            placeholder={isComboActive ? "Ketik prompt konsensus Combo..." : "Ketik pesan untuk X AWD..."}
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
            type="button"
            disabled={isExecuting || (!inputPrompt.trim() && !attachedImage)}
            onClick={handleSend}
            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '44px', height: '44px', flexShrink: 0 }}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </div>

      {/* Modal Action Sheet */}
      {isAttachOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-end justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }} onClick={() => setIsAttachOpen(false)}>
          <div className="bg-dark p-3 rounded-top-4 w-100 border-top border-secondary" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold">Pilih Aksi / Fitur</span>
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
                    type="button"
                    onClick={() => {
                      setIsAttachOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="btn btn-dark border border-secondary w-100 py-3 rounded-3"
                  >
                    <i className={`bi ${item.icon} fs-5 text-primary`}></i>
                    <div className="small mt-1">{item.name}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Model Picker */}
      {isDropdownOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }} onClick={() => setIsDropdownOpen(false)}>
          <div className="bg-dark p-3 rounded-4 w-100 border border-secondary" style={{ maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold">Pilih Model</span>
              <button type="button" className="btn-close btn-close-white" onClick={() => setIsDropdownOpen(false)}></button>
            </div>
            <input
              type="text"
              placeholder="Cari model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control bg-black text-white border-secondary mb-2"
              autoFocus
            />
            <div className="d-flex gap-1 flex-wrap mb-2">
              {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'FREE'].map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`btn btn-sm ${selectedTier === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="overflow-auto flex-grow-1">
              {filteredModels.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`p-2 rounded d-flex justify-content-between align-items-center mb-1 cursor-pointer ${selectedModel === m.id ? 'bg-primary text-white' : 'bg-transparent text-light border border-secondary'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="small fw-semibold">{m.name}</div>
                    <div className="text-secondary" style={{ fontSize: '10px' }}>{m.id}</div>
                  </div>
                  <span className="badge bg-secondary">{m.tier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
