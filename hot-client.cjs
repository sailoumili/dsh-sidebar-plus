'use strict';
const react = ENV.react;
const VERSION = '0.4.3';

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
  'rv.edit.tip': '编辑右侧（当前文件），左侧是只读的历史快照；会先切成左右分栏、不换行',
  'rv.find.tip': '搜索（左右两侧一起搜）',
  'rv.zoom.in': '缩小字号（左右两侧一起变）',
  'rv.zoom.out': '放大字号（左右两侧一起变）',
  'rv.zoom.reset': '点击恢复对比视图的官方字号（左右两侧一起变）',
  'rv.find.holder': '搜索（两侧一起搜；可用「左/右」只搜一侧。↓/Enter 下一个，↑/Shift+Enter 上一个，Esc 关闭）',
  'rv.editing': '编辑中：只改右侧的当前文件，左侧只读；Ctrl+S 保存，Esc 退出',
  'rv.saved': '已保存；左侧对比是这一轮的历史快照，不会随之更新',
  'bar.edit.tip': '编辑（md 跳到源编辑，其它格式就在本视图里编辑）',
  'bar.find.tip': '搜索（Ctrl+F）',
  'bar.save.tip': '保存（Ctrl+S）',
  'bar.exit.tip': '退出编辑（Esc）',
  'bar.forcedit.tip': '磁盘上这份已变，强制覆盖',
  'bar.reload.tip': '丢掉本地改动，重读磁盘最新',
  'bar.lineno': '行号',
  'bar.lineno.tip': '显示/隐藏行号（仅官方纯文本视图，默认关）',
  'font.reset.official': '点击恢复官方默认字号',
  'jump.row': '行',
  'jump.go': '跳',
  'jump.go.tip': '跳到该行',
  'jump.holder': '跳行',
  'jump.tip': '输入行号后回车：光标跳到那一行',
  'find.holder': '搜索（↓/Enter 下一个，↑/Shift+Enter 上一个，Esc 关闭）',
  'find.case': '区分大小写',
  'find.prev': '上一个（↑）',
  'find.next': '下一个（↓）',
  'find.close': '关闭（Esc）',
  'rv.edit': '编辑右侧',
  'rv.side.both': '两侧',
  'rv.side.both.tip': '左右两侧一起搜',
  'rv.side.left': '左',
  'rv.side.left.tip': '只搜左侧（本轮开始的历史快照），上下箭头只在左侧走',
  'rv.side.right': '右',
  'rv.side.right.tip': '只搜右侧（当前文件），上下箭头只在右侧走',
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
  'rv.edit.tip': "Edit the right side (the current file); the left side is a read-only snapshot. Switches to side-by-side, unwrapped",
  'rv.find.tip': 'Find (searches both sides)',
  'rv.zoom.in': 'Smaller text (both sides)',
  'rv.zoom.out': 'Larger text (both sides)',
  'rv.zoom.reset': 'Click to restore the comparison default size (both sides)',
  'rv.find.holder': 'Find in both sides, or use 左/右 for one (Enter/↓ next, ↑ previous, Esc close)',
  'rv.editing': 'Editing the right side only; the left side is read-only. Ctrl+S saves, Esc exits',
  'rv.saved': 'Saved; the left comparison is this turn\'s snapshot and does not change',
  'bar.edit.tip': 'Edit (md opens the Source view; other formats edit in place)',
  'bar.find.tip': 'Find (Ctrl+F)',
  'bar.save.tip': 'Save (Ctrl+S)',
  'bar.exit.tip': 'Exit editing (Esc)',
  'bar.forcedit.tip': 'The file changed on disk; overwrite anyway',
  'bar.reload.tip': 'Discard local edits and reload from disk',
  'bar.lineno': 'Lines',
  'bar.lineno.tip': 'Show/hide line numbers (official plain-text view only, off by default)',
  'font.reset.official': 'Click to restore the official default size',
  'jump.row': 'Ln',
  'jump.go': 'Go',
  'jump.go.tip': 'Jump to that line',
  'jump.holder': 'Line',
  'jump.tip': 'Type a line number and press Enter to jump there',
  'find.holder': 'Find (Enter/↓ next, ↑ previous, Esc close)',
  'find.case': 'Match case',
  'find.prev': 'Previous (↑)',
  'find.next': 'Next (↓)',
  'find.close': 'Close (Esc)',
  'rv.edit': 'Edit right',
  'rv.side.both': 'Both',
  'rv.side.both.tip': 'Search both sides',
  'rv.side.left': 'Left',
  'rv.side.left.tip': 'Left side only (this turn\'s snapshot); ↑/↓ walk the left side',
  'rv.side.right': 'Right',
  'rv.side.right.tip': 'Right side only (the current file); ↑/↓ walk the right side',
};

/* 界面语言跟随 DSH：官方 locale 把当前语言写在 <html lang>（zh 显示为 zh-CN）。
   React 那条路优先用官方传入的 props.t；命令式工具条没有 props.t，按 <html lang> 挑字典。 */
function uiIsEn() {
  try {
    const l = (typeof document !== 'undefined' && document.documentElement) ? String(document.documentElement.lang || '') : '';
    return /^en\b/i.test(l);
  } catch (e) { return false; }
}
function dict() { return uiIsEn() ? en : zh; }
function tr(key, fallback) {
  const d = dict();
  if (d[key] != null) return d[key];
  if (zh[key] != null) return zh[key];
  if (en[key] != null) return en[key];
  return fallback != null ? fallback : key;
}

let sharedFontPx = 14;
try {
  // '13' 是旧版本写坏过的值，遇到就丢弃、回落默认
  const raw = window.localStorage.getItem('dsh-sidebar-plus.fontPx');
  const bad = raw === '13';
  if (bad) { window.localStorage.removeItem('dsh-sidebar-plus.fontPx'); }
  const v = parseInt(bad ? '' : raw, 10);
  if (v >= 10 && v <= 28) sharedFontPx = v;
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
  /* 行号：按官方纯文本正文自带的 data-textpreview-plain 认（不猜渲染器 id，官方改名也不失效）。 */
  '[data-document-preview][data-dshsp-lineno="on"]:has([data-textpreview-plain]){--dshsp-lnch:2;--dshsp-lnw:calc(var(--dshsp-lnch) * 1ch);--dshsp-lnpad:8px;--dshsp-lngap:12px}',
  '[data-document-preview][data-dshsp-lineno="on"]:has([data-textpreview-plain]) [data-textpreview-line]{padding-left:calc(var(--dshsp-lnpad) + var(--dshsp-lnw) + var(--dshsp-lngap));text-indent:calc(-1 * (var(--dshsp-lnw) + var(--dshsp-lngap)))}',
  '[data-document-preview][data-dshsp-lineno="on"]:has([data-textpreview-plain]) [data-textpreview-line]::before{content:attr(data-textpreview-line);display:inline-block;width:var(--dshsp-lnw);padding-right:var(--dshsp-lngap);text-align:right;color:var(--dsw-alias-label-tertiary,rgba(128,128,128,.6));user-select:none;-webkit-user-select:none;font-variant-numeric:tabular-nums}',
  '.dshsp-ipwrap{flex:auto;display:flex;min-height:0;min-width:0}',
  '.dshsp-jumpbox{flex:none;display:inline-flex;align-items:center;gap:3px}',
  '.dshsp-jlabel{opacity:.7;font-size:11px}',
  '.dshsp-jump{width:4.2em;border:.5px solid rgba(128,128,128,.4);border-radius:5px;background:transparent;color:inherit;font:inherit;font-size:12px;padding:2px 5px;outline:none}',
  '.dshsp-jump:focus{border-color:rgba(64,150,255,.7)}',
  '[data-changes-review] [data-diff-line].dshsp-anchor{background:rgba(64,150,255,.14)}',
  '[data-changes-review][data-dshsp-rv]>[data-review-view]>*{zoom:var(--dshsp-rvz,1)}',
  '[data-changes-review] .dshsp-rved{display:flex;flex:auto;min-width:0;min-height:0;overflow:hidden}',
  '::highlight(dshsp-find){background:rgba(255,205,0,.45)}',
  '::highlight(dshsp-find-cur){background:rgba(255,130,20,.85)}',
  '::highlight(dshsp-rvfind){background:rgba(255,205,0,.45)}',
  '::highlight(dshsp-rvfind-cur){background:rgba(255,130,20,.85)}',
  /* 官方插槽里的挂钩占位：不显示任何东西，工具条仍在原来的那一行。 */
  '.dshsp-slot{display:none;width:0;height:0;overflow:hidden}',
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

/* 对比视图（官方 changes-review）只给相对路径 + 会话 id，这里拼成会话作用域的文件地址。 */
function sessionFileAddress(sessionId, raw) {
  const norm = String(raw == null ? '' : raw).replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
  const seg = norm.split('/').map((s) => encodeURIComponent(s).replace(/%3A/gi, ':')).join('/');
  const sid = encodeURIComponent(String(sessionId == null ? '' : sessionId)).replace(/%3A/gi, ':');
  return FILE_ADDRESS_PREFIX + 'session/' + sid + '/' + seg;
}

/* 二进制后缀名单（兜底判据）：官方注册表问不到时按它判；zip / exe 这类官方不给渲染器的后缀，
   也靠它避免把工具条挂到「打不开」的空状态上。取自官方各渲染器的 binaryExtensions，
   不含本来就是文本的 svg / csv / tsv。 */
const BINARY_SUFFIX = new Set([
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v',
  'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus',
  'zip', 'gz', 'tgz', 'bz2', 'xz', 'zst', '7z', 'rar', 'tar', 'jar',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'pages', 'numbers',
  'exe', 'dll', 'so', 'dylib', 'bin', 'o', 'class', 'pyc', 'wasm',
  'ttf', 'otf', 'woff', 'woff2', 'eot', 'dmg', 'iso', 'img',
  'sqlite', 'db', 'psd', 'ai', 'sketch', 'tiff', 'tif', 'heic', 'heif', 'avif',
  'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico',
]);

/* 路径后缀（小写、不含点）；取不到返回空串。 */
const pathSuffix = (p) => {
  const m = /\.([^./\\]+)\s*$/.exec(String(p == null ? '' : p).replace(/\\/g, '/').trim());
  return m ? m[1].toLowerCase() : '';
};

/* 后缀命中二进制名单 → 不能按文本读、不能就地编辑；取不到后缀返回 false（还有 UTF-8 严格解码兜底）。 */
const isBinaryPath = (p) => {
  const s = pathSuffix(p);
  return !!s && BINARY_SUFFIX.has(s);
};

/* 官方判据：注册表里每个渲染器自带 binaryExtensions（官方强制它是 extensions 的子集）。
   三态：true 是二进制 / false 不是 / null 问不到（服务没到或加载器为旧版）。
   官方新增二进制格式时这里自动跟随，无需改代码。 */
function officialBinary(abs) {
  try {
    const svc = ENV.previews && ENV.previews.value;
    if (!svc || typeof svc.getSnapshot !== 'function') return null;
    const defs = svc.getSnapshot();
    if (!Array.isArray(defs) || !defs.length) return null;
    const suffix = pathSuffix(abs);
    if (!suffix) return null;
    let declaresBinary = false;
    for (const def of defs) {
      const bin = def && def.binaryExtensions;
      if (!Array.isArray(bin) || !bin.length) continue;
      declaresBinary = true;
      for (const raw of bin) {
        if (String(raw).replace(/^\.+/, '').toLowerCase() === suffix) return true;
      }
    }
    return declaresBinary ? false : null;
  } catch (e) {
    return null;
  }
}

/* 合并判据：官方说了算；官方没这个后缀、内置名单有的（zip / exe 这类）仍按二进制处理。
   markOnce 给每种结果打一次点，供 /dsh-sp/marks 看出实际走了哪条。 */
const judgeMarks = {};
function markOnce(name) { if (judgeMarks[name]) return; judgeMarks[name] = true; mark(name); }
function pathIsBinary(abs) {
  const off = officialBinary(abs);
  if (off === true) { markOnce('judge-official-binary'); return true; }
  if (off === false) {
    if (isBinaryPath(abs)) { markOnce('judge-official-text-but-static-hit'); return true; }
    markOnce('judge-official-text');
    return false;
  }
  markOnce('judge-offservice-absent');
  return isBinaryPath(abs);
}

function isHiddenEl(el) {
  try { return !!(el && el.closest && el.closest('[hidden],[aria-hidden="true"]')); } catch (e) { return false; }
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

const INLINE_RE = /(`[^`\n]*`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g; /* ref-check:忽略（正则字面量，不是文件引用） */
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
/* 灌完文本直接 focus() 会让浏览器把视图滚到末尾 → 需显式把光标与滚动条放回目标行。 */
function lineStartOffset(text, line) {
  const s = String(text == null ? '' : text);
  const n = Math.max(1, Math.round(line) || 1);
  let pos = 0;
  for (let i = 1; i < n; i++) {
    const at = s.indexOf('\n', pos);
    if (at === -1) return s.length;
    pos = at + 1;
  }
  return pos;
}
function lineOfCaret(ta) {
  try {
    const upto = String(ta.value || '').slice(0, ta.selectionStart || 0);
    return upto.split('\n').length;
  } catch (e) { return 1; }
}
function caretToLine(ta, line) {
  if (!ta) return 0;
  const total = String(ta.value || '').split('\n').length;
  const n = Math.min(Math.max(1, Math.round(line) || 1), total);
  try { ta.focus(); } catch (e) { }
  const pos = lineStartOffset(ta.value, n);
  try { ta.setSelectionRange(pos, pos); } catch (e) { }
  const show = function () {
    try {
      const lh = parseFloat(getComputedStyle(ta).lineHeight);
      const step = Number.isFinite(lh) && lh > 0 ? lh : 20;
      ta.scrollTop = Math.max(0, (n - 1) * step - ta.clientHeight / 3);
    } catch (e) { }
  };
  show();
  if (typeof requestAnimationFrame === 'function') { try { requestAnimationFrame(show); } catch (e) { } }
  return n;
}
/* 对比页一行 DOM 里的「新版本行号」：分栏是自身行号，单栏是第二个号，分栏+换行取右格。 */
function rowLineNo(row) {
  try {
    const kids = Array.prototype.slice.call(row.children);
    const first = kids[0];
    if (first && first.tagName === 'SPAN' && !/^\d+$/.test(String(first.textContent || '').trim())) {
      const inner = first.firstElementChild;
      if (inner && inner.tagName === 'SPAN' && /^\d+$/.test(String(inner.textContent || '').trim())) {
        let n = 0;
        for (const kid of kids) {
          const cell = kid.firstElementChild;
          if (cell && cell.tagName === 'SPAN' && /^\d+$/.test(String(cell.textContent || '').trim())) n = parseInt(cell.textContent, 10);
        }
        return n;
      }
    }
    let n = 0;
    for (const kid of kids) {
      if (kid.tagName !== 'SPAN' || !/^\d+$/.test(String(kid.textContent || '').trim())) break;
      n = parseInt(kid.textContent, 10);
    }
    return n;
  } catch (e) { return 0; }
}

function humanBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  if (v < 1024) return v + ' B';
  if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KB';
  return (v / 1024 / 1024).toFixed(2) + ' MB';
}
function msgOf(e) { return String((e && (e.message || e)) || 'unknown').slice(0, 160); }
/* 每个同步周期都会调一次 UI 刷新，写同名文本会白白触发 DOM 变更 → 只在真变了才写。 */
function setText(el, s) {
  const v = String(s == null ? '' : s);
  if (el && el.textContent !== v) el.textContent = v;
}

/* 计时探针：只把时间点报给宿主（GET /dsh-sp/marks 读回），不参与任何界面逻辑。 */
let markSeq = 0;
function mark(name) {
  try {
    if (typeof fetch !== 'function') return;
    const t = (typeof performance !== 'undefined' && performance.now) ? Math.round(performance.now()) : -1;
    const qs = '?n=' + encodeURIComponent(String(name)) + '&t=' + t + '&s=' + (++markSeq) + '&at=' + Date.now();
    fetch('/dsh-sp/mark' + qs, { cache: 'no-store' }).catch(function () { });
  } catch (e) {  }
}

/* 整文件读取走 workspaceFiles.readBytes（Uint8Array），旧版 readAll 兜底；类型判断用标签不用 instanceof（跨 realm 会误判）。 */
const TYPED_TAG_RE = /^\[object (Uint8Clamped|Int8|Uint16|Int16|Uint32|Int32|Float32|Float64|BigInt64|BigUint64)Array\]$/;
function bytesOf(data) {
  if (data == null) return null;
  if (typeof data === 'string') {
    try { return Uint8Array.from(atob(data), (c) => c.charCodeAt(0)); } catch (e) { return null; }
  }
  if (typeof data !== 'object') return null;
  const tag = Object.prototype.toString.call(data);
  if (tag === '[object Uint8Array]') return data;
  if (tag === '[object ArrayBuffer]') { try { return new Uint8Array(data); } catch (e) { return null; } }
  if (tag === '[object DataView]' || TYPED_TAG_RE.test(tag)) {
    try { return new Uint8Array(data.buffer, data.byteOffset, data.byteLength); } catch (e) { return null; }
  }
  if (Array.isArray(data)) { try { return Uint8Array.from(data); } catch (e) { return null; } }
  return null;
}

async function readWholeBytes(file, signal) {
  const wf = ENV.remote && ENV.remote.workspaceFiles;
  if (!wf) throw new Error('连接未就绪，稍后再试');
  if (typeof wf.readBytes === 'function') {
    const args = signal ? [file.sessionId, file.path, {}, signal] : [file.sessionId, file.path, {}];
    return await wf.readBytes.apply(wf, args);
  }
  if (typeof wf.readAll === 'function') {
    const args = signal ? [file.sessionId, file.path, signal] : [file.sessionId, file.path];
    return await wf.readAll.apply(wf, args);
  }
  throw new Error('当前 DSH 版本缺少整文件读取接口（workspaceFiles.readBytes）');
}

async function readWholeText(address, signal) {
  const file = parseFileAddress(address);
  if (!file || file.scope !== 'session') throw new Error('无法定位所属会话（只支持会话工作区内的文件）');
  const res = await readWholeBytes(file, signal);
  if (!res || res.ok !== true || !res.value) {
    throw new Error('读取完整文件失败：' + msgOf(res && res.error ? res.error : res));
  }
  const v = res.value;
  const bytes = bytesOf(v.data);
  if (!bytes) throw new Error('文件内容解码失败');
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
    return tr(key);
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
  /* 官方按「整包字节」给内容时本视图只认文本分页 → 兜底：UTF-8 解得出就当文本显示，解不出明确提示。 */
  const bytesText = useMemo(() => {
    if (!content || content.kind !== 'bytes') return '';
    try { return new TextDecoder('utf-8', { fatal: true }).decode(content.data); } catch (e) { return '（该文件不是文本，无法在此视图显示）'; }
  }, [content]);
  const text = override != null ? override : (isText ? content.text : bytesText);
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

  if (!isText && override == null && !bytesText) {
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
              placeholder: tr('find.holder'),
              onChange: (e) => setFind((f) => Object.assign({}, f, { q: e.target.value, idx: 0 })),
              onKeyDown: (e) => {
                if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); step(1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); step(-1); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFind(); }
              },
            }),
            h('span', { className: 'dshsp-count' }, find.q ? (matches.length ? (safeIdx + 1) + ' / ' + matches.length : label('finding.no')) : ''),
            h('button', { className: 'dshsp-btn', type: 'button', title: tr('find.case'), onClick: () => setFind((f) => Object.assign({}, f, { cs: !f.cs, idx: 0 })) }, 'Aa' + (find.cs ? '✓' : '')),
            h('button', { className: 'dshsp-btn', type: 'button', title: tr('find.prev'), onClick: () => step(-1) }, '↑'),
            h('button', { className: 'dshsp-btn', type: 'button', title: tr('find.next'), onClick: () => step(1) }, '↓'),
            h('button', { className: 'dshsp-btn', type: 'button', title: tr('find.close'), onClick: closeFind }, '✕')
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

/* 官方插槽挂钩：加载器把这两个组件注册进 sidebar.right.tab.document.actions（Actions）
   与 deliverables.review.file.actions（ReviewActions）。组件是看不见的占位节点，
   画面仍是原来那一行工具条；面板归属与文件绝对路径由官方递来，不再翻 DOM 猜。
   挂钩缺失（官方没有该插槽或改了名）→ 自动退回整页扫描。 */
const slot = { doc: null, review: null };
const anchored = { doc: false, review: false };

/* 每次挂载给一个只比较身份用的对象，避免同一次重复渲染把钩子摘了又挂。 */
function useMountToken() {
  return react.useMemo(function () { return {}; }, []);
}

function useSlotHook(kind, token, info) {
  const ref = react.useRef(null);
  react.useEffect(function () {
    const el = ref.current;
    if (!el) return function () { };
    if (enh && typeof enh.slotAttach === 'function') enh.slotAttach(kind, el, info);
    return function () {
      if (enh && typeof enh.slotGone === 'function') enh.slotGone(kind, el);
    };
  }, [token, kind, info.abs, info.url]);
  return ref;
}

function Actions(props) {
  const abs = (props && typeof props.absolutePath === 'string') ? props.absolutePath : '';
  const token = useMountToken();
  const ref = useSlotHook('doc', token, { abs: abs });
  return react.createElement('span', {
    ref: ref, className: 'dshsp-slot', 'data-dshsp-slot': 'actions', 'data-dshsp-abs': abs, hidden: true,
  });
}

function ReviewActions(props) {
  const url = (props && typeof props.actionUrl === 'string') ? props.actionUrl : '';
  const token = useMountToken();
  const ref = useSlotHook('review', token, { url: url });
  return react.createElement('span', {
    ref: ref, className: 'dshsp-slot', 'data-dshsp-slot': 'review', 'data-dshsp-url': url, hidden: true,
  });
}

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

/* 文档预览与对比页可能各开一份搜索，高亮注册表分名，互不清场。 */
const FIND_NS_DOC = ['dshsp-find', 'dshsp-find-cur'];
const FIND_NS_REVIEW = ['dshsp-rvfind', 'dshsp-rvfind-cur'];

function clearHighlights(names) {
  try {
    if (window.CSS && window.CSS.highlights) {
      window.CSS.highlights.delete(names[0]);
      window.CSS.highlights.delete(names[1]);
    }
  } catch (e) { }
}
function paintHighlights(st, names) {
  try {
    if (!window.CSS || !window.CSS.highlights || typeof window.Highlight !== 'function') return;
    if (!st.ranges.length) { clearHighlights(names); return; }
    window.CSS.highlights.set(names[0], new window.Highlight(...st.ranges));
    const cur = st.ranges[st.idx];
    if (cur) window.CSS.highlights.set(names[1], new window.Highlight(cur));
    else window.CSS.highlights.delete(names[1]);
  } catch (e) { }
}
function revealHighlight(st) {
  try {
    const r = st.ranges[st.idx];
    if (!r) return;
    const host = r.startContainer && r.startContainer.parentElement;
    if (host && typeof host.scrollIntoView === 'function') host.scrollIntoView({ block: 'center', inline: 'nearest' });
  } catch (e) { }
}

function enhanceStart() {
  if (enh) return;
  if (typeof document === 'undefined' || !document.body) { if (typeof setTimeout === 'function') setTimeout(enhanceStart, 500); return; }
  try { const legacy = document.querySelector('style[data-plugin-css="dsh-sidebar-plus-official"]'); if (legacy) legacy.remove(); } catch (e) { } // 清理历史版本注入过的样式

  let attachedPane = null;
  let msgTimer = null;
  let paneMarked = false;
  let toolbarMarked = false;

  function mkBtn(txt, title, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dshsp-btn';
    b.title = title;
    b.textContent = txt;
    b.addEventListener('click', fn);
    return b;
  }

  function mkJump(getTa, flash) {
    const box = document.createElement('span');
    box.className = 'dshsp-jumpbox';
    box.style.display = 'none';
    const lab = document.createElement('span');
    lab.className = 'dshsp-jlabel';
    lab.textContent = tr('jump.row');
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'dshsp-jump';
    inp.placeholder = tr('jump.holder');
    inp.title = tr('jump.tip');
    const go = function () {
      const ta = getTa();
      const n = parseInt(inp.value, 10);
      if (!ta || !Number.isFinite(n) || n < 1) return;
      const at = caretToLine(ta, n);
      flash('已跳到第 ' + at + ' 行');
      inp.value = '';
    };
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); inp.blur(); }
    });
    box.appendChild(lab);
    box.appendChild(inp);
    box.appendChild(mkBtn(tr('jump.go'), tr('jump.go.tip'), go));
    return { box: box, input: inp };
  }

  /* 面板对应的文件路径：优先挂钩递来的绝对路径，其次文件地址，再次面板里的路径标签。 */
  function paneFilePath(pane, known) {
    if (known) return known;
    try {
      const f = parseFileAddress(pane.getAttribute('data-textpreview-url') || '');
      if (f && f.path) return f.path;
      const pathEl = pane.querySelector('[data-textpreview-path]');
      if (pathEl) return pathEl.textContent || '';
    } catch (e) { }
    return '';
  }

  /* 挂钩在位时一步到位：锚点就长在官方当前渲染的那个面板里，路径也是官方递的绝对路径。
     返回值三种含义——对象＝用这个面板；false＝官方明确说了这文件不该接管；null＝挂钩没说话，去扫描。 */
  function paneFromSlot() {
    const s = slot.doc;
    if (!s || !s.el || !s.el.isConnected) return null;
    let pane = null;
    try { pane = s.el.closest('[data-document-preview]'); } catch (e) { return null; }
    if (!pane || pane.getAttribute('data-document-preview') === SELF_ID || isHiddenEl(pane)) return null;
    const abs = paneFilePath(pane, s.abs);
    if (pathIsBinary(abs)) { anchored.doc = true; return false; }
    const body = pane.querySelector('[data-textpreview-body]');
    if (!body) return null;
    if (!paneMarked) { paneMarked = true; mark('official-pane-seen'); }
    anchored.doc = true;
    return { pane: pane, body: body, abs: abs, via: 'slot' };
  }

  /* 扫描兜底（挂钩没说话时走这里）：跳过隐藏面板与二进制文件，优先取打开态的那个。 */
  function paneNowScan() {
    let panes;
    try { panes = document.querySelectorAll('[data-document-preview]'); } catch (e) { return null; }
    const pick = (pane, body) => {
      if (!paneMarked) { paneMarked = true; mark('official-pane-seen'); }
      return { pane: pane, body: body, abs: paneFilePath(pane, ''), via: 'scan' };
    };
    let fallback = null;
    for (const pane of panes) {
      if (!pane.isConnected || pane.getAttribute('data-document-preview') === SELF_ID) continue;
      if (isHiddenEl(pane) || pathIsBinary(paneFilePath(pane, ''))) continue;
      const body = pane.querySelector('[data-textpreview-body]');
      if (!body) continue;
      if (pane.closest('[data-sidebar-right-open]') || pane.hasAttribute('data-dockkit-float')) return pick(pane, body);
      if (!fallback) fallback = pick(pane, body);
    }
    return fallback;
  }

  function paneNow() {
    const fromSlot = paneFromSlot();
    if (fromSlot === false) return null;
    if (fromSlot) return fromSlot;
    anchored.doc = false;
    return paneNowScan();
  }

  function paneAllowsEdit(cur) {
    const ext = pathSuffix(paneFilePath(cur.pane, cur.abs));
    return ext === 'md' || ext === 'markdown';
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
  input.placeholder = tr('find.holder');
  const count = document.createElement('span');
  count.className = 'dshsp-count';
  function renderFf() {
    count.textContent = ff.q ? (ff.ranges.length ? (ff.idx + 1) + ' / ' + ff.ranges.length : tr('finding.no')) : '';
  }
  function runFf() {
    const cur = paneNow();
    ff.ranges = (cur && ff.q) ? walkTextRanges(cur.body, ff.q, ff.cs) : [];
    if (ff.idx >= ff.ranges.length) ff.idx = 0;
    paintHighlights(ff, FIND_NS_DOC); revealHighlight(ff); renderFf();
  }
  function stepFf(d) {
    if (!ff.ranges.length) { runFf(); return; }
    const n = ff.ranges.length;
    ff.idx = ((ff.idx + d) % n + n) % n;
    paintHighlights(ff, FIND_NS_DOC); revealHighlight(ff); renderFf();
  }
  function openFind() {
    ff.open = true;
    sync();
    try { input.focus(); input.select(); } catch (e) { }
    if (ff.q) runFf(); else renderFf();
  }
  function closeFind() {
    ff.open = false;
    clearHighlights(FIND_NS_DOC);
    renderFf();
    sync();
  }
  async function gotoSourceEdit() {
    try {
      const cur = paneNow();
      if (!cur) return;
      const pane = cur.pane;
      if (pane.getAttribute('data-document-preview') === SELF_ID) { pendingEdit = true; return; }
      const menuBtn = pane.querySelector('[data-document-viewer-menu]');
      if (!menuBtn) { barFlash('请先切到「源编辑」视图'); return; }
      menuBtn.click();
      await sleep(250);
      const item = [...document.querySelectorAll('button,[role="menuitem"],[role="option"]')]
        .find((el) => (((el.textContent || '').trim() === TITLE || (el.textContent || '').trim() === en['viewer.label']) && el !== menuBtn && !(el.closest && el.closest('[data-dshsp-official]'))));
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
    setText(zoomBtn, Math.max(10, Math.round(basePx() * officialZoom)) + 'px');
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
    if (paneAllowsEdit(cur)) gotoSourceEdit();
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
    ipJump.box.style.display = on ? '' : 'none';
    setText(saveBtn, tr('bar.save') + (ip.dirty ? ' *' : ''));
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
      caretToLine(ta, 1);
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
    } catch (e) {
      barFlash('保存失败：' + msgOf(e));
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

  const editBtn = mkBtn(tr('bar.edit'), tr('bar.edit.tip'), onEditClick);
  editBtn.className = 'dshsp-btn dshsp-btn-primary';
  const findBtn = mkBtn(tr('bar.find'), tr('bar.find.tip'), openFind);
  const aMinus = mkBtn('A−', tr('font.in'), () => bumpZoom(-1));
  const zoomBtn = mkBtn('—', tr('font.reset.official'), () => setOfficialZoom(1));
  zoomBtn.style.minWidth = '42px';
  zoomBtn.style.justifyContent = 'center';
  const aPlus = mkBtn('A+', tr('font.out'), () => bumpZoom(1));
  const linenoBtn = mkBtn(tr('bar.lineno'), tr('bar.lineno.tip'), () => setPlainLineNo(!plainLineNo));
  const saveBtn = mkBtn(tr('bar.save'), tr('bar.save.tip'), () => doSave(false));
  saveBtn.className = 'dshsp-btn dshsp-btn-primary';
  const exitBtn = mkBtn(tr('bar.exit'), tr('bar.exit.tip'), () => exitInplace());
  const ipJump = mkJump(() => (ip.active ? ip.ta : null), barFlash);
  const forceBtn = mkBtn(tr('bar.forcedit'), tr('bar.forcedit.tip'), () => doSave(true));
  forceBtn.className = 'dshsp-btn dshsp-conflict';
  const reloadBtn = mkBtn(tr('bar.reload'), tr('bar.reload.tip'), () => reloadLatest());
  reloadBtn.className = 'dshsp-btn dshsp-conflict';
  bar.appendChild(editBtn);
  bar.appendChild(saveBtn);
  bar.appendChild(exitBtn);
  bar.appendChild(ipJump.box);
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
  findRow.appendChild(mkBtn('Aa', tr('find.case'), function () { ff.cs = !ff.cs; ff.idx = 0; runFf(); }));
  findRow.appendChild(mkBtn('↑', tr('find.prev'), () => stepFf(-1)));
  findRow.appendChild(mkBtn('↓', tr('find.next'), () => stepFf(1)));
  findRow.appendChild(mkBtn('✕', tr('find.close'), closeFind));
  input.addEventListener('input', function () { ff.q = input.value; ff.idx = 0; runFf(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); stepFf(e.shiftKey ? -1 : 1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); stepFf(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); stepFf(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFind(); }
  });

  /* 官方对比视图（changes-review）：工具条的第二处落点。搜索走 CSS Highlight 一次遍历两侧；
     字号一个变量管两侧；编辑只落右侧（＝磁盘上的当前文件），左侧是本轮历史快照，永远只读。 */
  const RV_ZOOM_KEY = 'dsh-sidebar-plus.reviewZoom';
  let rvZoom = 1;
  try {
    const z = parseFloat(window.localStorage.getItem(RV_ZOOM_KEY));
    if (z >= 0.5 && z <= 2.5) rvZoom = z;
  } catch (e) { }

  const RV_SIDE_KEY = 'dsh-sidebar-plus.reviewFindSide';
  const rvff = { open: false, q: '', cs: false, side: 'both', ranges: [], idx: 0 };
  try {
    const s = window.localStorage.getItem(RV_SIDE_KEY);
    if (s === 'left' || s === 'right') rvff.side = s;
  } catch (e) { }
  const rved = { active: false, dirty: false, conflict: false, busy: false, abs: '', mtimeMs: 0, crlf: false, bom: false, init: '', ta: null, gut: null, box: null, hide: null, wide: false };
  let rvRoot = null;
  let rvKey = '';
  let rvAnchorLine = 0;

  const rgroup = document.createElement('div');
  rgroup.className = 'dshsp-ogroup';
  rgroup.setAttribute('data-dshsp-review', '1');
  const rbar = document.createElement('div');
  rbar.className = 'dshsp-bar';
  const rfindRow = document.createElement('div');
  rfindRow.className = 'dshsp-find';
  rgroup.appendChild(rbar);
  rgroup.appendChild(rfindRow);
  const rstatus = document.createElement('span');
  rstatus.className = 'dshsp-status';
  let rvMsgTimer = null;
  function rvFlash(text) {
    rstatus.textContent = String(text || '');
    if (rvMsgTimer) clearTimeout(rvMsgTimer);
    rvMsgTimer = setTimeout(() => { rstatus.textContent = ''; }, 4000);
  }

  /* 只服务「可见且已画出对比体」的对比页：挂钩在位先认官方那一格，对不上再退回整页扫描。 */
  function rvFromSlot() {
    const s = slot.review;
    if (!s || !s.el || !s.el.isConnected) return null;
    try {
      const root = s.el.closest('[data-changes-review]');
      if (!root || isHiddenEl(root)) return null;
      const body = root.querySelector('[data-review-view]');
      if (!body) return null;
      anchored.review = true;
      return { root: root, body: body, via: 'slot' };
    } catch (e) { return null; }
  }

  function rvBodyNow() {
    if (typeof document === 'undefined') return null;
    const viaSlot = rvFromSlot();
    if (viaSlot) return viaSlot;
    anchored.review = false;
    const list = document.querySelectorAll('[data-changes-review]');
    for (const el of list) {
      if (!el.isConnected || isHiddenEl(el)) continue;
      const body = el.querySelector('[data-review-view]');
      if (body) return { root: el, body: body, via: 'scan' };
    }
    return null;
  }

  function rvSource() {
    const cur = rvBodyNow();
    if (!cur) return null;
    const scope = cur.root.closest('[data-sidebar-right-session]');
    const fileEl = cur.root.querySelector('[data-review-file]');
    const sessionId = scope ? String(scope.getAttribute('data-sidebar-right-session') || '') : '';
    const path = fileEl ? String(fileEl.getAttribute('data-review-file') || '') : '';
    return {
      root: cur.root,
      body: cur.body,
      left: cur.body.querySelector('[data-diff-side="left"]'),
      right: cur.body.querySelector('[data-diff-side="right"]'),
      sessionId: sessionId,
      path: path,
      address: (sessionId && path) ? sessionFileAddress(sessionId, path) : '',
    };
  }

  /* 搜索范围：两侧 / 只左 / 只右。官方没画两栏时（单栏、单边对比）自动退回两侧。 */
  function rvScope() {
    const caps = rvSource();
    if (!caps) return null;
    const sides = !!(caps.left && caps.right);
    const side = (rvff.side !== 'both' && caps[rvff.side]) ? rvff.side : 'both';
    return { caps: caps, side: side, sides: sides, el: side === 'both' ? caps.body : caps[side] };
  }

  const rEditBtn = mkBtn(tr('rv.edit'), '', () => rvEnterEdit());
  rEditBtn.className = 'dshsp-btn dshsp-btn-primary';
  const rSaveBtn = mkBtn(tr('bar.save'), tr('bar.save.tip'), () => rvSave(false));
  rSaveBtn.className = 'dshsp-btn dshsp-btn-primary';
  const rExitBtn = mkBtn(tr('bar.exit'), tr('bar.exit.tip'), () => rvExitEdit());
  const rvJump = mkJump(() => (rved.active ? rved.ta : null), rvFlash);
  const rFindBtn = mkBtn(tr('bar.find'), '', () => rvOpenFind());
  const rAMinus = mkBtn('A−', '', () => rvBump(-1));
  const rZoomBtn = mkBtn('—', '', () => rvSetZoom(1));
  rZoomBtn.style.minWidth = '42px';
  rZoomBtn.style.justifyContent = 'center';
  const rAPlus = mkBtn('A+', '', () => rvBump(1));
  const rForceBtn = mkBtn(tr('bar.forcedit'), tr('bar.forcedit.tip'), () => rvSave(true));
  rForceBtn.className = 'dshsp-btn dshsp-conflict';
  const rReloadBtn = mkBtn(tr('bar.reload'), tr('bar.reload.tip'), () => rvReload());
  rReloadBtn.className = 'dshsp-btn dshsp-conflict';
  const rvLabel = function (key, fallback) {
    return tr(key, fallback);
  };
  function rvTitles() {
    rEditBtn.title = rvLabel('rv.edit.tip', '编辑右侧（当前文件），左侧是只读的历史快照；会先切成左右分栏、不换行');
    rFindBtn.title = rvLabel('rv.find.tip', '搜索（左右两侧一起搜）');
    rAMinus.title = rvLabel('rv.zoom.in', '缩小字号（左右两侧一起变）');
    rAPlus.title = rvLabel('rv.zoom.out', '放大字号（左右两侧一起变）');
    rZoomBtn.title = rvLabel('rv.zoom.reset', '点击恢复对比视图的官方字号（左右两侧一起变）');
  }
  rbar.appendChild(rEditBtn);
  rbar.appendChild(rSaveBtn);
  rbar.appendChild(rExitBtn);
  rbar.appendChild(rvJump.box);
  rbar.appendChild(rFindBtn);
  rbar.appendChild(rAMinus);
  rbar.appendChild(rZoomBtn);
  rbar.appendChild(rAPlus);
  rbar.appendChild(rForceBtn);
  rbar.appendChild(rReloadBtn);
  rbar.appendChild(rstatus);
  rvTitles();
  rSaveBtn.style.display = 'none';
  rExitBtn.style.display = 'none';
  rForceBtn.style.display = 'none';
  rReloadBtn.style.display = 'none';

  const rInput = document.createElement('input');
  rInput.type = 'text';
  rInput.placeholder = rvLabel('rv.find.holder', '搜索（左右两侧一起搜；↓/Enter 下一个，↑/Shift+Enter 上一个，Esc 关闭）');
  const rCount = document.createElement('span');
  rCount.className = 'dshsp-count';

  const rvSideBtns = {};
  function rvSideBtn(side, label, title) {
    const b = mkBtn(label, title, function () {
      rvff.side = side;
      rvff.idx = 0;
      try { window.localStorage.setItem(RV_SIDE_KEY, side); } catch (e) { }
      rvRunFind();
    });
    rvSideBtns[side] = b;
    return b;
  }
  function rvSyncSideUi() {
    const sc = rvScope();
    if (!sc) return;
    for (const side of ['both', 'left', 'right']) {
      const b = rvSideBtns[side];
      if (!b) continue;
      b.disabled = !sc.sides && side !== 'both';
      b.className = (sc.side === side) ? 'dshsp-btn dshsp-btn-on' : 'dshsp-btn';
    }
  }

  function rvRenderFind() {
    rvSyncSideUi();
    rCount.textContent = rvff.q ? (rvff.ranges.length ? (rvff.idx + 1) + ' / ' + rvff.ranges.length : rvLabel('finding.no', '无匹配')) : '';
  }
  function rvRunFind() {
    const sc = rvScope();
    rvff.ranges = (sc && rvff.q) ? walkTextRanges(sc.el, rvff.q, rvff.cs) : [];
    if (rvff.idx >= rvff.ranges.length) rvff.idx = 0;
    paintHighlights(rvff, FIND_NS_REVIEW); revealHighlight(rvff); rvRenderFind();
  }
  function rvStepFind(d) {
    if (!rvff.ranges.length) { rvRunFind(); return; }
    const n = rvff.ranges.length;
    rvff.idx = ((rvff.idx + d) % n + n) % n;
    paintHighlights(rvff, FIND_NS_REVIEW); revealHighlight(rvff); rvRenderFind();
  }
  function rvOpenFind() {
    rvff.open = true;
    syncReview();
    try { rInput.focus(); rInput.select(); } catch (e) { }
    if (rvff.q) rvRunFind(); else rvRenderFind();
  }
  function rvCloseFind() {
    rvff.open = false;
    clearHighlights(FIND_NS_REVIEW);
    rvRenderFind();
    syncReview();
  }
  rfindRow.appendChild(rInput);
  rfindRow.appendChild(rCount);
  rfindRow.appendChild(rvSideBtn('both', tr('rv.side.both'), tr('rv.side.both.tip')));
  rfindRow.appendChild(rvSideBtn('left', tr('rv.side.left'), tr('rv.side.left.tip')));
  rfindRow.appendChild(rvSideBtn('right', tr('rv.side.right'), tr('rv.side.right.tip')));
  rfindRow.appendChild(mkBtn('Aa', tr('find.case'), function () { rvff.cs = !rvff.cs; rvff.idx = 0; rvRunFind(); }));
  rfindRow.appendChild(mkBtn('↑', tr('find.prev'), () => rvStepFind(-1)));
  rfindRow.appendChild(mkBtn('↓', tr('find.next'), () => rvStepFind(1)));
  rfindRow.appendChild(mkBtn('✕', tr('find.close'), rvCloseFind));
  rInput.addEventListener('input', function () { rvff.q = rInput.value; rvff.idx = 0; rvRunFind(); });
  rInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); rvStepFind(e.shiftKey ? -1 : 1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); rvStepFind(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); rvStepFind(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); rvCloseFind(); }
  });

  /* 对比体当前字号：取右栏首行 computed font-size，取不到退回 13px；同一面板内缓存。 */
  let rvBaseEl = null;
  let rvBase = 13;
  function rvBasePx() {
    const cur = rvBodyNow();
    if (!cur) return 13;
    if (rvBaseEl === cur.body) return rvBase;
    try {
      const el = cur.body.querySelector('[data-diff-line]') || cur.body;
      const v = parseFloat(getComputedStyle(el).fontSize);
      rvBase = Number.isFinite(v) && v > 0 ? v : 13;
    } catch (e) { rvBase = 13; }
    rvBaseEl = cur.body;
    return rvBase;
  }
  function rvApplyZoom() {
    if (!rvRoot) return;
    try {
      if (rvZoom === 1) {
        rvRoot.removeAttribute('data-dshsp-rv');
        rvRoot.style.removeProperty('--dshsp-rvz');
      } else {
        rvRoot.setAttribute('data-dshsp-rv', '1');
        if (rvRoot.style.getPropertyValue('--dshsp-rvz') !== String(rvZoom)) rvRoot.style.setProperty('--dshsp-rvz', String(rvZoom));
      }
    } catch (e) { }
    if (rved.active && rved.wide && rved.box) {
      try { rved.box.style.zoom = rvZoom === 1 ? '' : String(rvZoom); } catch (e) { }
    }
  }
  function rvUpdateZoomUi() {
    setText(rZoomBtn, Math.max(8, Math.round(rvBasePx() * rvZoom)) + 'px');
    rvApplyZoom();
  }
  function rvBump(dir) { rvSetZoom(rvZoom + dir / rvBasePx()); }
  function rvSetZoom(v) {
    const n = Math.min(2.5, Math.max(0.5, Math.round(v * 100) / 100));
    if (n === rvZoom) { rvUpdateZoomUi(); return; }
    rvZoom = n;
    try { window.localStorage.setItem(RV_ZOOM_KEY, String(n)); } catch (e) { }
    rvUpdateZoomUi();
  }

  function rvRenderGutter() {
    if (!rved.gut || !rved.ta) return;
    const n = rved.ta.value.split('\n').length;
    const out = [];
    for (let i = 1; i <= n; i++) out.push('<div>' + i + '</div>');
    rved.gut.innerHTML = out.join('');
  }
  /* 对比页右侧＝磁盘上的当前文件；二进制文件（Office / 表格 / PDF…）不给「编辑右侧」。 */
  function rvBinaryNow() {
    try { const caps = rvSource(); return !!(caps && caps.path && pathIsBinary(caps.path)); } catch (e) { return false; }
  }
  function rvSyncUi() {
    const on = rved.active;
    const bin = !on && rvBinaryNow();
    rSaveBtn.style.display = on ? '' : 'none';
    rExitBtn.style.display = on ? '' : 'none';
    rForceBtn.style.display = (on && rved.conflict) ? '' : 'none';
    rReloadBtn.style.display = (on && rved.conflict) ? '' : 'none';
    rEditBtn.style.display = (on || bin) ? 'none' : '';
    rFindBtn.style.display = on ? 'none' : '';
    rvJump.box.style.display = on ? '' : 'none';
    setText(rSaveBtn, tr('bar.save') + (rved.dirty ? ' *' : ''));
    rfindRow.style.display = (rvff.open && !on) ? 'flex' : 'none';
  }

  /* 官方的左右分栏只在「分栏 + 不换行」时成立；进编辑先替它切到那个形态。 */
  async function rvAutoSplit(root) {
    try {
      const splitBtn = root.querySelector('[data-review-tool="split"]');
      if (splitBtn && splitBtn.getAttribute('aria-pressed') !== 'true') splitBtn.click();
      const wrapBtn = root.querySelector('[data-review-tool="wrap"]');
      if (wrapBtn && wrapBtn.getAttribute('aria-pressed') === 'true') wrapBtn.click();
    } catch (e) { }
  }
  function rvWaitRight(ms) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const tick = () => {
        const caps = rvSource();
        if (caps && caps.right) return resolve(caps.right);
        if (Date.now() - t0 >= ms) return resolve(null);
        setTimeout(tick, 60);
      };
      tick();
    });
  }

  /* 对比页里点一行 → 记住它（映射到右侧/新版本的行号），编辑就从这行开始。 */
  function rvPickRow(row) {
    const caps = rvSource();
    if (!caps || !caps.body.contains(row)) return;
    let target = row;
    if (caps.left && caps.right && caps.left.contains(row)) {
      const rows = Array.prototype.slice.call(caps.left.querySelectorAll('[data-diff-line]'));
      const at = rows.indexOf(row);
      const peers = Array.prototype.slice.call(caps.right.querySelectorAll('[data-diff-line]'));
      if (at >= 0 && peers[at]) target = peers[at];
    }
    const n = rowLineNo(target);
    if (n < 1) return;
    rvAnchorLine = n;
    try {
      const marked = caps.root.querySelectorAll('.dshsp-anchor');
      for (const el of marked) el.classList.remove('dshsp-anchor');
      target.classList.add('dshsp-anchor');
    } catch (e) { }
    rvFlash('已选定第 ' + n + ' 行：点「编辑右侧」就从这一行开始');
  }

  /* 没点过行时的兜底：取右栏可视区中间那一行的行号。 */
  function rvCenterLine() {
    const caps = rvSource();
    if (!caps || !caps.right || typeof caps.right.getBoundingClientRect !== 'function') return 0;
    const box = caps.right.getBoundingClientRect();
    if (!box || !box.height) return 0;
    const mid = box.top + box.height / 2;
    let best = 0;
    let bestD = Infinity;
    for (const row of caps.right.querySelectorAll('[data-diff-line]')) {
      const r = row.getBoundingClientRect();
      if (!r.height) continue;
      if (r.bottom < box.top || r.top > box.bottom) continue;
      const d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < bestD) { bestD = d; best = rowLineNo(row); }
    }
    return best;
  }

  function rvBuildEditor(caps, r) {
    const wide = !caps.right;
    const box = document.createElement('div');
    box.className = wide ? 'dshsp-rved' : (caps.right.className + ' dshsp-rved');
    box.setAttribute('data-dshsp-rvedit', '1');
    box.style.setProperty('--dshsp-fs', Math.round(rvBasePx()) + 'px');
    const row = document.createElement('div');
    row.className = 'dshsp-editrow';
    const gut = document.createElement('div');
    gut.className = 'dshsp-egut';
    const ta = document.createElement('textarea');
    ta.className = 'dshsp-ta';
    ta.spellcheck = false;
    ta.setAttribute('wrap', 'off');
    ta.value = r.text;
    row.appendChild(gut);
    row.appendChild(ta);
    box.appendChild(row);
    if (wide) {
      caps.body.parentElement.insertBefore(box, caps.body);
      caps.body.style.display = 'none';
    } else {
      caps.right.parentElement.appendChild(box);
      caps.right.style.display = 'none';
    }
    Object.assign(rved, {
      active: true, dirty: false, conflict: false, abs: r.abs, mtimeMs: r.mtimeMs,
      crlf: r.crlf, bom: r.bom, init: r.text, ta: ta, gut: gut, box: box,
      hide: wide ? caps.body : caps.right, wide: wide,
    });
    ta.addEventListener('input', () => { rved.dirty = ta.value !== rved.init; rvRenderGutter(); rvSyncUi(); });
    ta.addEventListener('scroll', () => { if (rved.gut) rved.gut.scrollTop = ta.scrollTop; });
    rvApplyZoom();
    rvRenderGutter();
    rvSyncUi();
    return ta;
  }

  async function rvEnterEdit() {
    if (rved.active || rved.busy) return;
    let caps = rvSource();
    if (!caps) return;
    if (!caps.address) { rvFlash('无法定位文件（缺少会话或路径）'); return; }
    if (rvBinaryNow()) { rvFlash('该格式不是文本文件（Office / 表格 / PDF 等），不能用文本编辑器改'); return; }
    rved.busy = true;
    try {
      if (!caps.right) {
        await rvAutoSplit(caps.root);
        await rvWaitRight(900);
        caps = rvSource();
        if (!caps) return;
      }
      const r = await readWholeText(caps.address);
      const ta = rvBuildEditor(caps, r);
      const want = rvAnchorLine || rvCenterLine() || 1;
      const at = caretToLine(ta, want);
      if (at > 1 && want > 1) rvFlash('已定位到第 ' + at + ' 行（左侧是历史对照，只读）；Ctrl+S 保存，Esc 退出');
      else rvFlash(rvLabel('rv.editing', '编辑中：只改右侧的当前文件，左侧只读；Ctrl+S 保存，Esc 退出'));
    } catch (e) {
      rvFlash(msgOf(e));
    } finally {
      rved.busy = false;
    }
  }
  function rvExitEdit(force) {
    if (!rved.active) return;
    if (!force && rved.dirty && typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('有未保存的修改，确定放弃并退出编辑吗？')) return;
    }
    try { if (rved.box && rved.box.parentNode) rved.box.remove(); } catch (e) { }
    try { if (rved.hide) rved.hide.style.display = ''; } catch (e) { }
    Object.assign(rved, { active: false, dirty: false, conflict: false, ta: null, gut: null, box: null, hide: null, wide: false });
    rvSyncUi();
  }
  async function rvSave(force) {
    if (!rved.active || rved.busy) return;
    rved.busy = true;
    try {
      const out = fromEditorText(rved.ta.value, { crlf: rved.crlf, bom: rved.bom });
      const r = await postSave(saveRequestBody(rved.abs, out, rved.mtimeMs, force));
      if (r && r.ok) {
        rved.mtimeMs = r.mtimeMs;
        rved.init = rved.ta.value;
        rved.dirty = false;
        rved.conflict = false;
        rvSyncUi();
        rvFlash('已保存 ' + humanBytes(r.bytes) + (r.backup ? '（旧版已自动备份）' : '') + '；' + rvLabel('rv.saved', '左侧对比是历史快照，不会随之更新'));
        return;
      }
      if (r && r.error === 'changed') {
        rved.conflict = true;
        rvSyncUi();
        rvFlash('文件在别处被改过，请选择：');
        return;
      }
      rvFlash('保存失败：' + msgOf(r && r.error ? r.error : r));
    } catch (e) {
      rvFlash('保存失败：' + msgOf(e));
    } finally {
      rved.busy = false;
    }
  }
  async function rvReload() {
    if (!rved.active || rved.busy) return;
    rved.busy = true;
    try {
      const caps = rvSource();
      if (!caps || !caps.address) throw new Error('无法定位文件');
      const r = await readWholeText(caps.address);
      const keep = lineOfCaret(rved.ta);
      rved.init = r.text;
      rved.ta.value = r.text;
      rved.mtimeMs = r.mtimeMs;
      rved.crlf = r.crlf;
      rved.bom = r.bom;
      rved.dirty = false;
      rved.conflict = false;
      rvRenderGutter();
      rvSyncUi();
      caretToLine(rved.ta, keep);
      rvFlash('已重载磁盘最新内容');
    } catch (e) {
      rvFlash(msgOf(e));
    } finally {
      rved.busy = false;
    }
  }

  function syncReview() {
    const cur = rvBodyNow();
    if (!cur) {
      if (rved.active) rvExitEdit(true);
      if (rvRoot) {
        try { rvRoot.removeAttribute('data-dshsp-rv'); rvRoot.style.removeProperty('--dshsp-rvz'); } catch (e) { }
      }
      rvRoot = null;
      rvKey = '';
      if (rgroup.parentNode) { try { rgroup.remove(); } catch (e) { } }
      if (rvff.open) { rvff.open = false; clearHighlights(FIND_NS_REVIEW); rvRenderFind(); }
      return;
    }
    const scope = cur.root.closest('[data-sidebar-right-session]');
    const fileEl = cur.root.querySelector('[data-review-file]');
    /* 键里带上官方挂钩给的 actionUrl：换文件时它必变，比只靠 DOM 属性晚一拍稳。 */
    const key = String(scope ? scope.getAttribute('data-sidebar-right-session') || '' : '') + '|' + String(fileEl ? fileEl.getAttribute('data-review-file') || '' : '') + '|' + (slot.review ? slot.review.url : '');
    if (rvKey !== key) {
      rvKey = key;
      if (rved.active) rvExitEdit(true);
      rvAnchorLine = 0;
      try {
        const marked = cur.root.querySelectorAll('.dshsp-anchor');
        for (const el of marked) el.classList.remove('dshsp-anchor');
      } catch (e) { }
      clearHighlights(FIND_NS_REVIEW);
      rvff.ranges = [];
      rvff.idx = 0;
      if (rvff.q) rvRunFind(); else rvRenderFind();
    }
    if (rvRoot !== cur.root) {
      if (rved.active) rvExitEdit(true);
      rvRoot = cur.root;
    }
    const anchor = cur.root.firstElementChild;
    if (rgroup.parentNode !== cur.root) {
      try { cur.root.insertBefore(rgroup, anchor ? anchor.nextSibling : cur.root.firstChild); } catch (e) { return; }
    }
    rvApplyZoom();
    rvSyncUi();
    rvUpdateZoomUi();
  }

  function sync() {
    syncDoc();
    syncReview();
    retargetObserver();
  }

  /* 观察范围：挂钩在位时盯「右侧栏容器」，不是整页、也不只是单个面板 ——
     只盯单个面板的话，新开对比页或切页签的变化发生在面板之外，要等兜底轮询才出工具条。
     挂钩缺失时退回盯整页。 */
  const anchorScopes = new WeakMap();
  let anchorSeq = 0;
  const scopeId = (el) => {
    let id = anchorScopes.get(el);
    if (id === undefined) { id = String(++anchorSeq); try { anchorScopes.set(el, id); } catch (e) { } }
    return id;
  };
  const sidebarScope = (el) => {
    try {
      return el.closest('[data-sidebar-right-open]') || el.closest('[data-sidebar-right-session]') || el;
    } catch (e) { return el; }
  };

  let observedKey = '';
  function retargetObserver() {
    let obs = null;
    try { obs = observer; } catch (e) { return; }   // 观察者声明在后面，还没建好时先不动（TDZ 保护）
    if (!obs) return;
    const roots = [];
    const push = (el) => { if (el && roots.indexOf(el) === -1) roots.push(el); };
    if (anchored.doc && slot.doc && slot.doc.el) {
      try { const p = slot.doc.el.closest('[data-document-preview]'); if (p) push(sidebarScope(p)); } catch (e) { }
    }
    if (anchored.review && slot.review && slot.review.el) {
      try { const r = slot.review.el.closest('[data-changes-review]'); if (r) push(sidebarScope(r)); } catch (e) { }
    }
    let key = 'page';
    if (roots.length) key = roots.map((el) => scopeId(el)).join('|');
    if (key === observedKey) return;
    observedKey = key;
    try {
      obs.disconnect();
      for (const el of (roots.length ? roots : [document.documentElement])) obs.observe(el, { childList: true, subtree: true });
      mark(roots.length ? 'observer-scoped' : 'observer-page');
    } catch (e) { }
  }

  function syncDoc() {
    const cur = paneNow();
    if (!cur) {
      if (ip.active) exitInplace(true);
      if (attachedPane) { try { attachedPane.style.removeProperty('--dshsp-zoom'); attachedPane.removeAttribute('data-dshsp-lineno'); } catch (e) { } }
      attachedPane = null;
      if (group.parentNode) { try { group.remove(); } catch (e) { } }
      if (ff.open) { ff.open = false; clearHighlights(FIND_NS_DOC); renderFf(); }
      return;
    }
    if (ip.active && (ip.pane !== cur.pane || ip.body !== cur.body)) exitInplace(true);
    if (!ip.active && (group.parentNode !== cur.pane || group.nextElementSibling !== cur.body)) {
      try { cur.pane.insertBefore(group, cur.body); } catch (e) { return; }
      if (!toolbarMarked) { toolbarMarked = true; mark('toolbar-inserted'); }
    }
    attachedPane = cur.pane;
    findRow.style.display = (ff.open && !ip.active) ? 'flex' : 'none';
    const isPlain = !!cur.body.querySelector('[data-textpreview-plain]');
    linenoBtn.style.display = (isPlain && !ip.active) ? '' : 'none';
    setText(linenoBtn, tr('bar.lineno'));
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
  /* 对比页与文档预览可能同时开着；键盘先给「焦点所在 / 唯一可见」的那一个。 */
  function onKeyReview(e) {
    const ctrl = e.ctrlKey || e.metaKey;
    if (rved.active) {
      if (ctrl && !e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); e.stopPropagation(); rvSave(false); return; }
      if (e.key === 'Escape') { e.preventDefault(); rvExitEdit(); return; }
      return;
    }
    if (ctrl && !e.altKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); e.stopPropagation(); rvOpenFind(); return; }
    if (e.key === 'F3' && rvff.open) { e.preventDefault(); rvStepFind(e.shiftKey ? -1 : 1); return; }
    if (e.key === 'Escape' && rvff.open) { e.preventDefault(); rvCloseFind(); }
  }
  const onKey = function (e) {
    try {
      const rv = rvBodyNow();
      if (rv) {
        const doc = paneNow();
        const focusInRv = typeof document !== 'undefined' && document.activeElement && rv.root.contains(document.activeElement);
        if (!doc || isHiddenEl(doc.pane) || focusInRv) { onKeyReview(e); return; }
      }
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
      const rv = rvBodyNow();
      if (rv && rv.root.contains(e.target)) {
        e.preventDefault(); e.stopPropagation();
        rvBump(e.deltaY < 0 ? 1 : -1);
        return;
      }
      const cur = paneNow();
      if (!cur || !cur.pane.contains(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      bumpZoom(e.deltaY < 0 ? 1 : -1);
    } catch (err) { }
  };
  window.addEventListener('keydown', onKey, true);
  const onPick = function (e) {
    try {
      if (rved.active) return;
      const t = e.target;
      const row = t && t.closest ? t.closest('[data-diff-line]') : null;
      if (!row) return;
      const caps = rvSource();
      if (!caps || !caps.body.contains(row)) return;
      rvPickRow(row);
    } catch (err) { }
  };
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('click', onPick, true);
    document.addEventListener('wheel', onWheel, { passive: false });
  }

  /* 同步时机：MutationObserver 驱动（16 毫秒节流），另留慢速兜底轮询。 */
  let stopped = false;
  let syncScheduled = false;
  let lastSyncAt = 0;
  const SYNC_MIN_GAP_MS = 16;   // 一帧节流
  function scheduleSync() {
    if (stopped || syncScheduled) return;
    syncScheduled = true;
    const gap = SYNC_MIN_GAP_MS - (Date.now() - lastSyncAt);
    setTimeout(function () {
      syncScheduled = false;
      if (stopped) return;
      lastSyncAt = Date.now();
      try { sync(); } catch (e) {  }
    }, gap > 0 ? gap : 0);
  }
  const canObserve = typeof MutationObserver === 'function' && typeof document !== 'undefined' && !!document.documentElement;
  const observer = canObserve ? new MutationObserver(scheduleSync) : null;
  if (observer) { try { observer.observe(document.documentElement, { childList: true, subtree: true }); } catch (e) { } }
  lastSyncAt = Date.now();
  sync();
  const timer = setInterval(sync, observer ? 1200 : 400);
  enh = {
    /* 挂钩挂上／摘掉：由 Actions、ReviewActions 调用；信息没变不重复同步。 */
    slotAttach(kind, el, info) {
      if (kind !== 'doc' && kind !== 'review') return;
      const cur = slot[kind];
      const abs = (info && info.abs) || '';
      const url = (info && info.url) || '';
      if (cur && cur.el === el && cur.abs === abs && cur.url === url) return;
      slot[kind] = { el: el, abs: abs, url: url };
      mark('slot-' + kind + '-attached');
      sync();
    },
    slotGone(kind, el) {
      const cur = slot[kind];
      if (!cur || cur.el !== el) return;
      slot[kind] = null;
      anchored[kind] = false;
      mark('slot-' + kind + '-gone');
      sync();
    },
    stop() {
      stopped = true;
      slot.doc = null;
      slot.review = null;
      anchored.doc = false;
      anchored.review = false;
      if (observer) { try { observer.disconnect(); } catch (e) { } }
      clearInterval(timer);
      if (msgTimer) clearTimeout(msgTimer);
      if (rvMsgTimer) clearTimeout(rvMsgTimer);
      if (zoomUi === updateZoomUi) zoomUi = null;
      window.removeEventListener('keydown', onKey, true);
      try { document.removeEventListener('click', onPick, true); } catch (e) { }
      try { document.removeEventListener('wheel', onWheel); } catch (e) { }
      clearHighlights(FIND_NS_DOC);
      clearHighlights(FIND_NS_REVIEW);
      try { exitInplace(true); } catch (e) { }
      try { rvExitEdit(true); } catch (e) { }
      try { group.remove(); } catch (e) { }
      try { rgroup.remove(); } catch (e) { }
      if (rvRoot) {
        try { rvRoot.removeAttribute('data-dshsp-rv'); rvRoot.style.removeProperty('--dshsp-rvz'); } catch (e) { }
      }
      rvRoot = null;
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

mark('business-ready');
enhanceStart();

return {
  version: VERSION,
  title: TITLE,
  extensions: ['md', 'markdown'],
  meta: { loading: 'text-pages', wrap: true, priority: 'builtin' },
  locale: { zh: zh, en: en },
  css: CSS,
  Body: SourceBody,
  Actions: Actions,
  ReviewActions: ReviewActions,
  teardown: function () {
    enhanceStop();
    try {
      const tag = document.querySelector('style[data-plugin-css="dsh-sidebar-plus-official"]');
      if (tag) tag.remove();
    } catch (e) { }
  },
  _test: {
    VERSION: VERSION,
    slot: slot,
    anchored: anchored,
    Actions: Actions,
    ReviewActions: ReviewActions,
    parseFileAddress: parseFileAddress,
    sessionFileAddress: sessionFileAddress,
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
    bytesOf: bytesOf,
    tr: tr,
    uiIsEn: uiIsEn,
    pathSuffix: pathSuffix,
    isBinaryPath: isBinaryPath,
    officialBinary: officialBinary,
    pathIsBinary: pathIsBinary,
    readWholeBytes: readWholeBytes,
    readWholeText: readWholeText,
  },
};
