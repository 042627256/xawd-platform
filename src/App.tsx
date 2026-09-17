import React, { useState, useEffect } from 'react';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task: 'text' | 'coding' | 'image' | 'video' | 'deep_reason';
  tier: 'low' | 'medium' | 'high';
  isCombine: boolean;
}

export default function App() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<'text' | 'coding' | 'image' | 'video' | 'deep_reason'>('text');
  const [selectedTier, setSelectedTier] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedModel, setSelectedModel] = useState<string>('Oc-full/glm/glm-5.3');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [customKey, setCustomKey] = useState(localStorage.getItem('x_key') || 'comku');
  const [customBase, setCustomBase] = useState(localStorage.getItem('x_base') || 'https://9rxawd.up.railway.app/v1');

  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await fetch('https://api.xawd.my.idhttps://api.xawd.my.id/api/models', {
        headers: {
          'x-custom-key': customKey,
          'x-custom-base': customBase
        }
      });
      const data = await res.json();
      if (data.success && data.models?.length > 0) {
        setModels(data.models);
        const def = data.models.find((m: ModelItem) => m.id.includes('glm-5.3')) || data.models[0];
        if (def) setSelectedModel(def.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const saveSettings = () => {
    localStorage.setItem('x_key', customKey);
    localStorage.setItem('x_base', customBase);
    fetchModels();
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setReply('');
    try {
      const res = await fetch('https://api.xawd.my.idhttps://api.xawd.my.id/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          task: selectedTask,
          customKey,
          customBase
        })
      });
      const data = await res.json();
      setReply(data.reply || data.error || 'Tidak ada balasan.');
    } catch (err: any) {
      setReply('Koneksi Gagal: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredModels = models.filter(m => {
    const matchTask = selectedTask === 'text' ? true : m.task === selectedTask;
    const matchTier = selectedTier === 'all' ? true : m.tier === selectedTier;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                        m.id.toLowerCase().includes(search.toLowerCase()) || 
                        m.provider.toLowerCase().includes(search.toLowerCase());
    return matchTask && matchTier && matchSearch;
  });

  const activeModelDetails = models.find(m => m.id === selectedModel);

  return (
    <div className="frame-wrapper">
      {/* SaaS Navbar */}
      <nav className="frame-navbar">
        <div className="container nav-content">
          <div className="nav-brand">
            <span className="brand-logo">X</span>
            <span className="brand-name">X AWD <span className="brand-highlight">Engine</span></span>
          </div>
          <div className="nav-actions">
            <input
              type="password"
              placeholder="API Token..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="key-input"
            />
            <button onClick={saveSettings} className="btn-primary-sm">Sync</button>
          </div>
        </div>
      </nav>

      {/* Hero Header Frame */}
      <header className="hero-section">
        <div className="container text-center">
          <span className="badge-pill">Enterprise AI Routing Cluster</span>
          <h1 className="hero-title">High Performance Multi-Engine</h1>
          <p className="hero-desc">
            Orkestrasi cerdas GLM-5.3, Claude Sonnet 5, GPT-5.6 Terra, dan DeepSeek dalam satu ruang kendali modern.
          </p>
        </div>
      </header>

      {/* Main Dashboard Panel */}
      <main className="container main-content">
        <div className="row">
          {/* Kolom Kiri: Pengaturan Tugas & Model */}
          <div className="col-lg-5">
            {/* Task Category Card */}
            <div className="frame-card mb-4">
              <div className="card-header-clean">
                <span className="header-num">01</span>
                <div>
                  <h3 className="card-title">Kategori Tugas</h3>
                  <p className="card-subtitle">Pilih spesialisasi model</p>
                </div>
              </div>

              <div className="task-selector-grid">
                {[
                  { id: 'text', icon: '✍️', label: 'Text & Story', sub: 'Writing, Copy, Coretax' },
                  { id: 'coding', icon: '💻', label: 'Coding & Dev', sub: 'Syntax, Logic, Refactor' },
                  { id: 'deep_reason', icon: '🧠', label: 'Deep Reason', sub: 'Thinking & Mathematics' },
                  { id: 'image', icon: '🎨', label: 'Image & Vision', sub: 'Visual & Multimodal' },
                  { id: 'video', icon: '🎬', label: 'Video & Media', sub: 'Audio & Transcription' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTask(t.id as any)}
                    className={`task-tile ${selectedTask === t.id ? 'task-tile-active' : ''}`}
                  >
                    <span className="task-tile-icon">{t.icon}</span>
                    <div className="task-tile-body">
                      <span className="task-tile-title">{t.label}</span>
                      <span className="task-tile-sub">{t.sub}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Tier Filter */}
              <div className="tier-wrapper mt-3">
                <label className="tier-title">Tingkatan Model (Tier):</label>
                <div className="tier-pills">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'low', label: '🟢 Low Tier' },
                    { id: 'medium', label: '🟡 Mid Tier' },
                    { id: 'high', label: '🟣 High Tier' }
                  ].map(tr => (
                    <button
                      key={tr.id}
                      onClick={() => setSelectedTier(tr.id as any)}
                      className={`tier-pill ${selectedTier === tr.id ? 'tier-pill-active' : ''}`}
                    >
                      {tr.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Selection Dropdown Card */}
            <div className="frame-card model-dropdown-card">
              <div className="card-header-clean">
                <span className="header-num">02</span>
                <div className="w-100 d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="card-title">Model Selector</h3>
                    <p className="card-subtitle">{models.length} Model Aktif Terdeteksi</p>
                  </div>
                  <span className="badge-count">{filteredModels.length} Tersedia</span>
                </div>
              </div>

              {/* Bootstrap Clean Dropdown Trigger */}
              <div className="dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="model-select-btn"
                >
                  <div className="model-select-info">
                    <div className="model-select-header">
                      <span className="model-select-name">{activeModelDetails?.name || selectedModel}</span>
                      {activeModelDetails?.isCombine && (
                        <span className="badge-combine">COMBINE</span>
                      )}
                    </div>
                    <div className="model-select-id">{selectedModel}</div>
                  </div>
                  <span className="select-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {isDropdownOpen && (
                  <div className="model-menu-popover">
                    <div className="popover-search">
                      <input
                        type="text"
                        placeholder="Cari model GLM, Claude, GPT, DeepSeek..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-field"
                      />
                    </div>
                    <div className="popover-scrollable">
                      {filteredModels.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`model-item-row ${selectedModel === m.id ? 'model-item-selected' : ''}`}
                        >
                          <div className="model-item-meta">
                            <div className="d-flex align-items-center gap-2">
                              <span className="model-item-title">{m.name}</span>
                              {m.isCombine && <span className="tag-combine">COMBINE</span>}
                            </div>
                            <span className="model-item-sub">{m.id}</span>
                          </div>
                          <span className={`tier-tag tag-${m.tier}`}>{m.tier.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Playground Console Card */}
          <div className="col-lg-7">
            <div className="frame-card console-card">
              <div className="card-header-clean border-bottom pb-3 mb-3">
                <span className="header-num">03</span>
                <div className="w-100 d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="card-title">Playground Output Console</h3>
                    <p className="card-subtitle">Active Engine: <strong className="text-primary">{selectedModel}</strong></p>
                  </div>
                  <span className="badge-mode-pill">{selectedTask.toUpperCase()}</span>
                </div>
              </div>

              {/* Prompt Input Form */}
              <div className="prompt-wrapper">
                <textarea
                  rows={4}
                  placeholder={`Ketik prompt untuk pengujian task ${selectedTask}...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="frame-textarea"
                />
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || !prompt.trim()}
                  className="btn-execute-primary"
                >
                  {isExecuting ? 'Mengeksekusi...' : 'Jalankan Prompt →'}
                </button>
              </div>

              {/* Output Response Screen */}
              <div className="response-container mt-3">
                <div className="response-header">
                  <span>HASIL EKSEKUSI</span>
                  {reply && <span className="text-success">● Sukses</span>}
                </div>
                <div className="response-screen">
                  {reply ? (
                    <div className="response-text">{reply}</div>
                  ) : (
                    <div className="response-placeholder">
                      Hasil respons dari engine X AWD akan tampil rapi di sini...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Frame Footer */}
      <footer className="frame-footer">
        <div className="container text-center">
          <p className="footer-brand">X AWD Platform — Autonomous Intelligence Architecture</p>
          <p className="footer-sub">Optimized for High Concurrency & Persona Injection</p>
        </div>
      </footer>
    </div>
  );
}
