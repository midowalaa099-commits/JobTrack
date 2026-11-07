export const STAGES = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'archived'];
export const MODES = ['remote', 'hybrid', 'onsite'];
export const MAX_RECORDS = 1000;
export function dateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return year >= 2000 && year <= 2100 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
export function dateTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value)) || !dateOnly(value.slice(0, 10))) return false;
  const [hour, minute] = value.slice(11).split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function shiftDay(offset, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return todayISO(date);
}
const cleanText = (value, max) => String(value ?? '').trim().slice(0, max);
export function safeUrl(value) {
  const text = cleanText(value, 1500);
  if (!text) return '';
  let url;
  try { url = new URL(text); } catch { throw new Error('url'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('url');
  return url.href;
}
export function normalizeApplication(input, { id, now = new Date().toISOString() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('record');
  const record = {
    id: cleanText(id ?? input.id, 80),
    company: cleanText(input.company, 100),
    role: cleanText(input.role, 140),
    location: cleanText(input.location, 100),
    workMode: input.workMode || 'remote',
    stage: input.stage || 'saved',
    source: cleanText(input.source, 100),
    url: safeUrl(input.url),
    appliedDate: input.appliedDate || '',
    followUpDate: input.followUpDate || '',
    interviewAt: input.interviewAt || '',
    interviewType: input.interviewType || 'video',
    contactName: cleanText(input.contactName, 100),
    contactEmail: cleanText(input.contactEmail, 200),
    salaryMin: input.salaryMin === '' || input.salaryMin == null ? null : Number(input.salaryMin),
    salaryMax: input.salaryMax === '' || input.salaryMax == null ? null : Number(input.salaryMax),
    notes: cleanText(input.notes, 5000),
    createdAt: input.createdAt || now,
    updatedAt: now
  };
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(record.id) || record.company.length < 2 || record.role.length < 2) throw new Error('required');
  if (!STAGES.includes(record.stage) || !MODES.includes(record.workMode) || !['video','phone','onsite'].includes(record.interviewType)) throw new Error('options');
  if ([record.appliedDate, record.followUpDate].some(value => value && !dateOnly(value)) || record.interviewAt && !dateTime(record.interviewAt)) throw new Error('date');
  if (record.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contactEmail)) throw new Error('email');
  for (const amount of [record.salaryMin, record.salaryMax]) if (amount !== null && (!Number.isSafeInteger(amount) || amount < 0 || amount > 10000000)) throw new Error('salary');
  if (record.salaryMin !== null && record.salaryMax !== null && record.salaryMin > record.salaryMax) throw new Error('salaryOrder');
  if (!Number.isFinite(Date.parse(record.createdAt))) throw new Error('date');
  return record;
}
export function putApplication(records, input, options) {
  const record = normalizeApplication(input, options);
  const found = records.find(item => item.id === record.id);
  if (!found && records.length >= MAX_RECORDS) throw new Error('limit');
  return found ? records.map(item => item.id === record.id ? { ...record, createdAt: item.createdAt } : item) : [record, ...records];
}
export function isActive(record) { return !['saved', 'rejected', 'archived'].includes(record.stage); }
export function needsFollowUp(record, today = todayISO()) { return Boolean(record.followUpDate && record.followUpDate <= today && isActive(record)); }
export function selectApplications(records, { query = '', stage = 'all', mode = 'all', quick = 'all', sort = 'updated', today = todayISO() } = {}) {
  const search = query.trim().toLocaleLowerCase();
  const filtered = records.filter(record =>
    (stage === 'all' || record.stage === stage) &&
    (mode === 'all' || record.workMode === mode) &&
    (quick !== 'active' || isActive(record)) &&
    (quick !== 'followup' || needsFollowUp(record, today)) &&
    (quick !== 'offers' || record.stage === 'offer') &&
    [record.company, record.role, record.location, record.source, record.notes].join(' ').toLocaleLowerCase().includes(search)
  );
  return filtered.sort((a, b) => sort === 'company' ? a.company.localeCompare(b.company) : sort === 'followup' ? (a.followUpDate || '9999').localeCompare(b.followUpDate || '9999') : b.updatedAt.localeCompare(a.updatedAt));
}
export function stats(records, now = new Date()) {
  const submitted = records.filter(record => !['saved','archived'].includes(record.stage));
  const replied = submitted.filter(record => ['screening','interview','offer','rejected'].includes(record.stage));
  const localNow = `${todayISO(now)}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return { total:records.length, active:records.filter(isActive).length, interviews:records.filter(record => record.interviewAt && record.interviewAt >= localNow && isActive(record)).length, responseRate:submitted.length ? Math.round(replied.length / submitted.length * 100) : 0, followups:records.filter(record=>needsFollowUp(record,todayISO(now))).length };
}
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > 1500000) throw new Error('fileSize');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('json'); }
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.applications) || data.applications.length > MAX_RECORDS) throw new Error('backup');
  const ids = new Set();
  return data.applications.map(input => {
    const record=normalizeApplication(input,{now:input?.updatedAt || new Date().toISOString()});
    if (ids.has(record.id)) throw new Error('duplicate');
    ids.add(record.id);
    if (!Number.isFinite(Date.parse(record.updatedAt))) throw new Error('date');
    return record;
  });
}
export function toCSV(records) {
  const keys = ['company','role','stage','location','workMode','source','appliedDate','followUpDate','interviewAt','salaryMin','salaryMax','contactName','contactEmail','url','notes'];
  const cell = value => {
    let text=String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
  };
  return '\uFEFF'+[keys.map(cell).join(','),...records.map(record=>keys.map(key=>cell(record[key])).join(','))].join('\r\n');
}
