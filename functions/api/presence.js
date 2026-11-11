export async function onRequestPost({ request }) {
  const body = await request.json().catch(() => null);
  const ids = body && Array.isArray(body.userIds) ? body.userIds.filter(n => Number.isInteger(n) && n > 0) : null;
  if (!ids || !ids.length || ids.length > 100) {
    return new Response("bad ids", { status: 400 });
  }
  const res = await fetch("https://presence.roblox.com/v1/presence/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds: ids })
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": "application/json" }
  });
}
