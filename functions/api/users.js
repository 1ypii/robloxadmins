export async function onRequestPost({ request }) {
  const body = await request.json().catch(() => null);
  const ids = body && Array.isArray(body.userIds) ? body.userIds.filter(n => Number.isInteger(n) && n > 0) : null;
  if (!ids || !ids.length || ids.length > 100) {
    return new Response("bad ids", { status: 400 });
  }
  const res = await fetch("https://users.roblox.com/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds: ids, excludeBannedUsers: body.excludeBannedUsers === true })
  });
  const headers = { "Content-Type": "application/json" };
  if (res.ok) headers["Cache-Control"] = "public, max-age=300";
  return new Response(res.body, { status: res.status, headers });
}
