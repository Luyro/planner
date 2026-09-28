'use strict';
/* ====== НАСТРОЙКИ ИСТОЧНИКА (при необходимости правьте здесь) ====== */
const CFG = {
  url: 'https://bseu.by/schedule/',
  // Названия параметров — предположение; сверьте их в DevTools → Network при выборе группы на сайте
  params: { faculty: 'ФМк', form: 'Дневная', course: '3', group: '24ДММ-1' },
  proxies: [
    u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    u => 'https://corsproxy.io/?url=' + encodeURIComponent(u)
  ]
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let lessons = load('lessons', []);
let homework = load('homework', []);
let tab = load('tab', 'schedule');
let filter = 'all';
let syncMeta = load('syncMeta', null);

const DAYS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const BADGE = {
  'ЛК': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'ПЗ': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'ЛР': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
};

/* ---------- Тема ---------- */
function applyTheme() {
  const t = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', t === 'dark');
  $('meta[name=theme-color]').content = t === 'dark' ? '#0f172a' : '#f8fafc';
}
$('#themeBtn').onclick = () => {
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'light' : 'dark');
  applyTheme();
};

/* ---------- Вкладки ---------- */
function showTab(t) {
  tab = t; save('tab', t);
  $('#view-schedule').classList.toggle('hidden', t !== 'schedule');
  $('#view-homework').classList.toggle('hidden', t !== 'homework');
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
}
$$('.tab-btn').forEach(b => b.onclick = () => showTab(b.dataset.tab));

/* ---------- Недели и даты ---------- */
const mondayOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmt = d => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
const sameDay = (a, b) => a.toDateString() === b.toDateString();
function defaultSemStart() {
  const n = new Date();
  return new Date(n.getMonth() >= 7 ? n.getFullYear() : n.getFullYear() - 1, 8, 1).toISOString().slice(0, 10);
}
let semStart = localStorage.getItem('semStart') || defaultSemStart();
let weekMon = mondayOf(new Date());
const weekNo = () => Math.round((weekMon - mondayOf(new Date(semStart))) / 6048e5) + 1;

$('#prevWeek').onclick = () => { weekMon = addDays(weekMon, -7); renderSchedule(); };
$('#nextWeek').onclick = () => { weekMon = addDays(weekMon, 7); renderSchedule(); };
$('#todayWeek').onclick = () => { weekMon = mondayOf(new Date()); renderSchedule(); };
$('#weekLabel').onclick = () => {
  const v = prompt('Дата начала семестра (ГГГГ-ММ-ДД). По ней считается номер учебной недели:', semStart);
  if (v && !isNaN(new Date(v))) { semStart = v; localStorage.setItem('semStart', v); renderSchedule(); }
};

/* ---------- Расписание ---------- */
function renderSchedule() {
  const n = weekNo();
  $('#weekLabel').innerHTML = `<span class="block">${n >= 1 ? n + '-я неделя' : 'До начала семестра'}</span><span class="block text-xs font-normal text-slate-500 dark:text-slate-400">${fmt(weekMon)} – ${fmt(addDays(weekMon, 5))}</span>`;
  const now = new Date();
  $('#grid').innerHTML = [1, 2, 3, 4, 5, 6].map(d => {
    const date = addDays(weekMon, d - 1), isToday = sameDay(date, now);
    const items = lessons.filter(l => l.day === d && (!l.weeks || n < 1 || l.weeks.includes(n))).sort((a, b) => a.start.localeCompare(b.start));
    return `<div class="rounded-2xl p-3 bg-white dark:bg-slate-800 border ${isToday ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}">
      <div class="flex items-center justify-between mb-2 px-1">
        <h3 class="font-semibold">${DAYS[d]}, <span class="font-normal text-slate-500 dark:text-slate-400">${fmt(date)}</span></h3>
        ${isToday ? '<span class="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">Сегодня</span>' : ''}
      </div>
      <div class="space-y-2">
        ${items.length ? items.map(l => `
          <div class="rounded-xl p-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
            <button data-edit-lesson="${l.id}" class="block w-full text-left">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-slate-500 dark:text-slate-400">${esc(l.start)}–${esc(l.end)}</span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full ${BADGE[l.type]}">${l.type}</span>
              </div>
              <div class="font-medium mt-1">${esc(l.name)}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">${esc(l.teacher)}${l.teacher && l.room ? ' · ' : ''}${l.room ? 'ауд. ' + esc(l.room) : ''}</div>
            </button>
            <button data-hw-lesson="${l.id}" class="mt-2 text-xs px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">+ ДЗ</button>
          </div>`).join('') : '<p class="text-sm text-slate-400 px-1 pb-1">Пар нет</p>'}
      </div>
    </div>`;
  }).join('');
  $$('[data-edit-lesson]').forEach(b => b.onclick = () => openLesson(b.dataset.editLesson));
  $$('[data-hw-lesson]').forEach(b => b.onclick = () => {
    const l = lessons.find(x => x.id === b.dataset.hwLesson);
    openHw(null, { subject: l.name, type: l.type });
  });
}

const lessonDlg = $('#lessonDlg'), lessonForm = $('#lessonForm');
function openLesson(id) {
  const l = lessons.find(x => x.id === id);
  lessonForm.reset();
  lessonForm.id.value = l ? l.id : '';
  $('#lessonTitle').textContent = l ? 'Редактировать пару' : 'Новая пара';
  $('#lessonDel').classList.toggle('hidden', !l);
  if (l) for (const k of ['day', 'start', 'end', 'name', 'teacher', 'room', 'type']) lessonForm[k].value = l[k];
  else { const d = new Date().getDay(); lessonForm.day.value = d >= 1 && d <= 6 ? d : 1; }
  lessonDlg.showModal();
}
$('#addLesson').onclick = () => openLesson();
lessonForm.onsubmit = e => {
  e.preventDefault();
  const f = lessonForm, old = lessons.find(x => x.id === f.id.value);
  const data = { ...(old || {}), id: f.id.value || uid(), day: +f.day.value, start: f.start.value, end: f.end.value, name: f.name.value.trim(), teacher: f.teacher.value.trim(), room: f.room.value.trim(), type: f.type.value };
  if (old && old.src) data.src = 'manual'; // правка вручную защищает пару от перезаписи с сайта
  const i = lessons.findIndex(x => x.id === data.id);
  if (i >= 0) lessons[i] = data; else lessons.push(data);
  save('lessons', lessons); lessonDlg.close(); renderSchedule();
};
$('#lessonDel').onclick = () => {
  if (!confirm('Удалить эту пару?')) return;
  lessons = lessons.filter(x => x.id !== lessonForm.id.value);
  save('lessons', lessons); lessonDlg.close(); renderSchedule();
};

/* ---------- Парсинг bseu.by ---------- */
const DAYIDX = { 'понедельник': 1, 'вторник': 2, 'среда': 3, 'четверг': 4, 'пятница': 5, 'суббота': 6 };
const DAYRX = /(понедельник|вторник|среда|четверг|пятница|суббота)/i;
const TIMERX = /(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/;

function parseSchedule(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = [], seen = new Set();
  let day = 0;
  doc.querySelectorAll('tr').forEach(tr => {
    const cells = [...tr.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const text = cells.join(' | ');
    const dm = text.match(DAYRX);
    if (dm) day = DAYIDX[dm[1].toLowerCase()];
    const tm = text.match(TIMERX);
    if (!tm || !day) return;
    const p = v => v.padStart(2, '0');
    const low = text.toLowerCase();
    let rest = cells.map(c => c.replace(TIMERX, '').replace(DAYRX, '').trim()).filter(c => c.length > 1);
    const teacher = (text.match(/[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\./) || [''])[0];
    const room = (text.match(/(?:ауд\.?|каб\.?)\s*([\dА-Яа-яA-Za-z\-\/]+)/i) || [])[1] || '';
    const type = /(^|[^а-яё])(лк|лекц)/.test(low) ? 'ЛК' : /(^|[^а-яё])(лр|лаб)/.test(low) ? 'ЛР' : 'ПЗ';
    let name = rest.map(c => c.replace(teacher, '').replace(/(?:ауд\.?|каб\.?)\s*[\dА-Яа-яA-Za-z\-\/]+/i, '').replace(/(^|[\s(,])(лк|пз|лр)(?=[\s),.]|$)/gi, ' ').replace(/\s+/g, ' ').trim())
      .sort((a, b) => b.length - a.length)[0] || '';
    if (name.length < 2) return;
    let weeks;
    const wm = low.match(/([\d,\s\-–]+)\s*нед/);
    if (wm) {
      weeks = [];
      wm[1].split(',').forEach(part => {
        const r = part.split(/[-–]/).map(x => parseInt(x)).filter(x => !isNaN(x));
        if (r.length === 2) for (let i = r[0]; i <= r[1]; i++) weeks.push(i); else if (r.length === 1) weeks.push(r[0]);
      });
      if (!weeks.length) weeks = undefined;
    }
    const key = [day, tm[1], tm[2], name, room].join('|');
    if (seen.has(key)) return; seen.add(key);
    out.push({ id: uid(), day, start: p(tm[1]) + ':' + tm[2], end: p(tm[3]) + ':' + tm[4], name, teacher, room, type, weeks, src: 'site' });
  });
  return out;
}

async function fetchHtml(target) {
  let lastErr;
  for (const mk of CFG.proxies) {
    try {
      const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(mk(target), { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
      catch { return new TextDecoder('windows-1251').decode(buf); } // bseu.by отдаёт cp1251
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('no proxy');
}

function setStatus(msg, warn) {
  const s = $('#syncStatus');
  s.textContent = msg;
  s.className = 'text-xs ' + (warn ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400');
}
function statusFromMeta(prefix) {
  if (!syncMeta) return setStatus('Расписание с сайта ещё не загружалось', false);
  setStatus(`${prefix}Копия от ${new Date(syncMeta.ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`, !!prefix);
}

async function syncFromSite() {
  const btn = $('#syncBtn');
  btn.disabled = true; $('#spin').classList.remove('hidden'); $('#syncText').textContent = 'Загрузка…';
  try {
    const target = CFG.url + '?' + new URLSearchParams(CFG.params).toString();
    const parsed = parseSchedule(await fetchHtml(target));
    if (!parsed.length) throw new Error('Пары не найдены в ответе сайта');
    lessons = lessons.filter(l => l.src !== 'site').concat(parsed);
    syncMeta = { ts: Date.now(), count: parsed.length };
    save('lessons', lessons); save('syncMeta', syncMeta);
    renderSchedule(); renderHw();
    setStatus(`Обновлено: ${parsed.length} пар`, false);
  } catch (e) {
    console.warn('Sync failed:', e);
    statusFromMeta('Сайт недоступен или разметка не распознана. ');
  } finally {
    btn.disabled = false; $('#spin').classList.add('hidden'); $('#syncText').textContent = 'Обновить расписание с сайта';
  }
}
$('#syncBtn').onclick = syncFromSite;

/* ---------- Домашка ---------- */
function plural(n, a, b, c) { n = Math.abs(n) % 100; const k = n % 10; return n > 10 && n < 20 ? c : k > 1 && k < 5 ? b : k === 1 ? a : c; }
function timeLeft(due) {
  const ms = new Date(due) - Date.now(), abs = Math.abs(ms), m = Math.floor(abs / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  const txt = d >= 1 ? `${d} ${plural(d, 'день', 'дня', 'дней')}${h % 24 ? ' ' + (h % 24) + ' ч' : ''}` : h >= 1 ? `${h} ч ${m % 60} мин` : `${m} мин`;
  if (ms < 0) return { text: 'просрочено на ' + txt, cls: 'text-red-500' };
  return { text: 'осталось ' + txt, cls: ms < 864e5 ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400' };
}
const isHot = h => !h.done && new Date(h.due) - Date.now() < 2 * 864e5;
const CHECK = '<svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function renderHw() {
  $$('.f-btn').forEach(b => b.classList.toggle('active', b.dataset.f === filter));
  const list = homework
    .filter(h => filter === 'all' || (filter === 'hot' && isHot(h)) || (filter === 'done' && h.done))
    .sort((a, b) => (a.done - b.done) || (new Date(a.due) - new Date(b.due)));
  $('#hwList').innerHTML = list.length ? list.map(h => {
    const t = timeLeft(h.due);
    const due = new Date(h.due).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    return `<div class="flex gap-3 items-start rounded-2xl p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-opacity ${h.done ? 'opacity-60' : ''}">
      <button data-toggle="${h.id}" role="checkbox" aria-checked="${!!h.done}" aria-label="Сделано" class="mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 grid place-items-center transition-colors ${h.done ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-500 hover:border-blue-500'}">${h.done ? CHECK : ''}</button>
      <button data-edit-hw="${h.id}" class="flex-1 text-left min-w-0">
        <div class="flex items-center gap-2"><span class="font-medium ${h.done ? 'line-through' : ''}">${esc(h.subject)}</span>${h.type ? `<span class="text-xs px-2 py-0.5 rounded-full ${BADGE[h.type]}">${h.type}</span>` : ''}</div>
        <div class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line break-words ${h.done ? 'line-through' : ''}">${esc(h.text)}</div>
        <div class="text-xs mt-1 text-slate-500 dark:text-slate-400">до ${due} · <span class="${h.done ? '' : t.cls}">${h.done ? 'сделано' : t.text}</span></div>
      </button>
    </div>`;
  }).join('') : '<p class="text-slate-400 text-sm py-8 text-center">Здесь пока пусто</p>';
  $$('[data-toggle]').forEach(c => c.onclick = () => {
    const h = homework.find(x => x.id === c.dataset.toggle); h.done = h.done ? 0 : 1;
    save('homework', homework); renderHw();
  });
  $$('[data-edit-hw]').forEach(b => b.onclick = () => openHw(b.dataset.editHw));
}
$$('.f-btn').forEach(b => b.onclick = () => { filter = b.dataset.f; renderHw(); });

const hwDlg = $('#hwDlg'), hwForm = $('#hwForm');
function openHw(id, preset) {
  const h = homework.find(x => x.id === id);
  hwForm.reset();
  const subjects = [...new Set(lessons.map(l => l.name))].sort();
  const want = h ? h.subject : preset && preset.subject;
  if (want && !subjects.includes(want)) subjects.push(want);
  hwForm.subject.innerHTML = subjects.map(s => `<option>${esc(s)}</option>`).join('');
  $('#noSubj').classList.toggle('hidden', subjects.length > 0);
  hwForm.id.value = h ? h.id : '';
  $('#hwTitle').textContent = h ? 'Редактировать ДЗ' : 'Новое ДЗ';
  $('#hwDel').classList.toggle('hidden', !h);
  if (h) { hwForm.subject.value = h.subject; hwForm.type.value = h.type || ''; hwForm.text.value = h.text; hwForm.due.value = h.due; hwForm.done.value = h.done; }
  else if (preset) { hwForm.subject.value = preset.subject; hwForm.type.value = preset.type; }
  hwDlg.showModal();
}
$('#addHw').onclick = () => openHw();
hwForm.onsubmit = e => {
  e.preventDefault();
  const f = hwForm;
  if (!f.subject.value) return alert('Сначала добавьте пары в расписание.');
  const old = homework.find(x => x.id === f.id.value);
  const data = { id: f.id.value || uid(), subject: f.subject.value, type: f.type.value, text: f.text.value.trim(), due: f.due.value, done: +f.done.value, n: old && old.due === f.due.value ? old.n : {} };
  const i = homework.findIndex(x => x.id === data.id);
  if (i >= 0) homework[i] = data; else homework.push(data);
  save('homework', homework); hwDlg.close(); renderHw(); checkReminders();
};
$('#hwDel').onclick = () => {
  if (!confirm('Удалить это задание?')) return;
  homework = homework.filter(x => x.id !== hwForm.id.value);
  save('homework', homework); hwDlg.close(); renderHw();
};
$$('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());

/* ---------- Уведомления ---------- */
function updateNotifBtn() {
  const b = $('#notifBtn');
  if (!('Notification' in window)) { b.textContent = 'Уведомления недоступны'; b.disabled = true; b.classList.add('opacity-50'); return; }
  const on = Notification.permission === 'granted';
  b.textContent = on ? 'Напоминания включены' : Notification.permission === 'denied' ? 'Заблокировано в браузере' : 'Включить напоминания';
  b.className = 'text-sm px-3 py-1.5 rounded-lg ' + (on ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-600 text-white');
}
$('#notifBtn').onclick = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') return alert('Уведомления заблокированы. Разрешите их в настройках сайта в браузере.');
  await Notification.requestPermission();
  updateNotifBtn(); checkReminders();
};
async function notify(title, body) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification(title, { body, icon: 'icon-192.png', tag: title + body });
  } catch {}
  new Notification(title, { body });
}
function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  let changed = false;
  homework.forEach(h => {
    if (h.done) return;
    h.n = h.n || {};
    const ms = new Date(h.due) - Date.now();
    if (ms <= 864e5 && ms > 0 && !h.n.day) { h.n.day = 1; changed = true; notify('Дедлайн через 24 часа', `${h.subject}: ${h.text}`); }
    if (ms <= 0 && ms > -36e5 && !h.n.due) { h.n.due = 1; changed = true; notify('Срок сдачи наступил', `${h.subject}: ${h.text}`); }
  });
  if (changed) save('homework', homework);
}

/* ---------- Запуск ---------- */
applyTheme(); updateNotifBtn(); showTab(tab); renderSchedule(); renderHw(); checkReminders(); statusFromMeta('');
setInterval(() => { renderHw(); checkReminders(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderSchedule(); renderHw(); checkReminders(); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
