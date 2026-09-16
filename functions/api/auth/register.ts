export async function onRequestPost(context: any) {
  try {
    const { email, password } = await context.request.json() as any;
    if (!email || !password) {
      return Response.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    await context.env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, email, password, now, now).run();

    return Response.json({ success: true, message: "User registered", userId: id });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
