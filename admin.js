'use strict';
/* Codes-Admin: spricht nur mit den admin_*-Funktionen in Supabase. Die Sitzung (2 h) liegt im sessionStorage
   und ist beim Schließen des Tabs weg. Alle Prüfungen passieren auf dem Server. */
const CFG = window.ADMIN_CFG;
const COURSES = [["el-c","Einsatzleiter C-Dienst"],["el-b","Einsatzleiter B-Dienst"],["el-a","Einsatzleiter A-Dienst"],["Fernmeldung","Fernmeldedienst"],["wechsellader","Wechsellader"],["gefahrgut","Gefahrgut"],["dekonp","Dekontamination (Dekon-P)"],["hoehenrettung","Höhenrettung"],["kran","Feuerwehrkran"],["wasserrettung","Wasserrettung"],["taucher","Feuerwehrtaucher"],["notarzt","Notarzt"],["intensiv","Intensivpflege"],["verpflegungseinheit","Führer Verpflegungseinheit"],["verpflegungshelfer","Verpflegungshelfer"],["stemo","STEMO-Neurologie"],["mtra","Radiologie-Assistenz (MTRA)"],["lna","Leitender Notarzt"]];
const BUILDINGS = [["fire","Feuerwache"],["academy","Feuerwehr-Akademie"],["leitstelle","Leitstelle"]];
const EXTENSIONS = [["Feuerwache",[["rw","Rettungswache"],["wlf","Wechsellader-Stützpunkt"],["wasser","Wasserrettung"],["hoehe","Höhenrettung"],["gefahr","Gefahrgut"],["ruhe","Ruheräume"],["uebung","Übungsplatz"]]],
  ["Akademie",[["saal","Lehrsaal"],["sim","Simulationszentrum"],["hof","Übungshof"]]],["Leitstelle",[["ct","Calltaker-Platz"],["tna","Telenotarzt-Arbeitsplatz"]]]];
const name = (list, id) => (list.find(x => x[0] === id) || [id, id])[1];
const extName = id => { for (const [, l] of EXTENSIONS) { const x = l.find(e => e[0] === id); if (x) return x[1]; } return id; };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = n => Math.round(n).toLocaleString('de-DE');
const fmtDate = t => new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(t));

let token = null, expires = null, codes = [], editing = null;
try { const s = JSON.parse(sessionStorage.getItem('codes_admin') || 'null'); if (s && new Date(s.expires).getTime() > Date.now()) { token = s.token; expires = s.expires; } } catch (e) {}

async function rpc(fn, args) {
  const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, { method: 'POST', cache: 'no-store', referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json', apikey: CFG.anonKey, Authorization: `Bearer ${CFG.anonKey}` }, body: JSON.stringify(args || {}) });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error((data && (data.message || data.hint)) || `Fehler ${r.status}`);
  if (data && data.error === 'Nicht angemeldet') { logout(true); throw new Error('Sitzung abgelaufen, bitte neu anmelden'); }
  return data;
}
function toast(msg, bad) { const t = $('toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.add('hidden'), 3000); }

function show() {
  const on = !!token;
  $('login').classList.toggle('hidden', on); $('app').classList.toggle('hidden', !on); $('logout').classList.toggle('hidden', !on);
  $('sess').textContent = on ? `angemeldet bis ${fmtDate(expires)}` : '';
  if (on) load();
}
async function logout(silent) {
  const t = token; token = null; expires = null; try { sessionStorage.removeItem('codes_admin'); } catch (e) {}
  if (t && !silent) { try { await rpc('admin_logout', { p_token: t }); } catch (e) {} }
  show();
}
$('login-form').onsubmit = async e => {
  e.preventDefault(); $('login-err').textContent = '';
  try {
    const r = await rpc('admin_login', { p_password: $('pw').value });
    $('pw').value = '';
    if (!r || r.error) { $('login-err').textContent = (r && r.error) || 'Anmeldung fehlgeschlagen'; return; }
    token = r.token; expires = r.expires_at;
    try { sessionStorage.setItem('codes_admin', JSON.stringify({ token, expires })); } catch (e) {}
    show();
  } catch (err) { $('login-err').textContent = err.message; }
};
$('logout').onclick = () => logout(false);
setInterval(() => { if (token && new Date(expires).getTime() < Date.now()) { logout(true); toast('Sitzung abgelaufen', true); } }, 30000);

/* Belohnungen im Formular */
function rewardRow(r) {
  const div = document.createElement('div'); div.className = 'reward'; div.dataset.type = r.type;
  const opts = (list, sel) => list.map(([id, n]) => `<option value="${esc(id)}"${id === sel ? ' selected' : ''}>${esc(n)}</option>`).join('');
  let html = '';
  if (r.type === 'money') html = `<b>Geld</b><label class="fld"><span>Betrag (€)</span><input data-k="amount" type="number" min="1" max="100000000" step="1" value="${r.amount || 100000}" required></label>`;
  if (r.type === 'staff') html = `<b>Personal</b><label class="fld"><span>Anzahl</span><input data-k="count" type="number" min="1" max="50" value="${r.count || 5}" required></label>
    <label class="fld"><span>Ausbildung</span><select data-k="qual"><option value="">ohne</option>${opts(COURSES, r.qual)}</select></label>`;
  if (r.type === 'building') html = `<b>Gebäude-Gutschein</b><label class="fld"><span>Gebäude</span><select data-k="building">${opts(BUILDINGS, r.building)}</select></label>
    <label class="fld"><span>Anzahl</span><input data-k="count" type="number" min="1" max="5" value="${r.count || 1}" required></label>`;
  if (r.type === 'extension') html = `<b>Erweiterungs-Gutschein</b><label class="fld"><span>Erweiterung</span><select data-k="ext">${EXTENSIONS.map(([g, l]) => `<optgroup label="${g}">${opts(l, r.ext)}</optgroup>`).join('')}</select></label>
    <label class="fld"><span>Anzahl</span><input data-k="count" type="number" min="1" max="10" value="${r.count || 1}" required></label>`;
  div.innerHTML = html + `<button type="button" class="x" title="Entfernen" aria-label="Belohnung entfernen">×</button>`;
  div.querySelector('.x').onclick = () => div.remove();
  $('rewards').appendChild(div);
}
document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => rewardRow({ type: b.dataset.add }));
function readRewards() {
  return [...document.querySelectorAll('#rewards .reward')].map(d => {
    const o = { type: d.dataset.type };
    d.querySelectorAll('[data-k]').forEach(i => { o[i.dataset.k] = i.type === 'number' ? Number(i.value) : i.value; });
    return o;
  });
}
function resetForm() {
  editing = null; $('code-form').reset(); $('rewards').innerHTML = ''; $('f-active').checked = true; $('f-code').disabled = false;
  $('form-title').textContent = 'Neuer Code'; $('f-save').textContent = 'Code speichern'; $('f-cancel').classList.add('hidden'); $('form-err').textContent = '';
  rewardRow({ type: 'money' });
}
$('f-cancel').onclick = resetForm;
$('f-random').onclick = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(8); crypto.getRandomValues(b); $('f-code').value = [...b].map(x => a[x % a.length]).join(''); };
const toLocal = iso => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
function editCode(c) {
  resetForm(); editing = c.code; $('rewards').innerHTML = '';
  $('f-code').value = c.code; $('f-code').disabled = true; $('f-note').value = c.note || ''; $('f-exp').value = toLocal(c.expires_at);
  $('f-max').value = c.max_uses || ''; $('f-new').value = c.new_days || ''; $('f-active').checked = c.active; $('f-premium').checked = !!c.premium_only;
  c.rewards.forEach(rewardRow);
  $('form-title').textContent = `Code ${c.code} bearbeiten`; $('f-save').textContent = 'Änderungen speichern'; $('f-cancel').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
$('code-form').onsubmit = async e => {
  e.preventDefault(); $('form-err').textContent = '';
  const rewards = readRewards(); if (!rewards.length) { $('form-err').textContent = 'Mindestens eine Belohnung hinzufügen'; return; }
  const exp = $('f-exp').value;
  const p = { code: $('f-code').value.trim().toUpperCase(), note: $('f-note').value.trim(), expires_at: exp ? new Date(exp).toISOString() : '',
    max_uses: Number($('f-max').value) || 0, new_days: Number($('f-new').value) || 0, active: $('f-active').checked, premium_only: $('f-premium').checked, rewards };
  if (!editing && codes.some(c => c.code === p.code)) { $('form-err').textContent = `Code ${p.code} gibt es schon – unten auf „Bearbeiten“ klicken`; return; }
  try {
    const r = await rpc('admin_code_save', { p_token: token, p });
    if (!r || r.error) { $('form-err').textContent = (r && r.error) || 'Fehler'; return; }
    toast(`Code ${r.code} gespeichert`); resetForm(); load();
  } catch (err) { $('form-err').textContent = err.message; }
};

/* Liste */
function rewardText(r) {
  if (r.type === 'money') return `${fmt(r.amount)} €`;
  if (r.type === 'staff') return `${r.count} Personal${r.qual ? ' · ' + name(COURSES, r.qual) : ''}`;
  if (r.type === 'building') return `${r.count}× ${name(BUILDINGS, r.building)}`;
  if (r.type === 'extension') return `${r.count}× ${extName(r.ext)}`;
  return r.type;
}
function status(c) {
  if (c.premium_only && c.active) return statusBase(c) + ' <span class="tag prem">Premium</span>';
  return statusBase(c);
}
function statusBase(c) {
  if (!c.active) return '<span class="tag off">deaktiviert</span>';
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return '<span class="tag off">abgelaufen</span>';
  if (c.max_uses && c.uses >= c.max_uses) return '<span class="tag off">aufgebraucht</span>';
  return '<span class="tag on">aktiv</span>';
}
/* EP gutschreiben und Premium-Liste */
$('ep-form').onsubmit = async e => {
  e.preventDefault();
  const user = $('ep-user').value.trim(), amount = Math.trunc(Number($('ep-amount').value));
  if (!user || !amount) return;
  if (!confirm(`${amount > 0 ? amount + ' EP gutschreiben' : -amount + ' EP abziehen'}: ${user}?`)) return;
  try {
    const r = await rpc('admin_ep_grant', { p_token: token, p_username: user, p_amount: amount, p_note: $('ep-note').value.trim() });
    if (!r || r.error) { toast((r && r.error) || 'Fehler', true); return; }
    toast(`${user}: jetzt ${r.ep} EP`); $('ep-form').reset(); loadPremium();
  } catch (err) { toast(err.message, true); }
};
async function loadPremium() {
  try {
    const r = await rpc('admin_premium_list', { p_token: token }), list = (r && r.list) || [];
    $('prem').innerHTML = list.length ? list.map(x => { const on = x.premium_until && new Date(x.premium_until).getTime() > Date.now();
      return `<tr><td><b>${esc(x.name)}</b></td><td class="mono">${x.ep}</td>
        <td>${on ? `<span class="tag on">bis ${fmtDate(x.premium_until)}</span>${x.auto ? '' : ' <span class="hint">keine Verlängerung</span>'}` : (x.premium_until ? `<span class="tag off">abgelaufen</span>` : '<span class="hint">—</span>')}</td>
        <td class="mono">${x.discord_id ? esc(x.discord_id) + (on ? ' <span class="tag prem">VIP</span>' : '') : '<span class="hint">—</span>'}</td></tr>`; }).join('')
      : '<tr><td colspan="4" class="hint">Noch niemand.</td></tr>';
  } catch (err) { toast(err.message, true); }
}
$('prem-reload').onclick = loadPremium;
async function load() {
  loadPremium();
  try { const r = await rpc('admin_codes', { p_token: token }); codes = (r && r.codes) || []; render(); } catch (err) { toast(err.message, true); }
}
$('reload').onclick = load;
function render() {
  $('codes').innerHTML = codes.length ? codes.map((c, i) => `<tr>
      <td><b class="mono">${esc(c.code)}</b>${c.note ? `<div class="hint">${esc(c.note)}</div>` : ''}</td>
      <td>${c.rewards.map(r => `<div>${esc(rewardText(r))}</div>`).join('')}</td>
      <td>${c.expires_at ? 'bis ' + fmtDate(c.expires_at) : 'permanent'}${c.new_days ? `<div class="hint">Konten &lt; ${c.new_days} Tage</div>` : ''}</td>
      <td class="mono">${c.uses}${c.max_uses ? ' / ' + c.max_uses : ''}</td>
      <td>${status(c)}</td>
      <td class="acts"><button class="btn sm ghost" data-i="${i}" data-a="edit">Bearbeiten</button>
        <button class="btn sm ghost" data-i="${i}" data-a="toggle">${c.active ? 'Deaktivieren' : 'Aktivieren'}</button>
        <button class="btn sm ghost" data-i="${i}" data-a="who">Wer?</button>
        <button class="btn sm danger" data-i="${i}" data-a="del">Löschen</button></td></tr>`).join('')
    : '<tr><td colspan="6" class="hint">Noch keine Codes.</td></tr>';
  document.querySelectorAll('#codes [data-a]').forEach(b => b.onclick = () => act(codes[b.dataset.i], b.dataset.a));
}
async function act(c, a) {
  try {
    if (a === 'edit') return editCode(c);
    if (a === 'toggle') { await rpc('admin_code_active', { p_token: token, p_code: c.code, p_active: !c.active }); toast(`${c.code} ${c.active ? 'deaktiviert' : 'aktiviert'}`); return load(); }
    if (a === 'del') { if (!confirm(`Code ${c.code} endgültig löschen? Die Liste der Einlösungen geht verloren.`)) return; await rpc('admin_code_delete', { p_token: token, p_code: c.code }); toast(`${c.code} gelöscht`); return load(); }
    if (a === 'who') {
      const r = await rpc('admin_code_redemptions', { p_token: token, p_code: c.code }), box = $('redeemers');
      box.classList.remove('hidden');
      box.innerHTML = `<h3>Eingelöst: ${esc(c.code)} (${r.list.length})</h3>` + (r.list.length ? `<ul>${r.list.map(x => `<li><b>${esc(x.name)}</b> <span class="hint">${fmtDate(x.at)}</span></li>`).join('')}</ul>` : '<p class="hint">Noch niemand.</p>');
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) { toast(err.message, true); }
}
resetForm(); show();
