import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const key = process.env.ROBLOX_API_KEY;
if (!key) {
  console.error("set ROBLOX_API_KEY first, create one at https://create.roblox.com/dashboard/credentials");
  process.exit(1);
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const roster = JSON.parse(readFileSync(join(root, "data", "group.json")));
const staff = JSON.parse(readFileSync(join(root, "data", "staff.json")));
const ids = [...new Set([...roster.members.map(m => m.id), ...staff.staff.map(s => s.id)])];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ckptPath = join(root, "data", "plus-checkpoint.json");
let ckpt = { checked: [], premium: [], plus: [] };
try { ckpt = JSON.parse(readFileSync(ckptPath)); } catch {}
const checked = new Set(ckpt.checked);
const premium = new Set(ckpt.premium);
const plus = new Set(ckpt.plus);
const fieldsSeen = new Set();
let done = 0;

function saveCkpt() {
  writeFileSync(ckptPath, JSON.stringify({ checked: [...checked], premium: [...premium], plus: [...plus] }));
}

async function check(id) {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const res = await fetch(`https://apis.roblox.com/cloud/v2/users/${id}`, {
        headers: { "x-api-key": key }
      });
      if (res.status === 429) { await sleep(30000); continue; }
      if (res.status === 404) return;
      if (!res.ok) { await sleep(5000); continue; }
      const user = await res.json();
      Object.keys(user).forEach(k => fieldsSeen.add(k));
      if (user.premium) premium.add(id);
      if (user.robloxPlus || user.plus || user.isRobloxPlus) plus.add(id);
      return;
    } catch { await sleep(5000); }
  }
}

const todo = ids.filter(id => !checked.has(id));
console.error(`${todo.length} to check (${checked.size} already done)`);
let idx = 0;
async function worker() {
  while (idx < todo.length) {
    const id = todo[idx++];
    await check(id);
    checked.add(id);
    done++;
    if (done % 100 === 0) {
      saveCkpt();
      console.error(`${checked.size}/${ids.length} checked, ${premium.size} premium, ${plus.size} plus`);
    }
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
saveCkpt();
writeFileSync(join(root, "data", "plus.json"), JSON.stringify({ premium: [...premium], plus: [...plus] }));
console.error(`wrote data/plus.json: ${premium.size} premium, ${plus.size} plus`);
console.error(`response fields seen: ${[...fieldsSeen].join(", ")}`);
