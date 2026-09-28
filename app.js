'use strict';
const APP_VERSION = '5';
function banner(msg) {
  const d = document.createElement('div');
  d.style.cssText = 'margin:12px 0;padding:12px 14px;border-radius:12px;background:#7f1d1d;color:#fff;font-size:14px';
  d.textContent = msg;
  (document.querySelector('main') || document.body).prepend(d);
}
window.addEventListener('error', e => banner('Ошибка скрипта: ' + e.message));

function boot() {
/* =====================================================================
   РАСПИСАНИЕ НА СЕМЕСТР (из таблицы группы)
   Строка RAW: [день 1=Пн…6=Сб, пара A–E, недели, предмет, тип, преподаватель, к/ауд, подгруппа]
   Недели пишутся как в таблице: '2-14', '4,7-15', '3,5,7,9'
   ===================================================================== */
const SEMESTER_START = '2026-09-01'; // первый учебный день семестра — при необходимости поправьте
const WEEKS_COUNT = 16;
const SLOTS = { A: ['11:15', '12:35'], B: ['13:05', '14:25'], C: ['14:35', '15:55'], D: ['16:05', '17:25'], E: ['17:45', '19:05'] };
const TYPES = { K: 'ЛК', P: 'ПЗ', L: 'ЛР', Z: 'ЗЧ', N: 'ЗН' };
const SUBJ = { sm: 'Стратегический маркетинг', mu: 'Маркетинг услуг', kh: 'Кураторский час', ek: 'Эконометрика', imk: 'Интегрированные маркетинговые коммуникации', mi: 'Маркетинг инноваций', fsa: 'Функционально-стоимостный анализ', mia: 'Маркетинговые исследования и аналитика', lg: 'Логистика', fk: 'Физическая культура' };
const TEACH = { sv: 'Сверлов А.С.', sh: 'Шумских И.С.', me: 'Мельникова Л.А.', mk: 'Миксюк С.Ф.', st: 'Стасева А.А.', pu: 'Пушкин С.А.', le: 'Левчук К.А.', an: 'Анкинович Ю.Е.', tr: 'Трушкевич Н.Л.', sy: 'Синявская О.А.', pr: 'Протасеня В.С.', bu: 'Бутеня В.Е.', ko: 'Ковалева О.Л.', ar: 'Артёменко С.В.', vo: 'Волонтей А.В.', de: 'Демченко Е.В.', ve: 'Верниковская О.В.', ya: 'Яровская Е.С.', kp: 'Коптур Д.В.' };
const RAW = [
  // понедельник
  [1,'A','5','sm','K','sv','1/903'], [1,'A','6','mu','P','sh','1/1201'], [1,'A','7','kh','N','me',''],
  [1,'B','2-14','ek','K','mk','1/703'], [1,'B','15','kh','N','me',''],
  [1,'C','2','ek','K','mk','1/703'], [1,'C','3-7','ek','P','st','3/239'],
  [1,'C','8-16','ek','L','pu','2/200',1], [1,'C','8-16','ek','L','st','2/200а',2],
  [1,'D','3-10','imk','P','le','3/136а'], [1,'D','11-15','imk','L','le','2/218',2],
  [1,'D','11-14','mi','L','an','3/138',1], [1,'D','16','fsa','P','tr','3/136а'],
  // вторник
  [2,'B','3','kh','N','me','1/608'], [2,'B','6-14','mia','L','ar','3/226',1], [2,'B','6-14','sm','L','vo','2/300',2], [2,'B','15','sm','L','vo','2/103',2],
  [2,'C','1-2','fsa','K','sy','1/1203'], [2,'C','3','fsa','P','tr','3/242'], [2,'C','4,7-15','fsa','P','tr','3/136'], [2,'C','5-6','fsa','P','tr','3/140'],
  [2,'D','1-14','fsa','K','sy','1/1203'], [2,'E','1-2','mi','K','pr','1/1003'],
  // среда
  [3,'A','3,5,7,9','mi','K','pr','1/403'], [3,'A','4,6,8,10,12-13','imk','K','bu','1/403'],
  [3,'B','1,3-15','mia','K','ko','1/903'], [3,'B','2','mi','K','pr','3/136'],
  [3,'C','1-2','ek','K','mk','1/1203'], [3,'C','3-9','mi','P','an','1/708'], [3,'C','10-14','mu','P','sh','1/801'], [3,'C','16','fsa','Z','sy','3/136'],
  [3,'D','1','mi','K','pr','1/1203'], [3,'D','2','imk','K','bu','1/1203'], [3,'D','3-4,14','mu','P','sh','1/801'], [3,'D','5','mu','P','sh','1/706'],
  [3,'D','10','kh','N','me',''], [3,'D','15','lg','Z','ve','3/136'], [3,'D','16','fsa','Z','sy','3/136'],
  [3,'E','2','mia','K','ko','1/1203'], [3,'E','3','fsa','K','sy','1/903'], [3,'E','15','lg','Z','ve','3/136'],
  // четверг
  [4,'A','4','ek','K','mk','1/603'],
  [4,'B','1-13','mu','K','de','1/903'], [4,'B','14','mu','P','sh','1/801'], [4,'B','15','sm','L','vo','2/200а',1],
  [4,'C','1-2','imk','K','bu','1/1203'], [4,'C','3','ek','P','st','1/1105'], [4,'C','4-5','mu','P','sh','1/801'],
  [4,'C','6-14','mia','L','ar','3/226',2], [4,'C','6-14','sm','L','vo','2/200а',1], [4,'C','15','fsa','P','tr','1/804'],
  [4,'D','1-2','imk','K','bu','1/1203'], [4,'D','3,7','mu','P','sh','1/801'], [4,'D','8','ek','P','st','3/436'],
  [4,'E','3','sm','K','sv','1/403'],
  // пятница
  [5,'A','1-16','fk','P','kp',''],
  [5,'B','1','lg','K','ve','1/403'], [5,'B','2','sm','K','sv','1/403'], [5,'B','3-12','sm','P','vo','1/705'],
  [5,'B','14','imk','L','le','2/218',1], [5,'B','14','mi','L','an','3/138',2], [5,'B','15','imk','L','le','2/200а',1],
  [5,'C','1-2','lg','K','ve','1/403'], [5,'C','3-14','lg','P','ya','1/705'], [5,'C','15','mi','Z','pr','3/136'],
  [5,'D','3-11','lg','K','ve','1/703'], [5,'D','14','fsa','K','sy','1/403'], [5,'D','15','mi','Z','pr','3/136'],
  [5,'E','10','sm','K','sv','1/703'],
  // суббота
  [6,'B','1','sm','K','sv','1/403'], [6,'C','1,3-9,11-13','sm','K','sv','1/703'],
  [6,'D','3-9','mia','P','ar','2/320'], [6,'D','11-13','imk','L','le','2/200',1], [6,'D','11-13','mi','L','an','2/200а',2],
  [6,'E','9','ek','P','st','2/320']
];
const parseWeeks = s => s.split(',').flatMap(p => { const [a, b] = p.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a]; });
const DEMO_RAW = [ // демо-данные: показываются, только если RAW пуст или в адресе есть ?demo
  [1,'A','1-2','mu','K','sh','1/101'], [2,'B','1-2','ek','P','st','1/202'], [3,'C','1-2','sm','K','sv','1/303'],
  [4,'D','1-2','imk','L','le','2/218',1], [5,'A','1-2','lg','K','ve','1/403'], [6,'B','1-2','mi','P','an','2/320']
];
const useDemo = !RAW.length || /[?&]demo/.test(location.search);
const SEMESTER_SCHEDULE = (useDemo ? DEMO_RAW : RAW).map(([day, slot, w, s, t, te, room, sub]) => ({ day, start: SLOTS[slot][0], end: SLOTS[slot][1], weeks: parseWeeks(w), name: SUBJ[s], type: TYPES[t], teacher: TEACH[te], room, sub }));

const missing = [];
const $ = (s, r = document) => r.querySelector(s) || (missing.push(s), document.createElement('div')); // нет элемента — безвредная заглушка, скрипт не падает
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
const EMPTY = '<div class="inner rounded-xl p-4 text-center text-sm sub" style="border-style:dashed">На этот день занятий нет или расписание не заполнено</div>';
const BCLS = { 'ЛК': 'b-lk', 'ПЗ': 'b-pz', 'ЛР': 'b-lr', 'ЗЧ': 'b-zc', 'ЗН': 'b-zn' };
const allLessons = () => SEMESTER_SCHEDULE.map((l, i) => ({ ...l, id: 's' + i, base: true })).concat(myLessons);
let subSel = load('sub', '0');
const subOk = l => subSel === '0' || !l.sub || String(l.sub) === subSel;
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
  const v = $('#view-' + t); v.classList.remove('fadein'); void v.offsetWidth; v.classList.add('fadein');
}
$$('.tab-btn').forEach(b => b.onclick = () => showTab(b.dataset.tab));

/* ---------- Недели ---------- */
const mondayOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmt = d => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
const semMon = mondayOf(new Date(SEMESTER_START));
const currentWeek = Math.min(WEEKS_COUNT, Math.max(1, Math.floor((mondayOf(new Date()) - semMon) / 6048e5) + 1));
let week = Number.isFinite(currentWeek) ? currentWeek : 1;

$('#weekSel').innerHTML = Array.from({ length: WEEKS_COUNT }, (_, i) => `<option value="${i + 1}">Неделя ${i + 1}${i + 1 === currentWeek ? ' (текущая)' : ''}</option>`).join('');
$('#weekSel').onchange = e => { week = +e.target.value; renderSchedule(); };
$('#prevWeek').onclick = () => { if (week > 1) { week--; renderSchedule(); } };
$('#nextWeek').onclick = () => { if (week < WEEKS_COUNT) { week++; renderSchedule(); } };

$('#subSel').value = subSel;
$('#subSel').onchange = e => { subSel = e.target.value; save('sub', subSel); renderSchedule(); };
let lastKey = '';

/* ---------- Расписание ---------- */
function renderSchedule() {
  $('#weekSel').value = week;
  $('#prevWeek').disabled = week <= 1; $('#nextWeek').disabled = week >= WEEKS_COUNT;
  const mon = addDays(semMon, (week - 1) * 7), now = new Date(), lessons = allLessons();
  const key = week + '|' + subSel, anim = key !== lastKey; lastKey = key;
  $('#grid').className = 'grid gap-3 md:grid-cols-2 lg:grid-cols-3' + (anim ? ' enter' : '');
  $('#grid').innerHTML = [1, 2, 3, 4, 5, 6].map(d => { try {
    const date = addDays(mon, d - 1), isToday = date.toDateString() === now.toDateString();
    const items = lessons.filter(l => l.day === d && matchWeek(l, week) && subOk(l)).sort((a, b) => a.start.localeCompare(b.start));
    return `<div class="card rounded-2xl p-3 ${isToday ? 'today' : ''}" style="--i:${d}">
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
              <div class="text-xs sub">${esc(l.teacher)}${l.teacher && l.room ? ' · ' : ''}${l.room ? 'к/ауд ' + esc(l.room) : ''}${l.sub ? ' · подгр. ' + l.sub : ''}</div>
            </${l.base ? 'div' : 'button'}>
            <button data-hw-lesson="${l.id}" class="btn2 mt-2 text-xs px-2 py-1 rounded-md">+ ДЗ</button>
          </div>`).join('') : EMPTY}
      </div>
    </div>`;
  } catch (err) { console.error(err); return `<div class="card rounded-2xl p-3"><h3 class="font-semibold mb-2">${DAYS[d]}</h3>${EMPTY}</div>`; } }).join('');
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
    const nb = $(`[data-toggle="${h.id}"]`); if (h.done && nb) nb.classList.add('pop');
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
[applyTheme, updateNotifBtn, () => showTab(tab), renderSchedule, renderHw, checkReminders].forEach(f => { try { f(); } catch (e) { console.error(e); banner('Ошибка: ' + e.message); } });
const mv = document.querySelector('meta[name=app-version]');
if (!mv || mv.content !== APP_VERSION) banner('index.html и app.js от разных версий: загрузите оба файла на GitHub и обновите страницу (Ctrl+F5).');
else if (missing.length) banner('В index.html не найдены элементы: ' + [...new Set(missing)].join(', '));
setInterval(() => { renderHw(); checkReminders(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderSchedule(); renderHw(); checkReminders(); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);

}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
