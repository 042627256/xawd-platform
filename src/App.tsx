import React, { useState, useRef, useEffect } from 'react';
import staticModelList from './data/models.json';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isComboActive, setIsComboActive] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya asisten cerdas X AWD. Aktifkan fitur "⚡ Combo Epic" jika ingin jawaban tingkat tinggi hasil konsensus 3 engine AI sekaligus.',
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
        .header-fixed-row {
          grid-row: 1; display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px; background: rgba(30, 31, 32, 0.98); backdrop-filter: blur(16px);
          border-bottom: 1px solid #28292a; z-index: 100;
        }
        .header-left { display: flex; align-items: center; gap: 8px; }
        .brand-badge {
          background: #1a73e8; color: #fff; font-weight: 700; border-radius: 8px;
          padding: 4px 10px; font-size: 13px; letter-spacing: 0.5px;
        }
        .combo-btn {
          background: #2b2615; color: #ffd700; border: 1px solid #7c6818;
          border-radius: 20px; padding: 5px 12px; font-size: 12px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .combo-btn.active {
          background: #ffd700; color: #000; box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
        }
        .model-btn {
          background: #282a2c; border: 1px solid #3c4043; color: #e3e3e3;
          border-radius: 20px; padding: 5px 12px; font-size: 12.5px; cursor: pointer;
          max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .new-btn {
          background: transparent; border: 1px solid #3c4043; color: #8ab4f8;
          padding: 5px 10px; border-radius: 16px; font-size: 11.5px; cursor: pointer;
        }
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

        /* Modal Dialog Pemilih Model */
        .dropdown-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 200; }
        .dropdown-box {
          position: fixed; top: 64px; left: 16px; right: 16px; max-width: 500px;
          margin: 0 auto; background: #232427; border: 1px solid #3c4043;
          border-radius: 16px; padding: 14px; z-index: 210;
        }
        .search-in {
          width: 100%; padding: 10px 14px; background: #131314; border: 1px solid #3c4043;
          border-radius: 10px; color: #fff; margin-bottom: 10px; outline: none;
        }
        .model-items { max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .m-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
        .m-row:hover, .m-row.selected { background: #333538; }
        .m-name { font-size: 13.5px; font-weight: 500; }
        .m-id { font-size: 11px; color: #9aa0a6; }
        .t-badge { font-size: 10px; padding: 3px 7px; border-radius: 5px; font-weight: 600; text-transform: uppercase; }
        .t-badge.high { background: #5c2b29; color: #f28b82; }
        .t-badge.medium { background: #4a3b1a; color: #fdd663; }
        .t-badge.low { background: #1e3a29; color: #81c995; }

        /* Action Sheet */
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

      {/* Modal Dropdown */}
      {isDropdownOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
          <div className="dropdown-box">
            <input
              type="text"
              placeholder="Cari engine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-in"
              autoFocus
            />
            <div className="model-items">
              {models
                .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
                .map(m => (
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
                    <span className={`t-badge ${m.tier}`}>{m.tier}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Action Sheet */}
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
