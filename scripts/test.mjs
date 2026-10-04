// dsh-sidebar-plus 离线自测：node scripts/test.mjs
// 全程不弹窗、不联网；宿主端文件操作只在本脚本创建的临时目录里做。
// 覆盖：浏览器加载器（注册/守卫/热编译）、宿主加载器（路由守卫/parseSub/热装载）、
//       浏览器业务（纯函数全家桶）、宿主业务（保存/备份/冲突/清理）。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
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
ok(typeof bus.version === 'string' && bus.version === '0.4.4', '业务版本号', bus.version)
ok(typeof bus.Body === 'function' && typeof bus.Actions === 'function' && typeof bus.ReviewActions === 'function' && bus.title === '源编辑' && Array.isArray(bus.extensions), '业务契约字段齐全（含两个官方插槽挂钩组件）')
ok(bus.extensions.length === 2 && bus.extensions[0] === 'md' && bus.extensions[1] === 'markdown', '接管范围收窄到 md/markdown（其余格式保持官方视图、默认不被抢）', bus.extensions.join(','))
ok(bus.meta && bus.meta.loading === 'text-pages' && bus.meta.wrap === true && bus.meta.priority === 'builtin', '业务 meta：文本分页+支持换行+builtin 档注册（官方视图保持默认，不抢）')
ok(bus.locale && bus.locale.zh && bus.locale.en && typeof bus.css === 'string' && bus.css.includes('.dshsp-root'), '字典与样式随业务热载')
ok(bus.css.includes('[data-document-preview]>[data-textpreview-body]>*{zoom:var(--dshsp-zoom,1)}'), '官方视图字号走内容区 zoom 变量（不再强制覆盖官方默认）')
ok(bus.css.includes('[data-document-preview][data-dshsp-lineno="on"]:has([data-textpreview-plain]) [data-textpreview-line]::before') && bus.css.includes('attr(data-textpreview-line)'), '官方「纯文本」视图行号是可选开关（按 data-textpreview-plain 标记认，带 data-dshsp-lineno="on" 才画号，默认关）')
ok(bus.css.includes('--dshsp-lnw:calc(var(--dshsp-lnch) * 1ch)') && bus.css.includes('--dshsp-lnpad:8px') && bus.css.includes('--dshsp-lngap:12px'), '行号列几何对齐官方代码视图（8px+官方 8px 内边距=16px 缩进、位数自适应列宽、12px 间隙 → 两视图同列）')
ok(bus.css.includes('.dshsp-btn-on{font-weight:700'), '开关开启态用加粗+高亮底（不打勾，关闭即恢复）')
ok(!bus.css.includes('.dshsp-fab'), '旧悬浮药丸样式已移除（官方视图改用源编辑同款工具条）')
const T = bus._test

// 二进制后缀判据：决定是否接管 Office / 表格 / PDF / 图片这些格式
{
  ok(T.isBinaryPath('a/report.docx') && T.isBinaryPath('x/DATA.XLSX') && T.isBinaryPath('b.pdf') && T.isBinaryPath('c.png'),
    '二进制后缀判据：Office / 表格 / PDF / 图片 命中（不接管）')
  ok(T.isBinaryPath('z:\\dir\\old.PPTX') && T.isBinaryPath('z.docx '), '二进制后缀判据：反斜杠路径、大写、行尾空格也命中')
  ok(!T.isBinaryPath('a.md') && !T.isBinaryPath('a.csv') && !T.isBinaryPath('a.tsv') && !T.isBinaryPath('a.svg') && !T.isBinaryPath('a.json') && !T.isBinaryPath('noext'),
    '文本后缀 / 无后缀不命中（继续按文本处理，能力不缩水）')
  ok(T.pathSuffix('Z:\\x\\y.MD') === 'md' && T.pathSuffix('') === '' && T.pathSuffix(null) === '', '后缀提取：反斜杠、大写、空值')
}

// parseFileAddress
{
  const p = T.parseFileAddress('dsh-resource://file/session/session-abc123/%E7%AC%94%E8%AE%B0/2026-01-01.md')
  ok(p && p.scope === 'session' && p.sessionId === 'session-abc123' && p.path === '笔记/2026-01-01.md', 'session 地址：会话+百分号编码路径解码')
  const q = T.parseFileAddress('dsh-resource://file/session/s1/a/my%20file.txt?x=1#frag')
  ok(q && q.path === 'a/my file.txt', 'session 地址：? # 后缀截断、空格解码')
  const a = T.parseFileAddress('dsh-resource://file/absolute/Z%3A/tmp/x.md')
  ok(a && a.scope === 'absolute' && a.path === 'Z:/tmp/x.md', 'absolute 地址能解析')
  ok(T.parseFileAddress('https://example.com') === undefined, '非 file 地址拒绝')
  ok(T.parseFileAddress('dsh-resource://file/') === undefined, '残缺地址拒绝')
  ok(T.parseFileAddress('dsh-resource://file/session/onlysid') === undefined, '无路径段拒绝')
}

// sessionFileAddress：对比视图只有「会话 id + 相对路径」，拼好要能被自家 parseFileAddress 解回来
{
  const a = T.sessionFileAddress('session-abc123', 'temp/说明 文档.md')
  const back = T.parseFileAddress(a)
  ok(back && back.scope === 'session' && back.sessionId === 'session-abc123' && back.path === 'temp/说明 文档.md', '会话 id + 相对路径 → 文件地址可往返')
  const w = T.parseFileAddress(T.sessionFileAddress('s1', 'a\\b.md'))
  ok(w && w.path === 'a/b.md', '反斜杠归一到 /')
  // 假盘符路径拼接构造：避免字面量被当成真实路径登记
  const WIN_PATH = ['D:', '', 'demo', 'x.txt'].join(path.sep)
  const drv = T.parseFileAddress(T.sessionFileAddress('s1', WIN_PATH))
  ok(drv && drv.path === WIN_PATH.split(path.sep).join('/'), '会话作用域下的绝对路径保留盘符')
  const dot = T.parseFileAddress(T.sessionFileAddress('s1', './temp/x.txt'))
  ok(dot && dot.path === 'temp/x.txt', '开头的 ./ 丢掉')
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
ok(H2.LOADER_VERSION === '0.4.4', '宿主加载器版本')
ok(/hot-host\.cjs$/.test(H2.HOT_HOST) && /hot-client\.cjs$/.test(H2.HOT_CLIENT), '热件路径指到插件根目录')
// 版本号散在四处，发版时漏一处就会「版本静默不一致」——这里钉死
{
  const vOf = (f) => (/const VERSION = '([^']+)'/.exec(read(f)) || [])[1]
  const pkgV = JSON.parse(read('package.json')).version
  const hostV = vOf('hot-host.cjs')
  const clientV = vOf('hot-client.cjs')
  ok(pkgV === H2.LOADER_VERSION && pkgV === hostV && pkgV === clientV,
    '版本号四处一致（package.json / 加载器 / 宿主业务 / 浏览器业务）', [pkgV, H2.LOADER_VERSION, hostV, clientV].join(' / '))
  ok(read('README.md').includes(pkgV) && read('README.en.md').includes(pkgV), '两份 README 都写到了当前版本号', pkgV)
}
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
ok(hbus.version === '0.4.4' && hbus.handlers && typeof hbus.handlers.save === 'function' && typeof hbus.handlers.stat === 'function', '宿主业务装载成功，handlers 齐全')
{
  const N = (s) => ({ get: (k) => (k === 'abs' ? s : null) })
  ok(hbus.handlers.stat(N('relative/a.md')).body.ok === false, 'stat 拒相对路径')
  const r1 = hbus.handlers.save({ abs: '', text: 'x' })
  ok(r1.body.ok === false && r1.body.error === 'empty-path', 'save 拒空路径')
  const r2 = hbus.handlers.save({ abs: path.join(os.tmpdir(), 'dsh-sp-no-such-' + Date.now(), 'nope.md'), text: 'x' })
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
// 改的是沙箱里的副本，真热件一个字节都不动（被强杀也不会留脏版本）
{
  const hotPath = path.join(tmpHome, 'hot-host-copy.cjs')
  fs.copyFileSync(H2.HOT_HOST, hotPath)
  const before = H2.readHash(hotPath)
  fs.writeFileSync(hotPath, fs.readFileSync(hotPath, 'utf8').replace(/const VERSION = '[^']+'/, "const VERSION = '0.2.0-TEST'"), 'utf8')
  const hbus2 = H2.loadHostBus(hotPath)
  ok(before !== H2.readHash(hotPath) && hbus2.version === '0.2.0-TEST', '热文件哈希变化可被轮询发现、新业务可装载')
  ok(H2.loadHostBus(H2.HOT_HOST).version === hbus.version, '真热件始终没被测试改过', H2.loadHostBus(H2.HOT_HOST).version)
}

// ---------- 宿主业务：可配置的备份路径（GET/POST /dsh-sp/config） ----------
// 全部数据只在本脚本于 os.tmpdir() 下自建的临时目录里；不碰真机 ~/.dsh。
{
  const CT = hbus._test
  const cfgFile = path.join(tmpHome, 'sidebar-plus.config.json')
  const defDir = path.join(tmpHome, 'sidebar-plus-backups')
  const countBak = (dir) => fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.includes('.bak-')).length
  const jsonReq = (obj) => {
    const r = Readable.from([JSON.stringify(obj)])
    r.method = 'POST'
    r.headers = { 'content-type': 'application/json; charset=utf-8' }
    return r
  }
  const getCfg = async () => (await hbus.handlers.config({ get: () => null }, { method: 'GET', headers: {} }, {})).body
  const postCfg = async (obj) => (await hbus.handlers.config({ get: () => null }, jsonReq(obj), {})).body

  ok(Object.prototype.hasOwnProperty.call(hbus.handlers, 'config') && typeof hbus.handlers.config === 'function',
    'handlers 自有 config 键（lib 路由只认自有属性）')
  ok(CT.CONFIG_FILE === cfgFile && CT.DEFAULT_BACKUP_DIR === defDir && CT.BACKUP_DIR === defDir,
    '_test 常量：CONFIG_FILE / DEFAULT_BACKUP_DIR / BACKUP_DIR（旧键值=默认目录）')
  ok(typeof CT.readConfig === 'function' && typeof CT.writeConfig === 'function' && typeof CT.resolveBackupDir === 'function'
    && typeof CT.configHandler === 'function' && typeof CT.planConfigChange === 'function'
    && typeof CT.applyConfigChange === 'function' && typeof CT.moveBackups === 'function',
    '_test 新增导出齐全（配置读写 + 试算/执行/搬运）')

  // 1 无配置文件 → 默认目录
  {
    ok(!fs.existsSync(cfgFile), '前置：还没有配置文件')
    ok(Object.keys(CT.readConfig()).length === 0 && CT.resolveBackupDir() === defDir,
      '无配置文件：readConfig 回空对象、resolveBackupDir 回默认目录')
    const g = await getCfg()
    ok(g.ok === true && g.backupDir === defDir && g.defaultDir === defDir && g.isDefault === true && g.exists === true,
      '无配置：GET 回默认目录且 isDefault:true', JSON.stringify(g))
    fs.writeFileSync(path.join(defDir, 'not-a-backup.txt'), 'x', 'utf8')
    fs.mkdirSync(path.join(defDir, 'subdir'), { recursive: true })
    const all = fs.readdirSync(defDir)
    ok(g.backupCount === countBak(defDir) && g.backupCount === all.length - 2 && g.backupCount >= 2,
      '无配置：backupCount 只数含 .bak- 的普通文件（混进去的普通文件与子目录不算）', String(g.backupCount))
  }

  // 2 写配置后 GET 跟着变
  {
    const cfgDir = path.join(tmpHome, 'sp-cfg-dir')
    ok(CT.writeConfig({ backupDir: cfgDir }) === true && fs.existsSync(cfgFile), 'writeConfig 原子落盘（临时文件 + rename）')
    const g = await getCfg()
    ok(g.backupDir === cfgDir && g.isDefault === false && g.exists === false && g.backupCount === 0,
      '写配置后 GET 跟着变（新目录尚未创建、计数 0）', JSON.stringify(g))
  }

  // 3 试算零副作用
  {
    const srcDir = path.join(tmpHome, 'sp-dry-src')
    const dstDir = path.join(tmpHome, 'sp-dry-dst')
    fs.mkdirSync(path.join(srcDir, 'sub'), { recursive: true })
    fs.writeFileSync(path.join(srcDir, 'a.md.bak-20261004-101010'), 'AAAA', 'utf8')
    fs.writeFileSync(path.join(srcDir, 'keep.txt'), 'KEEP', 'utf8')
    CT.writeConfig({ backupDir: srcDir })
    const beforeCfg = fs.readFileSync(cfgFile, 'utf8')
    const plan = await postCfg({ backupDir: dstDir })
    ok(plan.ok === true && plan.dryRun === true && plan.from === srcDir && plan.to === dstDir,
      '试算：dryRun:true，from=当前生效目录、to=归一后的目标', JSON.stringify(plan))
    ok(plan.willMove === 1 && plan.skipped === 2 && plan.toExists === false && plan.toBackupCount === 0 && plan.isDefault === false,
      '试算：将搬 1 个 .bak-、跳过 2 个其它条目，目标不存在')
    ok(!fs.existsSync(dstDir) && fs.existsSync(path.join(srcDir, 'a.md.bak-20261004-101010'))
      && fs.readFileSync(cfgFile, 'utf8') === beforeCfg,
      '试算零副作用：不建目录、不搬文件、不写配置')
  }

  // 4 确认执行：建目录 + 搬 .bak- + 写配置，其它文件原地不动
  {
    const srcDir = path.join(tmpHome, 'sp-move-src')
    const dstDir = path.join(tmpHome, 'sp-move-dst')
    const bakName = 'note.md.bak-20261004-120000'
    const bytes = Buffer.from('备份内容 逐字节比对\n第二行', 'utf8')
    fs.mkdirSync(path.join(srcDir, 'sub'), { recursive: true })
    fs.writeFileSync(path.join(srcDir, bakName), bytes)
    fs.writeFileSync(path.join(srcDir, 'other.txt'), 'OTHER', 'utf8')
    CT.writeConfig({ backupDir: srcDir })
    const r = await postCfg({ backupDir: dstDir, confirm: true })
    ok(r.ok === true && r.backupDir === dstDir && r.moved === 1 && r.failed === 0 && r.skipped === 2,
      '确认执行：搬 1 个、跳过 2 个、零失败', JSON.stringify(r))
    ok(fs.statSync(dstDir).isDirectory() && r.backupCount === 1, '确认执行：目标目录已建好、备份计数 1')
    ok(Buffer.compare(fs.readFileSync(path.join(dstDir, bakName)), bytes) === 0, '搬运后内容逐字节相同')
    ok(!fs.existsSync(path.join(srcDir, bakName)) && fs.existsSync(path.join(srcDir, 'other.txt'))
      && fs.statSync(path.join(srcDir, 'sub')).isDirectory(),
      '源 .bak- 已不在旧目录，其它文件与子目录原地不动（旧目录不删）')
    ok(JSON.parse(fs.readFileSync(cfgFile, 'utf8')).backupDir === dstDir, '配置已写到新目录')
    const g = await getCfg()
    ok(g.backupDir === dstDir && g.isDefault === false && g.exists === true && g.backupCount === 1,
      '执行后 GET 与执行结果一致', JSON.stringify(g))
  }

  // 5 同名冲突不覆盖
  {
    const srcDir = path.join(tmpHome, 'sp-clash-src')
    const dstDir = path.join(tmpHome, 'sp-clash-dst')
    const name = 'x.md.bak-20261004-130000'
    fs.mkdirSync(srcDir, { recursive: true })
    fs.mkdirSync(dstDir, { recursive: true })
    fs.writeFileSync(path.join(srcDir, name), 'NEW', 'utf8')
    fs.writeFileSync(path.join(dstDir, name), 'OLD', 'utf8')
    CT.writeConfig({ backupDir: srcDir })
    const r = await postCfg({ backupDir: dstDir, confirm: true })
    ok(r.ok === true && r.moved === 1 && r.failed === 0 && r.backupCount === 2,
      '同名冲突：不覆盖、另存为 .1', JSON.stringify(r))
    ok(fs.readFileSync(path.join(dstDir, name), 'utf8') === 'OLD'
      && fs.readFileSync(path.join(dstDir, name + '.1'), 'utf8') === 'NEW',
      '原同名文件内容未被覆盖，新备份落在 .1')
  }

  // 6 reset 回默认目录
  {
    const plan = await postCfg({ reset: true })
    ok(plan.ok === true && plan.dryRun === true && plan.to === defDir && plan.isDefault === true,
      'reset 试算：目标回到默认目录、同样带 dryRun:true', JSON.stringify(plan))
    const done = await postCfg({ reset: true, confirm: true })
    ok(done.ok === true && done.backupDir === defDir && JSON.parse(fs.readFileSync(cfgFile, 'utf8')).backupDir === defDir,
      'reset 执行：配置写回默认目录', JSON.stringify(done))
    const g = await getCfg()
    ok(g.isDefault === true && g.backupDir === defDir && g.defaultDir === defDir, 'reset 后 GET 报 isDefault:true')
  }

  // 7 六个错误码
  {
    const filePath = path.join(tmpHome, 'sp-target-file.txt')
    fs.writeFileSync(filePath, 'x', 'utf8')
    const cases = [
      [{ backupDir: '' }, 'empty-path'],
      [{ backupDir: 123 }, 'empty-path'],
      [{ backupDir: 'relative/backups' }, 'not-absolute'],
      [{ backupDir: path.join(tmpHome, 'bad\u0000dir') }, 'bad-path'],
      [{ backupDir: filePath }, 'is-file'],
      [{ backupDir: path.parse(tmpHome).root }, 'bad-target'],
      [{ backupDir: tmpHome }, 'bad-target'],
    ]
    for (const [body, code] of cases) {
      const r = await postCfg(body)
      ok(r.ok === false && r.error === code,
        '错误码 ' + code + ' ｜ ' + JSON.stringify(body.backupDir), JSON.stringify(r))
    }
  }

  // 8 保存文件时备份落到配置里的新目录
  {
    const cfgDir = path.join(tmpHome, 'sp-save-backups')
    const workDir = path.join(tmpHome, 'sp-save-work')
    fs.mkdirSync(workDir, { recursive: true })
    const file = path.join(workDir, 'doc.md')
    fs.writeFileSync(file, '旧\n', 'utf8')
    CT.writeConfig({ backupDir: cfgDir })
    const st = fs.statSync(file)
    const r = hbus.handlers.save({ abs: file, text: '新\n', ifMtimeMs: st.mtimeMs })
    ok(r.body.ok === true && !!r.body.backup && path.dirname(r.body.backup) === cfgDir,
      '保存时备份落到配置里的新目录', String(r.body.backup))
    ok(fs.readFileSync(r.body.backup, 'utf8') === '旧\n', '配置目录里的备份内容=保存前旧文')
  }

  // 8.5 目标不许设成当前备份目录的子文件夹（盘点不递归，子夹里的备份会搬不回来）
  {
    const base = path.join(tmpHome, 'sp-nested-src')
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(path.join(base, 'a.md.bak-20261004-000000'), 'X\n', 'utf8')
    CT.writeConfig({ backupDir: base })
    const sub = path.join(base, 'sub')
    const dry = await postCfg({ backupDir: sub })
    ok(dry.ok === false && dry.error === 'nested-dir', '试算：子文件夹被拒（nested-dir）', JSON.stringify(dry))
    const run = await postCfg({ backupDir: sub, confirm: true })
    ok(run.ok === false && run.error === 'nested-dir', '执行：子文件夹被拒（nested-dir）', JSON.stringify(run))
    ok(!fs.existsSync(sub), '被拒时没有创建那个子文件夹')
    ok(CT.resolveBackupDir() === base, '被拒后配置没被改坏', String(CT.resolveBackupDir()))
    ok(CT.isInsideDir(sub, base) && !CT.isInsideDir(base, base), '嵌套判据：子路径算内、同路径不算')
  }

  // 9 配置里的目录不可用 → 退回默认目录（读取阶段挡回 + 写入阶段挡回）
  {
    const blocker = path.join(tmpHome, 'sp-blocker-file')
    fs.writeFileSync(blocker, 'not a dir', 'utf8')
    ok(CT.writeConfig({ backupDir: blocker }) === true && CT.resolveBackupDir() === defDir,
      '配置指向一个「已存在的文件」时，读取阶段就退回默认目录（不拿它当备份夹）')

    const unwritable = path.join(blocker, 'sub')   // 父路径是文件 → 建目录必失败
    ok(CT.writeConfig({ backupDir: unwritable }) === true && CT.resolveBackupDir() === unwritable,
      '前置：配置指向一个「建不出来」的目录（过得了读取校验，写入时才会失败）')
    const file = path.join(tmpHome, 'sp-save-work', 'doc2.md')
    fs.writeFileSync(file, 'OLD2\n', 'utf8')
    const st = fs.statSync(file)
    const r = hbus.handlers.save({ abs: file, text: 'NEW2\n', ifMtimeMs: st.mtimeMs })
    ok(r.body.ok === true && !!r.body.backup && path.dirname(r.body.backup) === defDir,
      '配置目录建不出来时退回默认目录重试一次', String(r.body.backup))
    ok(fs.readFileSync(r.body.backup, 'utf8') === 'OLD2\n' && fs.readFileSync(file, 'utf8') === 'NEW2\n',
      '退回后备份内容正确、保存照常成功（备份失败不阻断保存）')
  }

  // 10 旧目录为空 / 不存在 → 不报错
  {
    const emptyDir = path.join(tmpHome, 'sp-empty-src')
    fs.mkdirSync(emptyDir, { recursive: true })
    CT.writeConfig({ backupDir: emptyDir })
    const r = await postCfg({ backupDir: path.join(tmpHome, 'sp-empty-dst'), confirm: true })
    ok(r.ok === true && r.moved === 0 && r.failed === 0 && r.skipped === 0,
      '旧目录为空：moved 0 不报错', JSON.stringify(r))
    CT.writeConfig({ backupDir: path.join(tmpHome, 'sp-gone-src') })
    const r2 = await postCfg({ backupDir: path.join(tmpHome, 'sp-gone-dst'), confirm: true })
    ok(r2.ok === true && r2.moved === 0 && r2.failed === 0, '旧目录不存在：moved 0 不报错', JSON.stringify(r2))
    const plan = await postCfg({ backupDir: path.join(tmpHome, 'sp-gone-dst2') })
    ok(plan.ok === true && plan.dryRun === true && plan.willMove === 0 && plan.skipped === 0,
      '旧目录不存在：试算计数 0 不报错')
  }

  // 11 配置读取的容错
  {
    fs.writeFileSync(cfgFile, '{ 这不是 JSON', 'utf8')
    ok(Object.keys(CT.readConfig()).length === 0 && CT.resolveBackupDir() === defDir, '配置文件损坏 → 回默认目录')
    fs.writeFileSync(cfgFile, '[1,2,3]', 'utf8')
    ok(Object.keys(CT.readConfig()).length === 0 && CT.resolveBackupDir() === defDir, '配置不是对象 → 忽略')
    fs.writeFileSync(cfgFile, JSON.stringify({ backupDir: '   ' }), 'utf8')
    ok(Object.keys(CT.readConfig()).length === 0 && CT.resolveBackupDir() === defDir, '空白 backupDir 不算合法配置')
    fs.writeFileSync(cfgFile, JSON.stringify({ backupDir: '  ' + path.join(tmpHome, 'sp-trim') + '  ' }), 'utf8')
    ok(CT.resolveBackupDir() === path.join(tmpHome, 'sp-trim'), 'backupDir 两侧空白被 trim 后用')
  }

  // 12 请求体容错（上限 1 MB / 必须是 JSON）
  {
    const rawPost = async (str, ctype = 'application/json') => {
      const r = Readable.from([str])
      r.method = 'POST'
      r.headers = { 'content-type': ctype }
      return (await hbus.handlers.config({ get: () => null }, r, {})).body
    }
    ok((await rawPost('{ 这不是合法 JSON')).error === 'bad-json', 'POST 体不是合法 JSON → bad-json')
    const bigDir = path.join(tmpHome, 'sp-big')
    const bigBody = JSON.stringify({ backupDir: bigDir, pad: 'x'.repeat(1024 * 1024) })
    ok((await rawPost(bigBody)).error === 'bad-json', 'POST 体超过 1 MB → bad-json')
    ok(!fs.existsSync(bigDir) && CT.resolveBackupDir() === path.join(tmpHome, 'sp-trim'), '超限请求零副作用')
  }

  // 13 from 与 to 同一路径 → 不自我搬运
  {
    const sameDir = path.join(tmpHome, 'sp-same-dir')
    const keepName = 's.md.bak-20261004-140000'
    fs.mkdirSync(sameDir, { recursive: true })
    fs.writeFileSync(path.join(sameDir, keepName), 'S', 'utf8')
    CT.writeConfig({ backupDir: sameDir })
    const plan = await postCfg({ backupDir: sameDir })
    ok(plan.ok === true && plan.from === sameDir && plan.to === sameDir && plan.willMove === 0
      && plan.toExists === true && plan.toBackupCount === 1, 'from 与 to 相同：willMove 0', JSON.stringify(plan))
    const done = await postCfg({ backupDir: sameDir, confirm: true })
    ok(done.ok === true && done.moved === 0 && done.failed === 0 && fs.existsSync(path.join(sameDir, keepName)),
      'from 与 to 相同：执行不丢文件、不报错', JSON.stringify(done))
  }

  // 14 走 lib/index.js 的真实路由：/dsh-sp/config 必须被自有属性接住
  {
    const routes = []
    const cleanups = []
    host.apply({
      webServer: { register: (r) => { routes.push(r); return () => {} } },
      effect: (fn) => { const d = fn(); if (typeof d === 'function') cleanups.push(d); return () => {} },
    })
    const route = routes.find((r) => r.path === '/dsh-sp' && typeof r.handler === 'function')
    ok(!!route && route.kind === 'prefix', '宿主加载器注册了 /dsh-sp 前缀路由')
    const call = async (req) => {
      const out = { status: 0, body: null }
      const res = { writeHead: (s) => { out.status = s }, end: (b) => { out.body = JSON.parse(b) } }
      await route.handler(req, res)
      return out
    }
    const home = { host: '127.0.0.1:3080' }
    const routeDir = path.join(tmpHome, 'sp-route-dir')
    CT.writeConfig({ backupDir: routeDir })
    const g = await call({ method: 'GET', url: '/dsh-sp/config', headers: home })
    ok(g.status === 200 && g.body.ok === true && g.body.backupDir === routeDir && g.body.isDefault === false,
      '路由 GET /dsh-sp/config 回配置状态', JSON.stringify(g.body))
    const postReq = Readable.from([JSON.stringify({ backupDir: path.join(tmpHome, 'sp-route-dst') })])
    postReq.method = 'POST'
    postReq.url = '/dsh-sp/config'
    postReq.headers = { host: home.host, 'content-type': 'application/json' }
    const p = await call(postReq)
    ok(p.status === 200 && p.body.ok === true && p.body.dryRun === true
      && p.body.to === path.join(tmpHome, 'sp-route-dst') && p.body.from === routeDir,
      '路由 POST /dsh-sp/config 试算（body 由 handler 自己读流）', JSON.stringify(p.body))
    const badReq = Readable.from(['x'])
    badReq.method = 'POST'
    badReq.url = '/dsh-sp/config'
    badReq.headers = { host: home.host, 'content-type': 'text/plain' }
    const bad = await call(badReq)
    ok(bad.status === 200 && bad.body.ok === false && bad.body.error === 'bad-json',
      'POST 非 JSON Content-Type → bad-json', JSON.stringify(bad.body))
    for (const d of cleanups) { try { d() } catch (e) {  } }
  }
}

// ---------- 保留清理只认插件自己的命名：用户自己放进去的 .bak- 文件既不数也不移动 ----------
{
  ok(hbus._test.isOwnBackup('a.md.bak-20260101-000000') && hbus._test.isOwnBackup('b.md.bak-20260101-000000.1'),
    '插件命名判据：标准名与 .1 冲突后缀都认')
  ok(!hbus._test.isOwnBackup('我的归档.bak-备份.txt') && !hbus._test.isOwnBackup('a.md.bak-x') && !hbus._test.isOwnBackup('a.md.bak-20260101'),
    '插件命名判据：用户自己的 .bak- 名字、残缺时间戳都不认')
  ok(hbus._test.isSamePath('C:\\A\\', 'c:/a') && hbus._test.isSamePath('C:\\\\a\\\\b', 'c:\\a\\b') && !hbus._test.isSamePath('C:\\a', 'C:\\ab'),
    '路径同一性：大小写/斜杠/尾斜杠归一，前缀不算同一个')
  const d = path.join(tmpHome, 'sp-own-name')
  fs.mkdirSync(d, { recursive: true })
  fs.writeFileSync(path.join(d, 'a.md.bak-20260101-000000'), 'x', 'utf8')
  fs.writeFileSync(path.join(d, '我的归档.bak-备份.txt'), 'y', 'utf8')
  hbus._test.writeConfig({ backupDir: d })
  const st = await hbus._test.configHandler(null, { method: 'GET', headers: {} })
  ok(st.body.backupCount === 1, '统计只数插件自己的备份（用户那份不算）', String(st.body.backupCount))
  const ownDst = path.join(tmpHome, 'sp-own-name-dst')
  fs.mkdirSync(ownDst, { recursive: true })
  const moved = hbus._test.moveBackups(d, ownDst)
  ok(moved.moved === 1 && moved.skipped === 1 && fs.existsSync(path.join(d, '我的归档.bak-备份.txt')),
    '搬运只搬插件自己的备份，用户那份原地不动', JSON.stringify(moved))
}

// ---------- 配置写不进去时必须报错，不许谎报成功 ----------
// 手法：另起一个 DSH_HOME，把配置文件路径先用同名目录占位 → writeConfig 的 rename 必失败。
{
  const tmpHome2 = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-sp-home2-'))
  fs.mkdirSync(path.join(tmpHome2, 'sidebar-plus.config.json'), { recursive: true })
  process.env.DSH_HOME = tmpHome2
  const host2 = await import(pathToFileURL(path.join(root, 'lib', 'index.js')).href + '?v=cfgfail')
  const hbus2 = host2._test.loadHostBus(host2._test.HOT_HOST)
  const t2 = hbus2._test
  ok(t2.CONFIG_FILE === path.join(tmpHome2, 'sidebar-plus.config.json'), '第二实例的配置文件指向新 DSH_HOME', t2.CONFIG_FILE)
  const oldDir = path.join(tmpHome2, 'sidebar-plus-backups')
  fs.mkdirSync(oldDir, { recursive: true })
  fs.writeFileSync(path.join(oldDir, 'a.md.bak-20261004-000000'), 'OLD\n', 'utf8')
  const target = path.join(tmpHome2, 'sp-cfgfail-dst')
  const r = t2.applyConfigChange(target)
  ok(r.ok === false && r.error === 'config-write-failed', '配置写不进去 → 回 config-write-failed，不报成功', JSON.stringify(r))
  ok(r.backupDir === oldDir, '失败时回的是「当前生效目录」（配置没被改坏）', String(r.backupDir))
  ok(r.moved === 1 && fs.existsSync(path.join(target, 'a.md.bak-20261004-000000')), '备份确实搬过去了，如实回报 moved', String(r.moved))
  const after = await t2.configHandler(null, { method: 'GET', headers: {} })
  ok(after.body.ok === true && after.body.backupDir === oldDir, '事后 GET 仍是旧目录（配置确实没写进去）', JSON.stringify(after.body))
  process.env.DSH_HOME = tmpHome
}

fs.rmSync(tmpHome, { recursive: true, force: true })
console.log('\ndsh-sidebar-plus 自测通过：' + passed + ' 项')
