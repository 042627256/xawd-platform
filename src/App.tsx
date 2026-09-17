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
  const [models, setModels] = useState<ModelItem[]>([{"id":"ag/gemini-3.8-flash-high","name":"gemini-3.8-flash-high","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.8-flash-medium","name":"gemini-3.8-flash-medium","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.8-flash-low","name":"gemini-3.8-flash-low","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.8-flash","name":"gemini-3.8-flash","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.7-flash-high","name":"gemini-3.7-flash-high","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.7-flash-medium","name":"gemini-3.7-flash-medium","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.7-flash-low","name":"gemini-3.7-flash-low","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.6-flash-high","name":"gemini-3.6-flash-high","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.6-flash-medium","name":"gemini-3.6-flash-medium","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.6-flash-low","name":"gemini-3.6-flash-low","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3-flash-agent","name":"gemini-3-flash-agent","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.5-flash-low","name":"gemini-3.5-flash-low","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/gemini-3.5-flash-extra-low","name":"gemini-3.5-flash-extra-low","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/claude-sonnet-4-6","name":"claude-sonnet-4-6","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"ag/claude-opus-4-6-thinking","name":"claude-opus-4-6-thinking","provider":"ag","task":"text","tier":"high","isCombine":true},{"id":"gemini/gemini-3.5-flash-lite","name":"gemini-3.5-flash-lite","provider":"gemini","task":"text","tier":"high","isCombine":true},{"id":"gemini/gemini-3.1-flash-lite-preview","name":"gemini-3.1-flash-lite-preview","provider":"gemini","task":"text","tier":"high","isCombine":true},{"id":"gemini/gemini-3-flash-preview","name":"gemini-3-flash-preview","provider":"gemini","task":"text","tier":"high","isCombine":true},{"id":"cx/gpt-5.6-terra","name":"gpt-5.6-terra","provider":"cx","task":"text","tier":"high","isCombine":true},{"id":"cx/gpt-5.6-terra-review","name":"gpt-5.6-terra-review","provider":"cx","task":"text","tier":"high","isCombine":true},{"id":"cx/gpt-5.6-luna","name":"gpt-5.6-luna","provider":"cx","task":"text","tier":"high","isCombine":true},{"id":"cx/gpt-5.5","name":"gpt-5.5","provider":"cx","task":"text","tier":"high","isCombine":true},{"id":"cx/gpt-5.5-review","name":"gpt-5.5-review","provider":"cx","task":"text","tier":"high","isCombine":true},{"id":"gh/copilot-search-a","name":"copilot-search-a","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/copilot-search-b","name":"copilot-search-b","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/copilot-search-c","name":"copilot-search-c","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/exec-agent-a","name":"exec-agent-a","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/exec-agent-b","name":"exec-agent-b","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/exec-agent-c","name":"exec-agent-c","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4o-mini-2024-07-18","name":"gpt-4o-mini-2024-07-18","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4o-2024-11-20","name":"gpt-4o-2024-11-20","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4o-2024-08-06","name":"gpt-4o-2024-08-06","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4.1-2025-04-14","name":"gpt-4.1-2025-04-14","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-3.5-turbo-0613","name":"gpt-3.5-turbo-0613","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4o-2024-05-13","name":"gpt-4o-2024-05-13","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4-o-preview","name":"gpt-4-o-preview","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4.1","name":"gpt-4.1","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4o-mini","name":"gpt-4o-mini","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"gh/gpt-4o","name":"gpt-4o","provider":"gh","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-3.7-flash-medium","name":"gemini-3.7-flash-medium","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-3.6-flash-high","name":"gemini-3.6-flash-high","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-3.6-flash-medium","name":"gemini-3.6-flash-medium","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-3.6-flash-low","name":"gemini-3.6-flash-low","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-pro-agent","name":"gemini-pro-agent","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-3.1-pro-low","name":"gemini-3.1-pro-low","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-3-flash","name":"gemini-3-flash","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-2.5-flash","name":"gemini-2.5-flash","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-2.5-flash-lite","name":"gemini-2.5-flash-lite","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/ag/gemini-3.1-flash-lite-preview","name":"gemini-3.1-flash-lite-preview","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cx/gpt-image-1.5","name":"gpt-image-1.5","provider":"Oc-full","task":"image","tier":"high","isCombine":true},{"id":"Oc-full/am/nemotron-3-super-120b-a12b","name":"nemotron-3-super-120b-a12b","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/am/llama-3.2-11b-vision-instruct","name":"llama-3.2-11b-vision-instruct","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/am/nemotron-3-nano-omni-30b-a3b-reasoning","name":"nemotron-3-nano-omni-30b-a3b-reasoning","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/am/riva-translate-4b-instruct-v2","name":"riva-translate-4b-instruct-v2","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/am/nemotron-3.5-content-safety","name":"nemotron-3.5-content-safety","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/xai/grok-4.6","name":"grok-4.6","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/xai/grok-4.5","name":"grok-4.5","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/xai/grok-4.3","name":"grok-4.3","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/xai/grok-4.20-0309-reasoning","name":"grok-4.20-0309-reasoning","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/xai/grok-4.20-0309-non-reasoning","name":"grok-4.20-0309-non-reasoning","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/xai/grok-4.20-multi-agent-0309","name":"grok-4.20-multi-agent-0309","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/glm/glm-5.3","name":"glm-5.3","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/glm/glm-5.3-flash","name":"glm-5.3-flash","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/glm/glm-5.1","name":"glm-5.1","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/glm/glm-5","name":"glm-5","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/glm/glm-4.7","name":"glm-4.7","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/glm/glm-4.6v","name":"glm-4.6v","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cc/claude-opus-5","name":"claude-opus-5","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cc/claude-sonnet-5","name":"claude-sonnet-5","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cc/claude-opus-4-8","name":"claude-opus-4-8","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cc/claude-opus-4-7","name":"claude-opus-4-7","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cc/claude-opus-4-6","name":"claude-opus-4-6","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cc/claude-sonnet-4-6","name":"claude-sonnet-4-6","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/cc/claude-haiku-4-5-20251001","name":"claude-haiku-4-5-20251001","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"Oc-full/am/free","name":"free","provider":"Oc-full","task":"text","tier":"high","isCombine":true},{"id":"All-Official/minimax-m2.7","name":"minimax-m2.7","provider":"All-Official","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/google/gemini-3.5-flash","name":"gemini-3.5-flash","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/google/gemini-3.1-pro-preview","name":"gemini-3.1-pro-preview","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/google/gemini-3.1-flash-lite","name":"gemini-3.1-flash-lite","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/google/gemini-3-pro-image","name":"gemini-3-pro-image","provider":"Oc-uni","task":"image","tier":"high","isCombine":true},{"id":"Oc-uni/x-ai/grok-4.3","name":"grok-4.3","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/deepseek/deepseek-v4-pro","name":"deepseek-v4-pro","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/deepseek/deepseek-v4-flash","name":"deepseek-v4-flash","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/z-ai/glm-5.2","name":"glm-5.2","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/z-ai/glm-5.1","name":"glm-5.1","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/minimax/minimax-m3","name":"minimax-m3","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/moonshotai/kimi-k2.7-code","name":"kimi-k2.7-code","provider":"Oc-uni","task":"coding","tier":"high","isCombine":true},{"id":"Oc-uni/moonshotai/kimi-k3","name":"kimi-k3","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/MiniMax-M2.7","name":"MiniMax-M2.7","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/MiniMax-M3","name":"MiniMax-M3","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/claude-haiku-4-5-20251001","name":"claude-haiku-4-5-20251001","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/claude-opus-4-6","name":"claude-opus-4-6","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/claude-opus-4-7","name":"claude-opus-4-7","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/claude-opus-4-8","name":"claude-opus-4-8","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/deepseek-v4-flash","name":"deepseek-v4-flash","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/deepseek-v4-pro","name":"deepseek-v4-pro","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/gemini-3.1-pro","name":"gemini-3.1-pro","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/gemini-3.5-flash","name":"gemini-3.5-flash","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/glm-5.1","name":"glm-5.1","provider":"Oc-uni","task":"text","tier":"high","isCombine":true},{"id":"Oc-uni/kimi-k2.7-code","name":"kimi-k2.7-code","provider":"Oc-uni","task":"coding","tier":"high","isCombine":true}]);
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
      const res = await fetch("https://api.xawd.my.id/api/models");
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
      const res = await fetch('https://api.xawd.my.idhttps://api.xawd.my.idhttps://api.xawd.my.id/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel || "Harbor-max/gpt-5.6-terra",
          prompt,
          task: selectedTask
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

// build-stamp: 2026-09-17T11:52:19.503Z-0.02890996163865245

// build-hash: 1789646163321
