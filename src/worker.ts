export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      try {
        const result = await env.DB.prepare("SELECT 1 as alive").first();
        return new Response(JSON.stringify({ status: "ok", db: result ? "connected" : "idle" }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ status: "error", message: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        });
      }
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { email, password } = await request.json() as any;
        if (!email || !password) {
          return new Response(JSON.stringify({ error: "Email dan password wajib diisi" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const id = crypto.randomUUID();
        const now = Date.now();
        await env.DB.prepare(
          "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(id, email, password, now, now).run();

        return new Response(JSON.stringify({ success: true, message: "User registered", userId: id }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
