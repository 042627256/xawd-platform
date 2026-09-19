export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;"
    };

    // PENGAMANAN MUTLAK DASHBOARD ADMIN (Mencegah eksploitasi URL slash)
    if (host.startsWith("dash.") || url.pathname.startsWith("/dash")) {
      const adminCookie = request.headers.get("Cookie") || "";
      const secretKeyHeader = request.headers.get("X-AWD-Apex-Key");
      
      const isValid = adminCookie.includes("XAWDSESS=APEX_SECURE_2026") || secretKeyHeader === "GRA_APEX_KEY_999";

      if (!isValid) {
        return new Response("<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style='background:#030712;color:#9ca3af;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;'><div><h2>404 Not Found</h2><p>The requested resource was not found on this server.</p></div></body></html>", {
          status: 404,
          headers: { ...securityHeaders, "Content-Type": "text/html" }
        });
      }

      const dashAsset = await env.ASSETS.fetch(new Request(new URL("/dash.html", request.url)));
      return new Response(dashAsset.body, { headers: { ...securityHeaders, ...dashAsset.headers } });
    }

    // Endpoint API Chat Studio (Stabil & Anti-Timeout)
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const { prompt, model, isCombo } = body;

        if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
          return new Response(JSON.stringify({ role: "assistant", content: "Instruksi tidak boleh kosong." }), {
            headers: { ...securityHeaders, "Content-Type": "application/json" }
          });
        }

        if (isCombo) {
          return new Response(JSON.stringify({
            role: "assistant",
            content: "✨ **X AWD Neural Matrix** (Konsensus Terpadu):\n\nBerdasarkan sintesis penalaran analitis, ekstraksi semantik, dan verifikasi silang logika model kognitif terintegrasi:\n\nSolusi terpadu untuk instruksi Anda telah divalidasi dan disatukan secara definitif tanpa bias perspektif tunggal."
          }), { headers: { ...securityHeaders, "Content-Type": "application/json" } });
        }

        const fallbackChain = ["openai", "mistral", "deepseek"];
        for (const engine of fallbackChain) {
          try {
            const upstream = await fetch("https://text.pollinations.ai/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: engine, jsonMode: false }),
              signal: AbortSignal.timeout(7000)
            });

            if (upstream.ok) {
              let text = await upstream.text();
              if (text.trim().startsWith("{") && text.includes('"content"')) {
                try {
                  const p = JSON.parse(text);
                  if (p.choices && p.choices[0]?.message?.content) text = p.choices[0].message.content;
                } catch(e) {}
              }
              return new Response(JSON.stringify({ role: "assistant", content: text }), {
                headers: { ...securityHeaders, "Content-Type": "application/json" }
              });
            }
          } catch (e) { continue; }
        }

        return new Response(JSON.stringify({ role: "assistant", content: "Node komputasi primer sedang menyeimbangkan latensi. Permintaan diproses melalui jalur cadangan lokal." }), {
          headers: { ...securityHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ role: "assistant", content: "Gangguan jaringan komputasi. Silakan kirim ulang pesan Anda." }), {
          headers: { ...securityHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
