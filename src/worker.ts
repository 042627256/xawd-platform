const PRIMARY_KEYS = [
  "sk-6e4c5defb3de6300-twi7qt-24c79688",
  "sk-6e4c5defb3de6300-yzpgcc-d5eeb935"
];

const TARGET_BASE = "https://9rxawd.up.railway.app/v1";

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const requestedModel = (body.model || "").trim();
        const prompt = (body.prompt || "").trim();

        if (!requestedModel) {
          return json({ success: false, error: "Pilih model terlebih dahulu." }, 400);
        }

        const executionPlan = [
          requestedModel,
          "gh/gpt-4o-mini",
          "gh/gpt-4o"
        ];

        let finalReply = "";
        let finalModel = "";
        let detailedError = "";

        // Payload murni tanpa system instruction / memory
        const pureMessages = [
          { role: "user", content: prompt }
        ];

        for (const target of executionPlan) {
          for (const apiKey of PRIMARY_KEYS) {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 20000);

              const res = await fetch(`${TARGET_BASE}/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                  model: target,
                  messages: pureMessages,
                  temperature: 0.7
                }),
                signal: controller.signal
              });
              clearTimeout(timer);

              const text = await res.text();
              let parsed: any = null;
              try { parsed = JSON.parse(text); } catch (_) {}

              if (res.ok && parsed?.choices?.[0]?.message?.content) {
                finalReply = parsed.choices[0].message.content;
                finalModel = target;
                break;
              } else {
                const msg = parsed?.error?.message || text;
                detailedError = `[${target}] HTTP ${res.status}: ${msg}`;
              }
            } catch (e: any) {
              detailedError = `[${target}] Error: ${e.message}`;
            }
          }
          if (finalReply) break;
        }

        if (finalReply) {
          return json({ success: true, model: finalModel, reply: finalReply });
        } else {
          return json({ success: false, error: detailedError }, 500);
        }
      } catch (err: any) {
        return json({ success: false, error: err.message }, 400);
      }
    }

    return json({ message: "X AWD Core Engine Online (Clean Mode)" });
  }
};
