const LEGACY_KINDS = new Set(['growth', 'focus', 'abandoned', 'quest', 'avatar']);
const DASHBOARD_KINDS = new Set(['pte', 'countdown', 'checkin']);
const validType = value => typeof value === 'string' && value.length > 0
  && value.length <= 80 && value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
const MAX_BODY_BYTES = 200_000;

const json = (value, status = 200, headers = {}) => Response.json(value, {
  status,
  headers: { 'Cache-Control': 'no-store', ...headers },
});

async function equal(a, b) {
  const hash = async value => new Uint8Array(await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(value),
  ));
  const [x, y] = await Promise.all([hash(a), hash(b)]);
  let difference = 0;
  for (let index = 0; index < x.length; index += 1) difference |= x[index] ^ y[index];
  return difference === 0;
}

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function onlyFields(data, fields) {
  const keys = Object.keys(data);
  return keys.length === fields.length && keys.every(key => fields.includes(key));
}

function validDashboardRecord(record) {
  const { kind, id, data, deleted } = record;
  // Deleted records carry only their identity; personal notes and files never
  // belong in these metric payloads, including deletion payloads.
  if (deleted && Object.keys(data).length === 0) {
    if (kind === 'checkin') return isDate(id);
    if (kind === 'pte') {
      return id[10] === ':' && isDate(id.slice(0, 10)) && validType(id.slice(11));
    }
    return true;
  }
  if (kind === 'pte') {
    return onlyFields(data, ['date', 'type', 'count'])
      && isDate(data.date) && validType(data.type)
      && id === `${data.date}:${data.type}`
      && Number.isSafeInteger(data.count) && data.count >= 0;
  }
  if (kind === 'countdown') {
    return Object.keys(data).every(key => ['title', 'date', 'category', 'pinned'].includes(key))
      && (data.category === undefined || ['anniversary', 'birthday', 'holiday', 'uncategorized'].includes(data.category))
      && (data.pinned === undefined || typeof data.pinned === 'boolean') && isDate(data.date)
      && typeof data.title === 'string' && data.title.trim().length > 0 && data.title.length <= 200;
  }
  return onlyFields(data, ['date']) && isDate(data.date) && id === data.date;
}

function validLegacyRecord(record) {
  const { kind, id, data, deleted } = record;
  if (deleted) return true;
  if (kind === 'avatar') {
    return id === 'main' && typeof data.image === 'string'
      && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.image);
  }
  if (kind === 'quest') {
    return /^\d{4}-\d{2}-\d{2}$/.test(data.date)
      && ['english', 'code', 'reading', 'focus'].includes(data.quest)
      && id === `${data.date}:${data.quest}`;
  }
  if (kind === 'growth') {
    return data.id === id && typeof data.note === 'string' && data.note.length <= 10_000
      && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
      && ['language', 'work', 'strength', 'skill'].includes(data.category);
  }
  return Number.isFinite(data.endedAt) && data.endedAt > 0
    && Number.isFinite(data.seconds) && data.seconds > 0
    && ['up', 'down'].includes(data.mode)
    && (!data.goal || typeof data.goal === 'string' && data.goal.length <= 80);
}

function valid(record) {
  if (!record || typeof record !== 'object'
    || !(LEGACY_KINDS.has(record.kind) || DASHBOARD_KINDS.has(record.kind))
    || typeof record.id !== 'string' || !record.id || record.id.length > 150
    || !Number.isSafeInteger(record.baseRevision) || record.baseRevision < 0
    || typeof record.deleted !== 'boolean') return false;
  if (!record.data || typeof record.data !== 'object' || Array.isArray(record.data)
    || JSON.stringify(record.data).length > 150_000) return false;
  return DASHBOARD_KINDS.has(record.kind)
    ? validDashboardRecord(record) : validLegacyRecord(record);
}

function publicRecord(row) {
  return row ? { ...row, data: JSON.parse(row.data), deleted: Boolean(row.deleted) } : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    const cors = origin && allowed.includes(origin) ? {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Sync-Key',
    } : {};
    if (origin && !allowed.includes(origin)) return json({ error: 'Origin is not allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname !== '/api/sync') return json({ error: 'Not found' }, 404, cors);
    if (!env.SYNC_KEY || !(await equal(request.headers.get('X-Sync-Key') || '', env.SYNC_KEY))) {
      return json({ error: 'Invalid sync key' }, 401, cors);
    }
    try {
      if (request.method === 'GET') {
        const result = await env.DB.prepare(
          'SELECT kind,id,data,deleted,revision FROM records ORDER BY kind,id',
        ).all();
        return json({
          storage: 'd1', schemaVersion: 2,
          supportedKinds: [...LEGACY_KINDS, ...DASHBOARD_KINDS],
          records: result.results.map(publicRecord),
        }, 200, cors);
      }
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
      if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
        return json({ error: 'Payload too large' }, 413, cors);
      }
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return json({ error: 'Payload too large' }, 413, cors);
      }
      let record;
      try { record = JSON.parse(raw); }
      catch { return json({ error: 'Invalid JSON' }, 400, cors); }
      if (!valid(record)) return json({ error: 'Invalid record' }, 400, cors);
      const sql = record.baseRevision === 0
        ? 'INSERT INTO records(kind,id,data,deleted,revision) VALUES(?,?,?,?,1) ON CONFLICT(kind,id) DO NOTHING'
        : 'UPDATE records SET data=?,deleted=?,revision=revision+1 WHERE kind=? AND id=? AND revision=?';
      const values = record.baseRevision === 0
        ? [record.kind, record.id, JSON.stringify(record.data), +record.deleted]
        : [JSON.stringify(record.data), +record.deleted, record.kind, record.id, record.baseRevision];
      const result = await env.DB.prepare(sql).bind(...values).run();
      const row = await env.DB.prepare(
        'SELECT kind,id,data,deleted,revision FROM records WHERE kind=? AND id=?',
      ).bind(record.kind, record.id).first();
      const conflict = result.meta.changes === 0;
      return json({ record: publicRecord(row), conflict }, conflict ? 409 : 200, cors);
    } catch {
      return json({ error: 'Sync is temporarily unavailable. Please try again.' }, 500, cors);
    }
  },
};
