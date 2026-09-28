'use strict';
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

const DAYS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const BADGE = {
  'ЛК': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'ПЗ': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  'ЛР': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
};

/* ---------- Тема ---------- */
function applyTheme() {
  const t = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', t === 'dark');
  $('meta[name=theme-color]').content = t === 'dark' ? '#161618' : '#f7f7f5';
}
$('#themeBtn').onclick = () => {
  const dark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', dark ? 'light' : 'dark');
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

/* ---------- Расписание ---------- */
function renderSchedule() {
  const today = new Date().getDay();
  $('#grid').innerHTML = [1, 2, 3, 4, 5, 6].map(d => {
    const items = lessons.filter(l => l.day === d).sort((a, b) => a.start.localeCompare(b.start));
    const isToday = d === today;
    return `<div class="rounded-2xl p-3 bg-white dark:bg-neutral-900 border ${isToday ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200 dark:border-neutral-800'}">
      <div class="flex items-center justify-between mb-2 px-1">
        <h3 class="font-semibold">${DAYS[d]}</h3>
        ${isToday ? '<span class="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">Сегодня</span>' : ''}
      </div>
      <div class="space-y-2">
        ${items.length ? items.map(l => `
          <button data-edit-lesson="${l.id}" class="w-full text-left rounded-xl p-3 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-neutral-500 dark:text-neutral-400">${esc(l.start)}–${esc(l.end)}</span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full ${BADGE[l.type]}">${l.type}</span>
            </div>
            <div class="font-medium mt-1">${esc(l.name)}</div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400">${esc(l.teacher)}${l.teacher && l.room ? ' · ' : ''}${l.room ? 'ауд. ' + esc(l.room) : ''}</div>
          </button>`).join('') : '<p class="text-sm text-neutral-400 px-1 pb-1">Пар нет</p>'}
      </div>
    </div>`;
  }).join('');
  $$('[data-edit-lesson]').forEach(b => b.onclick = () => openLesson(b.dataset.editLesson));
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
  const f = lessonForm;
  const data = { id: f.id.value || uid(), day: +f.day.value, start: f.start.value, end: f.end.value, name: f.name.value.trim(), teacher: f.teacher.value.trim(), room: f.room.value.trim(), type: f.type.value };
  const i = lessons.findIndex(x => x.id === data.id);
  if (i >= 0) lessons[i] = data; else lessons.push(data);
  save('lessons', lessons); lessonDlg.close(); renderSchedule();
};
$('#lessonDel').onclick = () => {
  if (!confirm('Удалить эту пару?')) return;
  lessons = lessons.filter(x => x.id !== lessonForm.id.value);
  save('lessons', lessons); lessonDlg.close(); renderSchedule();
};

/* ---------- Домашка ---------- */
function timeLeft(due) {
  const ms = new Date(due) - Date.now();
  const abs = Math.abs(ms), m = Math.floor(abs / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  const txt = d >= 1 ? `${d} ${plural(d, 'день', 'дня', 'дней')}${h % 24 ? ' ' + (h % 24) + ' ч' : ''}` : h >= 1 ? `${h} ч ${m % 60} мин` : `${m} мин`;
  if (ms < 0) return { text: 'просрочено на ' + txt, cls: 'text-red-600', late: true };
  return { text: 'осталось ' + txt, cls: ms < 864e5 ? 'text-orange-600' : 'text-neutral-500 dark:text-neutral-400', late: false };
}
function plural(n, a, b, c) { n = Math.abs(n) % 100; const k = n % 10; return n > 10 && n < 20 ? c : k > 1 && k < 5 ? b : k === 1 ? a : c; }
const isHot = h => !h.done && new Date(h.due) - Date.now() < 2 * 864e5;

function renderHw() {
  $$('.f-btn').forEach(b => b.classList.toggle('active', b.dataset.f === filter));
  const list = homework
    .filter(h => filter === 'all' || (filter === 'hot' && isHot(h)) || (filter === 'done' && h.done))
    .sort((a, b) => (a.done - b.done) || (new Date(a.due) - new Date(b.due)));
  $('#hwList').innerHTML = list.length ? list.map(h => {
    const t = timeLeft(h.due);
    const due = new Date(h.due).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    return `<div class="flex gap-3 items-start rounded-2xl p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <input type="checkbox" data-toggle="${h.id}" ${h.done ? 'checked' : ''} class="mt-1 w-5 h-5 accent-blue-600" aria-label="Сделано">
      <button data-edit-hw="${h.id}" class="flex-1 text-left min-w-0">
        <div class="font-medium ${h.done ? 'line-through text-neutral-400' : ''}">${esc(h.subject)}</div>
        <div class="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line break-words ${h.done ? 'opacity-60' : ''}">${esc(h.text)}</div>
        <div class="text-xs mt-1 text-neutral-500 dark:text-neutral-400">до ${due} · <span class="${h.done ? '' : t.cls}">${h.done ? 'сделано' : t.text}</span></div>
      </button>
    </div>`;
  }).join('') : '<p class="text-neutral-400 text-sm py-8 text-center">Здесь пока пусто</p>';
  $$('[data-toggle]').forEach(c => c.onchange = () => {
    const h = homework.find(x => x.id === c.dataset.toggle); h.done = c.checked ? 1 : 0;
    save('homework', homework); renderHw();
  });
  $$('[data-edit-hw]').forEach(b => b.onclick = () => openHw(b.dataset.editHw));
}
$$('.f-btn').forEach(b => b.onclick = () => { filter = b.dataset.f; renderHw(); });

const hwDlg = $('#hwDlg'), hwForm = $('#hwForm');
function openHw(id) {
  const h = homework.find(x => x.id === id);
  hwForm.reset();
  const subjects = [...new Set(lessons.map(l => l.name))].sort();
  if (h && !subjects.includes(h.subject)) subjects.push(h.subject);
  hwForm.subject.innerHTML = subjects.map(s => `<option>${esc(s)}</option>`).join('');
  $('#noSubj').classList.toggle('hidden', subjects.length > 0);
  hwForm.id.value = h ? h.id : '';
  $('#hwTitle').textContent = h ? 'Редактировать ДЗ' : 'Новое ДЗ';
  $('#hwDel').classList.toggle('hidden', !h);
  if (h) { hwForm.subject.value = h.subject; hwForm.text.value = h.text; hwForm.due.value = h.due; hwForm.done.value = h.done; }
  hwDlg.showModal();
}
$('#addHw').onclick = () => openHw();
hwForm.onsubmit = e => {
  e.preventDefault();
  const f = hwForm;
  if (!f.subject.value) return alert('Сначала добавьте пары в расписание.');
  const old = homework.find(x => x.id === f.id.value);
  const data = { id: f.id.value || uid(), subject: f.subject.value, text: f.text.value.trim(), due: f.due.value, done: +f.done.value, n: old && old.due === f.due.value ? old.n : {} };
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
  b.className = 'text-sm px-3 py-1.5 rounded-lg ' + (on ? 'bg-neutral-200 dark:bg-neutral-800' : 'bg-blue-600 text-white hover:bg-blue-700');
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
applyTheme(); updateNotifBtn(); showTab(tab); renderSchedule(); renderHw(); checkReminders();
setInterval(() => { renderHw(); checkReminders(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderSchedule(); renderHw(); checkReminders(); } });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
