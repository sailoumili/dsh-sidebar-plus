'use strict';
const VERSION = '0.3.1';

const MAX_TEXT_BYTES = 32 * 1024 * 1024;
const KEEP_PER_BASENAME = 20;
const KEEP_TOTAL = 500;
const BACKUP_DIR = path.join(DSH_HOME, 'sidebar-plus-backups');

function normalizeTarget(raw) {
  const p = typeof raw === 'string' ? raw.trim() : '';
  if (!p) return { ok: false, error: 'empty-path' };
  if (p.includes('\0')) return { ok: false, error: 'bad-path' };
  if (!path.isAbsolute(p)) return { ok: false, error: 'not-absolute' };
  return { ok: true, abs: p };
}

function checkWritableFile(abs) {
  try {
    const ls = fs.lstatSync(abs);
    if (!ls.isFile()) return { ok: false, error: ls.isDirectory() ? 'is-directory' : 'not-regular-file' };
    const st = fs.statSync(abs);
    return { ok: true, mtimeMs: st.mtimeMs, bytes: st.size };
  } catch (err) {
    return { ok: false, error: String(err && err.code || '').includes('ENOENT') ? 'not-found' : 'stat-failed' };
  }
}

function stampNow(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return String(d.getFullYear()) + pad(d.getMonth() + 1) + pad(d.getDate())
    + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

function prunePlan(entries, keep, totalKeep) {
  const remove = new Set();
  const sorted = entries.slice().sort((a, b) => b.mtimeMs - a.mtimeMs);
  let total = 0;
  for (const e of sorted) {
    total++;
    if (total > totalKeep) remove.add(e.name);
  }
  const groups = new Map();
  for (const e of entries) {
    const i = e.name.indexOf('.bak-');
    const base = i > 0 ? e.name.slice(0, i) : e.name;
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(e);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => b.mtimeMs - a.mtimeMs);
    list.slice(keep).forEach((e) => remove.add(e.name));
  }
  return Array.from(remove);
}

function backupCurrent(abs) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const base = path.basename(abs);
    let name = base + '.bak-' + stampNow();
    let n = 1;
    while (fs.existsSync(path.join(BACKUP_DIR, name))) {
      name = base + '.bak-' + stampNow() + '.' + n;
      n++;
      if (n > 50) return null;
    }
    const dest = path.join(BACKUP_DIR, name);
    fs.copyFileSync(abs, dest);
    const all = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.includes('.bak-'))
      .map((e) => {
        let mtimeMs = 0;
        try { mtimeMs = fs.statSync(path.join(BACKUP_DIR, e.name)).mtimeMs; } catch (err) {  }
        return { name: e.name, mtimeMs };
      });
    for (const gone of prunePlan(all, KEEP_PER_BASENAME, KEEP_TOTAL)) {
      try { fs.unlinkSync(path.join(BACKUP_DIR, gone)); } catch (err) {  }
    }
    return dest;
  } catch (err) {
    log('备份失败（不阻断保存）:', err && err.message);
    return null;
  }
}

function saveFile({ abs, text, ifMtimeMs, force }) {
  const target = normalizeTarget(abs);
  if (!target.ok) return { body: target };
  if (typeof text !== 'string') return { body: { ok: false, error: 'text-must-be-string' } };
  const buf = Buffer.from(text, 'utf8');
  if (buf.length > MAX_TEXT_BYTES) return { body: { ok: false, error: 'too-large' } };

  const cur = checkWritableFile(target.abs);
  if (!cur.ok) return { body: { ok: false, error: cur.error } };

  if (!force && Number.isFinite(ifMtimeMs) && Math.abs(cur.mtimeMs - ifMtimeMs) > 0.5) {
    return { body: { ok: false, error: 'changed', mtimeMs: cur.mtimeMs } };
  }

  const backup = backupCurrent(target.abs);
  const dir = path.dirname(target.abs);
  const tmp = path.join(dir, '.dsh-sp-' + process.pid + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.tmp');
  try {
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, target.abs);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch (e) {  }
    return { body: { ok: false, error: 'write-failed:' + String(err && err.code || err && err.message || err).slice(0, 80) } };
  }
  let after = cur;
  try { const st = fs.statSync(target.abs); after = { mtimeMs: st.mtimeMs, bytes: st.size }; } catch (err) {  }
  return { body: { ok: true, mtimeMs: after.mtimeMs, bytes: after.bytes, backup } };
}

function statHandler(searchParams) {
  const target = normalizeTarget(String((searchParams && searchParams.get('abs')) || ''));
  if (!target.ok) return { body: target };
  const cur = checkWritableFile(target.abs);
  if (!cur.ok) return { body: { ok: false, error: cur.error, abs: target.abs } };
  return { body: { ok: true, abs: target.abs, mtimeMs: cur.mtimeMs, bytes: cur.bytes } };
}

const handlers = {
  health: () => ({ body: { ok: true, version: VERSION, role: 'host-business', backupDir: BACKUP_DIR } }),
  stat: (searchParams) => statHandler(searchParams),
  save: (bodyObj) => saveFile({
    abs: bodyObj && bodyObj.abs,
    text: bodyObj && bodyObj.text,
    ifMtimeMs: bodyObj && bodyObj.ifMtimeMs,
    force: !!(bodyObj && bodyObj.force === true),
  }),
};

const teardown = function () {  };

return {
  version: VERSION,
  handlers,
  teardown,
  _test: { VERSION, MAX_TEXT_BYTES, BACKUP_DIR, normalizeTarget, checkWritableFile, prunePlan, stampNow, saveFile, statHandler, handlers },
};
