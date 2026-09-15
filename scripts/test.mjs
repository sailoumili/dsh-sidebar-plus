// dsh-sidebar-plus 离线自测：node scripts/test.mjs
// 全程不弹窗、不联网；宿主端文件操作只在本脚本创建的临时目录里做。
// 覆盖：浏览器加载器（注册/守卫/热编译）、宿主加载器（路由守卫/parseSub/热装载）、
//       浏览器业务（纯函数全家桶）、宿主业务（保存/备份/冲突/清理）。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath, pathToFileURL } from 'node:url'

let passed = 0
function ok(cond, label, extra) {
  if (!cond) { console.log('  ✗ ' + label + (extra ? ' ｜ ' + extra : '')); throw new Error('FAIL: ' + label) }
  passed++
  console.log('  ✓ ' + label + (extra ? ' ｜ ' + extra : ''))
}

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8')

// ---------- 浏览器加载器 bundle：vm 沙箱里加载（伪造 __ModuleLoader__ 与 react） ----------
const stubReact = { createElement() {}, Fragment: 'F' }
let loaded = null
const sandbox = { console }
sandbox.window = { __ModuleLoader__: { load: (m) => { loaded = m } } }
vm.createContext(sandbox)
vm.runInContext(read('lib/client.js'), sandbox)
ok(loaded && loaded.id === 'dsh-sidebar-plus', '浏览器加载器以 id=dsh-sidebar-plus 注册')
const api = loaded.factory((id) => {
  if (id === 'react') return stubReact
  throw new Error('unexpected require: ' + id)
})
ok(api.name === 'dsh-sidebar-plus', '导出 name')
ok(Array.isArray(api.inject) && api.inject.includes('remote') && api.inject.includes('remote.workspaceFiles'), 'inject 声明了 remote + remote.workspaceFiles（护栏要求，缺了点编辑就炸）')
ok(typeof api.apply === 'function' && api._test && typeof api._test.compileBus === 'function', '导出 apply + _test.compileBus')
ok(api._test.ID === 'dsh-sidebar-plus/source' && api._test.NS === 'dshSidebarPlus', '注册 id / 字典命名空间稳定')

// ---------- 浏览器业务：通过加载器的 compileBus 真编译 hot-client.cjs ----------
const bus = api._test.compileBus(read('hot-client.cjs'), { react: stubReact, remote: null })
ok(typeof bus.version === 'string' && bus.version === '0.3.6', '业务版本号', bus.version)
ok(typeof bus.Body === 'function' && bus.title === '源编辑' && Array.isArray(bus.extensions), '业务契约字段齐全')
ok(bus.extensions.length === 2 && bus.extensions[0] === 'md' && bus.extensions[1] === 'markdown', '接管范围收窄到 md/markdown（其余格式保持官方视图、默认不被抢）', bus.extensions.join(','))
ok(bus.meta && bus.meta.loading === 'text-pages' && bus.meta.wrap === true && bus.meta.priority === 'builtin', '业务 meta：文本分页+支持换行+builtin 档注册（官方视图保持默认，不抢）')
ok(bus.locale && bus.locale.zh && bus.locale.en && typeof bus.css === 'string' && bus.css.includes('.dshsp-root'), '字典与样式随业务热载')
ok(bus.css.includes('[data-document-preview]>[data-textpreview-body]>*{zoom:var(--dshsp-zoom,1)}'), '官方视图字号走内容区 zoom 变量（不再强制覆盖官方默认）')
ok(bus.css.includes('[data-document-preview$="/text"][data-dshsp-lineno="on"] [data-textpreview-line]::before') && bus.css.includes('attr(data-textpreview-line)'), '官方「纯文本」视图行号是可选开关（面板带 data-dshsp-lineno="on" 才画号，默认关）')
ok(bus.css.includes('--dshsp-lnw:calc(var(--dshsp-lnch) * 1ch)') && bus.css.includes('--dshsp-lnpad:8px') && bus.css.includes('--dshsp-lngap:12px'), '行号列几何对齐官方代码视图（8px+官方 8px 内边距=16px 缩进、位数自适应列宽、12px 间隙 → 两视图同列）')
ok(bus.css.includes('.dshsp-btn-on{font-weight:700'), '开关开启态用加粗+高亮底（不打勾，关闭即恢复）')
ok(!bus.css.includes('.dshsp-fab'), '旧悬浮药丸样式已移除（官方视图改用源编辑同款工具条）')
const T = bus._test

// parseFileAddress
{
  const p = T.parseFileAddress('dsh-resource://file/session/session-abc123/%E7%AC%94%E8%AE%B0/2026-01-01.md')
  ok(p && p.scope === 'session' && p.sessionId === 'session-abc123' && p.path === '笔记/2026-01-01.md', 'session 地址：会话+百分号编码路径解码')
  const q = T.parseFileAddress('dsh-resource://file/session/s1/a/my%20file.txt?x=1#frag')
  ok(q && q.path === 'a/my file.txt', 'session 地址：? # 后缀截断、空格解码')
  const a = T.parseFileAddress('dsh-resource://file/absolute/F%3A/tmp/x.md')
  ok(a && a.scope === 'absolute' && a.path === 'F:/tmp/x.md', 'absolute 地址能解析')
  ok(T.parseFileAddress('https://example.com') === undefined, '非 file 地址拒绝')
  ok(T.parseFileAddress('dsh-resource://file/') === undefined, '残缺地址拒绝')
  ok(T.parseFileAddress('dsh-resource://file/session/onlysid') === undefined, '无路径段拒绝')
}

// computeMatches / matchesByLine
{
  const lines = ['Today 开头', 'Tomorrow is TODAY', 'no match here']
  const m = T.computeMatches(lines, 'today', false)
  ok(m.length === 2 && m[0].line === 1 && m[0].start === 0 && m[1].line === 2 && m[1].start === 12, '大小写不敏感：跨行两处命中')
  const cs = T.computeMatches(lines, 'TODAY', true)
  ok(cs.length === 1 && cs[0].line === 2 && cs[0].start === 12, '大小写敏感')
  ok(T.computeMatches(lines, '', false).length === 0, '空查询无匹配')
  ok(T.computeMatches(lines, '不存在的串', false).length === 0, '无命中返回空')
  const rep = T.computeMatches(['aaa', 'bbb'], 'aa', false)
  ok(rep.length === 1 && rep[0].line === 1, '不重叠前进（aaa 里 aa 只算一次）')
  const by = T.matchesByLine(m)
  ok(by[1].length === 1 && by[2].length === 1 && !by[3], '按行分组')
}

// markdown 片段与行类
{
  const s = T.segmentMarkdown('前 **粗** 中 `码` 后 ~~删~~ 斜 _it_')
  const kinds = s.map((x) => x.k).join(',')
  ok(s[0].s === '前 ' && kinds.includes('bold') && kinds.includes('code') && kinds.includes('strike') && s.some((x) => x.k === 'italic' && x.s === '_it_'), '行内 bold/code/strike/italic 切分')
  ok(T.segmentMarkdown('plain')[0].k === 'plain', '纯文本整段 plain')
  ok(T.segmentMarkdown('')[0].s === '', '空行不炸')
}
ok(T.headingLevel('### 标题') === 3 && T.headingLevel('#') === 1 && T.headingLevel('####### 七') === 0 && T.headingLevel('普通') === 0, '标题级数')
ok(T.isQuoteLine('> 引用') && T.isQuoteLine('  > 缩进引用') && !T.isQuoteLine('普通'), '引用行判定')
ok(T.isTaskLine('- [ ] 事项') && T.isTaskLine('* [x] 勾了') && !T.isTaskLine('- 事项'), '任务行判定')

// overlayMarks 高亮切片
{
  const segs = [{ k: 'bold', s: '**aa**' }, { k: 'plain', s: 'bb' }]
  const ranges = [{ line: 1, start: 3, len: 5 }]
  const out = T.overlayMarks(segs, ranges, ranges[0])
  const marked = out.filter((x) => x.mark)
  ok(marked.length === 2 && marked[0].kind === 'bold' && marked[0].text === 'a**' && marked[1].kind === 'plain' && marked[1].text === 'bb', '跨片段匹配按片段切开且保留原样式')
  ok(marked.every((x) => x.cur), '当前匹配标 cur')
  const plain = T.overlayMarks(segs, [], null)
  ok(plain.filter((x) => x.mark).length === 0 && plain.map((x) => x.text).join('') === '**aa**bb', '无匹配时文本完整还原')
}

// 换行/BOM 往返 + 杂项
{
  const winTxt = 'a\r\nb\r\n'
  const norm = T.toEditorText(winTxt)
  ok(norm.crlf === true && norm.text === 'a\nb\n', 'CRLF 编辑器内归一为 LF')
  ok(T.fromEditorText(norm.text, { crlf: true, bom: false }) === winTxt, '保存还原 CRLF 一致')
  const withBom = T.toEditorText('\uFEFFx=1')
  ok(withBom.bom === true && withBom.text === 'x=1', 'BOM 剥离')
  ok(T.fromEditorText('x=1', { crlf: false, bom: true }) === '\uFEFFx=1', 'BOM 还原')
}
ok(T.humanBytes(500) === '500 B' && T.humanBytes(2048) === '2.0 KB' && T.humanBytes(3 * 1024 * 1024) === '3.00 MB', '字节显示')
{
  let threw = false
  try { api._test.compileBus('return { version: 1 }', { react: stubReact }) } catch (e) { threw = true }
  ok(threw, '坏业务代码被 compileBus 拒绝（保留旧版机制的前提）')
}

// ---------- 宿主加载器（DSH_HOME 指到临时目录，备份不落真机） ----------
const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-sp-home-'))
process.env.DSH_HOME = tmpHome
const host = await import(pathToFileURL(path.join(root, 'lib', 'index.js')).href)
const H2 = host._test
ok(H2.LOADER_VERSION === '0.3.2', '宿主加载器版本')
ok(/hot-host\.cjs$/.test(H2.HOT_HOST) && /hot-client\.cjs$/.test(H2.HOT_CLIENT), '热件路径指到插件根目录')
{
  ok(H2.parseSub('/dsh-sp/save?x=1') === '/save', 'parseSub 去查询串')
  ok(H2.parseSub('/dsh-sp/') === '/', 'parseSub 根')
  ok(H2.parseSub('/dsh-sp/stat') === '/stat', 'parseSub 子路径')
  const req = (headers) => ({ headers })
  ok(H2.requestRejection(req({ host: '127.0.0.1:3091', origin: 'http://127.0.0.1:3091' })) === 0, '同源 Origin 放行')
  ok(H2.requestRejection(req({ host: '127.0.0.1:3091', origin: 'http://evil.example' })) === 403, '异源 Origin 拒绝')
  ok(H2.requestRejection(req({ host: '127.0.0.1:3091' })) === 0, '本机无 Origin 放行（file-opener 同口径）')
  ok(H2.wantsJsonBody({ headers: { 'content-type': 'application/json; charset=utf-8' } }) === true, 'JSON 体识别')
}

// ---------- 宿主业务：用加载器的 loadHostBus 真装载 hot-host.cjs ----------
const hbus = H2.loadHostBus(H2.HOT_HOST)
ok(hbus.version === '0.3.1' && hbus.handlers && typeof hbus.handlers.save === 'function' && typeof hbus.handlers.stat === 'function', '宿主业务装载成功，handlers 齐全')
{
  const N = (s) => ({ get: (k) => (k === 'abs' ? s : null) })
  ok(hbus.handlers.stat(N('relative/a.md')).body.ok === false, 'stat 拒相对路径')
  const r1 = hbus.handlers.save({ abs: '', text: 'x' })
  ok(r1.body.ok === false && r1.body.error === 'empty-path', 'save 拒空路径')
  const r2 = hbus.handlers.save({ abs: 'C:\\definitely-missing-dir-xyz\\nope.md', text: 'x' })
  ok(r2.body.ok === false && r2.body.error === 'not-found', 'save 拒不存在文件（保存≠新建）')
}
{
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-sp-work-'))
  const file = path.join(work, '测试.md')
  fs.writeFileSync(file, '旧内容 第一行\n', 'utf8')
  const st1 = fs.statSync(file)
  const q = (s) => ({ get: (k) => (k === 'abs' ? s : null) })
  const s1 = hbus.handlers.stat(q(file))
  ok(s1.body.ok === true && s1.body.mtimeMs === st1.mtimeMs, 'stat 返回 mtime/bytes')
  const r1 = hbus.handlers.save({ abs: file, text: '新内容 第一行\n第二行\n', ifMtimeMs: st1.mtimeMs })
  ok(r1.body.ok === true, '保存成功（mtime 匹配）')
  ok(fs.readFileSync(file, 'utf8') === '新内容 第一行\n第二行\n', '磁盘内容已更新')
  ok(r1.body.backup && fs.existsSync(r1.body.backup), '旧内容自动备份存在')
  ok(fs.readFileSync(r1.body.backup, 'utf8') === '旧内容 第一行\n', '备份内容=保存前旧文')
  ok(fs.readdirSync(work).every((n) => !n.startsWith('.dsh-sp-')), '临时文件已清理')
  const r2 = hbus.handlers.save({ abs: file, text: 'X', ifMtimeMs: 12345 })
  ok(r2.body.ok === false && r2.body.error === 'changed', '外部改动检测：基线不符拒绝覆盖')
  ok(fs.readFileSync(file, 'utf8') !== 'X', '被拒时磁盘原样')
  const r3 = hbus.handlers.save({ abs: file, text: 'X', ifMtimeMs: 12345, force: true })
  ok(r3.body.ok === true && fs.readFileSync(file, 'utf8') === 'X', 'force 强制保存')
  const r4 = hbus.handlers.save({ abs: work, text: 'Y' })
  ok(r4.body.ok === false && r4.body.error === 'is-directory', '目录目标拒绝')
  const r5 = hbus.handlers.save({ abs: file, text: 123 })
  ok(r5.body.ok === false && r5.body.error === 'text-must-be-string', '非字符串文本拒绝')
  ok(fs.readdirSync(path.join(tmpHome, 'sidebar-plus-backups')).length >= 2, '备份目录按 DSH_HOME 落在沙箱内')
  const entries = []
  for (let i = 0; i < 5; i++) entries.push({ name: 'a.md.bak-20260914-00000' + i, mtimeMs: 100 + i })
  for (let i = 0; i < 3; i++) entries.push({ name: 'b.txt.bak-20260914-10000' + i, mtimeMs: 50 + i })
  const gone = hbus._test.prunePlan(entries, 2, 500)
  ok(gone.length === 4 && gone.includes('a.md.bak-20260914-000000') && gone.includes('b.txt.bak-20260914-100000'), '备份清理：每组留最新 2 份')
  fs.rmSync(work, { recursive: true, force: true })
}
// 热装载监视：改热文件 → readHash 变化、loadHostBus 读到新版本（加载器轮询就是靠这个）
{
  const hotPath = H2.HOT_HOST
  const before = H2.readHash(hotPath)
  const orig = fs.readFileSync(hotPath, 'utf8')
  try {
    fs.writeFileSync(hotPath, orig.replace("const VERSION = '0.3.1'", "const VERSION = '0.2.0-TEST'"), 'utf8')
    const hbus2 = H2.loadHostBus(hotPath)
    ok(before !== H2.readHash(hotPath) && hbus2.version === '0.2.0-TEST', '热文件哈希变化可被轮询发现、新业务可装载')
  } finally {
    fs.writeFileSync(hotPath, orig, 'utf8')
    ok(H2.readHash(hotPath) === before, '热文件已还原')
  }
}

fs.rmSync(tmpHome, { recursive: true, force: true })
console.log('\ndsh-sidebar-plus 自测通过：' + passed + ' 项')
