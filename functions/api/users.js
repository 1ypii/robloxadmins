export async function onRequestPost({ request }) {
  const body = await request.text();
  if (body.length > 10000) return new Response("payload too large", { status: 413 });
  const res = await fetch("https://users.roblox.com/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  });
}
