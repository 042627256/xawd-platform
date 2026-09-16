export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Health Check
    if (url.pathname === "/api/health") {
      try {
        const result = await env.DB.prepare("SELECT 1 as alive").first();
        return Response.json({ status: "ok", db: result ? "connected" : "idle" });
      } catch (e: any) {
        return Response.json({ status: "error", message: e.message }, { status: 500 });
      }
    }

    // 2. Register Endpoint
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { email, password } = await request.json() as any;
        if (!email || !password) {
          return Response.json({ error: "Email dan password wajib diisi" }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = Date.now();

        await env.DB.prepare(
          "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(id, email, password, now, now).run();

        return Response.json({ success: true, message: "User registered", userId: id });
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 400 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
