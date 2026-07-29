export async function onRequestGet({ request }) {
  const ids = new URL(request.url).searchParams.get("ids") || "";
  if (!/^\d+(,\d+)*$/.test(ids) || ids.split(",").length > 100) {
    return new Response("bad ids", { status: 400 });
  }
  const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids}&size=150x150&format=Png&isCircular=false`);
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
