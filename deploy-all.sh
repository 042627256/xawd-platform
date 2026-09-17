#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=== [XAWD] AUTOMATED TERMUX FULL DEPLOYMENT ==="[cite: 1]

# 1. Pastikan variabel environment Cloudflare tersedia jika ingin eksekusi remote D1 via API[cite: 1]
if [ -n "$CF_ACCOUNT_ID" ] && [ -n "$CF_API_TOKEN" ] && [ -n "$CF_DB_ID" ]; then
  echo "[1/4] Menerapkan tabel D1 via Cloudflare API..."[cite: 1]
  curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DB_ID}/query" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": \"CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, key_hash TEXT NOT NULL, prefix TEXT NOT NULL, tier TEXT DEFAULT 'Standard', is_active INTEGER DEFAULT 1, created_at INTEGER NOT NULL, last_used_at INTEGER); CREATE TABLE IF NOT EXISTS team_members (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'member', invited_by TEXT NOT NULL, created_at INTEGER NOT NULL);\"}" || true[cite: 1]
else
  echo "[1/4] Variabel CF API tidak lengkap di env, melewati eksekusi D1 via curl (pastikan tabel sudah dibuat via D1 Console)."[cite: 1]
fi

# 2. Tulis src/worker.ts lengkap[cite: 1]
echo "[2/4] Memperbarui src/worker.ts..."[cite: 1]
cat << 'WORKER_EOF' > src/worker.ts
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: any;
  NINE_ROUTER_API_KEY: string;
  NINE_ROUTER_BASE_URL: string;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach(cookie => {
    let [name, ...rest] = cookie.split("=");
    name = name?.trim();
    if (!name) return;
    list[name] = decodeURIComponent(rest.join("=").trim());
  });
  return list;
}

async function sha256(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getSessionUser(request: Request, env: Env) {
  try {
    const cookies = parseCookies(request.headers.get("Cookie"));
    const sessionId = cookies["session_id"];
    if (sessionId) {
      const session: any = await env.DB.prepare(
        "SELECT users.id, users.email, users.role FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?"
      ).bind(sessionId, Date.now()).first();
      if (session) return session;
    }

    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer xawd_live_")) {
      const rawKey = authHeader.replace("Bearer ", "").trim();
      const hash = await sha256(rawKey);
      const apiKeyRow: any = await env.DB.prepare(
        "SELECT user_id, tier, is_active FROM api_keys WHERE key_hash = ?"
      ).bind(hash).first();

      if (apiKeyRow && apiKeyRow.is_active === 1) {
        await env.DB.prepare("UPDATE api_keys SET last_used_at = ? WHERE key_hash = ?").bind(Date.now(), hash).run();
        const user: any = await env.DB.prepare("SELECT id, email, role FROM users WHERE id = ?").bind(apiKeyRow.user_id).first();
        if (user) return { ...user, isApiKey: true, apiTier: apiKeyRow.tier };
      }
    }

    return null;
  } catch (_) {
    return null;
  }
}

async function getOrCreateUsage(env: Env, userId: string) {
  const period = new Date().toISOString().slice(0, 7);
  let meter: any = await env.DB.prepare(
    "SELECT * FROM usage_meter WHERE user_id = ? AND month_period = ?"
  ).bind(userId, period).first();

  if (!meter) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO usage_meter (id, user_id, tier, tokens_used, images_generated, month_period, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, "Free", 0, 0, period, Date.now()).run();
    meter = { id, user_id: userId, tier: "Free", tokens_used: 0, images_generated: 0, month_period: period };
  }
  return meter;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    if (host.startsWith("api.") && url.pathname === "/") {
      return new Response(JSON.stringify({
        gateway: "XAWD Autonomous Edge API Engine",
        version: "2.0-Production",
        status: "active",
        endpoints: ["/api/health", "/api/auth/me", "/api/ai/run", "/api/ai/image", "/api/developer/keys", "/api/referrals", "/api/billing/checkout"]
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "healthy", host, timestamp: Date.now() }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (url.pathname === "/api/auth/me") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ user: null }), { status: 401, headers: { "Content-Type": "application/json" } });
      const usage = await getOrCreateUsage(env, user.id);
      return new Response(JSON.stringify({ user, usage }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const cookies = parseCookies(request.headers.get("Cookie"));
      const sessionId = cookies["session_id"];
      if (sessionId) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", "session_id=; Path=/; Domain=.xawd.my.id; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    if (url.pathname === "/api/developer/keys") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

      if (request.method === "GET") {
        const rows = await env.DB.prepare(
          "SELECT id, name, prefix, tier, is_active, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(user.id).all();
        return new Response(JSON.stringify({ keys: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (request.method === "POST") {
        const body = await request.json() as any;
        const keyName = body?.name?.trim() || "Default Live Key";
        const secretPart = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().slice(0, 8);
        const fullKey = `xawd_live_${secretPart}`;
        const prefix = fullKey.slice(0, 16) + "...";
        const keyHash = await sha256(fullKey);

        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO api_keys (id, user_id, name, key_hash, prefix, tier, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, user.id, keyName, keyHash, prefix, "Standard", 1, Date.now()).run();

        return new Response(JSON.stringify({ success: true, key: fullKey, id, prefix, name: keyName }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/api/teams") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

      if (request.method === "GET") {
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return new Response(JSON.stringify({ members: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
        const rows = await env.DB.prepare("SELECT * FROM team_members WHERE project_id = ?").bind(projectId).all();
        return new Response(JSON.stringify({ members: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (request.method === "POST") {
        const { projectId, email, role } = await request.json() as any;
        const invitee: any = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (!invitee) return new Response(JSON.stringify({ error: "Email anggota belum terdaftar" }), { status: 404, headers: { "Content-Type": "application/json" } });

        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO team_members (id, project_id, user_id, role, invited_by, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(id, projectId, invitee.id, role || "member", user.id, Date.now()).run();

        return new Response(JSON.stringify({ success: true, message: "Anggota tim ditambahkan" }), { status: 201, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/billing/checkout" && request.method === "POST") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Silakan login terlebih dahulu" }), { status: 401, headers: { "Content-Type": "application/json" } });

      const { planTier } = await request.json() as any;
      const prices: Record<string, number> = { Plus: 59000, Pro: 149000, Team: 799000 };
      const amount = prices[planTier] || 59000;
      const invoiceId = "INV-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomUUID().slice(0, 4).toUpperCase();
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      await env.DB.prepare(
        "INSERT INTO subscriptions (id, user_id, plan_tier, amount_idr, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(invoiceId, user.id, planTier, amount, "pending", Date.now(), expiresAt).run();

      return new Response(JSON.stringify({
        success: true,
        invoiceId,
        planTier,
        amountIdr: amount,
        paymentInstructions: `Transfer tepat Rp${amount.toLocaleString("id-ID")} via QRIS/BCA/Mandiri ke rekening operasional XAWD.`
      }), { status: 201, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/referrals" && request.method === "GET") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

      const referralCode = "AWD-" + user.id.slice(0, 6).toUpperCase();
      const rows = await env.DB.prepare(
        "SELECT id, referred_id, status, min_activity_reached, reward_granted, created_at FROM referrals WHERE referrer_id = ?"
      ).bind(user.id).all();

      return new Response(JSON.stringify({
        referralCode,
        referralUrl: `https://xawd.my.id/?ref=${referralCode}`,
        stats: {
          totalInvited: rows.results?.length || 0,
          verifiedAccounts: rows.results?.filter((r: any) => r.min_activity_reached === 1).length || 0
        },
        records: rows.results || []
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/projects") {
      const user = await getSessionUser(request, env);
      if (request.method === "GET") {
        if (!user) return new Response(JSON.stringify({ projects: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
        const rows = await env.DB.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").bind(user.id).all();
        return new Response(JSON.stringify({ projects: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (request.method === "POST") {
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        const { name } = await request.json() as any;
        const id = "proj_" + crypto.randomUUID().slice(0, 8);
        const now = Date.now();
        await env.DB.prepare("INSERT INTO projects (id, user_id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, user.id, name, "active", now, now).run();
        return new Response(JSON.stringify({ success: true, project: { id, name, status: "active", updated_at: now } }), { status: 201, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/ai/image" && request.method === "POST") {
      try {
        const user = await getSessionUser(request, env);
        const body = await request.json() as any;
        const prompt = (body?.prompt || "").trim();
        if (!prompt) return new Response(JSON.stringify({ error: "Prompt gambar tidak boleh kosong" }), { status: 400, headers: { "Content-Type": "application/json" } });

        const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt, steps: 4 });
        const buffer = await new Response(response).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const imageUrl = `data:image/jpeg;base64,${btoa(binary)}`;

        if (user) {
          await env.DB.prepare("UPDATE usage_meter SET images_generated = images_generated + 1, updated_at = ? WHERE user_id = ?").bind(Date.now(), user.id).run();
          await env.DB.prepare("UPDATE referrals SET min_activity_reached = 1 WHERE referred_id = ?").bind(user.id).run();
        }

        await env.DB.prepare("INSERT INTO ai_logs (id, user_id, mode, model_used, prompt, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(crypto.randomUUID(), user ? user.id : "anonymous", "image", "flux-1-schnell", prompt, imageUrl, Date.now()).run();

        return new Response(JSON.stringify({ imageUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: "Visual error: " + e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/ai/run" && request.method === "POST") {
      try {
        const user = await getSessionUser(request, env);
        const body = await request.json() as any;
        const promptText = (body?.prompt || body?.query || "").trim();

        if (!promptText) {
          return new Response(JSON.stringify({ error: "Query atau prompt tidak boleh kosong" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const targetModel = body?.model || "Comku";
        const apiKey = env.NINE_ROUTER_API_KEY;
        const baseUrl = (env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1").replace(/\/+$/, "");

        const messages = [];
        if (body?.systemPrompt?.trim()) messages.push({ role: "system", content: body.systemPrompt.trim() });
        messages.push({ role: "user", content: promptText });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response: Response;
        try {
          response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({ model: targetModel, messages, stream: false }),
            signal: controller.signal
          });
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          return new Response(JSON.stringify({ error: "Gateway timeout: " + fetchErr.message }), { status: 504, headers: { "Content-Type": "application/json" } });
        } finally {
          clearTimeout(timeoutId);
        }

        const rawText = await response.text();
        let reply = "";
        try {
          const parsed = JSON.parse(rawText);
          reply = parsed.choices?.[0]?.message?.content || parsed.choices?.[0]?.text || parsed.error?.message;
        } catch (_) {}
        if (!reply) reply = rawText || "Respons kosong.";

        if (user) {
          await env.DB.prepare("UPDATE usage_meter SET tokens_used = tokens_used + 1, updated_at = ? WHERE user_id = ?").bind(Date.now(), user.id).run();
          await env.DB.prepare("UPDATE referrals SET min_activity_reached = 1 WHERE referred_id = ?").bind(user.id).run();
        }

        await env.DB.prepare("INSERT INTO ai_logs (id, user_id, mode, model_used, prompt, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(crypto.randomUUID(), user ? user.id : "anonymous", "text", targetModel, promptText, reply, Date.now()).run();

        return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
WORKER_EOF

# 3. Update src/main.tsx[cite: 1]
echo "[3/4] Memperbarui antarmuka frontend src/main.tsx..."[cite: 1]
cat << 'MAIN_EOF' > src/main.tsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight, ChevronRight, FolderKanban, LayoutDashboard, Menu,
  Sparkles, LogOut, MessageSquareText, ImageIcon, Globe, CreditCard,
  Users, Terminal, Copy, Check, Fingerprint
} from "lucide-react";
import "./styles.css";

const textModels = [
  { id: "Comku", label: "AWD Standard (ChatGPT Style - Default)" },
  { id: "ag/gemini-3.8-flash-high", label: "AWD Pro Ultra (Flash High-Speed)" },
  { id: "ag/claude-opus-4-6-thinking", label: "AWD Deep Thinking (Opus)" },
  { id: "ag/claude-sonnet-4-6", label: "AWD Sonnet Agent" }
];

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [lang, setLang] = useState<string>("id");
  const [activeTab, setActiveTab] = useState("Overview");

  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Comku");
  const [aiResponse, setAiResponse] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<any>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setCurrentUser(data.user);
        loadAllData();
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  const loadAllData = () => {
    fetch("/api/projects").then(res => res.json()).then(data => setProjects(data.projects || [])).catch(() => {});
    fetch("/api/referrals").then(res => res.json()).then(setReferralData).catch(() => {});
    fetch("/api/developer/keys").then(res => res.json()).then(data => setApiKeys(data.keys || [])).catch(() => {});
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    setGeneratedImage("");

    try {
      if (mode === "text") {
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, model: selectedModel })
        });
        const data = await res.json();
        setAiResponse(data.reply || data.error || "Tidak ada respons diterima.");
      } else {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        if (data.imageUrl) setGeneratedImage(data.imageUrl);
        else setAiResponse(data.error || "Gagal membuat gambar.");
      }
      loadAllData();
    } catch (e: any) {
      setAiResponse("Network error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCheckout = async (planTier: string) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier })
      });
      const data = await res.json();
      if (data.success) {
        setActiveInvoice(data);
      } else {
        alert(data.error || "Gagal membuat invoice");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.key);
        setNewKeyName("");
        loadAllData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (checkingAuth) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f19", color: "#6366f1" }}>Memuat Lingkungan XAWD...</div>;
  }

  return (
    <div className="app">
      {activeInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid var(--accent-cyan)", borderRadius: "16px", padding: "24px", maxWidth: "450px", width: "100%" }}>
            <h3 style={{ color: "#fff", marginBottom: "8px" }}>Invoice Pembayaran {activeInvoice.planTier}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>ID Transaksi: <b>{activeInvoice.invoiceId}</b></p>
            <div style={{ margin: "20px 0", padding: "16px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "12px", border: "1px dashed var(--accent-primary)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Tagihan:</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#10b981" }}>Rp{activeInvoice.amountIdr.toLocaleString("id-ID")}</div>
              <p style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "8px" }}>{activeInvoice.paymentInstructions}</p>
            </div>
            <button onClick={() => setActiveInvoice(null)} style={{ width: "100%", padding: "10px", background: "var(--accent-gradient)", border: "none", color: "#fff", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>Tutup Invoice</button>
          </div>
        </div>
      )}

      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brandmark">X</div>
          <b>XAWD</b>
          <button className="icon close" onClick={() => setMobile(false)}>✕</button>
        </div>

        <nav className="nav">
          <button className={`navItem ${activeTab === "Overview" ? "active" : ""}`} onClick={() => { setActiveTab("Overview"); setMobile(false); }}>
            <LayoutDashboard size={18} /><span>Command Center</span>
          </button>
          <button className={`navItem ${activeTab === "Developer" ? "active" : ""}`} onClick={() => { setActiveTab("Developer"); setMobile(false); }}>
            <Terminal size={18} /><span>Developer API</span>
          </button>
          <button className={`navItem ${activeTab === "Projects" ? "active" : ""}`} onClick={() => { setActiveTab("Projects"); setMobile(false); }}>
            <FolderKanban size={18} /><span>Workspaces</span>
          </button>
          <button className={`navItem ${activeTab === "Referral" ? "active" : ""}`} onClick={() => { setActiveTab("Referral"); setMobile(false); }}>
            <Users size={18} /><span>Referral Hub</span>
          </button>
          <button className={`navItem ${activeTab === "Pricing" ? "active" : ""}`} onClick={() => { setActiveTab("Pricing"); setMobile(false); }}>
            <CreditCard size={18} /><span>Paket & Billing</span>
          </button>
        </nav>

        <div className="sidebarBottom">
          <div className="profile">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="avatar">{currentUser?.email?.[0]?.toUpperCase() || "A"}</div>
              <div><b>{currentUser?.email?.split("@")[0] || "Guest"}</b><small style={{ color: "#10b981", display: "block" }}>Online</small></div>
            </div>
            <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => window.location.reload())} style={{ background: "none", border: "none", color: "var(--text-muted)" }}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button className="icon menu" onClick={() => setMobile(true)} style={{ background: "none", border: "none", color: "#fff" }}><Menu size={20} /></button>
          <div className="crumb"><span>XAWD OS</span> <ChevronRight size={14} /> <span>{activeTab}</span></div>
          <div className="headerActions">
            <button onClick={() => setLang(lang === "en" ? "id" : "en")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", color: "#fff", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Globe size={14} /> {lang.toUpperCase()}
            </button>
          </div>
        </header>

        <div className="content">
          {activeTab === "Overview" && (
            <section className="aiPanel">
              <div className="aiTop">
                <div className="aiTitle">
                  <div className="aiIcon"><Sparkles size={18} /></div>
                  <div><b>Command Center</b><small>{mode === "text" ? selectedModel : "Flux 1.0 Diffusion"}</small></div>
                </div>
                <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.8)", padding: "4px", borderRadius: "10px" }}>
                  <button onClick={() => setMode("text")} style={{ background: mode === "text" ? "var(--accent-gradient)" : "transparent", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}><MessageSquareText size={14} /> Penalaran</button>
                  <button onClick={() => setMode("image")} style={{ background: mode === "image" ? "var(--accent-gradient)" : "transparent", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}><ImageIcon size={14} /> Visual Flux</button>
                </div>
              </div>

              {mode === "text" && (
                <div style={{ marginBottom: "12px" }}>
                  <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ width: "100%", background: "rgba(15, 23, 42, 0.6)", color: "#fff", border: "1px solid var(--border-subtle)", padding: "10px 14px", borderRadius: "10px", outline: "none", fontSize: "0.85rem" }}>
                    {textModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              )}

              <textarea id="command" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={mode === "text" ? "Perintah penalaran kode atau analisis arsitektur..." : "Deskripsi prompt visual gambar..."} />

              <div className="aiBottom">
                <button className="run" onClick={handleExecute} disabled={aiLoading}>{aiLoading ? "Memproses..." : "Eksekusi"} <ArrowUpRight size={16} /></button>
              </div>

              {aiResponse && <div style={{ marginTop: "18px", padding: "16px", background: "rgba(15, 23, 42, 0.8)", borderRadius: "12px", border: "1px solid var(--border-subtle)", whiteSpace: "pre-wrap" }}>{aiResponse}</div>}
              {generatedImage && <div style={{ marginTop: "18px", textAlign: "center" }}><img src={generatedImage} alt="Render" style={{ maxWidth: "100%", borderRadius: "12px" }} /></div>}
            </section>
          )}

          {activeTab === "Developer" && (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
              <h2>Developer API Keys</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>Gunakan kunci ini untuk memanggil endpoint api.xawd.my.id langsung dari aplikasi eksternal.</p>
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Nama Kunci (misal: Production Bot)" style={{ flex: 1, background: "#0b0f19", border: "1px solid var(--border-subtle)", color: "#fff", padding: "10px", borderRadius: "8px" }} />
                <button onClick={handleCreateApiKey} style={{ background: "var(--accent-primary)", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Buat Kunci Baru</button>
              </div>

              {generatedKey && (
                <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "10px", marginBottom: "20px" }}>
                  <b style={{ color: "#10b981" }}>Kunci Anda Berhasil Dibuat:</b>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <code style={{ background: "#0b0f19", padding: "8px", borderRadius: "6px", color: "#fff", flex: 1 }}>{generatedKey}</code>
                    <button onClick={() => copyToClipboard(generatedKey)} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><Copy size={16} /></button>
                  </div>
                  <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px" }}>Salin sekarang. Kunci tidak akan ditampilkan lagi demi keamanan.</small>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {apiKeys.map(k => (
                  <div key={k.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px" }}>
                    <div><b>{k.name}</b><code style={{ marginLeft: "12px", color: "var(--accent-cyan)" }}>{k.prefix}</code></div>
                    <span style={{ color: "#10b981", fontSize: "0.8rem" }}>Aktif</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Referral" && (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
              <h2>Referral & Anti-Sybil Hub</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>Undang developer lain. Kuota tambahan hanya dihitung jika akun terverifikasi aktif menjalankan eksekusi sistem.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px" }}>
                  <small style={{ color: "var(--text-muted)" }}>Total Diundang</small>
                  <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#fff" }}>{referralData?.stats?.totalInvited || 0}</div>
                </div>
                <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px" }}>
                  <small style={{ color: "var(--text-muted)" }}>Akun Terverifikasi</small>
                  <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#10b981" }}>{referralData?.stats?.verifiedAccounts || 0}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input readOnly value={referralData?.referralUrl || "Memuat tautan..."} style={{ flex: 1, background: "#0b0f19", border: "1px solid var(--border-subtle)", color: "#fff", padding: "10px", borderRadius: "8px" }} />
                <button onClick={() => copyToClipboard(referralData?.referralUrl)} style={{ background: "var(--accent-primary)", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  {copiedRef ? <Check size={16} /> : <Copy size={16} />} {copiedRef ? "Tersalin" : "Salin Link"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "Pricing" && (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
              <h2>Paket Langganan & Aktivasi Kuota</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>Pilih paket untuk mengaktifkan akses komputasi tanpa batas.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {[
                  { tier: "Plus", price: "Rp59.000/bln", desc: "Akses standard models, 250 visual flux, BYOK vault unthrottled." },
                  { tier: "Pro", price: "Rp149.000/bln", desc: "Prioritas queue 9router, Deep reasoning agent, developer API key." },
                  { tier: "Team", price: "Rp799.000/bln", desc: "Workspace bersama, 5 developer key, unlimited team seats." }
                ].map((p, idx) => (
                  <div key={idx} style={{ background: "rgba(15, 23, 42, 0.6)", padding: "20px", borderRadius: "14px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <b>{p.tier}</b>
                      <h3 style={{ margin: "10px 0", color: "var(--accent-cyan)" }}>{p.price}</h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>{p.desc}</p>
                    </div>
                    <button onClick={() => handleCheckout(p.tier)} disabled={checkoutLoading} style={{ width: "100%", padding: "10px", background: "var(--accent-primary)", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Beli Paket {p.tier}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Projects" && (
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "24px" }}>
              <h2>Workspaces & Kolaborasi Tim</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>Ruang kerja proyek terisolasi yang mendukung pembagian akses tim.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {projects.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px" }}>
                    <div><b>{p.name}</b><small style={{ display: "block", color: "var(--text-muted)" }}>ID: {p.id}</small></div>
                    <span style={{ color: "#10b981", fontSize: "0.8rem" }}>Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
MAIN_EOF

# 4. Build dan Push ke Cloudflare[cite: 1]
echo "[4/4] Membangun bundel dan mendeploy ke Cloudflare..."[cite: 1]
npm run build
git add -f dist/
git add src/worker.ts src/main.tsx
git commit -m "feat(termux-all-in-one): integrate developer keys, workspaces, billing, anti-sybil referrals, and full ui"
git push origin main

echo "=== [XAWD] DEPLOYMENT LENGKAP VIA TERMUX SELESAI! ==="[cite: 1]
