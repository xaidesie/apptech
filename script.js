// Base API host (ตามที่คุณระบุ)
const API_HOST = "app-rfpiui4w3-xaides-projects.vercel.app";
document.getElementById('api-host').textContent = API_HOST;

const usersArea = document.getElementById('users-area');
const debug = document.getElementById('debug');
const createResult = document.getElementById('create-result');

function setDebug(title, obj) {
  debug.textContent = ${title}\n\n${JSON.stringify(obj, null, 2)};
}

// --- Helper for fetch with error handling ---
async function apiFetch(path, opts = {}) {
  const url = ${API_HOST}${path};
  try {
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        'Content-Type': 'application/json'
      }
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch(e) { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: null, error: String(err) };
  }
}

// --- GET all users and render ---
async function refreshUsers() {
  usersArea.textContent = "กำลังโหลด...";
  const r = await apiFetch('/api/users', { method: 'GET' });
  setDebug('GET /api/users', r);
  if (!r.ok) {
    usersArea.textContent = เกิดข้อผิดพลาด: ${r.status || r.error};
    return;
  }
  const users = r.data || [];
  if (users.length === 0) {
    usersArea.textContent = "ไม่มีผู้ใช้ในระบบ";
    return;
  }
  // render table-like
  const table = document.createElement('div');
  table.style.display = 'grid';
  table.style.gridTemplateColumns = '1fr 2fr 2fr 1fr';
  table.style.gap = '8px';
  table.style.alignItems = 'center';
  // header
  ['id','name','email','role'].forEach(h=>{
    const el = document.createElement('div');
    el.style.fontWeight = '700';
    el.style.fontSize = '0.95rem';
    el.textContent = h;
    table.appendChild(el);
  });
  users.forEach(u=>{
    table.appendChild(Object.assign(document.createElement('div'), { textContent: u.id }));
    table.appendChild(Object.assign(document.createElement('div'), { textContent: u.name }));
    table.appendChild(Object.assign(document.createElement('div'), { textContent: u.email }));
    table.appendChild(Object.assign(document.createElement('div'), { textContent: u.role || '-' }));
  });
  usersArea.innerHTML = '';
  usersArea.appendChild(table);
}

// --- Health check ---
async function checkHealth() {
  const r = await apiFetch('/health', { method: 'GET' });
  setDebug('GET /health', r);
  alert(r.ok ? Healthy: ${JSON.stringify(r.data)} : Health check failed: ${r.status || r.error});
}

// --- Create user (POST) ---
document.getElementById('create-form').addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const payload = {};
  for (const [k,v] of fd.entries()) {
    if (v && v.trim() !== '') payload[k] = v.trim();
  }
  const r = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  createResult.textContent = JSON.stringify(r, null, 2);
  setDebug('POST /api/users', r);
  if (r.ok) {
    // รีโหลดรายการ
    await refreshUsers();
    ev.target.reset();
  }
});

// --- GET by id ---
document.getElementById('btn-get').addEventListener('click', async ()=>{
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  const r = await apiFetch(/api/users/${encodeURIComponent(id)}, { method: 'GET' });
  setDebug(GET /api/users/${id}, r);
  if (r.ok) {
    alert(พบผู้ใช้: ${r.data.name} (${r.data.email}));
  } else {
    alert(ไม่พบหรือเกิดข้อผิดพลาด: ${r.status});
  }
});

// --- DELETE by id ---
document.getElementById('btn-delete').addEventListener('click', async ()=>{
  const id = document.getElementById('target-id').value.trim();
  if (!id) { alert('โปรดใส่ user id'); return; }
  if (!confirm(