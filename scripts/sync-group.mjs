const GROUP = 1200769;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const rolesRes = await fetch(`https://groups.roblox.com/v1/groups/${GROUP}/roles`);
const roles = (await rolesRes.json()).roles.filter(r => r.rank >= 20);

const members = [];

for (const role of roles) {
  let cursor = "";
  while (true) {
    const url = `https://groups.roblox.com/v1/groups/${GROUP}/roles/${role.id}/users?limit=100&sortOrder=Asc${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`${role.name}: HTTP ${res.status}, retrying in 15s`);
      await sleep(15000);
      continue;
    }
    const body = await res.json();
    for (const u of body.data) {
      members.push({
        id: u.userId,
        username: u.username,
        displayName: u.displayName,
        groupRole: role.name,
        verified: u.hasVerifiedBadge
      });
    }
    console.error(`${role.name}: ${members.length} total`);
    if (!body.nextPageCursor) break;
    cursor = body.nextPageCursor;
    await sleep(600);
  }
}

const out = {
  updated: new Date().toISOString().slice(0, 10),
  group: GROUP,
  count: members.length,
  members
};

const { writeFileSync } = await import("fs");
const { fileURLToPath } = await import("url");
const { dirname, join } = await import("path");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
writeFileSync(join(root, "data", "group.json"), JSON.stringify(out));
console.error(`wrote data/group.json with ${members.length} members`);
