import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const roster = JSON.parse(readFileSync(join(root, "data", "group.json")));
const staff = JSON.parse(readFileSync(join(root, "data", "staff.json")));
const ids = [...new Set([...roster.members.map(m => m.id), ...staff.staff.map(s => s.id)])];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const avatars = {};

async function load(chunk) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${chunk.join(",")}&size=150x150&format=Png&isCircular=false`);
      if (res.status === 429) { await sleep(20000); continue; }
      if (!res.ok) { await sleep(3000); continue; }
      const body = await res.json();
      for (const t of body.data) {
        if (t.state === "Completed" && t.imageUrl) avatars[t.targetId] = t.imageUrl;
      }
      return;
    } catch { await sleep(3000); }
  }
}

for (let i = 0; i < ids.length; i += 100) {
  await load(ids.slice(i, i + 100));
  await sleep(500);
}

const count = Object.keys(avatars).length;
if (!count) {
  console.error("no avatars loaded keeping the old file");
  process.exit(1);
}
writeFileSync(join(root, "data", "avatars.json"), JSON.stringify(avatars));
console.error(`wrote data/avatars.json with ${count} of ${ids.length} avatars`);
