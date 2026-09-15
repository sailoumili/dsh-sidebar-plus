'use strict';
const react = ENV.react;
const VERSION = '0.3.6';

const zh = {
  'viewer.label': '源编辑',
  'bar.edit': '编辑',
  'bar.find': '搜索',
  'bar.save': '保存',
  'bar.exit': '退出编辑',
  'bar.forcedit': '强制保存',
  'bar.reload': '重载最新',
  'finding.no': '无匹配',
  'loading': '正在读取…',
  'notloaded': '只加载了前面部分，搜索仅限已加载内容；编辑作用于整个文件。',
  'font.in': '缩小字号（或 Ctrl+向下滚轮）',
  'font.out': '放大字号（或 Ctrl+向上滚轮）',
  'font.reset': '点击恢复默认 14px',
};
const en = {
  'viewer.label': 'Source',
  'bar.edit': 'Edit',
  'bar.find': 'Find',
  'bar.save': 'Save',
  'bar.exit': 'Exit',
  'bar.forcedit': 'Save anyway',
  'bar.reload': 'Reload',
  'finding.no': 'No matches',
  'loading': 'Loading…',
  'notloaded': 'Only a prefix is loaded; find covers loaded lines, edit uses the whole file.',
  'font.in': 'Smaller text (or Ctrl+wheel down)',
  'font.out': 'Larger text (or Ctrl+wheel up)',
  'font.reset': 'Click to reset to 14px',
};

let sharedFontPx = 14;
try {
  const raw = window.localStorage.getItem('dsh-sidebar-plus.fontPx');
  if (raw === '13') { window.localStorage.removeItem('dsh-sidebar-plus.fontPx'); }
  const v = parseInt(raw, 10);
  if (raw !== '13' && v >= 10 && v <= 28) sharedFontPx = v;
} catch (e) { }

const TITLE = '源编辑';
const SELF_ID = 'dsh-sidebar-plus/source';
let fontPx = sharedFontPx;
const fontSubs = new Set();
let pendingEdit = false;
function consumePendingEdit() { const v = pendingEdit; pendingEdit = false; return v; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function setFontPxGlobal(v) {
  const n = Math.min(28, Math.max(10, Math.round(v)));
  if (n === fontPx) return;
  fontPx = n;
  sharedFontPx = n;
  try { window.localStorage.setItem('dsh-sidebar-plus.fontPx', String(n)); } catch (e) { }
  for (const f of fontSubs) { try { f(n); } catch (e) { } }
}

const OFFICIAL_ZOOM_KEY = 'dsh-sidebar-plus.officialZoom';
let officialZoom = 1;
try {
  const z = parseFloat(window.localStorage.getItem(OFFICIAL_ZOOM_KEY));
  if (z >= 0.5 && z <= 2.5) officialZoom = z;
} catch (e) { }
let zoomUi = null;
function setOfficialZoom(v) {
  const n = Math.min(2.5, Math.max(0.5, Math.round(v * 100) / 100));
  if (n === officialZoom) return;
  officialZoom = n;
  try { window.localStorage.setItem(OFFICIAL_ZOOM_KEY, String(n)); } catch (e) { }
  if (zoomUi) { try { zoomUi(); } catch (e) { } }
}

const CSS = [
  '.dshsp-root{display:flex;flex-direction:column;flex:auto;width:100%;min-width:0;height:100%;min-height:0;overflow:hidden}',
  '.dshsp-bar{display:flex;align-items:center;gap:6px;flex:none;min-height:30px;padding:2px 10px;font-size:12px;font-family:var(--dsw-font-family,system-ui,-apple-system,"Segoe UI",sans-serif);border-bottom:.5px solid var(--dsw-alias-border-l3,rgba(128,128,128,.25))}',
  '.dshsp-status{opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:auto;text-align:right}',
  '.dshsp-btn{flex:none;display:inline-flex;align-items:center;gap:3px;border:none;border-radius:5px;background:transparent;color:inherit;font:inherit;font-size:12px;line-height:1;padding:3px 8px;cursor:pointer}',
  '.dshsp-btn:hover{background:rgba(128,128,128,.16)}',
  '.dshsp-btn[disabled]{opacity:.45;cursor:default}',
  '.dshsp-btn-primary{background:rgba(64,150,255,.16)}',
  '.dshsp-btn-on{font-weight:700;background:rgba(64,150,255,.16)}',
  '.dshsp-btn-on:hover{background:rgba(64,150,255,.26)}',
  '.dshsp-find{flex:none;display:flex;align-items:center;gap:4px;padding:4px 10px;font-family:var(--dsw-font-family,system-ui,-apple-system,"Segoe UI",sans-serif);border-bottom:.5px solid var(--dsw-alias-border-l3,rgba(128,128,128,.25));font-size:12px}',
  '.dshsp-find input{flex:1;min-width:40px;border:.5px solid rgba(128,128,128,.4);border-radius:5px;background:transparent;color:inherit;font:inherit;padding:2px 6px;outline:none}',
  '.dshsp-find input:focus{border-color:rgba(64,150,255,.7)}',
  '.dshsp-count{flex:none;min-width:52px;text-align:center;opacity:.8;font-variant-numeric:tabular-nums}',
  '.dshsp-scroll{flex:auto;min-height:0;overflow:auto;position:relative;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace);font-size:var(--dshsp-fs,14px);line-height:1.6}',
  '.dshsp-wrap .dshsp-tx{white-space:pre-wrap;word-break:break-word}',
  '.dshsp-line{display:flex;align-items:flex-start}',
  '.dshsp-line-hit{background:rgba(255,160,40,.12)}',
  '.dshsp-ln{flex:none;width:3.4em;padding-right:.9em;text-align:right;color:rgba(128,128,128,.6);user-select:none;white-space:pre;font-variant-numeric:tabular-nums;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace);font-size:var(--dshsp-fs,14px);line-height:1.6}',
  '.dshsp-tx{white-space:pre;min-width:0}',
  '.dshsp-mark{background:rgba(255,205,0,.45);border-radius:2px}',
  '.dshsp-mark-cur{background:rgba(255,130,20,.85)}',
  '.dshsp-b{font-weight:700}',
  '.dshsp-i{font-style:italic}',
  '.dshsp-s{text-decoration:line-through;opacity:.75}',
  '.dshsp-code{background:rgba(128,128,128,.15);border-radius:3px}',
  '.dshsp-h{font-weight:700}',
  '.dshsp-h1{font-size:1.45em}',
  '.dshsp-h2{font-size:1.28em}',
  '.dshsp-h3{font-size:1.15em}',
  '.dshsp-h4,.dshsp-h5,.dshsp-h6{font-size:1.05em}',
  '.dshsp-quote{opacity:.8}',
  '.dshsp-task{color:#4aa3ff}',
  '.dshsp-foot{flex:none;padding:3px 12px;font-size:11px;opacity:.65;border-top:.5px solid rgba(128,128,128,.2)}',
  '.dshsp-editrow{display:flex;flex:auto;min-height:0;position:relative}',
  '.dshsp-egut{flex:none;overflow:hidden;width:3.6em;padding:6px .9em 6px 0;text-align:right;color:rgba(128,128,128,.6);user-select:none;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace);font-size:var(--dshsp-fs,14px);line-height:1.6;background:transparent}',
  '.dshsp-ta{flex:auto;min-width:0;border:none;outline:none;resize:none;background:transparent;color:inherit;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace);font-size:var(--dshsp-fs,14px);line-height:1.6;padding:6px 10px;white-space:pre;overflow:auto;tab-size:2}',
  '.dshsp-conflict{color:#ff9040}',
  '.dshsp-ogroup{flex:none;display:flex;flex-direction:column;min-width:0}',
  '[data-document-preview]>[data-textpreview-body]>*{zoom:var(--dshsp-zoom,1)}',
  '[data-document-preview$="/text"][data-dshsp-lineno="on"]{--dshsp-lnch:2;--dshsp-lnw:calc(var(--dshsp-lnch) * 1ch);--dshsp-lnpad:8px;--dshsp-lngap:12px}',
  '[data-document-preview$="/text"][data-dshsp-lineno="on"] [data-textpreview-line]{padding-left:calc(var(--dshsp-lnpad) + var(--dshsp-lnw) + var(--dshsp-lngap));text-indent:calc(-1 * (var(--dshsp-lnw) + var(--dshsp-lngap)))}',
  '[data-document-preview$="/text"][data-dshsp-lineno="on"] [data-textpreview-line]::before{content:attr(data-textpreview-line);display:inline-block;width:var(--dshsp-lnw);padding-right:var(--dshsp-lngap);text-align:right;color:var(--dsw-alias-label-tertiary,rgba(128,128,128,.6));user-select:none;-webkit-user-select:none;font-variant-numeric:tabular-nums}',
  '.dshsp-ipwrap{flex:auto;display:flex;min-height:0;min-width:0}',
  '::highlight(dshsp-find){background:rgba(255,205,0,.45)}',
  '::highlight(dshsp-find-cur){background:rgba(255,130,20,.85)}',
].join('\n');

const FILE_ADDRESS_PREFIX = 'dsh-resource://file/';

function parseFileAddress(address) {
  try {
    if (typeof address !== 'string' || !address.startsWith(FILE_ADDRESS_PREFIX)) return void 0;
    const end = address.search(/[?#]/);
    const parts = address.slice(FILE_ADDRESS_PREFIX.length, end === -1 ? void 0 : end).split('/');
    const scope = parts[0];
    const rest = parts.slice(1);
    if (scope === 'session') {
      const id = rest[0];
      const segments = rest.slice(1);
      if (id === void 0 || id === '' || segments.length === 0) return void 0;
      return { scope: scope, sessionId: decodeURIComponent(id), path: segments.map(decodeURIComponent).join('/') };
    }
    if (scope === 'absolute') {
      const unc = rest[0] === '' && rest.length > 1;
      const segments = (unc ? rest.slice(1) : rest).map(decodeURIComponent);
      if (segments.length === 0 || segments[0] === '') return void 0;
      if (unc) return { scope: scope, path: '//' + segments.join('/') };
      return { scope: scope, path: /^[A-Za-z]:$/.test(segments[0]) ? segments.join('/') : '/' + segments.join('/') };
    }
    return void 0;
  } catch (e) {
    return void 0;
  }
}

function splitLines(text) {
  return String(text == null ? '' : text).split('\n');
}

function computeMatches(lines, query, caseSensitive) {
  const out = [];
  const q = String(query == null ? '' : query);
  if (!q) return out;
  const needle = caseSensitive ? q : q.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const hay = caseSensitive ? String(lines[i]) : String(lines[i]).toLowerCase();
    let from = 0;
    for (;;) {
      const at = hay.indexOf(needle, from);
      if (at === -1) break;
      out.push({ line: i + 1, start: at, len: needle.length });
      if (out.length >= 20000) return out;
      from = at + needle.length;
    }
  }
  return out;
}

function matchesByLine(matches) {
  const map = {};
  for (const m of matches) {
    if (!map[m.line]) map[m.line] = [];
    map[m.line].push(m);
  }
  return map;
}

const INLINE_RE = /(`[^`\n]*`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g; /* ref-check:忽略 */
function segmentMarkdown(line) {
  const rest0 = String(line);
  const chunks = [];
  let last = 0;
  let m;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(rest0)) !== null) {
    if (m.index > last) chunks.push({ k: 'plain', s: rest0.slice(last, m.index) });
    const tok = m[0];
    let k = 'code';
    if (tok.startsWith('**')) k = 'bold';
    else if (tok.startsWith('~~')) k = 'strike';
    else if (tok.startsWith('_') || tok.startsWith('*')) k = 'italic';
    chunks.push({ k: k, s: tok });
    last = m.index + tok.length;
  }
  if (last < rest0.length) chunks.push({ k: 'plain', s: rest0.slice(last) });
  if (chunks.length === 0) chunks.push({ k: 'plain', s: '' });
  return chunks;
}

const INLINE_CLASS = { bold: 'dshsp-b', italic: 'dshsp-i', strike: 'dshsp-s', code: 'dshsp-code' };
function markChunk(kind, text, key) {
  const cls = INLINE_CLASS[kind];
  return cls ? react.createElement('span', { key: key, className: cls }, text) : text;
}

function headingLevel(line) {
  const m = /^(#{1,6})(\s|$)/.exec(String(line));
  return m ? m[1].length : 0;
}
function isQuoteLine(line) { return /^\s*>/.test(String(line)); }
function isTaskLine(line) { return /^\s*[-*+]\s+\[[ xX]\]/.test(String(line)); }

function overlayMarks(segs, ranges, activeRange) {
  const out = [];
  let pos = 0;
  for (const seg of segs) {
    const s = pos;
    const e = pos + seg.s.length;
    pos = e;
    let cur = 0;
    for (const r of ranges) {
      const a = Math.max(r.start, s) - s;
      const b = Math.min(r.start + r.len, e) - s;
      if (a >= b) continue;
      if (cur < a) out.push({ kind: seg.k, text: seg.s.slice(cur, a), mark: false, cur: false });
      out.push({ kind: seg.k, text: seg.s.slice(a, b), mark: true, cur: activeRange ? (r === activeRange) : false });
      cur = b;
    }
    if (cur < seg.s.length) out.push({ kind: seg.k, text: seg.s.slice(cur), mark: false, cur: false });
  }
  return out;
}

function eolOf(text) { return String(text).indexOf('\r\n') >= 0 ? '\r\n' : '\n'; }
function bomOf(text) { return String(text).charCodeAt(0) === 0xfeff; }
function toEditorText(text) {
  let t = String(text);
  const bom = bomOf(t);
  if (bom) t = t.slice(1);
  return { text: t.split('\r\n').join('\n'), crlf: eolOf(t) === '\r\n', bom: bom };
}
function fromEditorText(draft, meta) {
  let t = String(draft);
  if (meta && meta.crlf) t = t.split('\n').join('\r\n');
  if (meta && meta.bom) t = '\uFEFF' + t;
  return t;
}
function humanBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  if (v < 1024) return v + ' B';
  if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KB';
  return (v / 1024 / 1024).toFixed(2) + ' MB';
}
function msgOf(e) { return String((e && (e.message || e)) || 'unknown').slice(0, 160); }

async function readWholeText(address, signal) {
  const file = parseFileAddress(address);
  if (!file || file.scope !== 'session') throw new Error('无法定位所属会话（只支持会话工作区内的文件）');
  const rem = ENV.remote;
  if (!rem || !rem.workspaceFiles || typeof rem.workspaceFiles.readAll !== 'function') throw new Error('连接未就绪，稍后再试');
  const args = signal ? [file.sessionId, file.path, signal] : [file.sessionId, file.path];
  const res = await rem.workspaceFiles.readAll.apply(rem.workspaceFiles, args);
  if (!res || res.ok !== true || !res.value) {
    throw new Error('读取完整文件失败：' + msgOf(res && res.error ? res.error : res));
  }
  const v = res.value;
  let bytes;
  try { bytes = Uint8Array.from(atob(v.data), (c) => c.charCodeAt(0)); } catch (e) { throw new Error('文件内容解码失败'); }
  let full;
  try { full = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) { throw new Error('非 UTF-8 文本文件，编辑可能损坏内容，已阻止'); }
  const norm = toEditorText(full);
  let mtimeMs = 0;
  try {
    const st = await fetch('/dsh-sp/stat?abs=' + encodeURIComponent(v.absolutePath), { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    if (st && st.ok) mtimeMs = st.mtimeMs;
  } catch (e) { }
  return { text: norm.text, crlf: norm.crlf, bom: norm.bom, abs: v.absolutePath, mtimeMs: mtimeMs };
}

function saveRequestBody(abs, text, mtimeMs, force) {
  const body = { abs: abs, text: text };
  if (Number.isFinite(mtimeMs) && mtimeMs > 0) body.ifMtimeMs = mtimeMs;
  if (force) body.force = true;
  return body;
}

async function postSave(body) {
  return fetch('/dsh-sp/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((x) => x.json()).catch((e) => ({ ok: false, error: 'network:' + msgOf(e) }));
}

const EMPTY = [];

function SourceBody(props) {
  const h = react.createElement;
  const useState = react.useState, useRef = react.useRef, useEffect = react.useEffect, useMemo = react.useMemo;
  const resourceAddress = props.resourceAddress;
  const content = props.content;
  const wrap = props.wrap !== false;
  const t = typeof props.t === 'function' ? props.t : null;
  const label = function (key) {
    try { if (t) { const v = t(key); if (typeof v === 'string' && v) return v; } } catch (e) {  }
    return (zh[key] != null ? zh[key] : (en[key] != null ? en[key] : key));
  };

  const [mode, setMode] = useState('view');
  const [override, setOverride] = useState(null);
  const [draft, setDraft] = useState('');
  const [draftInit, setDraftInit] = useState('');
  const [meta, setMeta] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [find, setFind] = useState({ open: false, q: '', idx: 0, cs: false });

  const scrollerEl = useRef(null);
  const inputEl = useRef(null);
  const egutEl = useRef(null);
  const statusTimer = useRef(null);
  const acRef = useRef(null);
  const rootEl = useRef(null);
  const [fpx, setFpx] = useState(fontPx);
  useEffect(() => {
    const f = (v) => setFpx(v);
    fontSubs.add(f);
    return () => { fontSubs.delete(f); };
  }, []);
  const bumpFont = function (d) { setFontPxGlobal(fontPx + d); };
  const resetFont = function () { setFontPxGlobal(14); };
  const fontControls = function () {
    return h(react.Fragment, null,
      h('button', { className: 'dshsp-btn', type: 'button', title: label('font.in'), onClick: () => bumpFont(-1) }, 'A−'),
      h('button', { className: 'dshsp-btn', type: 'button', title: label('font.reset'), onClick: resetFont, style: { minWidth: '42px', justifyContent: 'center' } }, fpx + 'px'),
      h('button', { className: 'dshsp-btn', type: 'button', title: label('font.out'), onClick: () => bumpFont(1) }, 'A+'));
  };

  const flash = function (msg) {
    setStatus(String(msg || ''));
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(''), 4000);
  };

  const attachScrollport = function (el) {
    scrollerEl.current = el;
    const sp = props.scrollportRef;
    try {
      if (typeof sp === 'function') sp(el);
      else if (sp && typeof sp === 'object') sp.current = el;
    } catch (e) {  }
  };

  const isText = content && content.kind === 'text';
  const text = override != null ? override : (isText ? content.text : '');
  const lines = useMemo(() => splitLines(text), [text]);
  const eof = override != null ? true : !!(isText && content.eof);
  const matches = useMemo(
    () => (find.open ? computeMatches(lines, find.q, find.cs) : EMPTY),
    [lines, find.open, find.q, find.cs]
  );
  const byLine = useMemo(() => matchesByLine(matches), [matches]);
  const safeIdx = matches.length > 0 ? Math.min(Math.max(find.idx, 0), matches.length - 1) : 0;
  const active = matches.length > 0 ? matches[safeIdx] : null;

  useEffect(() => {
    if (override == null || !isText) return;
    if (content.text !== override) setOverride(null);
  }, [content && content.text]);

  useEffect(() => {
    if (!active || mode !== 'view') return;
    const sc = scrollerEl.current;
    if (!sc) return;
    const el = sc.querySelector('[data-textpreview-line="' + active.line + '"]');
    if (el) sc.scrollTop = Math.max(0, el.offsetTop - 24);
  }, [active && active.line, active && active.start, safeIdx, mode, matches.length]);

  useEffect(() => {
    if (find.open && inputEl.current) {
      try { inputEl.current.focus(); inputEl.current.select(); } catch (e) {  }
    }
  }, [find.open]);

  const step = function (d) {
    setFind((f) => {
      if (!matches.length) return Object.assign({}, f, { idx: 0 });
      const n = matches.length;
      return Object.assign({}, f, { idx: ((f.idx + d) % n + n) % n });
    });
  };
  const closeFind = function () { setFind((f) => Object.assign({}, f, { open: false })); };
  const openFind = function () { setFind((f) => Object.assign({}, f, { open: true, idx: 0 })); };

  const readFileNow = async function () {
    const controller = new AbortController();
    if (acRef.current) { try { acRef.current.abort(); } catch (e) { } }
    acRef.current = controller;
    return await readWholeText(resourceAddress, controller.signal);
  };

  const applyLoaded = function (r) {
    setMeta({ abs: r.abs, mtimeMs: r.mtimeMs, crlf: r.crlf, bom: r.bom });
    setDraft(r.text);
    setDraftInit(r.text);
    setConflict(false);
  };

  const startEdit = async function () {
    if (busy) return;
    setBusy(true);
    try {
      applyLoaded(await readFileNow());
      setMode('edit');
      closeFind();
    } catch (e) {
      flash(msgOf(e));
    } finally {
      setBusy(false);
    }
  };

  const startEditRef = useRef(null);
  startEditRef.current = startEdit;
  useEffect(() => {
    if (consumePendingEdit() && startEditRef.current) startEditRef.current();
  }, []);

  const doSave = async function (force) {
    if (busy || !meta) return false;
    setBusy(true);
    try {
      const out = fromEditorText(draft, meta);
      const r = await postSave(saveRequestBody(meta.abs, out, meta.mtimeMs, force));
      if (r && r.ok) {
        setOverride(out);
        setMode('view');
        setConflict(false);
        setMeta((m) => (m ? Object.assign({}, m, { mtimeMs: r.mtimeMs }) : m));
        flash('已保存 ' + humanBytes(r.bytes) + (r.backup ? '（旧版已自动备份）' : ''));
        return true;
      }
      if (r && r.error === 'changed') {
        setConflict(true);
        flash('文件在别处被改过，请选择：');
        return false;
      }
      flash('保存失败：' + msgOf(r && r.error ? r.error : r));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const exitEdit = function () {
    if (draft !== draftInit && typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('有未保存的修改，确定放弃并退出编辑吗？')) return;
    }
    setMode('view');
    setConflict(false);
  };

  const reloadLatest = async function () {
    if (busy) return;
    setBusy(true);
    try {
      applyLoaded(await readFileNow());
      setOverride(null);
      flash('已重载磁盘最新内容');
      setMode('edit');
    } catch (e) {
      flash(msgOf(e));
    } finally {
      setBusy(false);
    }
  };

  const actions = useRef({});
  actions.current = {
    mode: mode, findOpen: find.open,
    openFind: openFind, closeFind: closeFind, step: step,
    doSave: doSave, exitEdit: exitEdit,
  };
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = function (e) {
      try {
        const el = scrollerEl.current;
        if (!el || el.offsetParent === null || !el.isConnected) return;
        const a = actions.current;
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && !e.altKey && (e.key === 'f' || e.key === 'F')) {
          e.preventDefault(); e.stopPropagation();
          if (a.mode === 'edit') { flash('请先退出编辑再搜索'); return; }
          a.openFind();
          return;
        }
        if (ctrl && !e.altKey && (e.key === 's' || e.key === 'S')) {
          if (a.mode === 'edit') { e.preventDefault(); e.stopPropagation(); a.doSave(false); }
          return;
        }
        if (e.key === 'F3') {
          if (a.findOpen) { e.preventDefault(); a.step(e.shiftKey ? -1 : 1); }
          return;
        }
        if (a.findOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          if (inputEl.current && e.target === inputEl.current) return;
          e.preventDefault(); a.step(e.key === 'ArrowDown' ? 1 : -1);
          return;
        }
        if (e.key === 'Escape') {
          if (a.findOpen) { e.preventDefault(); a.closeFind(); }
          else if (a.mode === 'edit') { a.exitEdit(); }
        }
      } catch (err) {  }
    };
    window.addEventListener('keydown', onKey, true);
    return () => { try { window.removeEventListener('keydown', onKey, true); } catch (e) {  } };
  }, []);

  useEffect(() => {
    const el = rootEl.current;
    if (!el || typeof el.addEventListener !== 'function') return;
    const onWheel = function (e) {
      try {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        if (el.offsetParent === null || !el.isConnected) return;
        e.preventDefault(); e.stopPropagation();
        bumpFont(e.deltaY < 0 ? 1 : -1);
      } catch (err) { }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { try { el.removeEventListener('wheel', onWheel); } catch (e) { } };
  }, []);

  useEffect(() => () => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    if (acRef.current) { try { acRef.current.abort(); } catch (e) {  } }
  }, []);

  if (!isText && override == null) {
    if (content && content.kind === 'bytes') return null;
    return h('div', { className: 'dshsp-root' }, h('div', { className: 'dshsp-status' }, label('loading')));
  }

  let body;
  if (mode === 'edit') {
    const n = draft.split('\n').length;
    const gut = [];
    for (let i = 1; i <= n; i++) gut.push(h('div', { key: i }, String(i)));
    const dirty = draft !== draftInit;
    body = h(react.Fragment, null,
      h('div', { className: 'dshsp-bar' },
        h('button', { className: 'dshsp-btn dshsp-btn-primary', type: 'button', disabled: busy, onClick: () => doSave(false) }, label('bar.save') + (dirty ? ' *' : '')),
        h('button', { className: 'dshsp-btn', type: 'button', disabled: busy, onClick: exitEdit }, label('bar.exit')),
        fontControls(),
        conflict
          ? h(react.Fragment, null,
              h('button', { className: 'dshsp-btn dshsp-conflict', type: 'button', disabled: busy, onClick: () => doSave(true) }, label('bar.forcedit')),
              h('button', { className: 'dshsp-btn dshsp-conflict', type: 'button', disabled: busy, onClick: reloadLatest }, label('bar.reload')))
          : null,
        h('span', { className: 'dshsp-status' }, status)
      ),
      h('div', { className: 'dshsp-editrow' },
        h('div', { className: 'dshsp-egut', ref: egutEl }, gut),
        h('textarea', {
          className: 'dshsp-ta',
          ref: attachScrollport,
          value: draft,
          spellCheck: false,
          wrap: 'off',
          readOnly: busy,
          onChange: (e) => setDraft(e.target.value),
          onScroll: (e) => { if (egutEl.current) egutEl.current.scrollTop = e.target.scrollTop; },
        })
      )
    );
  } else {
    const lineNodes = [];
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const num = i + 1;
      const ranges = byLine[num] || EMPTY;
      const level = headingLevel(raw);
      const segs = level > 0 || isQuoteLine(raw) ? [{ k: 'plain', s: raw }] : segmentMarkdown(raw);
      const parts = ranges.length ? overlayMarks(segs, ranges, active && active.line === num ? active : null) : null;
      const cls = ['dshsp-line'];
      if (level > 0) cls.push('dshsp-h', 'dshsp-h' + level);
      if (isQuoteLine(raw)) cls.push('dshsp-quote');
      if (isTaskLine(raw)) cls.push('dshsp-task');
      if (active && active.line === num) cls.push('dshsp-line-hit');
      const kids = [];
      if (parts) {
        for (let p = 0; p < parts.length; p++) {
          const it = parts[p];
          if (it.mark) kids.push(h('span', { key: p, className: 'dshsp-mark' + (it.cur ? ' dshsp-mark-cur' : '') }, it.text));
          else kids.push(markChunk(it.kind, it.text, p));
        }
      } else {
        for (let p = 0; p < segs.length; p++) kids.push(markChunk(segs[p].k, segs[p].s, p));
      }
      kids.push('\n');
      lineNodes.push(h('div', { key: num, className: cls.join(' '), 'data-textpreview-line': num },
        h('span', { className: 'dshsp-ln' }, String(num)),
        h('span', { className: 'dshsp-tx' }, kids)));
    }
    body = h(react.Fragment, null,
      h('div', { className: 'dshsp-bar' },
        h('button', { className: 'dshsp-btn dshsp-btn-primary', type: 'button', disabled: busy, onClick: startEdit }, label('bar.edit')),
        h('button', { className: 'dshsp-btn', type: 'button', disabled: busy, onClick: openFind }, label('bar.find')),
        fontControls(),
        h('span', { className: 'dshsp-status' }, status)
      ),
      find.open
        ? h('div', { className: 'dshsp-find' },
            h('input', {
              ref: inputEl,
              type: 'text',
              value: find.q,
              placeholder: '搜索（↓/Enter 下一个，↑/Shift+Enter 上一个，Esc 关闭）',
              onChange: (e) => setFind((f) => Object.assign({}, f, { q: e.target.value, idx: 0 })),
              onKeyDown: (e) => {
                if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); step(1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); step(-1); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFind(); }
              },
            }),
            h('span', { className: 'dshsp-count' }, find.q ? (matches.length ? (safeIdx + 1) + ' / ' + matches.length : label('finding.no')) : ''),
            h('button', { className: 'dshsp-btn', type: 'button', title: '区分大小写', onClick: () => setFind((f) => Object.assign({}, f, { cs: !f.cs, idx: 0 })) }, 'Aa' + (find.cs ? '✓' : '')),
            h('button', { className: 'dshsp-btn', type: 'button', title: '上一个 (↑)', onClick: () => step(-1) }, '↑'),
            h('button', { className: 'dshsp-btn', type: 'button', title: '下一个 (↓)', onClick: () => step(1) }, '↓'),
            h('button', { className: 'dshsp-btn', type: 'button', title: '关闭 (Esc)', onClick: closeFind }, '✕')
          )
        : null,
      h('div', {
        className: 'dshsp-scroll' + (wrap ? ' dshsp-wrap' : ''),
        ref: attachScrollport,
        'data-dshsp-source': true,
      }, lineNodes),
      !eof && !status
        ? h('div', { className: 'dshsp-foot' }, label('notloaded'))
        : null
    );
  }

  return h('div', { className: 'dshsp-root', ref: rootEl, 'data-dshsp-ver': VERSION, style: { '--dshsp-fs': fpx + 'px' } }, body);
}

const ff = { open: false, q: '', cs: false, ranges: [], idx: 0 };
let enh = null;

function walkTextRanges(container, query, caseSensitive) {
  const out = [];
  const q = String(query || '');
  if (!q || typeof document === 'undefined' || typeof document.createTreeWalker !== 'function') return out;
  const nodes = [];
  let all = '';
  const walker = document.createTreeWalker(container, 4, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return 3;
      const tag = p.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') return 3;
      return 1;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.nodeValue || '';
    if (!t) continue;
    nodes.push({ node: n, start: all.length });
    all += t;
  }
  const hay = caseSensitive ? all : all.toLowerCase();
  const needle = caseSensitive ? q : q.toLowerCase();
  let from = 0;
  while (out.length < 2000) {
    const at = hay.indexOf(needle, from);
    if (at === -1) break;
    from = at + needle.length;
    let sn = null, so = 0, en2 = null, eo = 0;
    for (const e of nodes) {
      const l = (e.node.nodeValue || '').length;
      if (!sn && at < e.start + l) { sn = e.node; so = at - e.start; }
      if (at + needle.length <= e.start + l) { en2 = e.node; eo = at + needle.length - e.start; break; }
    }
    if (!sn || !en2) continue;
    try {
      const r = document.createRange();
      r.setStart(sn, so);
      r.setEnd(en2, eo);
      out.push(r);
    } catch (e) { }
  }
  return out;
}

function clearFfHighlights() {
  try {
    if (window.CSS && window.CSS.highlights) {
      window.CSS.highlights.delete('dshsp-find');
      window.CSS.highlights.delete('dshsp-find-cur');
    }
  } catch (e) { }
}
function paintFf() {
  try {
    if (!window.CSS || !window.CSS.highlights || typeof window.Highlight !== 'function') return;
    if (!ff.ranges.length) { clearFfHighlights(); return; }
    window.CSS.highlights.set('dshsp-find', new window.Highlight(...ff.ranges));
    const cur = ff.ranges[ff.idx];
    if (cur) window.CSS.highlights.set('dshsp-find-cur', new window.Highlight(cur));
    else window.CSS.highlights.delete('dshsp-find-cur');
  } catch (e) { }
}
function revealFf() {
  try {
    const r = ff.ranges[ff.idx];
    if (!r) return;
    const host = r.startContainer && r.startContainer.parentElement;
    if (host && typeof host.scrollIntoView === 'function') host.scrollIntoView({ block: 'center', inline: 'nearest' });
  } catch (e) { }
}

function enhanceStart() {
  if (enh) return;
  if (typeof document === 'undefined' || !document.body) { if (typeof setTimeout === 'function') setTimeout(enhanceStart, 500); return; }
  try { const legacy = document.querySelector('style[data-plugin-css="dsh-sidebar-plus-official"]'); if (legacy) legacy.remove(); } catch (e) { }

  let attachedPane = null;
  let msgTimer = null;

  function mkBtn(txt, title, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dshsp-btn';
    b.title = title;
    b.textContent = txt;
    b.addEventListener('click', fn);
    return b;
  }

  function paneNow() {
    const pane = document.querySelector('[data-document-preview]');
    if (!pane || !pane.isConnected || pane.getAttribute('data-document-preview') === SELF_ID) return null;
    const body = pane.querySelector('[data-textpreview-body]');
    if (!body) return null;
    return { pane: pane, body: body };
  }

  function paneAllowsEdit(pane) {
    try {
      let p = '';
      const f = parseFileAddress(pane.getAttribute('data-textpreview-url') || '');
      if (f && f.path) p = f.path;
      if (!p) {
        const pathEl = pane.querySelector('[data-textpreview-path]');
        if (pathEl) p = pathEl.textContent || '';
      }
      const m = /\.([^./\\]+)\s*$/.exec(String(p).replace(/\\/g, '/').trim());
      const ext = m ? m[1].toLowerCase() : '';
      return ext === 'md' || ext === 'markdown';
    } catch (e) { return false; }
  }

  const group = document.createElement('div');
  group.className = 'dshsp-ogroup';
  group.setAttribute('data-dshsp-official', '1');
  const bar = document.createElement('div');
  bar.className = 'dshsp-bar';
  const findRow = document.createElement('div');
  findRow.className = 'dshsp-find';
  group.appendChild(bar);
  group.appendChild(findRow);
  const status = document.createElement('span');
  status.className = 'dshsp-status';
  function barFlash(text) {
    status.textContent = String(text || '');
    if (msgTimer) clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { status.textContent = ''; }, 4000);
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '搜索（↓/Enter 下一个，↑/Shift+Enter 上一个，Esc 关闭）';
  const count = document.createElement('span');
  count.className = 'dshsp-count';
  function renderFf() {
    count.textContent = ff.q ? (ff.ranges.length ? (ff.idx + 1) + ' / ' + ff.ranges.length : '无匹配') : '';
  }
  function runFf() {
    const cur = paneNow();
    ff.ranges = (cur && ff.q) ? walkTextRanges(cur.body, ff.q, ff.cs) : [];
    if (ff.idx >= ff.ranges.length) ff.idx = 0;
    paintFf(); revealFf(); renderFf();
  }
  function stepFf(d) {
    if (!ff.ranges.length) { runFf(); return; }
    const n = ff.ranges.length;
    ff.idx = ((ff.idx + d) % n + n) % n;
    paintFf(); revealFf(); renderFf();
  }
  function openFind() {
    ff.open = true;
    sync();
    try { input.focus(); input.select(); } catch (e) { }
    if (ff.q) runFf(); else renderFf();
  }
  function closeFind() {
    ff.open = false;
    clearFfHighlights();
    renderFf();
    sync();
  }
  async function gotoSourceEdit() {
    try {
      const pane = document.querySelector('[data-document-preview]');
      if (!pane) return;
      if (pane.getAttribute('data-document-preview') === SELF_ID) { pendingEdit = true; return; }
      const menuBtn = pane.querySelector('[data-document-viewer-menu]');
      if (!menuBtn) { barFlash('请先切到「源编辑」视图'); return; }
      menuBtn.click();
      await sleep(250);
      const item = [...document.querySelectorAll('button,[role="menuitem"],[role="option"]')]
        .find((el) => ((el.textContent || '').trim() === TITLE) && el !== menuBtn && !(el.closest && el.closest('[data-dshsp-official]')));
      if (!item) { barFlash('请先切到「源编辑」视图'); return; }
      pendingEdit = true;
      item.click();
    } catch (e) { barFlash('切换失败，请手动选「源编辑」'); }
  }
  function baseEl() {
    const cur = paneNow();
    if (!cur) return null;
    const body = cur.body;
    const sels = ['[data-textpreview-line]', 'p', 'li', 'pre', '[data-code-block-content]'];
    for (const s of sels) { try { const el = body.querySelector(s); if (el) return el; } catch (e) { } }
    return body.firstElementChild || body;
  }
  function basePx() {
    try {
      const el = baseEl();
      if (!el || typeof getComputedStyle !== 'function') return 14;
      const v = parseFloat(getComputedStyle(el).fontSize);
      return Number.isFinite(v) && v > 0 ? v : 14;
    } catch (e) { return 14; }
  }
  function bumpZoom(dir) { setOfficialZoom(officialZoom + dir / basePx()); }
  function updateZoomUi() {
    zoomBtn.textContent = Math.max(10, Math.round(basePx() * officialZoom)) + 'px';
    if (ip.active) ipSyncUi();
    if (!attachedPane) return;
    if (officialZoom === 1) attachedPane.style.removeProperty('--dshsp-zoom');
    else attachedPane.style.setProperty('--dshsp-zoom', String(officialZoom));
  }
  zoomUi = updateZoomUi;

  let plainLineNo = false;
  try { plainLineNo = window.localStorage.getItem('dsh-sidebar-plus.plainLineNo') === '1'; } catch (e) { }
  function setPlainLineNo(v) {
    plainLineNo = !!v;
    try { window.localStorage.setItem('dsh-sidebar-plus.plainLineNo', plainLineNo ? '1' : '0'); } catch (e) { }
    sync();
  }

  const ip = { active: false, dirty: false, conflict: false, busy: false, abs: '', mtimeMs: 0, crlf: false, bom: false, init: '', wrap: null, ta: null, gut: null, pane: null, body: null };

  function onEditClick() {
    const cur = paneNow();
    if (!cur) return;
    if (paneAllowsEdit(cur.pane)) gotoSourceEdit();
    else enterInplace();
  }
  function ipRenderGutter() {
    if (!ip.gut || !ip.ta) return;
    const n = ip.ta.value.split('\n').length;
    const out = [];
    for (let i = 1; i <= n; i++) out.push('<div>' + i + '</div>');
    ip.gut.innerHTML = out.join('');
  }
  function ipSyncUi() {
    const on = ip.active;
    saveBtn.style.display = on ? '' : 'none';
    exitBtn.style.display = on ? '' : 'none';
    forceBtn.style.display = (on && ip.conflict) ? '' : 'none';
    reloadBtn.style.display = (on && ip.conflict) ? '' : 'none';
    editBtn.style.display = on ? 'none' : '';
    findBtn.style.display = on ? 'none' : '';
    saveBtn.textContent = '保存' + (ip.dirty ? ' *' : '');
    if (on && ip.ta) {
      const px = Math.max(10, Math.round(basePx() * officialZoom));
      ip.ta.style.fontSize = px + 'px';
      if (ip.gut) ip.gut.style.fontSize = px + 'px';
    }
  }
  async function enterInplace() {
    if (ip.active || ip.busy) return;
    const cur = paneNow();
    if (!cur) return;
    ip.busy = true;
    try {
      const r = await readWholeText(cur.pane.getAttribute('data-textpreview-url') || '');
      const wrap = document.createElement('div');
      wrap.className = 'dshsp-ipwrap';
      const gut = document.createElement('div');
      gut.className = 'dshsp-egut';
      const ta = document.createElement('textarea');
      ta.className = 'dshsp-ta';
      ta.spellcheck = false;
      ta.setAttribute('wrap', 'off');
      ta.value = r.text;
      wrap.appendChild(gut);
      wrap.appendChild(ta);
      try { cur.pane.insertBefore(wrap, cur.body); } catch (e) { wrap.remove(); throw e; }
      cur.body.style.display = 'none';
      Object.assign(ip, { active: true, dirty: false, conflict: false, abs: r.abs, mtimeMs: r.mtimeMs, crlf: r.crlf, bom: r.bom, init: r.text, wrap: wrap, ta: ta, gut: gut, pane: cur.pane, body: cur.body });
      ta.addEventListener('input', () => { ip.dirty = ip.ta.value !== ip.init; ipRenderGutter(); ipSyncUi(); });
      ta.addEventListener('scroll', () => { if (ip.gut) ip.gut.scrollTop = ip.ta.scrollTop; });
      ipRenderGutter();
      ipSyncUi();
      try { ta.focus(); } catch (e) { }
      barFlash('编辑中：Ctrl+S 保存，Esc 退出');
    } catch (e) {
      barFlash(msgOf(e));
    } finally {
      ip.busy = false;
    }
  }
  function exitInplace(force) {
    if (!ip.active) return;
    if (!force && ip.dirty && typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('有未保存的修改，确定放弃并退出编辑吗？')) return;
    }
    try { if (ip.wrap && ip.wrap.parentNode) ip.wrap.remove(); } catch (e) { }
    try { if (ip.body) ip.body.style.display = ''; } catch (e) { }
    Object.assign(ip, { active: false, dirty: false, conflict: false, wrap: null, ta: null, gut: null, pane: null, body: null });
    ipSyncUi();
  }
  async function doSave(force) {
    if (!ip.active || ip.busy) return;
    ip.busy = true;
    try {
      const out = fromEditorText(ip.ta.value, { crlf: ip.crlf, bom: ip.bom });
      const r = await postSave(saveRequestBody(ip.abs, out, ip.mtimeMs, force));
      if (r && r.ok) {
        ip.mtimeMs = r.mtimeMs;
        ip.init = ip.ta.value;
        ip.dirty = false;
        ip.conflict = false;
        ipSyncUi();
        barFlash('已保存 ' + humanBytes(r.bytes) + (r.backup ? '（旧版已自动备份）' : ''));
        try { const rb = document.querySelector('[data-textpreview-tool="reload"]'); if (rb) rb.click(); } catch (e) { }
        return;
      }
      if (r && r.error === 'changed') {
        ip.conflict = true;
        ipSyncUi();
        barFlash('文件在别处被改过，请选择：');
        return;
      }
      barFlash('保存失败：' + msgOf(r && r.error ? r.error : r));
    } finally {
      ip.busy = false;
    }
  }
  async function reloadLatest() {
    if (!ip.active || ip.busy) return;
    ip.busy = true;
    try {
      const addr = ip.pane ? (ip.pane.getAttribute('data-textpreview-url') || '') : '';
      const r = await readWholeText(addr);
      ip.init = r.text;
      ip.ta.value = r.text;
      ip.mtimeMs = r.mtimeMs;
      ip.crlf = r.crlf;
      ip.bom = r.bom;
      ip.dirty = false;
      ip.conflict = false;
      ipRenderGutter();
      ipSyncUi();
      barFlash('已重载磁盘最新内容');
    } catch (e) {
      barFlash(msgOf(e));
    } finally {
      ip.busy = false;
    }
  }

  const editBtn = mkBtn('编辑', '编辑（md 跳到源编辑，其它格式就在本视图里编辑）', onEditClick);
  editBtn.className = 'dshsp-btn dshsp-btn-primary';
  const findBtn = mkBtn('搜索', '搜索（Ctrl+F）', openFind);
  const aMinus = mkBtn('A−', '缩小文件文字（或 Ctrl+向下滚轮）', () => bumpZoom(-1));
  const zoomBtn = mkBtn('—', '点击恢复官方默认字号', () => setOfficialZoom(1));
  zoomBtn.style.minWidth = '42px';
  zoomBtn.style.justifyContent = 'center';
  const aPlus = mkBtn('A+', '放大文件文字（或 Ctrl+向上滚轮）', () => bumpZoom(1));
  const linenoBtn = mkBtn('行号', '显示/隐藏行号（仅官方纯文本视图，默认关）', () => setPlainLineNo(!plainLineNo));
  const saveBtn = mkBtn('保存', '保存（Ctrl+S）', () => doSave(false));
  saveBtn.className = 'dshsp-btn dshsp-btn-primary';
  const exitBtn = mkBtn('退出编辑', '退出编辑（Esc）', () => exitInplace());
  const forceBtn = mkBtn('强制保存', '磁盘上这份已变，强制覆盖', () => doSave(true));
  forceBtn.className = 'dshsp-btn dshsp-conflict';
  const reloadBtn = mkBtn('重载最新', '丢掉本地改动，重读磁盘最新', () => reloadLatest());
  reloadBtn.className = 'dshsp-btn dshsp-conflict';
  bar.appendChild(editBtn);
  bar.appendChild(saveBtn);
  bar.appendChild(exitBtn);
  bar.appendChild(findBtn);
  bar.appendChild(aMinus);
  bar.appendChild(zoomBtn);
  bar.appendChild(aPlus);
  bar.appendChild(linenoBtn);
  bar.appendChild(forceBtn);
  bar.appendChild(reloadBtn);
  bar.appendChild(status);
  saveBtn.style.display = 'none';
  exitBtn.style.display = 'none';
  forceBtn.style.display = 'none';
  reloadBtn.style.display = 'none';
  findRow.appendChild(input);
  findRow.appendChild(count);
  findRow.appendChild(mkBtn('Aa', '区分大小写', function () { ff.cs = !ff.cs; ff.idx = 0; runFf(); }));
  findRow.appendChild(mkBtn('↑', '上一个（↑）', () => stepFf(-1)));
  findRow.appendChild(mkBtn('↓', '下一个（↓）', () => stepFf(1)));
  findRow.appendChild(mkBtn('✕', '关闭（Esc）', closeFind));
  input.addEventListener('input', function () { ff.q = input.value; ff.idx = 0; runFf(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); stepFf(e.shiftKey ? -1 : 1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); stepFf(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); stepFf(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFind(); }
  });

  function sync() {
    const cur = paneNow();
    if (!cur) {
      if (ip.active) exitInplace(true);
      if (attachedPane) { try { attachedPane.style.removeProperty('--dshsp-zoom'); attachedPane.removeAttribute('data-dshsp-lineno'); } catch (e) { } }
      attachedPane = null;
      if (group.parentNode) { try { group.remove(); } catch (e) { } }
      if (ff.open) { ff.open = false; clearFfHighlights(); renderFf(); }
      return;
    }
    if (ip.active && (ip.pane !== cur.pane || ip.body !== cur.body)) exitInplace(true);
    if (!ip.active && (group.parentNode !== cur.pane || group.nextElementSibling !== cur.body)) {
      try { cur.pane.insertBefore(group, cur.body); } catch (e) { return; }
    }
    attachedPane = cur.pane;
    findRow.style.display = (ff.open && !ip.active) ? 'flex' : 'none';
    const isPlain = /\/text$/.test(String(cur.pane.getAttribute('data-document-preview') || ''));
    linenoBtn.style.display = (isPlain && !ip.active) ? '' : 'none';
    linenoBtn.textContent = '行号';
    linenoBtn.className = plainLineNo ? 'dshsp-btn dshsp-btn-on' : 'dshsp-btn';
    try {
      if (isPlain && plainLineNo) {
        cur.pane.setAttribute('data-dshsp-lineno', 'on');
        let digits = 2;
        try {
          const ls = cur.pane.querySelectorAll('[data-textpreview-line]');
          const lastEl = ls.length ? ls[ls.length - 1] : null;
          const n = lastEl ? parseInt(lastEl.getAttribute('data-textpreview-line'), 10) : 0;
          digits = Math.max(2, String(Number.isFinite(n) && n > 0 ? n : 0).length);
        } catch (e) { }
        if (cur.pane.style.getPropertyValue('--dshsp-lnch') !== String(digits)) cur.pane.style.setProperty('--dshsp-lnch', String(digits));
      } else {
        cur.pane.removeAttribute('data-dshsp-lineno');
      }
    } catch (e) { }
    ipSyncUi();
    updateZoomUi();
  }
  const onKey = function (e) {
    try {
      if (!paneNow()) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ip.active) {
        if (ctrl && !e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); e.stopPropagation(); doSave(false); return; }
        if (e.key === 'Escape') { e.preventDefault(); exitInplace(); return; }
        return;
      }
      if (ctrl && !e.altKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); e.stopPropagation(); openFind(); return; }
      if (e.key === 'F3' && ff.open) { e.preventDefault(); stepFf(e.shiftKey ? -1 : 1); return; }
      if (e.key === 'Escape' && ff.open) { e.preventDefault(); closeFind(); }
    } catch (err) { }
  };
  const onWheel = function (e) {
    try {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const cur = paneNow();
      if (!cur || !cur.pane.contains(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      bumpZoom(e.deltaY < 0 ? 1 : -1);
    } catch (err) { }
  };
  window.addEventListener('keydown', onKey, true);
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('wheel', onWheel, { passive: false });
  }
  const timer = setInterval(sync, 400);
  sync();
  enh = {
    sync: sync,
    stop() {
      clearInterval(timer);
      if (msgTimer) clearTimeout(msgTimer);
      if (zoomUi === updateZoomUi) zoomUi = null;
      window.removeEventListener('keydown', onKey, true);
      try { document.removeEventListener('wheel', onWheel); } catch (e) { }
      clearFfHighlights();
      try { exitInplace(true); } catch (e) { }
      try { group.remove(); } catch (e) { }
      if (attachedPane) {
        try {
          attachedPane.style.removeProperty('--dshsp-zoom');
          attachedPane.removeAttribute('data-dshsp-lineno');
        } catch (e) { }
      }
      attachedPane = null;
      enh = null;
    },
  };
}
function enhanceStop() { if (enh) { try { enh.stop(); } catch (e) { } } }

enhanceStart();

return {
  version: VERSION,
  title: TITLE,
  extensions: ['md', 'markdown'],
  meta: { loading: 'text-pages', wrap: true, priority: 'builtin' },
  locale: { zh: zh, en: en },
  css: CSS,
  Body: SourceBody,
  teardown: function () {
    enhanceStop();
    try {
      const tag = document.querySelector('style[data-plugin-css="dsh-sidebar-plus-official"]');
      if (tag) tag.remove();
    } catch (e) { }
  },
  _test: {
    VERSION: VERSION,
    parseFileAddress: parseFileAddress,
    splitLines: splitLines,
    computeMatches: computeMatches,
    matchesByLine: matchesByLine,
    segmentMarkdown: segmentMarkdown,
    overlayMarks: overlayMarks,
    headingLevel: headingLevel,
    isQuoteLine: isQuoteLine,
    isTaskLine: isTaskLine,
    eolOf: eolOf,
    bomOf: bomOf,
    toEditorText: toEditorText,
    fromEditorText: fromEditorText,
    humanBytes: humanBytes,
  },
};
