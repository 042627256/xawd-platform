import React, { useState, useRef, useEffect, useMemo } from 'react';
const staticModelList: any[] = [];

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task: string;
  tier: string;
  isCombine: boolean;
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
  const [models] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>(
    staticModelList.length > 0 ? (staticModelList[0] as any).id : 'ag/gemini-3.8-flash-high'
  );
  
  // State Modal Model, Pencarian, Filter & Sort
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'tier' | 'provider'>('name');
  const [isComboActive, setIsComboActive] = useState(false);

  // State Chat & Action Sheet
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya asisten cerdas X AWD. Anda dapat memilih model per tier, menggunakan filter, atau mengaktifkan mode ⚡ Combo Epic.',
      model: 'X AWD',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting]);

  // Filter dan Sort Dinamis
  const filteredModels = useMemo(() => {
    return models
      .filter(m => {
        const matchesSearch =
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase()) ||
          (m.provider && m.provider.toLowerCase().includes(search.toLowerCase()));
        const matchesTier = selectedTier === 'ALL' || (m.tier && m.tier.toUpperCase() === selectedTier);
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'provider') return (a.provider || '').localeCompare(b.provider || '');
        if (sortBy === 'tier') {
          const weight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (weight[b.tier?.toUpperCase()] || 0) - (weight[a.tier?.toUpperCase()] || 0);
        }
        return 0;
      });
  }, [models, search, selectedTier, sortBy]);

  const handleSend = async (textToSendRaw?: string) => {
    const textToSend = textToSendRaw || inputPrompt;
    if (!textToSend.trim() || isExecuting) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsExecuting(true);

    try {
      const conversationPayload = newHistory
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const res = await fetch("https://api.xawd.my.id/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = "Upstream model gagal merespons.";
        try {
          errMsg = JSON.parse(errText).error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
              try {
                const parsed = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                const token = parsed?.choices?.[0]?.delta?.content || "";
                if (token) {
                  accumulated += token;
                  setMessages(prev => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
                      next[lastIdx] = { ...next[lastIdx], content: accumulated };
                    }
                    return next;
                  });
                }
              } catch (_) {}
            }
          }
        }
      }
  }, [messages, isExecuting]);

  // Filter dan Sort Dinamis
  const filteredModels = useMemo(() => {
    return models
      .filter(m => {
        const matchesSearch =
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase()) ||
          (m.provider && m.provider.toLowerCase().includes(search.toLowerCase()));
        const matchesTier = selectedTier === 'ALL' || (m.tier && m.tier.toUpperCase() === selectedTier);
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'provider') return (a.provider || '').localeCompare(b.provider || '');
        if (sortBy === 'tier') {
          const weight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (weight[b.tier?.toUpperCase()] || 0) - (weight[a.tier?.toUpperCase()] || 0);
        }
        return 0;
      });
  }, [models, search, selectedTier, sortBy]);

  const handleSend = async (textToSendRaw?: string) => {
    const textToSend = textToSendRaw || inputPrompt;
    if (!textToSend.trim() || isExecuting) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsExecuting(true);

    try {
      const conversationPayload = newHistory
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('https://api.xawd.my.id/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: conversationPayload,
          prompt: textToSend.trim(),
          isCombo: isComboActive
        })
      });

      const data = await res.json();
      const replyContent = data.reply || data.error || 'Tidak ada balasan dari engine.';

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: replyContent,
          model: data.model || (isComboActive ? 'Combo Epic' : selectedModel),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          perspectives: data.perspectives
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Koneksi terputus: ' + err.message,
          model: 'Error',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFeaturePick = (name: string) => {
    setIsAttachOpen(false);
    if (name === 'Kamera' || name === 'File' || name === 'Foto' || name === 'Drive') {
      fileInputRef.current?.click();
    } else {
      setInputPrompt(`[${name}] `);
    }
  };

  const activeModel = models.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.split('/').pop() || selectedModel,
    tier: 'MEDIUM'
  };

  return (
    <div className="xawd-viewport-lock">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%; height: 100%; height: 100dvh; overflow: hidden;
          background-color: #0e0f10; color: #e3e3e3;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .xawd-viewport-lock {
          position: fixed; inset: 0; width: 100vw; height: 100dvh;
          display: flex; justify-content: center; background-color: #0e0f10; overflow: hidden;
        }
        .xawd-app-shell {
          width: 100%; max-width: 900px; height: 100%;
          display: grid; grid-template-rows: 58px 1fr auto;
          background-color: #131314; border-left: 1px solid #232427; border-right: 1px solid #232427;
          overflow: hidden; position: relative;
        }
        @media (max-width: 768px) {
          .xawd-app-shell { max-width: 100%; border: none; grid-template-rows: 54px 1fr auto; }
        }

        /* 1. HEADER */
        .header-fixed-row {
          grid-row: 1; display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px; background: rgba(30, 31, 32, 0.98); backdrop-filter: blur(16px);
          border-bottom: 1px solid #28292a; z-index: 100;
        }
        .header-left { display: flex; align-items: center; gap: 8px; }
        .brand-badge {
          background: #1a73e8; color: #fff; font-weight: 700; border-radius: 8px;
          padding: 5px 11px; font-size: 13px; letter-spacing: 0.5px;
        }
        .combo-btn {
          background: #2b2615; color: #ffd700; border: 1px solid #7c6818;
          border-radius: 20px; padding: 5px 12px; font-size: 12px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
        }
        .combo-btn.active {
          background: #ffd700; color: #000; box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
        }
        .model-btn {
          background: #282a2c; border: 1px solid #3c4043; color: #e3e3e3;
          border-radius: 20px; padding: 5px 12px; font-size: 12.5px; cursor: pointer;
          max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .new-btn {
          background: transparent; border: 1px solid #3c4043; color: #8ab4f8;
          padding: 5px 10px; border-radius: 16px; font-size: 11.5px; cursor: pointer;
        }

        /* 2. CHAT SCROLL BODY */
        .chat-scroll-row {
          grid-row: 2; overflow-y: auto; padding: 16px; display: flex; flex-direction: column;
          gap: 14px; scroll-behavior: smooth;
        }
        .msg-line { display: flex; width: 100%; }
        .msg-line.user { justify-content: flex-end; }
        .msg-line.assistant { justify-content: flex-start; }
        .bubble {
          max-width: 86%; padding: 12px 16px; border-radius: 18px; font-size: 14.5px;
          line-height: 1.55; word-break: break-word;
        }
        .bubble.user { background: #2b2c2f; color: #fff; border-bottom-right-radius: 4px; }
        .bubble.assistant { background: #1e1f20; border: 1px solid #333538; color: #e3e3e3; border-bottom-left-radius: 4px; }
        .b-head { display: flex; justify-content: space-between; font-size: 11px; color: #9aa0a6; margin-bottom: 5px; gap: 10px; }
        .b-text { white-space: pre-wrap; }
        .details-box {
          margin-top: 10px; padding: 8px 12px; background: #18191b;
          border: 1px solid #2e2f30; border-radius: 10px; font-size: 12.5px;
        }
        .details-box summary { cursor: pointer; color: #ffd700; font-weight: 600; outline: none; }
        .details-content { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
        .perspective-card { padding: 6px 10px; background: #232427; border-radius: 6px; }
        .perspective-title { font-weight: 700; color: #8ab4f8; margin-bottom: 2px; }

        /* 3. FOOTER INPUT */
        .footer-fixed-row {
          grid-row: 3; display: flex; align-items: center;
          padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
          background: #1e1f20; border-top: 1px solid #28292a; gap: 10px; z-index: 100;
        }
        .btn-round {
          width: 42px; height: 42px; border-radius: 50%; border: none;
          background: #2b2c2f; color: #fff; font-size: 22px; display: flex;
          align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .btn-round.send { background: #1a73e8; font-size: 17px; }
        .btn-round.send:disabled { background: #3c4043; color: #888; cursor: not-allowed; }
        .chat-in {
          flex: 1; background: #2b2c2f; border: 1px solid #3c4043; border-radius: 22px;
          padding: 10px 16px; color: #fff; font-size: 14.5px; outline: none; resize: none;
        }

        /* MODAL SELECTOR & FILTER ENGINE */
        .dropdown-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 200; }
        .dropdown-box {
          position: fixed; top: 60px; left: 16px; right: 16px; max-width: 520px;
          margin: 0 auto; background: #232427; border: 1px solid #3c4043;
          border-radius: 16px; padding: 14px; z-index: 210; box-shadow: 0 12px 32px rgba(0,0,0,0.7);
        }
        .search-in {
          width: 100%; padding: 10px 14px; background: #131314; border: 1px solid #3c4043;
          border-radius: 10px; color: #fff; margin-bottom: 10px; outline: none;
        }
        .filter-controls-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 10px; gap: 8px; flex-wrap: wrap;
        }
        .tier-pills { display: flex; gap: 6px; }
        .pill-btn {
          background: #18191b; border: 1px solid #3c4043; color: #9aa0a6;
          border-radius: 12px; padding: 4px 9px; font-size: 11px; cursor: pointer; font-weight: 600;
        }
        .pill-btn.active {
          background: #1a73e8; color: #fff; border-color: #1a73e8;
        }
        .sort-select {
          background: #18191b; border: 1px solid #3c4043; color: #e3e3e3;
          border-radius: 10px; padding: 4px 8px; font-size: 11px; outline: none;
        }
        .model-items { max-height: 48vh; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .m-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
        .m-row:hover, .m-row.selected { background: #333538; }
        .m-name { font-size: 13.5px; font-weight: 500; }
        .m-id { font-size: 11px; color: #9aa0a6; }
        .t-badge { font-size: 10px; padding: 3px 7px; border-radius: 5px; font-weight: 600; text-transform: uppercase; }
        .t-badge.high { background: #5c2b29; color: #f28b82; }
        .t-badge.medium { background: #4a3b1a; color: #fdd663; }
        .t-badge.low { background: #1e3a29; color: #81c995; }

        /* ACTION SHEET */
        .sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 250; display: flex; align-items: flex-end; justify-content: center; }
        .sheet-body {
          width: 100%; max-width: 600px; background: #1e1f20; border-top-left-radius: 24px;
          border-top-right-radius: 24px; padding: 16px 20px 28px; max-height: 70vh; overflow-y: auto;
        }
        .sheet-drag { width: 40px; height: 4px; background: #5f6368; border-radius: 2px; margin: 0 auto 16px; }
        .sheet-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
        .grid-btn {
          background: #2b2c2f; border: none; border-radius: 14px; padding: 12px 6px;
          color: #e3e3e3; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;
        }
        .feat-list { display: flex; flex-direction: column; gap: 6px; }
        .feat-item { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 12px; cursor: pointer; }
        .feat-item:hover { background: #2b2c2f; }
      `}</style>

      <div className="xawd-app-shell">
        <header className="header-fixed-row">
          <div className="header-left">
            <span className="brand-badge">X AWD</span>
            <button
              onClick={() => setIsComboActive(!isComboActive)}
              className={`combo-btn ${isComboActive ? 'active' : ''}`}
              title="Aktifkan Konsensus 3 Model Sekaligus"
            >
              ⚡ {isComboActive ? 'Combo ON' : 'Combo Epic'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isComboActive && (
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="model-btn">
                <span>{activeModel.name}</span>
                <span>{isDropdownOpen ? '▴' : '▾'}</span>
              </button>
            )}
            <button onClick={() => setMessages([messages[0]])} className="new-btn">
              + Baru
            </button>
          </div>
        </header>

        <main className="chat-scroll-row">
          {messages.map(msg => (
            <div key={msg.id} className={`msg-line ${msg.role}`}>
              <div className={`bubble ${msg.role}`}>
                <div className="b-head">
                  <span>{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="b-text">{msg.content}</div>

                {msg.perspectives && (
                  <details className="details-box">
                    <summary>👁️ Lihat Sudut Pandang Tiap Engine (Claude, Gemini, GPT)</summary>
                    <div className="details-content">
                      {Object.entries(msg.perspectives).map(([modelTitle, mText]) => (
                        <div key={modelTitle} className="perspective-card">
                          <div className="perspective-title">{modelTitle}</div>
                          <div>{mText}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
          {isExecuting && (
            <div className="msg-line assistant">
              <div className="bubble assistant" style={{ fontStyle: 'italic', color: '#ffd700' }}>
                {isComboActive
                  ? '⚡ Sedang mengumpulkan konsensus 3 engine (Claude, Gemini, GPT-4o)...'
                  : 'Sedang berpikir...'}
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </main>

        <footer className="footer-fixed-row">
          <button
            type="button"
            onClick={() => setIsAttachOpen(true)}
            className="btn-round"
            title="Lampiran & Fitur"
          >
            +
          </button>
          <textarea
            rows={1}
            placeholder={isComboActive ? "Ketik prompt untuk konsensus Combo Epic..." : "Ketik pesan untuk X AWD..."}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="chat-in"
          />
          <button
            onClick={() => handleSend()}
            disabled={isExecuting || !inputPrompt.trim()}
            className="btn-round send"
          >
            ➤
          </button>
        </footer>
      </div>

      {/* Modal Dialog Pemilih Model dengan Sort & Filter Tier */}
      {isDropdownOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
          <div className="dropdown-box">
            <input
              type="text"
              placeholder="Cari engine (Gemini, Claude, GPT, GLM)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-in"
              autoFocus
            />

            {/* Bilah Kontrol Filter Tier & Pengurutan */}
            <div className="filter-controls-row">
              <div className="tier-pills">
                {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW'].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`pill-btn ${selectedTier === tier ? 'active' : ''}`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Urut: Nama (A-Z)</option>
                <option value="tier">Urut: Tier (Tinggi-Rendah)</option>
                <option value="provider">Urut: Provider</option>
              </select>
            </div>

            {/* List Model Terfilter */}
            <div className="model-items">
              {filteredModels.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#9aa0a6', fontSize: '13px' }}>
                  Tidak ada model yang cocok dengan kriteria filter.
                </div>
              ) : (
                filteredModels.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`m-row ${selectedModel === m.id ? 'selected' : ''}`}
                  >
                    <div>
                      <div className="m-name">{m.name}</div>
                      <div className="m-id">{m.id}</div>
                    </div>
                    <span className={`t-badge ${(m.tier || 'low').toLowerCase()}`}>
                      {m.tier || 'LOW'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Sheet Action Lampiran */}
      {isAttachOpen && (
        <div className="sheet-backdrop" onClick={() => setIsAttachOpen(false)}>
          <div className="sheet-body" onClick={e => e.stopPropagation()}>
            <div className="sheet-drag" />
            <div className="sheet-grid">
              {[
                { name: 'Kamera', icon: '📷' },
                { name: 'File', icon: '📎' },
                { name: 'Drive', icon: '📁' },
                { name: 'Foto', icon: '🖼️' }
              ].map(item => (
                <button key={item.name} onClick={() => handleFeaturePick(item.name)} className="grid-btn">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
            <div className="feat-list">
              {[
                { name: 'Gambar', sub: 'Buat dan edit gambar', icon: '🎨' },
                { name: 'Video', sub: 'Wujudkan ide kreatif', icon: '🎬' },
                { name: 'Musik', sub: 'Buat trek audio sintetis', icon: '🎵' },
                { name: 'Canvas', sub: 'Buat kode, tulis, atau slide', icon: '📋' },
                { name: 'Deep Research', sub: 'Dapatkan laporan mendalam', icon: '🔍' }
              ].map(feat => (
                <div key={feat.name} onClick={() => handleFeaturePick(feat.name)} className="feat-item">
                  <span style={{ fontSize: '20px' }}>{feat.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{feat.name}</div>
                    <div style={{ fontSize: '12px', color: '#9aa0a6' }}>{feat.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setInputPrompt(`[Lampiran: ${e.target.files[0].name}] `);
          }
        }}
      />
    </div>
  );
}
