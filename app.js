'use strict';
const APP_VERSION = '9';
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
// Расписание звонков БГЭУ (можно править здесь): [название, начало, конец]
const BELLS = [['1 пара', '08:30', '09:50'], ['2 пара', '10:05', '11:25'], ['3 пара', '11:40', '13:00'], ['4 пара', '13:30', '14:50'], ['5 пара', '15:05', '16:25'], ['6 пара', '16:35', '17:55'], ['7 пара', '18:05', '19:25']];
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
const EMPTY = '<div class="empty">На этот день занятий нет или расписание не заполнено</div>';
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
  $('meta[name=theme-color]').content = '#3e4593';
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
const pinIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
let selDay = (() => { const d = new Date().getDay(); return d >= 1 && d <= 6 ? d : 1; })();
const lessonHtml = (l, date) => `<div class="lesson inner">
    <div class="tcol"><b>${esc(l.start)}</b><span>${esc(l.end)}</span></div><div class="vdiv"></div>
    <div style="min-width:0;flex:1">
      <div class="flex items-start justify-between gap-2">
        <${l.base ? 'div' : 'button data-edit-lesson="' + l.id + '"'} class="lname">${esc(l.name)}</${l.base ? 'div' : 'button'}>
        <span class="tbadge ${BCLS[l.type] || 'b-pz'}">${esc(l.type)}</span>
      </div>
      ${l.room || l.teacher || l.sub ? `<div class="lmeta">${pinIcon}<span>${[l.room && 'к/ауд ' + esc(l.room), esc(l.teacher), l.sub && subLabel(l.sub)].filter(Boolean).join(' · ')}</span></div>` : ''}
      <button data-hw-lesson="${l.id}" data-date="${date.getTime()}" class="hwbtn">+ ДЗ</button>
    </div>
  </div>`;
function renderSchedule() {
  $('#weekSel').value = week;
  $('#prevWeek').disabled = week <= 1; $('#nextWeek').disabled = week >= WEEKS_COUNT;
  const mon = addDays(semMon, (week - 1) * 7), now = new Date(), lessons = allLessons();
  const k = [week, subSel, engSel, group].join('|'), anim = k !== lastKey; lastKey = k;
  const short = d => d.getDate() + ' ' + MON[d.getMonth()];
  $('#weekTitle').textContent = 'Неделя ' + week;
  $('#weekRange').textContent = short(mon) + ' – ' + short(addDays(mon, 5));
  const byDay = d => lessons.filter(l => l.day === d && matchWeek(l, week) && subOk(l)).sort((x, y) => x.start.localeCompare(y.start));
  $('#dayStrip').innerHTML = [1, 2, 3, 4, 5, 6].map(d => { const date = addDays(mon, d - 1);
    return `<button data-sday="${d}" class="dchip${d === selDay ? ' sel' : ''}${date.toDateString() === now.toDateString() ? ' tod' : ''}"><span class="dn">${WDS[d]}</span><span class="dd">${date.getDate()}</span><i class="${byDay(d).length ? '' : 'off'}"></i></button>`; }).join('');
  $('#grid').className = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6' + (anim ? ' enter' : '');
  $('#grid').innerHTML = [1, 2, 3, 4, 5, 6].map(d => { try {
    const date = addDays(mon, d - 1), isToday = date.toDateString() === now.toDateString(), items = byDay(d);
    return `<div class="daycol card${d === selDay ? ' sel' : ''}${isToday ? ' today' : ''}" style="--i:${d}">
      <div class="dayhead"><h3>${DAYS[d]}<span class="sub" style="font-weight:600;text-transform:none;font-size:12px"> · ${fmt(date)}</span></h3>${isToday ? '<span class="todaypill">Сегодня</span>' : ''}</div>
      <div style="display:flex;flex-direction:column;gap:10px">${items.length ? items.map(l => lessonHtml(l, date)).join('') : EMPTY}</div>
    </div>`;
  } catch (err) { console.error(err); return `<div class="daycol card sel"><div class="dayhead"><h3>${DAYS[d]}</h3></div>${EMPTY}</div>`; } }).join('');
  $$('[data-sday]').forEach(b => b.onclick = () => { selDay = +b.dataset.sday; renderSchedule(); });
  $$('[data-edit-lesson]').forEach(b => b.onclick = () => openLesson(b.dataset.editLesson));
  $$('[data-hw-lesson]').forEach(b => b.onclick = () => {
    const l = allLessons().find(x => x.id === b.dataset.hwLesson);
    const [hh, mm] = l.start.split(':').map(Number), from = new Date(+b.dataset.date); from.setHours(hh, mm, 0, 0);
    openHw(null, { subject: l.name, type: l.type, from });
  });
  renderHero();
}
function renderHero() {
  const now = new Date(), wd = now.getDay(), cw = Math.floor((mondayOf(now) - semMon) / 6048e5) + 1;
  const n = wd >= 1 && wd <= 6 ? allLessons().filter(l => l.day === wd && matchWeek(l, cw) && subOk(l)).length : 0;
  $('#heroSub').innerHTML = `Сегодня ${n} ${plural(n, 'пара', 'пары', 'пар')} · горящих ДЗ: <b>${homework.filter(isHot).length}</b>`;
}

const lessonDlg = $('#lessonDlg'), lessonForm = $('#lessonForm');
$('#slotSel').innerHTML = BELLS.map(([n, s, e]) => `<option value="${s}-${e}">${n}: ${s} – ${e}</option>`).join('') + '<option value="other">Другое время (ввести вручную)</option>';
function toggleSlot() { const o = $('#slotSel').value === 'other'; $('#timeWrap').classList.toggle('hidden', !o); lessonForm.start.required = lessonForm.end.required = o; }
$('#slotSel').onchange = toggleSlot;
function openLesson(id) {
  const l = myLessons.find(x => x.id === id);
  lessonForm.reset();
  lessonForm.id.value = l ? l.id : '';
  $('#lessonTitle').textContent = l ? 'Редактировать пару' : 'Новая пара';
  $('#lessonDel').classList.toggle('hidden', !l);
  $('#slotSel').value = `${BELLS[0][1]}-${BELLS[0][2]}`;
  if (l) {
    for (const k of ['day', 'start', 'end', 'name', 'teacher', 'room', 'type']) lessonForm[k].value = l[k];
    lessonForm.parity.value = l.parity || '';
    const k = l.start + '-' + l.end; $('#slotSel').value = BELLS.some(b => b[1] + '-' + b[2] === k) ? k : 'other';
  } else { const d = new Date().getDay(); lessonForm.day.value = d >= 1 && d <= 6 ? d : 1; }
  toggleSlot(); lessonDlg.showModal();
}
$('#addLesson').onclick = () => openLesson();
$('#fab').onclick = () => (tab === 'schedule' ? openLesson() : openHw());
lessonForm.onsubmit = e => {
  e.preventDefault();
  const f = lessonForm, [st, en] = $('#slotSel').value === 'other' ? [f.start.value, f.end.value] : $('#slotSel').value.split('-');
  const data = { id: f.id.value || uid(), day: +f.day.value, start: st, end: en, name: f.name.value.trim(), teacher: f.teacher.value.trim(), room: f.room.value.trim(), type: f.type.value, parity: f.parity.value || undefined };
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
    return `<div class="kcard inner" data-id="${h.id}" tabindex="0" style="${h.done ? 'opacity:.55' : ''}">
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
  const colHtml = (id, title, items, hint) => `<div class="kcol card" data-col="${id}">
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
  renderHero();
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
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WDS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const dk = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
let hwDue = '', hwKind = 'lesson', hwNearest = '', calMonth = new Date();

function toggleRem() { const m = $('#remSel').value === 'custom'; $('#remWrap').classList.toggle('hidden', !m); $('#remAt').required = m; }

// Все даты занятий этого предмета и типа по расписанию выбранной группы: 'ГГГГ-ММ-ДД' -> время начала
function occ(subject, type) {
  const m = new Map(), list = allLessons().filter(l => l.name === subject && (!type || l.type === type) && subOk(l));
  for (let w = 1; w <= WEEKS_COUNT; w++) list.forEach(l => {
    if (!matchWeek(l, w)) return;
    const k = dk(addDays(semMon, (w - 1) * 7 + l.day - 1));
    if (!m.has(k) || l.start < m.get(k)) m.set(k, l.start);
  });
  return m;
}
function renderDueBtn() {
  const el = $('#dueText');
  if (!hwDue) { el.textContent = 'Выберите срок сдачи'; return; }
  const d = new Date(hwDue);
  const pre = hwKind === 'keep' ? 'Текущий срок: ' : hwKind === 'custom' ? 'Свой срок: ' : hwDue === hwNearest ? 'Ближайшая пара: ' : 'Пара: ';
  el.textContent = `${pre}${d.getDate()} ${MON[d.getMonth()]}, ${WDS[d.getDay()]} (${pad(d.getHours())}:${pad(d.getMinutes())})`;
}
function setDue(v, kind) { hwDue = v; hwKind = kind; renderDueBtn(); }
function refreshDue() {
  const n = nextLessons(hwForm.subject.value, hwForm.type.value, hwFrom, 1)[0];
  hwNearest = n ? toLocal(n) : '';
  $('#calTime').value = n ? pad(n.getHours()) + ':' + pad(n.getMinutes()) : '09:00';
  if (hwKeep) setDue(hwKeep, 'keep'); else if (hwNearest) setDue(hwNearest, 'lesson'); else setDue('', 'custom');
  if (!$('#cal').hidden) renderCal();
}
function closeCal() { $('#cal').hidden = true; $('#dueBtn').setAttribute('aria-expanded', 'false'); }
function renderCal() {
  const y = calMonth.getFullYear(), mo = calMonth.getMonth(), off = (new Date(y, mo, 1).getDay() + 6) % 7, dim = new Date(y, mo + 1, 0).getDate();
  $('#calMonth').textContent = MONTHS[mo] + ' ' + y;
  const marks = occ(hwForm.subject.value, hwForm.type.value), today = new Date(), tk = dk(today), sel = hwDue.slice(0, 10);
  today.setHours(0, 0, 0, 0);
  let html = '<span></span>'.repeat(off), count = 0;
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(y, mo, d), k = dk(dt), has = marks.has(k), past = dt < today && k !== sel;
    if (has && dt >= today) count++;
    html += `<button type="button" data-cday="${k}" ${past ? 'disabled' : ''} class="cday${has ? ' has' : ''}${k === sel ? ' sel' : ''}${k === tk ? ' tod' : ''}"${has ? ` title="Пара в ${marks.get(k)}"` : ''}><span>${d}</span>${has ? '<i></i>' : ''}</button>`;
  }
  $('#calGrid').innerHTML = html;
  const what = [hwForm.type.value, hwForm.subject.value].filter(Boolean).join(' · ');
  $('#calLegend').textContent = `● Подсвечены дни занятий: ${what || 'выберите предмет'}. В этом месяце: ${count}`;
  $$('[data-cday]', $('#calGrid')).forEach(b => b.onclick = () => pickDay(b.dataset.cday));
}
function pickDay(k) {
  const t = occ(hwForm.subject.value, hwForm.type.value).get(k);
  setDue(k + 'T' + (t || $('#calTime').value || '09:00'), t ? 'lesson' : 'custom');
  $('#remSel').value = 'eve19'; toggleRem(); // предлагаем напомнить накануне вечером
  closeCal();
}
$('#dueBtn').onclick = () => {
  const open = $('#cal').hidden;
  $('#cal').hidden = !open; $('#dueBtn').setAttribute('aria-expanded', String(open));
  if (open) { calMonth = hwDue ? new Date(hwDue) : new Date(); calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1); renderCal(); }
};
$('#calPrev').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCal(); };
$('#calNext').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCal(); };
$('#calTime').onchange = () => { if (hwKind === 'custom' && hwDue) setDue(hwDue.slice(0, 10) + 'T' + $('#calTime').value, 'custom'); };
hwForm.subject.onchange = hwForm.type.onchange = () => { if (hwKind === 'lesson' || !hwDue) { hwKeep = ''; refreshDue(); } else if (!$('#cal').hidden) renderCal(); };
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
  $('#remSel').value = h ? (h.rem || 'd1') : 'eve19';
  $('#remAt').value = h && h.remAt || '';
  if (h) { hwForm.subject.value = h.subject; hwForm.type.value = h.type || ''; hwForm.text.value = h.text; hwForm.done.value = h.done; }
  else if (preset) { hwForm.subject.value = preset.subject; hwForm.type.value = preset.type; }
  const now = new Date();
  hwFrom = preset && preset.from > now ? preset.from : now;
  hwKeep = h ? h.due : '';
  closeCal(); refreshDue();
  toggleRem(); hwDlg.showModal();
}
$('#addHw').onclick = () => openHw();
hwForm.onsubmit = e => {
  e.preventDefault();
  const f = hwForm;
  if (!f.subject.value) return alert('Сначала добавьте пары в расписание.');
  const due = hwDue;
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
  if (m === 'eve19') { const d = new Date(due); d.setDate(d.getDate() - 1); d.setHours(19, 0, 0, 0); return d; }
  if (m === 'day8') { const d = new Date(due); d.setHours(8, 0, 0, 0); return d; }
  return new Date(due - (m === 'd2' ? 2 : 1) * 864e5);
}
function remLabel(h) {
  const r = remindAt(h);
  return r ? '🔔 ' + r.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '🔕 без напоминания';
}

/* ---------- Уведомления ---------- */
const notifState = () => !('Notification' in window) ? 'unsupported' : Notification.permission; // default | granted | denied | unsupported
function updateNotifBtn() {
  const st = notifState(), on = st === 'granted', b = $('#notifBtn'), t = $('#notifTxt');
  b.dataset.on = on ? '1' : '0';
  t.textContent = on ? 'Напоминания включены' : st === 'denied' ? 'Заблокировано' : st === 'unsupported' ? 'Недоступно' : 'Включить напоминания';
  b.title = t.textContent; b.setAttribute('aria-label', t.textContent);
  $('#notifBanner').hidden = on || localStorage.getItem('notifHide') === '1';
  $('#notifMsg').textContent = st === 'denied' ? 'Уведомления заблокированы. Разрешите их в настройках сайта (значок замка в адресной строке) или приложения и перезагрузите страницу.'
    : st === 'unsupported' ? 'Этот браузер не поддерживает уведомления. На iPhone откройте приложение с иконки на экране «Домой» (iOS 16.4 и новее).'
    : 'Чтобы получать напоминания о дедлайнах, разрешите уведомления.';
  $('#notifAsk').hidden = st !== 'default';
}
async function askNotif() {
  localStorage.removeItem('notifHide');
  if (notifState() === 'default') { try { await Notification.requestPermission(); } catch (e) { console.error(e); } }
  updateNotifBtn(); checkReminders();
}
$('#notifBtn').onclick = askNotif; $('#notifAsk').onclick = askNotif;
$('#notifHide').onclick = () => { localStorage.setItem('notifHide', '1'); updateNotifBtn(); };

// Отправка через Service Worker (на телефонах new Notification() блокируется); запасной вариант — обычный Notification
async function notify(title, body, tag) {
  const opts = { body, icon: 'icon-192.png', badge: 'icon-192.png', tag, data: { url: './index.html' } };
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('SW не готов')), 3000))]);
      await reg.showNotification(title, opts); return;
    } catch (e) { console.warn('Уведомление через SW не удалось:', e); }
  }
  new Notification(title, opts);
}
const minute = t => Math.floor(t / 60000); // сравнение с точностью до минуты
function checkReminders() {
  if (notifState() !== 'granted') return;
  const now = minute(Date.now());
  homework.forEach(h => {
    const rt = remindAt(h);
    if (h.done || !rt) return; // «Не напоминать» — уведомлений нет вообще
    h.n = h.n || {};
    const due = minute(new Date(h.due).getTime());
    const fire = (flag, title, body) => {
      h.n[flag] = 1; save(key('homework'), homework);
      notify(title, body, `hw-${h.id}-${flag}`).catch(e => { console.error(e); h.n[flag] = 0; save(key('homework'), homework); }); // не вышло — повторим на следующей проверке
    };
    if (now >= minute(rt.getTime()) && now < due && !h.n.rem) fire('rem', 'Напоминание о ДЗ', `${h.subject}: ${h.text} — ${timeLeft(h.due).text}`);
    if (now >= due && now < due + 60 && !h.n.due) fire('due', 'Срок сдачи наступил', `${h.subject}: ${h.text}`);
  });
}

/* ---------- Свайп шторок (телефон) ---------- */
function bindSheet(dlg) {
  const sheet = dlg.querySelector('.sheet'); let y0 = null, dy = 0, t0 = 0, grab = false;
  const reset = () => { sheet.style.transform = ''; sheet.style.transition = ''; };
  const dismiss = () => { sheet.style.transition = 'transform .25s ease'; sheet.style.transform = 'translateY(100%)'; setTimeout(() => { dlg.close(); reset(); }, 230); };
  dlg.addEventListener('close', reset);
  $$('.grab, h3', sheet).forEach(z => {
    z.addEventListener('touchstart', e => { if (innerWidth >= 768) return; y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); grab = !!e.target.closest('.grab'); sheet.style.transition = 'none'; }, { passive: true });
    z.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = `translateY(${dy}px)`; e.preventDefault(); }, { passive: false });
    z.addEventListener('touchend', () => {
      if (y0 === null) return; y0 = null;
      if (dy > 90 || (grab && dy < 8 && Date.now() - t0 < 400)) dismiss(); // свайп вниз >90px или тап по полоске
      else { sheet.style.transition = 'transform .2s ease'; sheet.style.transform = ''; setTimeout(() => { sheet.style.transition = ''; }, 220); }
    });
  });
}

/* ---------- Запуск ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error); // регистрируем до первой проверки напоминаний
bindSheet($('#lessonDlg')); bindSheet($('#hwDlg'));
[applyTheme, updateNotifBtn, () => showTab(tab), renderSchedule, renderHw, checkReminders].forEach(f => { try { f(); } catch (e) { console.error(e); banner('Ошибка: ' + e.message); } });
const mv = document.querySelector('meta[name=app-version]');
if (!mv || mv.content !== APP_VERSION) banner('index.html и app.js от разных версий: загрузите оба файла на GitHub и обновите страницу (Ctrl+F5).');
else if (missing.length) banner('В index.html не найдены элементы: ' + [...new Set(missing)].join(', '));
setInterval(() => { renderHw(); checkReminders(); }, 30000); // проверка дедлайнов каждые 30 секунд
document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderSchedule(); renderHw(); checkReminders(); } });

}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
