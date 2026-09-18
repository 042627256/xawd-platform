import React, { useState, useEffect, useRef } from "react";

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  tier: "ULTRA" | "HIGH" | "MEDIUM" | "LOW";
  tierWeight: number;
  task: string;
  supportsVision: boolean;
  isCombine?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function App() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("Oc-uni/gpt-6-astra");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Sistem X AWD siap digunakan. Semua model beroperasi secara live dengan respon instan." }
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModelDrawer, setShowModelDrawer] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://api.xawd.my.id/api/models")
      .then(res => res.json())
      .then(resData => {
        if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          setModels(resData.data);
          const hasAstra = resData.data.some((m: ModelItem) => m.id === "Oc-uni/gpt-6-astra");
          if (!hasAstra) setSelectedModel(resData.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const res = await fetch("https://api.xawd.my.id/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = "Upstream gagal merespons.";
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
                    const last = next[next.length - 1];
                    if (last && last.role === "assistant") {
                      last.content = accumulated;
                    }
                    return next;
                  });
                }
              } catch (_) {}
            }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          last.content = `[Error] ${err.message || "Gagal memproses pesan."}`;
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModels = models.filter(m => tierFilter === "ALL" || m.tier === tierFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "sans-serif" }}>
      {/* Header Sticky */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1f2937", backgroundColor: "#111827", zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#38bdf8" }}>X AWD AI Gateway</h1>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Model: {selectedModel}</span>
        </div>
        <button
          onClick={() => setShowModelDrawer(!showModelDrawer)}
          style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          Pilih Model ({models.length})
        </button>
      </header>

      {/* Drawer Model */}
      {showModelDrawer && (
        <div style={{ position: "absolute", top: "56px", right: "20px", width: "320px", maxHeight: "80vh", background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "12px", zIndex: 50, display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {["ALL", "ULTRA", "HIGH", "MEDIUM", "LOW"].map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                style={{
                  background: tierFilter === t ? "#38bdf8" : "#374151",
                  color: tierFilter === t ? "#000" : "#fff",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredModels.map(m => (
              <div
                key={m.id}
                onClick={() => { setSelectedModel(m.id); setShowModelDrawer(false); }}
                style={{
                  padding: "8px 10px",
                  borderRadius: "4px",
                  background: selectedModel === m.id ? "#1d4ed8" : "#111827",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{m.name}</span>
                <span style={{ fontSize: "0.65rem", padding: "2px 4px", borderRadius: "3px", background: "#374151" }}>{m.tier}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Area Chat */}
      <main style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              background: msg.role === "user" ? "#2563eb" : "#1f2937",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "12px",
              lineHeight: 1.5,
              fontSize: "0.95rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          >
            {msg.content || (isLoading && i === messages.length - 1 ? "Sedang mengetik..." : "")}
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>

      {/* Input Chat Box Sticky */}
      <footer style={{ padding: "14px 20px", background: "#111827", borderTop: "1px solid #1f2937" }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.95rem",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "12px 24px",
              background: isLoading ? "#4b5563" : "#38bdf8",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "0.95rem"
            }}
          >
            {isLoading ? "..." : "Kirim"}
          </button>
        </form>
      </footer>
    </div>
  );
}
