export async function onRequestGet(context: any) {
  try {
    const result = await context.env.DB.prepare("SELECT 1 as alive").first();
    return Response.json({ status: "ok", db: result ? "connected" : "idle" });
  } catch (e: any) {
    return Response.json({ status: "error", message: e.message }, { status: 500 });
  }
}
