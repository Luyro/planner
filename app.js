'use strict';
/* =====================================================================
   РАСПИСАНИЕ НА СЕМЕСТР — сюда попадут ваши реальные данные
   day:    1 = Пн … 6 = Сб
   weeks:  [1,3,5] — только в эти недели (необязательно)
   parity: 'odd' (нечётные) | 'even' (чётные) — если пара чередуется (необязательно)
   без weeks и parity — пара идёт каждую неделю
   type:   'ЛК' | 'ПЗ' | 'ЛР'
   ===================================================================== */
const SEMESTER_START = '2026-09-01'; // дата 1-го учебного дня семестра (ГГГГ-ММ-ДД)
const WEEKS_COUNT = 18;
const SEMESTER_SCHEDULE = [
  // Пример формата (удалите или замените):
  // { day: 1, parity: 'odd',  start: '09:00', end: '10:20', name: 'Математика', type: 'ЛК', room: '305', teacher: 'Иванов И.И.' },
  // { day: 1, weeks: [2, 4],  start: '10:35', end: '11:55', name: 'Физика',     type: 'ЛР', room: '112', teacher: 'Петров П.П.' },
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let myLessons = load('lessons', []).filter(l => l.src !== 'site'); // пары, добавленные вручную
let homework = load('homework', []);
let tab = load('tab', 'schedule');
let filter = 'all';

const DAYS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const BCLS = { 'ЛК': 'b-lk', 'ПЗ': 'b-pz', 'ЛР': 'b-lr' };
const allLessons = () => SEMESTER_SCHEDULE.map((l, i) => ({ ...l, id: 's' + i, base: true })).concat(myLessons);
const matchWeek = (l, n) => l.weeks ? l.weeks.includes(n) : l.parity === 'odd' ? n % 2 === 1 : l.parity === 'even' ? n % 2 === 0 : true;

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

/* ---------- Недели ---------- */
const mondayOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmt = d => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
const semMon = mondayOf(new Date(SEMESTER_START));
const currentWeek = Math.min(WEEKS_COUNT, Math.max(1, Math.floor((mondayOf(new Date()) - semMon) / 6048e5) + 1));
let week = currentWeek;

$('#weekSel').innerHTML = Array.from({ length: WEEKS_COUNT }, (_, i) => `<option value="${i + 1}">Неделя ${i + 1}${i + 1 === currentWeek ? ' (текущая)' : ''}</option>`).join('');
$('#weekSel').onchange = e => { week = +e.target.value; renderSchedule(); };
$('#prevWeek').onclick = () => { if (week > 1) { week--; renderSchedule(); } };
$('#nextWeek').onclick = () => { if (week < WEEKS_COUNT) { week++; renderSchedule(); } };

/* ---------- Расписание ---------- */
function renderSchedule() {
  $('#weekSel').value = week;
  $('#prevWeek').disabled = week <= 1; $('#nextWeek').disabled = week >= WEEKS_COUNT;
  const mon = addDays(semMon, (week - 1) * 7), now = new Date(), lessons = allLessons();
  $('#grid').innerHTML = [1, 2, 3, 4, 5, 6].map(d => {
    const date = addDays(mon, d - 1), isToday = date.toDateString() === now.toDateString();
    const items = lessons.filter(l => l.day === d && matchWeek(l, week)).sort((a, b) => a.start.localeCompare(b.start));
    return `<div class="card rounded-2xl p-3 ${isToday ? 'today' : ''}">
      <div class="flex items-center justify-between mb-2 px-1">
        <h3 class="font-semibold">${DAYS[d]}, <span class="sub font-normal">${fmt(date)}</span></h3>
        ${isToday ? '<span class="text-xs px-2 py-0.5 rounded-full b-lk">Сегодня</span>' : ''}
      </div>
      <div class="space-y-2">
        ${items.length ? items.map(l => `
          <div class="inner rounded-xl p-3">
            <${l.base ? 'div' : 'button data-edit-lesson="' + l.id + '"'} class="block w-full text-left">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs sub">${esc(l.start)}–${esc(l.end)}</span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full ${BCLS[l.type] || 'b-pz'}">${esc(l.type)}</span>
              </div>
              <div class="font-semibold mt-1" style="color:var(--tx)">${esc(l.name)}</div>
              <div class="text-xs sub">${esc(l.teacher)}${l.teacher && l.room ? ' · ' : ''}${l.room ? 'ауд. ' + esc(l.room) : ''}</div>
            </${l.base ? 'div' : 'button'}>
            <button data-hw-lesson="${l.id}" class="btn2 mt-2 text-xs px-2 py-1 rounded-md">+ ДЗ</button>
          </div>`).join('') : '<p class="text-sm sub px-1 pb-1">Пар нет</p>'}
      </div>
    </div>`;
  }).join('');
  $$('[data-edit-lesson]').forEach(b => b.onclick = () => openLesson(b.dataset.editLesson));
  $$('[data-hw-lesson]').forEach(b => b.onclick = () => {
    const l = allLessons().find(x => x.id === b.dataset.hwLesson);
    openHw(null, { subject: l.name, type: l.type });
  });
}

const lessonDlg = $('#lessonDlg'), lessonForm = $('#lessonForm');
function openLesson(id) {
  const l = myLessons.find(x => x.id === id);
  lessonForm.reset();
  lessonForm.id.value = l ? l.id : '';
  $('#lessonTitle').textContent = l ? 'Редактировать пару' : 'Новая пара';
  $('#lessonDel').classList.toggle('hidden', !l);
  if (l) { for (const k of ['day', 'start', 'end', 'name', 'teacher', 'room', 'type']) lessonForm[k].value = l[k]; lessonForm.parity.value = l.parity || ''; }
  else { const d = new Date().getDay(); lessonForm.day.value = d >= 1 && d <= 6 ? d : 1; }
  lessonDlg.showModal();
}
$('#addLesson').onclick = () => openLesson();
lessonForm.onsubmit = e => {
  e.preventDefault();
  const f = lessonForm;
  const data = { id: f.id.value || uid(), day: +f.day.value, start: f.start.value, end: f.end.value, name: f.name.value.trim(), teacher: f.teacher.value.trim(), room: f.room.value.trim(), type: f.type.value, parity: f.parity.value || undefined };
  const i = myLessons.findIndex(x => x.id === data.id);
  if (i >= 0) myLessons[i] = data; else myLessons.push(data);
  save('lessons', myLessons); lessonDlg.close(); renderSchedule();
};
$('#lessonDel').onclick = () => {
  if (!confirm('Удалить эту пару?')) return;
  myLessons = myLessons.filter(x => x.id !== lessonForm.id.value);
  save('lessons', myLessons); lessonDlg.close(); renderSchedule();
};

/* ---------- Домашка ---------- */
function plural(n, a, b, c) { n = Math.abs(n) % 100; const k = n % 10; return n > 10 && n < 20 ? c : k > 1 && k < 5 ? b : k === 1 ? a : c; }
function timeLeft(due) {
  const ms = new Date(due) - Date.now(), abs = Math.abs(ms), m = Math.floor(abs / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  const txt = d >= 1 ? `${d} ${plural(d, 'день', 'дня', 'дней')}${h % 24 ? ' ' + (h % 24) + ' ч' : ''}` : h >= 1 ? `${h} ч ${m % 60} мин` : `${m} мин`;
  if (ms < 0) return { text: 'просрочено на ' + txt, color: '#f87171' };
  return { text: 'осталось ' + txt, color: ms < 864e5 ? '#fb923c' : 'var(--sub)' };
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
    return `<div class="card flex gap-3 items-start rounded-2xl p-3 transition-opacity" style="${h.done ? 'opacity:.55' : ''}">
      <button data-toggle="${h.id}" role="checkbox" aria-checked="${!!h.done}" aria-label="Сделано" class="chk ${h.done ? 'on' : ''} mt-0.5 w-6 h-6 shrink-0 rounded-full grid place-items-center">${h.done ? CHECK : ''}</button>
      <button data-edit-hw="${h.id}" class="flex-1 text-left min-w-0">
        <div class="flex items-center gap-2"><span class="font-semibold ${h.done ? 'line-through' : ''}">${esc(h.subject)}</span>${h.type ? `<span class="text-xs px-2 py-0.5 rounded-full ${BCLS[h.type]}">${h.type}</span>` : ''}</div>
        <div class="text-sm whitespace-pre-line break-words ${h.done ? 'line-through' : ''}" style="color:var(--tx)">${esc(h.text)}</div>
        <div class="text-xs mt-1 sub">до ${due} · <span style="${h.done ? '' : 'color:' + t.color}">${h.done ? 'сделано' : t.text}</span></div>
      </button>
    </div>`;
  }).join('') : '<p class="text-sm sub py-8 text-center">Здесь пока пусто</p>';
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
  const subjects = [...new Set(allLessons().map(l => l.name))].sort();
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
  if (!('Notification' in window)) { b.textContent = 'Уведомления недоступны'; b.disabled = true; b.style.opacity = .5; return; }
  const on = Notification.permission === 'granted';
  b.textContent = on ? 'Напоминания включены' : Notification.permission === 'denied' ? 'Заблокировано в браузере' : 'Включить напоминания';
  b.className = 'text-sm px-3 py-1.5 rounded-lg ' + (on ? 'btn2' : 'btn-main');
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
