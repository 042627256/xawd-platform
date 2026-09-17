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
}

export default function App() {
  const [models] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>(
    staticModelList.length > 0 ? (staticModelList[0] as any).id : 'ag/gemini-3.8-flash-medium'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // State Chat & Tools
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya asisten cerdas X AWD. Ada yang bisa saya bantu hari ini?',
      model: 'System',
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

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputPrompt;
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
      // Format riwayat chat untuk dikirim ke API
      const conversationPayload = newHistory
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('https://api.xawd.my.id/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: conversationPayload,
          prompt: textToSend.trim()
        })
      });

      const data = await res.json();
      const replyContent = data.reply || data.error || 'Tidak ada respons dari engine.';
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: replyContent,
          model: data.model || selectedModel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Kesalahan Jaringan: ' + err.message,
          model: 'Error',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFileAction = (actionName: string) => {
    setIsAttachOpen(false);
    if (actionName === 'Kamera' || actionName === 'File' || actionName === 'Foto') {
      fileInputRef.current?.click();
    } else {
      setInputPrompt(`[Fitur ${actionName}]: `);
    }
  };

  const activeModel = models.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.split('/').pop() || selectedModel,
    tier: 'MEDIUM'
  };

  return (
    <div className="chat-app-container">
      {/* Top Navbar */}
      <nav className="chat-navbar">
        <div className="chat-nav-left">
          <span className="chat-brand-logo">X</span>
          <div className="chat-model-selector-wrapper">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="chat-model-picker-btn"
            >
              <span className="chat-model-name">{activeModel.name}</span>
              <span className="dropdown-arrow">{isDropdownOpen ? '▴' : '▾'}</span>
            </button>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="btn-new-chat" title="Bersihkan Percakapan">
          + Obrolan Baru
        </button>
      </nav>

      {/* Model Popover Dropdown */}
      {isDropdownOpen && (
        <div className="model-dropdown-modal">
          <input
            type="text"
            placeholder="Cari engine (Gemini, Claude, GPT, GLM)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="model-search-input"
          />
          <div className="model-list-scroll">
            {models
              .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
              .map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`model-list-item ${selectedModel === m.id ? 'active' : ''}`}
                >
                  <div>
                    <div className="model-title">{m.name}</div>
                    <div className="model-sub">{m.id}</div>
                  </div>
                  <span className={`tier-badge ${m.tier}`}>{m.tier}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Area Pesan Berkelanjutan (Chat History) */}
      <div className="chat-message-list">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble-row ${msg.role === 'user' ? 'user-row' : 'bot-row'}`}>
            <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
              <div className="bubble-header">
                <span className="bubble-author">{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                <span className="bubble-time">{msg.timestamp}</span>
              </div>
              <div className="bubble-content">{msg.content}</div>
            </div>
          </div>
        ))}
        {isExecuting && (
          <div className="chat-bubble-row bot-row">
            <div className="chat-bubble bot-bubble loading-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="loading-text">Sedang berpikir...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Sheet Action Lampiran (Kamera, File, Gambar, dll) */}
      {isAttachOpen && (
        <div className="action-sheet-overlay" onClick={() => setIsAttachOpen(false)}>
          <div className="action-sheet-card" onClick={e => e.stopPropagation()}>
            <div className="action-sheet-handle"></div>
            
            {/* Baris Pintasan Media */}
            <div className="action-quick-grid">
              {[
                { name: 'Kamera', icon: '📷' },
                { name: 'File', icon: '📎' },
                { name: 'Drive', icon: '📁' },
                { name: 'Foto', icon: '🖼️' }
              ].map(item => (
                <button key={item.name} onClick={() => handleFileAction(item.name)} className="action-quick-btn">
                  <div className="action-quick-icon">{item.icon}</div>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* List Fitur Lanjutan Mirip Gemini */}
            <div className="action-feature-list">
              {[
                { name: 'Gambar', sub: 'Buat dan edit gambar', icon: '🎨' },
                { name: 'Video', sub: 'Wujudkan ide kreatif', icon: '🎬' },
                { name: 'Musik', sub: 'Buat trek audio sintetis', icon: '🎵' },
                { name: 'Canvas', sub: 'Buat kode, tulis, atau slide', icon: '📋' },
                { name: 'Deep Research', sub: 'Dapatkan laporan mendalam', icon: '🔍' }
              ].map(feat => (
                <div key={feat.name} onClick={() => handleFileAction(feat.name)} className="action-feature-item">
                  <span className="feature-icon">{feat.icon}</span>
                  <div>
                    <div className="feature-title">{feat.name}</div>
                    <div className="feature-sub">{feat.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input File Hidden */}
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

      {/* Input Bar Bawah */}
      <div className="chat-input-bar">
        <button
          type="button"
          onClick={() => setIsAttachOpen(!isAttachOpen)}
          className={`btn-attach ${isAttachOpen ? 'active' : ''}`}
          title="Buka Menu Lampiran"
        >
          +
        </button>
        <textarea
          rows={1}
          placeholder="Ketik pesan untuk X AWD..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="chat-textarea"
        />
        <button
          onClick={() => handleSend()}
          disabled={isExecuting || !inputPrompt.trim()}
          className="btn-send-message"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
