// jsdom + React18 integration test. Deps search: DSH_SB_TEST_MODULES env,
// <workspace>/temp/pw/node_modules (pnpm add --dir <that dir> jsdom react@18 react-dom@18), plugin node_modules.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const CANDIDATES = [
  process.env.DSH_SB_TEST_MODULES,
  path.join(root, '..', '..', 'temp', 'pw', 'node_modules'),
  path.join(root, 'node_modules'),
].filter(Boolean)
const mods = CANDIDATES.find((c) => {
  try { return fs.existsSync(path.join(c, 'jsdom')) && fs.existsSync(path.join(c, 'react')) && fs.existsSync(path.join(c, 'react-dom')) } catch { return false }
})
if (!mods) {
  console.log('SKIP test-dom: jsdom/react not found. Prepare once: pnpm add --dir <workspace>/temp/pw jsdom react@18 react-dom@18')
  process.exit(0)
}

let passed = 0, failed = 0
function ok(cond, label, extra) {
  if (!cond) { failed++ } else { passed++ }
  console.log((cond ? '  ✓ ' : '  ✗ ') + label + (extra ? ' ｜ ' + extra : ''))
}

const req = createRequire(path.join(mods, 'noop.cjs'))
const { JSDOM } = req('jsdom')

const MD = '# 测试标题\n\n第一行 示例内容\n- [ ] 09:00 任务行 #标签\n**加粗** 与普通\n'
const MD_B64 = Buffer.from(MD, 'utf8').toString('base64')

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'http://127.0.0.1:3091/',
})
const win = dom.window
for (const k of ['window', 'self', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'KeyboardEvent', 'MouseEvent', 'Node', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia']) {
  try { globalThis[k] = k === 'window' || k === 'self' ? win : win[k] } catch { /* ignore */ }
}
try { Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true }) } catch { /* ignore */ }

const React = req('react')
const ReactDOMClient = req('react-dom/client')
const { act } = req('react-dom/test-utils')
globalThis.IS_REACT_ACT_ENVIRONMENT = true

win.TextDecoder = TextDecoder
win.TextEncoder = TextEncoder
win.AbortController = AbortController

// ---- fetch 桩：stat/save/rev/pull/ping ----
const fetchCalls = []
let saveResponse = () => ({ ok: true, mtimeMs: 2000, bytes: MD.length + 20, backup: null })
const HOT_CLIENT_SRC = fs.readFileSync(path.join(root, 'hot-client.cjs'), 'utf8')
// 假路径拼接构造：别让查引用扫描器把字面量当真引用登记
const FAKE_ABS = ['F:', '', 'fake', 'sb.md'].join(path.sep)
win.fetch = async (url, init) => {
  const u = String(url)
  fetchCalls.push({ url: u, init })
  const json = async (v) => ({ json: async () => v })
  if (u.startsWith('/dsh-sp/stat')) return json({ ok: true, abs: FAKE_ABS, mtimeMs: 1000, bytes: MD.length })
  if (u.startsWith('/dsh-sp/save')) return json(saveResponse())
  if (u.startsWith('/dsh-sp/rev')) return json({ ok: true, h: 'hh', c: 'rev-1' })
  if (u.startsWith('/dsh-sp/pull')) return json({ ok: true, code: HOT_CLIENT_SRC, c: 'rev-1' })
  return json({ ok: true })
}

// ---- 浏览器加载器（vm 里真执行），拿 compileBus/bus/Shell ----
win.__ModuleLoader__ = { load: (m) => { win.__loaded = m } }
const ctx = dom.getInternalVMContext()
vm.runInContext(fs.readFileSync(path.join(root, 'lib', 'client.js'), 'utf8'), ctx)
const api = win.__loaded.factory((id) => {
  if (id === 'react') return React
  throw new Error('unexpected require: ' + id)
})
ok(typeof api._test.compileBus === 'function', '浏览器加载器就绪')

// ---- 经加载器的热编译链产出业务（和浏览器运行时完全同路） ----
const ENV_REMOTE = { workspaceFiles: { readAll: async () => ({ ok: true, value: { absolutePath: FAKE_ABS, version: 'v1', bytes: MD.length, data: MD_B64 } }) } }
const bus = api._test.compileBus(HOT_CLIENT_SRC, { react: React, remote: ENV_REMOTE })
ok(bus.version === '0.3.6', '业务经 compileBus 就绪', bus.version)

const container = win.document.getElementById('root')
const props = {
  resourceAddress: 'dsh-resource://file/session/s1/temp/sb.md',
  content: { kind: 'text', text: MD, pages: [{ offset: 1, text: MD, lines: 5 }], eof: true },
  wrap: true,
  scrollportRef: { current: null },
  useTabInfo: () => ({ tab: { navigation: { revision: 0, params: {} } } }),
}

// ================= 1) 行号渲染 =================
let root_
await act(async () => { root_ = ReactDOMClient.createRoot(container); root_.render(React.createElement(bus.Body, props)) })
const q = (s) => container.querySelector(s)
const qa = (s) => container.querySelectorAll(s)
ok(q('[data-textpreview-line="1"]') && q('[data-textpreview-line="5"]'), '5 行全部带行号渲染')
ok(q('[data-textpreview-line="1"] .dshsp-ln').textContent === '1', '行号列文字正确')
ok(q('[data-textpreview-line="1"]').className.includes('dshsp-h1'), '标题行有着色类')
ok(q('.dshsp-b') && q('.dshsp-task'), '加粗/任务着色在位')
ok(q('.dshsp-root').getAttribute('data-dshsp-ver') === '0.3.6', '业务版本标记在 DOM 上（热替换观测点）')
const btns = () => [...qa('.dshsp-bar button')]
ok(btns().some((b) => b.textContent.includes('编辑')), '工具栏有「编辑」按钮（无 t 时走中文兜底字典）')

function patchVisible(sel) {
  const el = container.querySelector(sel)
  if (el) Object.defineProperty(el, 'offsetParent', { value: container, configurable: true })
}
patchVisible('.dshsp-scroll')

{
  patchVisible('.dshsp-root')
  const aPlus = btns().find((b) => b.textContent === 'A+')
  const aMinus = btns().find((b) => b.textContent === 'A−')
  ok(!!aPlus && !!aMinus, '工具栏有 A−/A+ 字号按钮')
  await act(async () => { aPlus.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  ok(q('.dshsp-root').style.getPropertyValue('--dshsp-fs') === '15px', '默认 14px（与 Markdown 排版一致），点 A+ 字号 +1px', q('.dshsp-root').style.getPropertyValue('--dshsp-fs'))
  await act(async () => { q('.dshsp-root').dispatchEvent(new win.WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true })) })
  ok(q('.dshsp-root').style.getPropertyValue('--dshsp-fs') === '16px', 'Ctrl+滚轮上 字号 +1px（并拦住整页缩放）')
  const pxBtn = btns().find((b) => /px$/.test(b.textContent || ''))
  await act(async () => { pxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  ok(q('.dshsp-root').style.getPropertyValue('--dshsp-fs') === '14px', '点字号数字复位 14px')
}

// ================= 2) Ctrl+F 搜索 =================
const kev = new win.KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true })
await act(async () => { win.dispatchEvent(kev) })
ok(!!q('.dshsp-find input'), 'Ctrl+F 打开搜索条（全局快捷键路径）')
ok(kev.defaultPrevented, '原生查找被 preventDefault')
const input = q('.dshsp-find input')
const setInput = (v) => {
  const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
  setter.call(input, v)
}
await act(async () => { setInput('示例'); input.dispatchEvent(new win.Event('input', { bubbles: true })) })
ok(qa('.dshsp-mark').length === 1 && qa('.dshsp-mark-cur').length === 1, '搜索命中：1 处高亮+当前定位', q('.dshsp-count').textContent)
await act(async () => { setInput('行'); input.dispatchEvent(new win.Event('input', { bubbles: true })) })
ok(qa('.dshsp-mark').length >= 2, '改查询词后重新计数（两行命中）', String(qa('.dshsp-mark').length))
await act(async () => { input.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
ok(!q('.dshsp-find'), '搜索框里 Esc 关闭')

// ================= 3) 编辑 → Ctrl+S 保存 =================
const editBtn = btns().find((b) => b.textContent.includes('编辑'))
await act(async () => { editBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
ok(!!q('textarea.dshsp-ta'), '进编辑：整文件进 textarea')
ok(q('textarea.dshsp-ta').value === MD, '编辑初始内容 = readAll 的整文件')
patchVisible('.dshsp-ta')
const ta = q('textarea.dshsp-ta')
const NEW_TEXT = MD + '追加一行 by hot\n'
await act(async () => {
  const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set
  setter.call(ta, NEW_TEXT)
  ta.dispatchEvent(new win.Event('input', { bubbles: true }))
})
ok(btns().some((b) => /保存 \*/.test(b.textContent)), '脏状态标记（保存 *）')
await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })) })
const saved = fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).pop()
ok(!!saved && saved.init && JSON.parse(saved.init.body).text === NEW_TEXT, 'Ctrl+S 触发保存，正文完整')
ok(JSON.parse(saved.init.body).abs === FAKE_ABS && JSON.parse(saved.init.body).ifMtimeMs === 1000, '保存带绝对路径 + 编辑基线')
ok(!!q('[data-textpreview-line="6"]') && container.textContent.includes('追加一行'), '保存后回阅读视图且显示新文本（override）')
ok(!q('textarea.dshsp-ta'), '已退出编辑模式')

// ================= 4) 外部改动冲突 → 强制保存 =================
saveResponse = () => ({ ok: false, error: 'changed', mtimeMs: 9999 })
const editBtn2 = btns().find((b) => b.textContent.includes('编辑'))
await act(async () => { editBtn2.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
patchVisible('.dshsp-ta')
const ta2 = q('textarea.dshsp-ta')
await act(async () => {
  const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set
  setter.call(ta2, '冲突场景内容\n')
  ta2.dispatchEvent(new win.Event('input', { bubbles: true }))
})
const saveBtn = btns().find((b) => /保存/.test(b.textContent))
await act(async () => { saveBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
ok(btns().some((b) => b.textContent.includes('强制保存')), '冲突时出现「强制保存 / 重载最新」')
saveResponse = () => ({ ok: true, mtimeMs: 5000, bytes: 10, backup: 'x' })
const forceBtn = btns().find((b) => b.textContent.includes('强制保存'))
await act(async () => { forceBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
const lastSave = fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).pop()
ok(JSON.parse(lastSave.init.body).force === true, '强制保存带 force 标记')
ok(!q('textarea.dshsp-ta') && container.textContent.includes('冲突场景内容'), '强制保存成功回阅读视图')

await act(async () => root_.unmount())

// ================= 4.5) 官方视图增强层（布局流内工具条：搜索/编辑/字号缩放，与源编辑同款） =================
{
  const pane = win.document.createElement('div')
  pane.setAttribute('data-document-preview', 'official/markdown')
  const obody = win.document.createElement('div')
  obody.setAttribute('data-textpreview-body', 'true')
  obody.textContent = '样例 可搜文本 searchable now\n第二行 样例 again'
  pane.appendChild(obody)
  win.document.body.appendChild(pane)
  await act(async () => { await new Promise((r) => setTimeout(r, 900)) })
  const ogroup = pane.querySelector(':scope > .dshsp-ogroup')
  ok(!!ogroup && ogroup.nextElementSibling === obody, '官方视图出现工具条：插在头部与正文之间（布局流内，不悬浮）')
  ok(win.document.querySelectorAll('.dshsp-ogroup').length === 1 && !win.document.querySelector('[data-dshsp-fab]'), '工具条只有一个，旧悬浮药丸条已废除')
  const obtns = [...ogroup.querySelectorAll('.dshsp-bar button')]
  const obtn = (t) => obtns.find((b) => (b.textContent || '').trim() === t || (b.textContent || '').trim().startsWith(t))
  ok(!!obtn('编辑') && !!obtn('搜索') && !!obtn('A−') && !!obtn('A+'), '工具条按钮齐全（编辑/搜索/A−/字号/A+）')
  ok(obtn('保存').style.display === 'none' && obtn('退出编辑').style.display === 'none', '阅读态不显示「保存/退出编辑」（编辑态才出现）')
  ok(/px$/.test((obtn('A+').previousElementSibling || {}).textContent || ''), '字号数字按钮在 A± 之间显示当前大小', (obtn('A+').previousElementSibling || {}).textContent)
  ok(!!ogroup.querySelector('.dshsp-bar .dshsp-status') && ogroup.querySelector('.dshsp-bar').className === 'dshsp-bar', '工具条复用源编辑视图同一套样式类，右侧带状态区')
  // md：点「编辑」= 跳源编辑（不就地编辑）；非 md：点「编辑」= 就在当前视图里编辑
  pane.setAttribute('data-textpreview-url', 'dsh-resource://file/session/s1/temp/sb.md')
  await act(async () => { await new Promise((r) => setTimeout(r, 700)) })
  await act(async () => { obtn('编辑').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 300)) })
  ok(!pane.querySelector('textarea.dshsp-ta'), 'md 文件点「编辑」不就地编辑（走"跳源编辑"那条路）')
  pane.setAttribute('data-textpreview-url', 'dsh-resource://file/session/s1/temp/sb.json')
  await act(async () => { await new Promise((r) => setTimeout(r, 700)) })
  await act(async () => { obtn('编辑').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 500)) })
  ok(!!pane.querySelector('.dshsp-ipwrap textarea.dshsp-ta'), '非 md 文件点「编辑」→ 当前视图里直接出现编辑框（就地编辑）')
  ok(obody.style.display === 'none', '就地编辑时官方正文暂时隐藏（退出即恢复）')
  ok(obtn('保存').style.display !== 'none' && obtn('退出编辑').style.display !== 'none', '编辑态出现「保存/退出编辑」')
  ok(obtn('编辑').style.display === 'none' && obtn('搜索').style.display === 'none', '编辑态隐藏「编辑/搜索」')
  const ipTa = pane.querySelector('.dshsp-ipwrap textarea.dshsp-ta')
  ok(pane.querySelectorAll('.dshsp-ipwrap .dshsp-egut div').length === ipTa.value.split('\n').length, '编辑框左侧行号数 = 行数')
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set
    setter.call(ipTa, ipTa.value + '追加 by inplace\n')
    ipTa.dispatchEvent(new win.Event('input', { bubbles: true }))
  })
  ok(/保存 \*/.test(obtn('保存').textContent), '改动后「保存 *」脏标记')
  const savesBefore = fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).length
  await act(async () => { obtn('保存').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
  const ipSaved = fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).pop()
  ok(fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).length === savesBefore + 1 && JSON.parse(ipSaved.init.body).text.includes('追加 by inplace'), '就地编辑点「保存」→ POST /dsh-sp/save，正文完整')
  ok(JSON.parse(ipSaved.init.body).abs === FAKE_ABS, '就地编辑保存带绝对路径', JSON.parse(ipSaved.init.body).abs)
  await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 300)) })
  ok(!pane.querySelector('.dshsp-ipwrap') && obody.style.display !== 'none', 'Esc 退出就地编辑，官方正文恢复显示')
  const fbtn = (t) => [...ogroup.querySelectorAll('button')].find((b) => b.textContent === t)
  await act(async () => { fbtn('A+').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  const z1 = pane.style.getPropertyValue('--dshsp-zoom')
  ok(Number(z1) > 1, 'A+ 只给预览容器设 zoom 变量（放大文件文字，不动页面其他部分）', 'zoom=' + z1)
  ok(!win.document.querySelector('style[data-plugin-css="dsh-sidebar-plus-official"]'), '不再强制覆盖官方字号（无 13px !important 样式注入）')
  await act(async () => { fbtn('A−').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  ok(pane.style.getPropertyValue('--dshsp-zoom') === '', 'A− 回到 1.0 时 zoom 变量自动清除（= 官方原版大小）', pane.getAttribute('style') || '')
  const wheelUp = new win.WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true })
  await act(async () => { obody.dispatchEvent(wheelUp) })
  ok(wheelUp.defaultPrevented === true, '官方视图里 Ctrl+滚轮被拦下（不触发浏览器整页缩放）')
  ok(Number(pane.style.getPropertyValue('--dshsp-zoom')) > 1, 'Ctrl+向上滚轮 → 只放大文件文字', 'zoom=' + pane.style.getPropertyValue('--dshsp-zoom'))
  const wheelDown = new win.WheelEvent('wheel', { ctrlKey: true, deltaY: 100, bubbles: true, cancelable: true })
  await act(async () => { obody.dispatchEvent(wheelDown) })
  ok(pane.style.getPropertyValue('--dshsp-zoom') === '', 'Ctrl+向下滚轮回 1.0 自动清除', 'zoom=' + pane.style.getPropertyValue('--dshsp-zoom'))
  await act(async () => { fbtn('A+').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  await act(async () => {
    const zbtn = [...ogroup.querySelectorAll('.dshsp-bar button')].find((b) => /px$/.test(b.textContent || ''))
    zbtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }))
  })
  ok(pane.style.getPropertyValue('--dshsp-zoom') === '', '点字号数字 = 恢复该视图官方默认字号')
  const ofind = ogroup.querySelector('.dshsp-find')
  ok(ofind.style.display === 'none', '搜索条默认收起')
  await act(async () => { fbtn('搜索').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  ok(ofind.style.display === 'flex', '点搜索展开（源编辑同款搜索行）')
  const oinput = ofind.querySelector('input')
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
    setter.call(oinput, '样例')
    oinput.dispatchEvent(new win.Event('input', { bubbles: true }))
  })
  ok(ofind.querySelector('.dshsp-count').textContent === '1 / 2', '工具条搜索命中 2 处（只搜正文内容，不搜工具条按钮文字）', ofind.querySelector('.dshsp-count').textContent)
  await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
  ok(ofind.style.display === 'none', 'Esc 关闭搜索条')
  // 「行号」开关：只在官方纯文本视图出现，默认关，点一下才画号
  ok(obtn('行号').style.display === 'none', '非纯文本视图：「行号」开关不出现')
  pane.setAttribute('data-document-preview', '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/text')
  await act(async () => { await new Promise((r) => setTimeout(r, 700)) })
  ok(obtn('行号').style.display !== 'none' && obtn('行号').textContent === '行号' && !obtn('行号').className.includes('dshsp-btn-on'), '纯文本视图：出现「行号」开关（默认关、不打勾）', obtn('行号').textContent + ' / ' + obtn('行号').className)
  ok(!pane.hasAttribute('data-dshsp-lineno'), '默认不给面板打行号标记（不画号）')
  await act(async () => { obtn('行号').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 200)) })
  ok(pane.getAttribute('data-dshsp-lineno') === 'on' && obtn('行号').className.includes('dshsp-btn-on') && obtn('行号').textContent === '行号', '点「行号」→ 面板打标记、按钮变成加粗高亮态（不打勾）', obtn('行号').className)
  await act(async () => { obtn('行号').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 200)) })
  ok(!pane.hasAttribute('data-dshsp-lineno') && !obtn('行号').className.includes('dshsp-btn-on'), '再点一次 → 关掉行号、按钮恢复原样')
  // 切到源编辑视图：增强层自动退出（源编辑有自己的工具条）；切回官方视图自动补回
  pane.setAttribute('data-document-preview', 'dsh-sidebar-plus/source')
  await act(async () => { await new Promise((r) => setTimeout(r, 900)) })
  ok(!pane.querySelector(':scope > .dshsp-ogroup'), '源编辑视图里不插官方增强工具条')
  pane.setAttribute('data-document-preview', 'official/markdown')
  await act(async () => { await new Promise((r) => setTimeout(r, 900)) })
  ok(pane.contains(ogroup), '切回官方视图工具条自动补回')
  await act(async () => { bus.teardown() })
  ok(!win.document.querySelector('.dshsp-ogroup'), 'teardown 后增强层工具条回收')
  pane.remove()
}

// ================= 5) 加载器 apply：注册 + 热装载 + 回收 =================
{
  const effectDisposers = []
  const reg = { slotKey: null, Shell: null, def: null, defDisposed: false, slotDisposed: false, localeNs: null }
  const slotsStub = {
    inject: (name, cb) => { cb(); return () => { reg.slotDisposed = true } },
    register: (opts, Comp) => { reg.slotKey = opts.key; reg.Shell = Comp; return () => {} },
  }
  const localeStub = {
    register: (ns) => { reg.localeNs = ns; return () => {} },
    bind: () => (k) => k,
  }
  const previewsStub = {
    register: (def) => { reg.def = def; return () => { reg.defDisposed = true } },
  }
  const ctxStub = {
    remote: ENV_REMOTE,
    get: (k) => (k === 'slots' ? slotsStub : k === 'locale' ? localeStub : k === 'documentPreviews' ? previewsStub : undefined),
    effect: (fn) => { effectDisposers.push(fn) },
  }
  await act(async () => { api.apply(ctxStub) })
  // tick() 异步：等热装载循环跑完首轮
  await act(async () => { await new Promise((r) => setTimeout(r, 300)) })
  ok(reg.def && reg.def.id === api._test.ID && reg.def.extensions.includes('md') && reg.def.loading === 'text-pages', '加载器注册渲染器（md 家族、text-pages）')
  ok(Array.isArray(reg.def.extensions) && reg.def.extensions.length === 2 && reg.def.extensions[0] === 'md', '扩展名单是活数组且已收窄到 md/markdown（其余格式保持官方视图）', String(reg.def.extensions.length))
  ok(reg.slotKey === api._test.ID && reg.Shell === api._test.Shell, '空壳组件挂上文档插槽')
  ok(api._test.bus.cur && api._test.bus.cur.version === '0.3.6', '首轮 tick 已完成业务热装载')
  ok(!!win.document.querySelector('style[data-plugin-css="dsh-sidebar-plus"]'), '样式由业务 css 注入')
  for (const fn of effectDisposers) { try { const inner = fn(); if (typeof inner === 'function') inner() } catch (e) { /* ignore */ } }
  await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
  ok(reg.defDisposed === true && reg.slotDisposed === true, '插件停用：渲染器与插槽注册全部回收')
  ok(!win.document.querySelector('style[data-plugin-css="dsh-sidebar-plus"]'), '插件停用：样式移除')
  ok(api._test.bus.cur === null, '插件停用：业务总线清空')
}

console.log('\ntest-dom 通过 ' + passed + ' / 失败 ' + failed)
if (failed) process.exit(1)
