'use strict';
const VERSION = '0.4.4';

const MAX_TEXT_BYTES = 32 * 1024 * 1024;
const KEEP_PER_BASENAME = 20;
const KEEP_TOTAL = 500;
/* 备份落点可配置：默认仍是老路径，配置只认 backupDir 一个键。 */
const CONFIG_FILE = path.join(DSH_HOME, 'sidebar-plus.config.json');
const DEFAULT_BACKUP_DIR = path.join(DSH_HOME, 'sidebar-plus-backups');
const BACKUP_DIR = DEFAULT_BACKUP_DIR;
const CONFIG_BODY_CAP = 1024 * 1024;
/* 「这是插件自己生成的备份」的唯一判据：<原名>.bak-YYYYMMDD-HHMMSS[.n]，与下面 stampNow 的命名一致。
   收紧到这个形状，才敢对所选文件夹做保留清理——否则会把用户自己放在那儿的 .bak- 文件当备份删掉。 */
const BAK_NAME_RE = /\.bak-\d{8}-\d{6}(\.\d+)?$/;
const isOwnBackup = (name) => BAK_NAME_RE.test(String(name == null ? '' : name));

/* 路径同一性：斜杠归一、去尾斜杠、不分大小写（Windows 口径）。 */
function isSamePath(a, b) {
  const norm = (p) => String(p == null ? '' : p).replace(/[\\/]+/g, '\\').replace(/\\+$/,'').toLowerCase();
  return norm(a) === norm(b);
}

/* child 是否严格位于 parent 里面（同路径不算）。
   备份目录不许设成当前备份目录的子文件夹：盘点不递归，子夹里的备份会搬不回来。 */
function isInsideDir(child, parent) {
  const norm = (p) => path.resolve(String(p == null ? '' : p)).replace(/[\\/]+/g, '\\').replace(/\\+$/, '').toLowerCase();
  const a = norm(child);
  const b = norm(parent);
  return a !== b && a.startsWith(b + '\\');
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch (err) { return false; }
}

/* 目录里本插件自己备份文件的个数（判据同 isOwnBackup）；目录不存在算 0。 */
function countBackups(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && isOwnBackup(e.name)).length;
  } catch (err) { return 0; }
}

function readConfig() {
  let raw;
  try { raw = fs.readFileSync(CONFIG_FILE, 'utf8'); } catch (err) { return {}; }
  let obj;
  try { obj = JSON.parse(raw); } catch (err) { return {}; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const out = {};
  if (typeof obj.backupDir === 'string' && obj.backupDir.trim()) out.backupDir = obj.backupDir.trim();
  return out;
}

function writeConfig(obj) {
  const dir = path.dirname(CONFIG_FILE);
  const tmp = path.join(dir, '.dsh-sp-config-' + process.pid + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.tmp');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    fs.renameSync(tmp, CONFIG_FILE);
    return true;
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch (e) { }   /* rename 失败（目标被占用等）别把临时件留在 DSH_HOME 里 */
    log('写配置失败:', err && err.message);
    return false;
  }
}

/* 配置里的目录在使用时也要过一遍校验：文件可能被手改、被同步工具带来别的机器的路径。 */
function resolveBackupDir() {
  const cfg = readConfig();
  if (cfg.backupDir) {
    const bad = validateBackupTarget(cfg.backupDir);
    if (!bad) return path.resolve(cfg.backupDir);
    log('配置里的备份目录不可用（' + bad + '），本次改用默认目录:', cfg.backupDir);
  }
  return DEFAULT_BACKUP_DIR;
}

function normalizeTarget(raw) {
  const p = typeof raw === 'string' ? raw.trim() : '';
  if (!p) return { ok: false, error: 'empty-path' };
  if (p.includes('\0')) return { ok: false, error: 'bad-path' };
  if (!path.isAbsolute(p)) return { ok: false, error: 'not-absolute' };
  return { ok: true, abs: p };
}

/* 备份目录目标的校验：返回错误码或 null。 */
function validateBackupTarget(raw) {
  const base = normalizeTarget(raw);
  if (!base.ok) return base.error;
  const abs = path.resolve(base.abs);
  if (path.parse(abs).root === abs) return 'bad-target';
  if (isSamePath(abs, DSH_HOME)) return 'bad-target';
  try { if (!fs.statSync(abs).isDirectory()) return 'is-file'; } catch (err) {  }
  return null;
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

/* 往指定目录写一份备份；失败不抛，回 { ok:false, error }。 */
function writeBackupTo(dir, abs) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const base = path.basename(abs);
    let name = base + '.bak-' + stampNow();
    let n = 1;
    while (fs.existsSync(path.join(dir, name))) {
      name = base + '.bak-' + stampNow() + '.' + n;
      n++;
      if (n > 50) return { ok: false, error: 'name-collision' };
    }
    const dest = path.join(dir, name);
    fs.copyFileSync(abs, dest);
    const all = fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && isOwnBackup(e.name))
      .map((e) => {
        let mtimeMs = 0;
        try { mtimeMs = fs.statSync(path.join(dir, e.name)).mtimeMs; } catch (err) {  }
        return { name: e.name, mtimeMs };
      });
    for (const gone of prunePlan(all, KEEP_PER_BASENAME, KEEP_TOTAL)) {
      try { fs.unlinkSync(path.join(dir, gone)); } catch (err) {  }
    }
    return { ok: true, dest };
  } catch (err) {
    return { ok: false, error: String((err && err.code) || (err && err.message) || 'backup-failed').slice(0, 80) };
  }
}

function backupCurrent(abs) {
  const primary = resolveBackupDir();
  const first = writeBackupTo(primary, abs);
  if (first.ok) return first.dest;
  if (!isSamePath(primary, DEFAULT_BACKUP_DIR)) {
    const retry = writeBackupTo(DEFAULT_BACKUP_DIR, abs);
    if (retry.ok) return retry.dest;
  }
  log('备份失败（不阻断保存）', first.error);
  return null;
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

/* 旧目录盘点：bak = 会被搬走的，other = 其它文件 + 子目录。 */
function scanSource(dir) {
  const out = { bak: 0, other: 0 };
  let list;
  try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (err) { return out; }
  for (const e of list) {
    if (e.isFile() && isOwnBackup(e.name)) out.bak++;
    else out.other++;
  }
  return out;
}

/* 目标名被占就不覆盖：依次试 name.1 … name.50，都占则回 null。 */
function pickFreeName(dir, name) {
  let candidate = path.join(dir, name);
  if (!fs.existsSync(candidate)) return candidate;
  for (let n = 1; n <= 50; n++) {
    candidate = path.join(dir, name + '.' + n);
    if (!fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function moveBackups(from, to) {
  const out = { moved: 0, failed: 0, skipped: 0 };
  let list;
  try { list = fs.readdirSync(from, { withFileTypes: true }); } catch (err) { return out; }
  const same = isSamePath(from, to);
  for (const e of list) {
    if (!(e.isFile() && isOwnBackup(e.name))) { out.skipped++; continue; }
    if (same) continue;
    const src = path.join(from, e.name);
    const dest = pickFreeName(to, e.name);
    if (!dest) { out.failed++; continue; }
    try {
      fs.renameSync(src, dest);
      out.moved++;
      continue;
    } catch (err) {  }
    try {
      fs.copyFileSync(src, dest);
    } catch (err) { out.failed++; continue; }
    try { fs.unlinkSync(src); } catch (err) {  }
    out.moved++;
  }
  return out;
}

function planConfigChange(rawTarget) {
  const bad = validateBackupTarget(rawTarget);
  if (bad) return { ok: false, error: bad };
  const to = path.resolve(String(rawTarget).trim());
  const from = resolveBackupDir();
  if (isInsideDir(to, from)) return { ok: false, error: 'nested-dir' };
  const same = isSamePath(from, to);
  const scan = scanSource(from);
  return {
    ok: true,
    dryRun: true,
    from,
    to,
    willMove: same ? 0 : scan.bak,
    skipped: scan.other,
    toExists: isDir(to),
    toBackupCount: countBackups(to),
    isDefault: isSamePath(to, DEFAULT_BACKUP_DIR),
  };
}

function applyConfigChange(rawTarget) {
  const bad = validateBackupTarget(rawTarget);
  if (bad) return { ok: false, error: bad };
  const to = path.resolve(String(rawTarget).trim());
  const from = resolveBackupDir();
  if (isInsideDir(to, from)) return { ok: false, error: 'nested-dir' };
  try {
    fs.mkdirSync(to, { recursive: true });
  } catch (err) {
    return { ok: false, error: 'mkdir-failed' };
  }
  const probe = path.join(to, '.dsh-sp-probe-' + process.pid + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.tmp');
  try {
    fs.writeFileSync(probe, 'ok');
  } catch (err) {
    return { ok: false, error: 'not-writable' };
  }
  try { fs.unlinkSync(probe); } catch (err) {  }
  const moved = moveBackups(from, to);
  /* 配置写不进去时不许报成功：否则界面说「已改到新路径」，实际下次备份仍落旧目录。 */
  if (!writeConfig({ backupDir: to })) {
    return {
      ok: false,
      error: 'config-write-failed',
      backupDir: from,
      moved: moved.moved,
      failed: moved.failed,
      skipped: moved.skipped,
    };
  }
  return {
    ok: true,
    backupDir: to,
    moved: moved.moved,
    failed: moved.failed,
    skipped: moved.skipped,
    backupCount: countBackups(to),
  };
}

function configStatus() {
  const backupDir = resolveBackupDir();
  return {
    ok: true,
    backupDir,
    defaultDir: DEFAULT_BACKUP_DIR,
    isDefault: isSamePath(backupDir, DEFAULT_BACKUP_DIR),
    exists: isDir(backupDir),
    backupCount: countBackups(backupDir),
  };
}

/* POST 体由 handler 自己读流（lib/index.js 只把 req 原样递进来）。 */
function readJsonBody(req, limit) {
  return new Promise((resolve) => {
    if (!req || typeof req.on !== 'function') { resolve(null); return; }
    let data = '';
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > limit) { finish(null); try { req.destroy(); } catch (err) {  } }
    });
    req.on('end', () => { if (!done) { try { finish(JSON.parse(data || '{}')); } catch (err) { finish(null); } } });
    req.on('error', () => finish(null));
  });
}

async function configHandler(searchParams, req, res) {
  const method = String((req && req.method) || 'GET').toUpperCase();
  if (method !== 'POST') return { body: configStatus() };
  const ctype = String((req && req.headers && req.headers['content-type']) || '');
  if (!/application\/json/i.test(ctype)) return { body: { ok: false, error: 'bad-json' } };
  const body = await readJsonBody(req, CONFIG_BODY_CAP);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { body: { ok: false, error: 'bad-json' } };
  const raw = body.reset === true ? DEFAULT_BACKUP_DIR : body.backupDir;
  if (body.confirm === true) return { body: applyConfigChange(raw) };
  return { body: planConfigChange(raw) };
}

/* 页面侧上报的时间点，只存进程内存，由 GET /dsh-sp/marks 读回。 */
function marksStore() {
  const g = globalThis;
  if (!Array.isArray(g.__dshSpMarks)) g.__dshSpMarks = [];
  return g.__dshSpMarks;
}

function recordMark(searchParams) {
  try {
    const g = searchParams && typeof searchParams.get === 'function' ? searchParams.get.bind(searchParams) : () => null;
    const box = marksStore();
    box.push({
      n: String(g('n') || '?').slice(0, 40),
      t: Number(g('t')),
      s: Number(g('s')),
      at: Number(g('at')) || Date.now(),
    });
    if (box.length > 400) box.splice(0, box.length - 400);
  } catch (err) {  }
  return { body: { ok: true } };
}

const handlers = {
  stat: (searchParams) => statHandler(searchParams),
  save: (bodyObj) => saveFile({
    abs: bodyObj && bodyObj.abs,
    text: bodyObj && bodyObj.text,
    ifMtimeMs: bodyObj && bodyObj.ifMtimeMs,
    force: !!(bodyObj && bodyObj.force === true),
  }),
  mark: (searchParams) => recordMark(searchParams),
  marks: () => ({ body: { ok: true, marks: marksStore().slice(-200) } }),
  config: (searchParams, req, res) => configHandler(searchParams, req, res),
};

const teardown = function () {  };

return {
  version: VERSION,
  handlers,
  teardown,
  _test: {
    VERSION, MAX_TEXT_BYTES, BACKUP_DIR, DEFAULT_BACKUP_DIR, CONFIG_FILE,
    normalizeTarget, checkWritableFile, prunePlan, stampNow, saveFile, statHandler,
    isSamePath, isOwnBackup, isInsideDir,
    readConfig, writeConfig, resolveBackupDir, configHandler,
    planConfigChange, applyConfigChange, moveBackups,
    handlers,
  },
};
