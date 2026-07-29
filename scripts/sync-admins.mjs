import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const roster = JSON.parse(readFileSync(join(root, "data", "group.json")));
const staff = JSON.parse(readFileSync(join(root, "data", "staff.json")));
const ids = [...new Set([...roster.members.map(m => m.id), ...staff.staff.map(s => s.id)])];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const admins = new Set();
let done = 0;

async function check(id) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(`https://accountinformation.roblox.com/v1/users/${id}/roblox-badges`);
      if (res.status === 429) { await sleep(20000); continue; }
      if (!res.ok) { await sleep(3000); continue; }
      const badges = await res.json();
      if (Array.isArray(badges) && badges.some(b => b.id === 1)) admins.add(id);
      return;
    } catch { await sleep(3000); }
  }
}

let idx = 0;
async function worker() {
  while (idx < ids.length) {
    const id = ids[idx++];
    await check(id);
    done++;
    if (done % 100 === 0) console.error(`${done}/${ids.length} checked, ${admins.size} admins`);
  }
}

await Promise.all(Array.from({ length: 6 }, worker));
writeFileSync(join(root, "data", "admins.json"), JSON.stringify([...admins]));
console.error(`wrote data/admins.json with ${admins.size} ids`);
