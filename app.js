const state = { members: [], query: "", shown: 100 };

const PAGE = 100;

const rows = document.getElementById("rows");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const more = document.getElementById("more");

const avatars = new Map();
const presence = new Map();
const pendingAvatars = new Set();
const pendingPresence = new Set();

const adminSvg = `<svg class="admin-badge" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M7.91703 2L2 24.083L24.083 30L30 7.91703L7.91703 2ZM18.2592 19.9135L12.0885 18.2592L13.7427 12.0885L19.916 13.7427L18.2592 19.9135Z" fill="currentColor"/></svg>`;

const verifiedSvg = `<svg class="verified-badge" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M7.71897 4.48022C8.00434 3.41518 9.09906 2.78315 10.1641 3.06852L27.5198 7.71897C28.5848 8.00434 29.2169 9.09906 28.9315 10.1641L24.281 27.5198C23.9957 28.5848 22.9009 29.2169 21.8359 28.9315L4.48022 24.281C3.41518 23.9957 2.78315 22.9009 3.06852 21.8359L7.71897 4.48022Z" fill="#335FFF"/><path d="M21.7071 13.7071C22.0976 13.3166 22.0976 12.6834 21.7071 12.2929C21.3166 11.9024 20.6834 11.9024 20.2929 12.2929L14 18.5858L11.7071 16.2929C11.3166 15.9024 10.6834 15.9024 10.2929 16.2929C9.90237 16.6834 9.90237 17.3166 10.2929 17.7071L13.2929 20.7071C13.6834 21.0976 14.3166 21.0976 14.7071 20.7071L21.7071 13.7071Z" fill="#fff"/></svg>`;

const premiumSvg = `<svg class="premium-badge" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><path d="M40 4H4v40a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h36a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H21v-4h19Zm-7 7H11v33H7V7h30v30H21v-4h12Zm-7 7h-8v26h-4V14h16v16h-9v-4h5Z" fill="currentColor" fill-rule="evenodd"/></svg>`;

const plusSvg = `<svg class="plus-badge" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M13.8555 2.5606C15.1824 1.81313 16.8176 1.81313 18.1445 2.5606L26.8555 7.46782C28.1824 8.21534 28.9999 9.59781 29 11.0928V20.9073C29 22.4024 28.1824 23.7847 26.8555 24.5323L18.1445 29.4395L17.8926 29.5704C16.6996 30.143 15.3004 30.143 14.1074 29.5704L13.8555 29.4395L11.0176 27.8409C10.3887 27.4864 10 26.8196 10 26.0977V12.001C10.0002 10.8967 10.8957 10.0012 12 10.001L20 10.0001C21.1044 10 21.9998 10.8957 22 12.0001V19.0001C22 20.1046 21.1046 21.0001 20 21.0001H16C15.4477 21.0001 15 20.5523 15 20.0001C15.0002 19.4479 15.4478 19.0001 16 19.0001H20V12.0001L12 12.001V26.0987L14.8369 27.6973C15.5545 28.1016 16.4455 28.1016 17.1631 27.6973L25.874 22.7891C26.5863 22.3877 27 21.6636 27 20.9073V11.0928C26.9999 10.3366 26.5863 9.61234 25.874 9.21099L17.1631 4.30278C16.4456 3.89864 15.5544 3.89864 14.8369 4.30278L6.12598 9.21099C5.41372 9.61234 5.00013 10.3366 5 11.0928V20.9073C5 21.6636 5.4137 22.3877 6.12598 22.7891L6.49023 22.9942C6.80495 23.1714 7 23.5051 7 23.8663C6.99984 24.6314 6.17549 25.1128 5.50879 24.7374L5.14453 24.5323C3.81763 23.7847 3 22.4024 3 20.9073V11.0928C3.00012 9.69126 3.71827 8.38846 4.90137 7.61528L5.14453 7.46782L13.8555 2.5606Z" fill="currentColor"/></svg>`;

const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'%3E%3Ccircle cx='21' cy='16' r='7' fill='%235a6069'/%3E%3Cellipse cx='21' cy='34' rx='12' ry='8' fill='%235a6069'/%3E%3C/svg%3E";

const PRESENCE_CLASS = { 1: "online", 2: "game", 3: "studio" };

function clean(s) {
  return (s || "").toLowerCase().replace(/&/g, "and").replace(/[–—-]/g, " ").replace(/\s+/g, " ").trim();
}

function presenceDot(id) {
  const cls = PRESENCE_CLASS[presence.get(id)];
  return cls ? `<span class="presence-dot ${cls}"></span>` : "";
}

function userCell(u) {
  const admin = u.admin ? adminSvg : "";
  const verified = u.verified ? verifiedSvg : "";
  const plus = u.plus ? plusSvg : "";
  const premium = u.premium ? premiumSvg : "";
  const hint = u.inGroup && !u.admin ? `<span class="hint" data-tip="administrator badge hidden on profile but still shows ingame">!</span>` : "";
  return `<div class="user-cell">
    <span class="avatar-wrap">
      <img class="avatar${u.banned ? " is-banned" : ""}" src="${avatars.get(u.id) || placeholder}" data-id="${u.id}" alt="" loading="lazy">
      ${presenceDot(u.id)}
    </span>
    <div class="user-names">
      <div class="user-display"><span class="name-text">${u.displayName}</span>${verified}${plus}${premium}${admin}${hint}</div>
      <div class="user-handle">@${u.username}</div>
    </div>
  </div>`;
}

function row(u) {
  const note = u.note ? `<div class="role-note">${u.note}</div>` : "";
  return `<tr>
    <td>${userCell(u)}</td>
    <td class="role-cell">${u.role}${note}</td>
    <td class="th-link"><a class="profile-link" href="https://www.roblox.com/users/${u.id}/profile" target="_blank" rel="noopener">profile</a></td>
  </tr>`;
}

function filtered() {
  const q = state.query.toLowerCase();
  if (!q) return state.members;
  return state.members.filter(u =>
    (u.username + " " + u.displayName + " " + u.role).toLowerCase().includes(q)
  );
}

function render() {
  const list = filtered();
  const slice = list.slice(0, state.shown);
  rows.innerHTML = slice.map(row).join("");
  const left = list.length - slice.length;
  more.hidden = left <= 0;
  more.textContent = `show ${Math.min(left, 200).toLocaleString()} more of ${left.toLocaleString()}`;
  empty.hidden = list.length > 0;
  loadAvatars(slice);
  loadPresence(slice);
}

function renderStats() {
  const group = state.members.filter(u => u.inGroup).length;
  document.getElementById("stat-tracked").textContent = state.members.length.toLocaleString();
  document.getElementById("stat-group").textContent = group.toLocaleString();
}

async function fetchThumbs(ids) {
  const res = await fetch(`/api/thumbs?ids=${ids.join(",")}`);
  if (!res.ok) return;
  const data = await res.json();
  for (const t of data.data) avatars.set(t.targetId, t.imageUrl);
}

function applyAvatars() {
  rows.querySelectorAll("img[data-id]").forEach(img => {
    const url = avatars.get(Number(img.dataset.id));
    if (url && img.src !== url) img.src = url;
  });
}

async function loadAvatars(slice) {
  const need = slice.map(u => u.id).filter(id => !avatars.has(id) && !pendingAvatars.has(id));
  if (!need.length) return;
  need.forEach(id => pendingAvatars.add(id));
  for (let i = 0; i < need.length; i += 100) {
    const chunk = need.slice(i, i + 100);
    try { await fetchThumbs(chunk); } catch {}
    chunk.forEach(id => pendingAvatars.delete(id));
    applyAvatars();
  }
}

async function loadPresence(slice) {
  const need = slice.map(u => u.id).filter(id => !presence.has(id) && !pendingPresence.has(id));
  if (!need.length) return;
  need.forEach(id => pendingPresence.add(id));
  for (let i = 0; i < need.length; i += 100) {
    const chunk = need.slice(i, i + 100);
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: chunk })
      });
      if (res.ok) {
        const data = await res.json();
        for (const p of data.userPresences) presence.set(p.userId, p.userPresenceType);
      }
    } catch {}
    chunk.forEach(id => pendingPresence.delete(id));
  }
  applyPresence();
}

function applyPresence() {
  rows.querySelectorAll(".avatar-wrap").forEach(wrap => {
    const id = Number(wrap.querySelector("img").dataset.id);
    const cls = PRESENCE_CLASS[presence.get(id)];
    const dot = wrap.querySelector(".presence-dot");
    if (cls && !dot) wrap.insertAdjacentHTML("beforeend", `<span class="presence-dot ${cls}"></span>`);
    else if (cls && dot) dot.className = `presence-dot ${cls}`;
    else if (!cls && dot) dot.remove();
  });
}

async function liveCheck(ids) {
  if (!ids.length) return;
  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: ids, excludeBannedUsers: true })
    });
    if (!res.ok) return;
    const data = await res.json();
    const alive = new Set(data.data.map(u => u.id));
    const names = new Map(data.data.map(u => [u.id, u]));
    for (const u of state.members) {
      if (!ids.includes(u.id)) continue;
      u.banned = !alive.has(u.id);
      const fresh = names.get(u.id);
      if (fresh) {
        u.username = fresh.name;
        u.displayName = fresh.displayName;
        u.verified = fresh.hasVerifiedBadge || u.verified;
      }
    }
    renderStats();
    render();
  } catch {}
}

async function init() {
  const [staffRes, groupRes, adminRes, plusRes] = await Promise.all([
    fetch("data/staff.json"),
    fetch("data/group.json"),
    fetch("data/admins.json").catch(() => null),
    fetch("data/plus.json").catch(() => null)
  ]);
  const staffData = await staffRes.json();
  const groupData = await groupRes.json();
  let adminIds = new Set();
  try { adminIds = new Set(await adminRes.json()); } catch {}
  let premiumIds = new Set();
  let plusIds = new Set();
  try {
    const plusData = await plusRes.json();
    premiumIds = new Set(plusData.premium);
    plusIds = new Set(plusData.plus);
  } catch {}

  const byId = new Map();
  for (const m of groupData.members) {
    byId.set(m.id, {
      id: m.id,
      username: m.username,
      displayName: m.displayName,
      role: clean(m.groupRole),
      verified: m.verified,
      admin: adminIds.has(m.id),
      premium: premiumIds.has(m.id),
      plus: plusIds.has(m.id),
      inGroup: true
    });
  }
  for (const s of staffData.staff) {
    const existing = byId.get(s.id);
    if (existing) {
      existing.role = clean(s.role);
      if (s.note) existing.note = clean(s.note);
      if (s.plus) existing.plus = true;
    } else {
      byId.set(s.id, {
        id: s.id,
        username: s.username,
        displayName: s.displayName,
        role: clean(s.role),
        note: s.note ? clean(s.note) : undefined,
        plus: !!s.plus || plusIds.has(s.id),
        premium: premiumIds.has(s.id),
        verified: false,
        admin: adminIds.has(s.id),
        inGroup: false
      });
    }
  }
  state.members = [...byId.values()];
  renderStats();
  render();
  liveCheck(staffData.staff.map(s => s.id));
}

search.addEventListener("input", e => {
  state.query = e.target.value;
  state.shown = PAGE;
  render();
});

more.addEventListener("click", () => {
  state.shown += 200;
  render();
});

init();
