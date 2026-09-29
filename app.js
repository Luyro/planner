'use strict';
const APP_VERSION = '7';
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
const SUBJ = { sm: 'Стратегический маркетинг', mu: 'Маркетинг услуг', kh: 'Кураторский час', ek: 'Эконометрика', imk: 'Интегрированные маркетинговые коммуникации', mi: 'Маркетинг инноваций', fsa: 'Функционально-стоимостный анализ', mia: 'Маркетинговые исследования и аналитика', lg: 'Логистика', fk: 'Физическая культура', dia: 'Деловой иностранный язык' };
const TEACH = { sv: 'Сверлов А.С.', sh: 'Шумских И.С.', me: 'Мельникова Л.А.', mk: 'Миксюк С.Ф.', st: 'Стасева А.А.', pu: 'Пушкин С.А.', le: 'Левчук К.А.', an: 'Анкинович Ю.Е.', tr: 'Трушкевич Н.Л.', sy: 'Синявская О.А.', pr: 'Протасеня В.С.', bu: 'Бутеня В.Е.', ko: 'Ковалева О.Л.', ar: 'Артёменко С.В.', vo: 'Волонтей А.В.', de: 'Демченко Е.В.', ve: 'Верниковская О.В.', ya: 'Яровская Е.С.', kp: 'Коптур Д.В.', lp: 'Лапина С.Н.', kv: 'Коротышевская В.Д.', ki: 'Кирильчик Т.К.', ch: 'Черник Н.Н.' };
const RAW_MM = [ // ===== группа 24ДММ-1 =====
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

/* =====================================================================
   ГРУППА 24ДМВ-1 — СЮДА ВСТАВЛЯЙТЕ/МЕНЯЙТЕ РАСПИСАНИЕ (массив RAW_MV)
   Строка: [день 1=Пн…6=Сб, пара A–E, недели, предмет, тип, преподаватель, к/ауд, подгруппа]
   Подгруппа: 1 или 2 (лабораторные), 'a1' или 'a2' (английский), без неё — вся группа
   ===================================================================== */
const RAW_MV = [
  // понедельник
  [1,'A','5','sm','K','sv','1/903'], [1,'B','2-14','ek','K','mk','1/703'], [1,'C','2','ek','K','mk','1/703'], [1,'C','3','kh','N','lp',''],
  [1,'C','4-14','lg','P','ya','1/901'], [1,'C','16','fsa','Z','sy','1/805'], [1,'D','4','mia','P','ar','1/1207'],
  [1,'D','6-14','mia','L','ar','3/226',1], [1,'D','6-14','sm','L','vo','2/308',2], [1,'D','15','lg','Z','ve','3/233'], [1,'D','16','fsa','Z','sy','1/805'],
  [1,'E','6','kh','N','lp',''], [1,'E','8','ek','P','st','2/215'], [1,'E','15','lg','Z','ve','3/233'],
  // вторник
  [2,'B','15','mu','P','sh','1/801'], [2,'B','16','mi','Z','pr','3/233'], [2,'C','1-2','fsa','K','sy','1/1203'], [2,'C','3-15','fsa','P','sy','3/441'],
  [2,'C','16','mi','Z','pr','3/233'], [2,'D','1-14','fsa','K','sy','1/1203'], [2,'E','1-2','mi','K','pr','1/1003'],
  [2,'E','4-9','mia','P','ar','1/1207'], [2,'E','10','fsa','P','sy','3/450'],
  // среда
  [3,'A','3,5,7,9','mi','K','pr','1/403'], [3,'A','4,6,8,10,12-13','imk','K','bu','1/403'], [3,'B','1,3-15','mia','K','ko','1/903'], [3,'B','2','mi','K','pr','3/136'],
  [3,'B','16','dia','P','ki','3/429','a1'], [3,'B','16','dia','P','ch','2/322','a2'],
  [3,'C','1-2','ek','K','mk','1/1203'], [3,'C','3-5','ek','P','st','2/322'], [3,'C','6-14','mia','L','ar','3/226',2], [3,'C','6-14','sm','L','vo','2/200',1],
  [3,'C','15','sm','L','vo','2/200',2], [3,'C','16','dia','P','ki','1/708','a1'], [3,'C','16','dia','P','ch','2/322','a2'],
  [3,'D','1','mi','K','pr','1/1203'], [3,'D','2','imk','K','bu','1/1203'], [3,'D','3-10','imk','P','kv','3/338'], [3,'D','11-15','imk','L','kv','2/200',2],
  [3,'D','11-14','mi','L','an','3/138',1], [3,'D','16','sm','L','vo','2/218',1], [3,'E','2','mia','K','ko','1/1203'], [3,'E','3','fsa','K','sy','1/903'],
  // четверг
  [4,'A','4','ek','K','mk','1/603'], [4,'A','12-13','imk','L','kv','2/200',1], [4,'B','1-13','mu','K','de','1/903'], [4,'B','14','kh','N','lp',''],
  [4,'B','16','dia','P','ki','2/313','a1'], [4,'B','16','dia','P','ch','2/322','a2'], [4,'C','1-2','imk','K','bu','1/1203'],
  [4,'C','3-16','dia','P','ki','2/313','a1'], [4,'C','3-16','dia','P','ch','2/322','a2'], [4,'D','1-2','imk','K','bu','1/1203'], [4,'D','3-9','mi','P','an','1/804'],
  [4,'D','10-11','imk','L','kv','3/226',1], [4,'D','10-13','mi','L','an','3/138',2], [4,'D','14','imk','L','kv','3/138',1],
  [4,'D','15','dia','P','ki','2/313','a1'], [4,'D','15','dia','P','ch','2/322','a2'], [4,'E','3','sm','K','sv','1/403'],
  // пятница
  [5,'A','1-16','fk','P','kp',''], [5,'B','1','lg','K','ve','1/403'], [5,'B','2','sm','K','sv','1/403'], [5,'B','6-7','ek','P','st','1/805'],
  [5,'B','8-16','ek','L','pu','2/306',1], [5,'B','8-16','ek','L','st','2/103',2], [5,'C','1-2','lg','K','ve','1/403'], [5,'C','3-16','mu','P','sh','1/801'],
  [5,'D','3-11','lg','K','ve','1/703'], [5,'D','12','kh','N','lp',''], [5,'D','14','fsa','K','sy','1/403'], [5,'D','15','fsa','P','sy','1/804'], [5,'E','10','sm','K','sv','1/703'],
  // суббота
  [6,'B','1','sm','K','sv','1/403'], [6,'B','13','lg','P','ya','2/320'], [6,'C','1,3-9,11-13','sm','K','sv','1/703'],
  [6,'D','3-9,11-13','sm','P','vo','1/701'], [6,'E','8,11','ek','P','st','1/701']
];
const DEMO_RAW = [ // демо-данные: показываются, только если RAW пуст или в адресе есть ?demo
  [1,'A','1-2','mu','K','sh','1/101'], [2,'B','1-2','ek','P','st','1/202'], [3,'C','1-2','sm','K','sv','1/303'],
  [4,'D','1-2','imk','L','le','2/218',1], [5,'A','1-2','lg','K','ve','1/403'], [6,'B','1-2','mi','P','an','2/320']
];
const useDemo = /[?&]demo/.test(location.search);
const build = raw => raw.map(([day, slot, w, s, t, te, room, sub]) => ({ day, start: SLOTS[slot][0], end: SLOTS[slot][1], weeks: parseWeeks(w), name: SUBJ[s], type: TYPES[t], teacher: TEACH[te], room, sub }));
const ALL_SCHEDULES = {
  '24ДММ-1': build(useDemo || !RAW_MM.length ? DEMO_RAW : RAW_MM),
  '24ДМВ-1': build(useDemo || !RAW_MV.length ? DEMO_RAW : RAW_MV)
};

const missing = [];
const $ = (s, r = document) => r.querySelector(s) || (missing.push(s), document.createElement('div')); // нет элемента — безвредная заглушка, скрипт не падает
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DEFAULT_GROUP = '24ДММ-1';
let group = load('group', DEFAULT_GROUP); if (!ALL_SCHEDULES[group]) group = DEFAULT_GROUP;
const key = k => group === DEFAULT_GROUP ? k : k + ':' + group; // данные каждой группы хранятся отдельно
let myLessons, homework; // свои пары и ДЗ текущей группы
function loadGroupData() { myLessons = load(key('lessons'), []).filter(l => l.src !== 'site'); homework = load(key('homework'), []); }
loadGroupData();
let tab = load('tab', 'schedule');
let filter = 'all';

const DAYS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const EMPTY = '<div class="inner rounded-xl p-4 text-center text-sm sub" style="border-style:dashed">На этот день занятий нет или расписание не заполнено</div>';
const BCLS = { 'ЛК': 'b-lk', 'ПЗ': 'b-pz', 'ЛР': 'b-lr', 'ЗЧ': 'b-zc', 'ЗН': 'b-zn' };
const allLessons = () => ALL_SCHEDULES[group].map((l, i) => ({ ...l, id: 's' + i, base: true })).concat(myLessons);
let subSel = load('sub', '0');
let engSel = load('eng', '0');
const isEng = l => l.sub && String(l.sub)[0] === 'a';
const subOk = l => !l.sub || (isEng(l) ? engSel === '0' || String(l.sub).slice(1) === engSel : subSel === '0' || String(l.sub) === subSel);
const subLabel = s => String(s)[0] === 'a' ? 'англ. ' + String(s).slice(1) : 'подгр. ' + s;
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
$('#engSel').value = engSel;
$('#engSel').onchange = e => { engSel = e.target.value; save('eng', engSel); renderSchedule(); };
const syncEng = () => { $('#engSel').hidden = !ALL_SCHEDULES[group].some(isEng); };
const gs = $('#groupSel');
gs.innerHTML = Object.keys(ALL_SCHEDULES).map(g => `<option>${g}</option>`).join(''); gs.value = group;
gs.onchange = e => { group = e.target.value; save('group', group); loadGroupData(); lastKey = ''; syncEng(); renderSchedule(); renderHw(); };
syncEng();

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
    return `<div class="card rounded-md shadow-xs p-3 ${isToday ? 'today' : ''}" style="--i:${d}">
      <div class="flex items-center justify-between mb-2 px-1">
        <h3 class="font-semibold">${DAYS[d]}, <span class="sub font-normal">${fmt(date)}</span></h3>
        ${isToday ? '<span class="text-xs px-2 py-0.5 rounded-full b-lk">Сегодня</span>' : ''}
      </div>
      <div class="space-y-2">
        ${items.length ? items.map(l => `
          <div class="inner rounded-md p-3">
            <${l.base ? 'div' : 'button data-edit-lesson="' + l.id + '"'} class="block w-full text-left">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs sub">${esc(l.start)}–${esc(l.end)}</span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full ${BCLS[l.type] || 'b-pz'}">${esc(l.type)}</span>
              </div>
              <div class="font-semibold mt-1" style="color:var(--tx)">${esc(l.name)}</div>
              <div class="text-xs sub">${esc(l.teacher)}${l.teacher && l.room ? ' · ' : ''}${l.room ? 'к/ауд ' + esc(l.room) : ''}${l.sub ? ' · ' + subLabel(l.sub) : ''}</div>
            </${l.base ? 'div' : 'button'}>
            <button data-hw-lesson="${l.id}" data-date="${date.getTime()}" class="btn2 mt-2 text-xs px-2 py-1 rounded-md">+ ДЗ</button>
          </div>`).join('') : EMPTY}
      </div>
    </div>`;
  } catch (err) { console.error(err); return `<div class="card rounded-md shadow-xs p-3"><h3 class="font-semibold mb-2">${DAYS[d]}</h3>${EMPTY}</div>`; } }).join('');
  $$('[data-edit-lesson]').forEach(b => b.onclick = () => openLesson(b.dataset.editLesson));
  $$('[data-hw-lesson]').forEach(b => b.onclick = () => {
    const l = allLessons().find(x => x.id === b.dataset.hwLesson);
    const [hh, mm] = l.start.split(':').map(Number), from = new Date(+b.dataset.date); from.setHours(hh, mm, 0, 0);
    openHw(null, { subject: l.name, type: l.type, from });
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
  save(key('lessons'), myLessons); lessonDlg.close(); renderSchedule();
};
$('#lessonDel').onclick = () => {
  if (!confirm('Удалить эту пару?')) return;
  myLessons = myLessons.filter(x => x.id !== lessonForm.id.value);
  save(key('lessons'), myLessons); lessonDlg.close(); renderSchedule();
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

let dragId = null, suppressClick = false;
const CHECK_S = CHECK.replace('w-4 h-4', 'w-3 h-3');
const GRIP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
function urgency(h) {
  if (h.done) return ['kb-gray', 'Сделано'];
  const ms = new Date(h.due) - Date.now();
  return ms < 0 ? ['kb-red', 'Просрочено'] : ms < 1728e5 ? ['kb-amber', 'Горит'] : ['kb-blue', 'В срок'];
}
// Канбан-доска: две колонки, карточки перетаскиваются между ними (меняется статус)
function renderHw() {
  if (dragId) return;
  $$('.f-btn').forEach(b => b.classList.toggle('active', b.dataset.f === filter));
  const vis = homework.filter(h => filter === 'all' || (filter === 'hot' && isHot(h)) || (filter === 'done' && h.done));
  const byDue = (x, y) => new Date(x.due) - new Date(y.due);
  const cardHtml = h => {
    const t = timeLeft(h.due), [uc, ut] = urgency(h);
    const due = new Date(h.due).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `<div class="kcard inner rounded-md shadow-xs" data-id="${h.id}" tabindex="0" style="${h.done ? 'opacity:.55' : ''}">
      <div class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <button data-toggle="${h.id}" role="checkbox" aria-checked="${!!h.done}" aria-label="Сделано" class="chk ${h.done ? 'on' : ''} w-5 h-5 shrink-0 rounded-full grid place-items-center">${h.done ? CHECK_S : ''}</button>
            <span class="clamp1 font-medium text-sm ${h.done ? 'line-through' : ''}">${esc(h.subject)}</span>
          </div>
          <span class="kb ${uc} shrink-0">${ut}</span>
        </div>
        <div class="clamp2 text-sm break-words ${h.done ? 'line-through' : ''}" style="color:var(--tx)">${esc(h.text)}</div>
        <div class="text-xs sub tabular-nums">до ${due}${h.done ? '' : ` · <span style="color:${t.color}">${t.text}</span>`}</div>
        <div class="flex items-center justify-between gap-2 text-xs sub">
          <div class="flex items-center gap-1.5 flex-wrap min-w-0">${h.type ? `<span class="kb-type ${BCLS[h.type]}">${h.type}</span>` : ''}${h.done ? '' : `<span>${remLabel(h)}</span>`}</div>
          <span class="kgrip" title="Перетащить" aria-hidden="true">${GRIP}</span>
        </div>
      </div>
    </div>`;
  };
  const colHtml = (id, title, items, hint) => `<div class="kcol card shadow-xs" data-col="${id}">
      <div class="flex items-center gap-2.5 mb-2.5"><span class="font-semibold text-sm">${title}</span><span class="kb-count">${items.length}</span></div>
      <div class="kdrop">${items.length ? items.map(cardHtml).join('') : `<div class="kempty">${hint}</div>`}</div>
    </div>`;
  $('#hwList').innerHTML =
    colHtml('todo', 'В процессе', vis.filter(h => !h.done).sort(byDue), 'Нет задач в работе') +
    colHtml('done', 'Сделано', vis.filter(h => h.done).sort(byDue), 'Перетащите сюда выполненное');
  $$('[data-toggle]').forEach(c => c.onclick = e => {
    e.stopPropagation();
    const h = homework.find(x => x.id === c.dataset.toggle); h.done = h.done ? 0 : 1;
    save(key('homework'), homework); renderHw();
  });
  $$('.kcard').forEach(bindCard);
}
function bindCard(card) {
  const id = card.dataset.id;
  card.onclick = e => { if (suppressClick || e.target.closest('[data-toggle]')) return; openHw(id); };
  card.onkeydown = e => { if (e.key === 'Enter' && e.target === card) openHw(id); };
  card.onpointerdown = e => {
    if (e.button > 0 || e.target.closest('[data-toggle]')) return;
    if (e.pointerType !== 'mouse' && !e.target.closest('.kgrip')) return; // на телефоне тянем за ручку ⋮⋮, чтобы не мешать прокрутке
    const sx = e.clientX, sy = e.clientY;
    let ghost = null, over = null;
    const move = ev => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10) return;
        const r = card.getBoundingClientRect();
        ghost = card.cloneNode(true); ghost.classList.add('kghost');
        ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;pointer-events:none;z-index:60;opacity:.95`;
        document.body.appendChild(ghost); card.style.opacity = '.4'; dragId = id;
      }
      ghost.style.transform = `translate(${ev.clientX - sx}px,${ev.clientY - sy}px) rotate(1.5deg)`;
      const col = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-col]');
      if (col !== over) { over?.classList.remove('drop'); over = col; over?.classList.add('drop'); }
    };
    const end = (ev, cancelled) => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel);
      if (!ghost) return; // это обычный клик
      ghost.remove(); over?.classList.remove('drop'); dragId = null;
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 50);
      const h = homework.find(x => x.id === id), done = over && over.dataset.col === 'done' ? 1 : 0;
      if (!cancelled && over && h.done !== done) { h.done = done; save(key('homework'), homework); }
      renderHw();
    };
    const up = ev => end(ev, false), cancel = ev => end(ev, true);
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
  };
}
$$('.f-btn').forEach(b => b.onclick = () => { filter = b.dataset.f; renderHw(); });

const hwDlg = $('#hwDlg'), hwForm = $('#hwForm');
const pad = n => String(n).padStart(2, '0');
const toLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtFull = d => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
let hwFrom = new Date(), hwKeep = '';

// Ближайшие занятия вперёд по семестру с тем же предметом и тем же типом (ЛК/ПЗ/ЛР)
function nextLessons(subject, type, from, count = 2) {
  const out = [], seen = new Set(), list = allLessons().filter(l => l.name === subject && (!type || l.type === type) && subOk(l));
  for (let w = 1; w <= WEEKS_COUNT; w++) list.forEach(l => {
    if (!matchWeek(l, w)) return;
    const [hh, mm] = l.start.split(':').map(Number), d = addDays(semMon, (w - 1) * 7 + l.day - 1);
    d.setHours(hh, mm, 0, 0);
    if (d > from && !seen.has(+d)) { seen.add(+d); out.push(d); }
  });
  return out.sort((x, y) => x - y).slice(0, count);
}
function toggleDue() { const m = $('#dueSel').value === 'manual'; $('#dueWrap').classList.toggle('hidden', !m); $('#dueInput').required = m; }
function toggleRem() { const m = $('#remSel').value === 'custom'; $('#remWrap').classList.toggle('hidden', !m); $('#remAt').required = m; }
function refreshDue() {
  const opts = [];
  if (hwKeep) opts.push([hwKeep, 'Текущий срок: ' + fmtFull(new Date(hwKeep))]);
  nextLessons(hwForm.subject.value, hwForm.type.value, hwFrom).forEach((d, i) =>
    opts.push([toLocal(d), (i ? 'Следующее занятие: ' : 'Ближайшее занятие: ') + fmtFull(d)]));
  opts.push(['manual', 'Выбрать свою дату и время вручную']);
  $('#dueSel').innerHTML = opts.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('');
  toggleDue();
}
hwForm.subject.onchange = hwForm.type.onchange = refreshDue;
$('#dueSel').onchange = toggleDue;
$('#remSel').onchange = toggleRem;

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
  $('#remSel').value = h ? (h.rem || 'd1') : 'd1';
  $('#remAt').value = h && h.remAt || '';
  if (h) { hwForm.subject.value = h.subject; hwForm.type.value = h.type || ''; hwForm.text.value = h.text; hwForm.done.value = h.done; }
  else if (preset) { hwForm.subject.value = preset.subject; hwForm.type.value = preset.type; }
  const now = new Date();
  hwFrom = preset && preset.from > now ? preset.from : now;
  hwKeep = h ? h.due : '';
  refreshDue();
  $('#dueInput').value = h ? h.due : '';
  toggleRem(); hwDlg.showModal();
}
$('#addHw').onclick = () => openHw();
hwForm.onsubmit = e => {
  e.preventDefault();
  const f = hwForm;
  if (!f.subject.value) return alert('Сначала добавьте пары в расписание.');
  const due = $('#dueSel').value === 'manual' ? $('#dueInput').value : $('#dueSel').value;
  if (!due) return alert('Укажите срок сдачи.');
  const rem = $('#remSel').value, remAt = rem === 'custom' ? $('#remAt').value : '';
  if (rem === 'custom' && !remAt) return alert('Укажите дату и время напоминания.');
  const old = homework.find(x => x.id === f.id.value);
  const same = old && old.due === due && (old.rem || 'd1') === rem && (old.remAt || '') === remAt;
  const data = { id: f.id.value || uid(), subject: f.subject.value, type: f.type.value, text: f.text.value.trim(), due, done: +f.done.value, rem, remAt, n: same ? old.n : {} };
  const i = homework.findIndex(x => x.id === data.id);
  if (i >= 0) homework[i] = data; else homework.push(data);
  save(key('homework'), homework); hwDlg.close(); renderHw(); checkReminders();
};
$('#hwDel').onclick = () => {
  if (!confirm('Удалить это задание?')) return;
  homework = homework.filter(x => x.id !== hwForm.id.value);
  save(key('homework'), homework); hwDlg.close(); renderHw();
};
$$('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());

// Время напоминания: по выбранному режиму, а не только по дедлайну
function remindAt(h) {
  const due = new Date(h.due), m = h.rem || 'd1';
  if (m === 'none') return null;
  if (m === 'custom') return h.remAt ? new Date(h.remAt) : null;
  if (m === 'day8') { const d = new Date(due); d.setHours(8, 0, 0, 0); return d; }
  return new Date(due - (m === 'd2' ? 2 : 1) * 864e5);
}
function remLabel(h) {
  const r = remindAt(h);
  return r ? '🔔 ' + r.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '🔕 без напоминания';
}

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
  const now = Date.now(); let changed = false;
  homework.forEach(h => {
    const rt = remindAt(h);
    if (h.done || !rt) return; // «Не напоминать» — уведомлений нет вообще
    h.n = h.n || {};
    const due = new Date(h.due).getTime();
    if (now >= rt.getTime() && now < due && !h.n.rem) { h.n.rem = 1; changed = true; notify('Напоминание о ДЗ', `${h.subject}: ${h.text} — ${timeLeft(h.due).text}`); }
    if (now >= due && now < due + 36e5 && !h.n.due) { h.n.due = 1; changed = true; notify('Срок сдачи наступил', `${h.subject}: ${h.text}`); }
  });
  if (changed) save(key('homework'), homework);
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
