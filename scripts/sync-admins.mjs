import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const roster = JSON.parse(readFileSync(join(root, "data", "group.json")));
const staff = JSON.parse(readFileSync(join(root, "data", "staff.json")));
const ids = [...new Set([...roster.members.map(m => m.id), ...staff.staff.map(s => s.id)])];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const limit = 1500;
const gap = 6100;
const adminsPath = join(root, "data", "admins.json");
const checkedPath = join(root, "data", "admins-checked.json");
let admins = new Set();
try { admins = new Set(JSON.parse(readFileSync(adminsPath))); } catch {}
let checked = {};
try { checked = JSON.parse(readFileSync(checkedPath)); } catch {}
const now = Math.floor(Date.now() / 1000);
let done = 0;

async function check(id) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(`https://accountinformation.roblox.com/v1/users/${id}/roblox-badges`);
      if (res.status === 429) { await sleep(20000); continue; }
      if (!res.ok) { await sleep(3000); continue; }
      const badges = await res.json();
      if (Array.isArray(badges) && badges.some(b => b.id === 1)) admins.add(id);
      else admins.delete(id);
      checked[id] = now;
      return;
    } catch { await sleep(3000); }
  }
}

const todo = [...ids].sort((a, b) => (checked[a] || 0) - (checked[b] || 0)).slice(0, limit);
for (const id of todo) {
  const started = Date.now();
  await check(id);
  done++;
  if (done % 100 === 0) console.error(`${done} of ${todo.length} checked ${admins.size} admins`);
  await sleep(Math.max(0, gap - (Date.now() - started)));
}

const kept = ids.filter(id => admins.has(id));
const keptChecked = {};
for (const id of ids) {
  if (checked[id]) keptChecked[id] = checked[id];
}
writeFileSync(adminsPath, JSON.stringify(kept));
writeFileSync(checkedPath, JSON.stringify(keptChecked));
console.error(`wrote data/admins.json with ${kept.length} ids`);
