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
const MD_BYTES = new Uint8Array(Buffer.from(MD, 'utf8'))
const MD_B64 = Buffer.from(MD, 'utf8').toString('base64') // 仅用于旧版 base64 兜底断言

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
// ---- 假 remote：只实现新版 workspaceFiles.readBytes（返回 Uint8Array）----
const remoteCalls = { readBytes: [], readAll: 0 }
const ENV_REMOTE = {
  workspaceFiles: {
    readBytes: async (sessionId, p, opts, signal) => {
      remoteCalls.readBytes.push({ sessionId, path: p, opts, hasSignal: !!signal })
      return { ok: true, value: { absolutePath: FAKE_ABS, version: 'v1', bytes: MD_BYTES.length, data: MD_BYTES } }
    },
  },
}
const bus = api._test.compileBus(HOT_CLIENT_SRC, { react: React, remote: ENV_REMOTE })
ok(bus.version === '0.4.0', '业务经 compileBus 就绪', bus.version)
const b1 = bus._test.bytesOf(MD_BYTES)
const b2 = bus._test.bytesOf(MD_B64)
const b3 = bus._test.bytesOf(MD_BYTES.buffer)
const b4 = bus._test.bytesOf(new Uint8ClampedArray(MD_BYTES))
const dec = (x) => (x ? new TextDecoder().decode(x) : '(null)')
ok(b1 === MD_BYTES, 'bytesOf: 新版 Uint8Array 直接可用（不解 base64）')
ok(dec(b2) === MD, 'bytesOf: 旧版 base64 仍能兜底解出')
ok(dec(b3) === MD, 'bytesOf: ArrayBuffer 也能解')
ok(dec(b4) === MD, 'bytesOf: 其它 TypedArray 也能解（跨 realm 不靠 instanceof）')

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
ok(q('.dshsp-root').getAttribute('data-dshsp-ver') === '0.4.0', '业务版本标记在 DOM 上（热替换观测点）')
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
ok(q('textarea.dshsp-ta').value === MD, '编辑初始内容 = workspaceFiles.readBytes 的整文件')
ok(remoteCalls.readBytes.length === 1 && remoteCalls.readBytes[0].path === 'temp/sb.md' && remoteCalls.readBytes[0].hasSignal === true,
  '整文件读取走新版 readBytes(会话, 相对路径, {}, 取消信号)', JSON.stringify(remoteCalls.readBytes[0] || {}))
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
  // 立刻量：面板进 DOM 后工具条多久挂上（旧实现是每 0.4 秒轮询，最坏要等 0.4s）
  const tMount = Date.now()
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  let ogroup = pane.querySelector(':scope > .dshsp-ogroup')
  const mountedFast = !!ogroup
  const mountMs = Date.now() - tMount
  if (!ogroup) { await act(async () => { await new Promise((r) => setTimeout(r, 900)) }); ogroup = pane.querySelector(':scope > .dshsp-ogroup') }
  ok(mountedFast, '面板一进 DOM 工具条立即挂上（不再等 0.4 秒轮询）', '约 ' + mountMs + 'ms')
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
  ok(ipTa.selectionStart === 0, '就地编辑进框时光标在第 1 行（不再被 focus 甩到文件末尾）', 'selectionStart=' + ipTa.selectionStart)
  const ipJump = pane.querySelector('.dshsp-jump')
  ok(!!ipJump, '就地编辑也有「跳行」输入框')
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
    setter.call(ipJump, '5')
    ipJump.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  })
  const ipOff5 = MD.split('\n').slice(0, 4).join('\n').length + 1
  ok(ipTa.selectionStart === ipOff5, '就地编辑输入行号回车：光标跳到第 5 行开头', 'selectionStart=' + ipTa.selectionStart + ' 期望 ' + ipOff5)
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
  // ================= 4.6) 官方对比视图（changes-review）增强 =================
  {
    pane.setAttribute('hidden', '')
    const scopeEl = win.document.createElement('div')
    scopeEl.setAttribute('data-sidebar-right-session', 's1')
    const rroot = win.document.createElement('div')
    rroot.setAttribute('data-changes-review', '1')
    const rhead = win.document.createElement('div')
    const rfiler = win.document.createElement('button')
    rfiler.setAttribute('data-review-file', 'temp/rv.md')
    rhead.appendChild(rfiler)
    const splitBtn = win.document.createElement('button')
    splitBtn.setAttribute('data-review-tool', 'split')
    splitBtn.setAttribute('aria-pressed', 'false')
    const wrapBtn = win.document.createElement('button')
    wrapBtn.setAttribute('data-review-tool', 'wrap')
    wrapBtn.setAttribute('aria-pressed', 'true')
    wrapBtn.addEventListener('click', () => { wrapBtn.setAttribute('aria-pressed', 'false') })
    rhead.appendChild(splitBtn)
    rhead.appendChild(wrapBtn)
    rroot.appendChild(rhead)
    const rbody = win.document.createElement('div')
    rbody.setAttribute('data-review-view', 'unified')
    rroot.appendChild(rbody)
    const mkRow = (num, text) => {
      const row = win.document.createElement('div')
      row.setAttribute('data-diff-line', 'context')
      const n = win.document.createElement('span')
      n.textContent = String(num)
      const tx = win.document.createElement('span')
      tx.textContent = text
      row.appendChild(n)
      row.appendChild(tx)
      return row
    }
    const addColumns = () => {
      if (rbody.querySelector('[data-diff-side="right"]')) return
      const cols = win.document.createElement('div')
      const left = win.document.createElement('div')
      left.setAttribute('data-diff-side', 'left')
      left.appendChild(mkRow(1, '左边 旧内容 alpha'))
      left.appendChild(mkRow(3, '左边 内容乙'))
      const right = win.document.createElement('div')
      right.setAttribute('data-diff-side', 'right')
      right.appendChild(mkRow(2, '右边 新内容 alpha'))
      right.appendChild(mkRow(3, '右边 内容丙'))
      cols.appendChild(left)
      cols.appendChild(right)
      rbody.appendChild(cols)
    }
    splitBtn.addEventListener('click', () => { splitBtn.setAttribute('aria-pressed', 'true'); addColumns() })
    scopeEl.appendChild(rroot)
    win.document.body.appendChild(scopeEl)

    await act(async () => { await new Promise((r) => setTimeout(r, 150)) })
    let rgroup = rroot.querySelector(':scope > .dshsp-ogroup')
    if (!rgroup) { await act(async () => { await new Promise((r) => setTimeout(r, 900)) }); rgroup = rroot.querySelector(':scope > .dshsp-ogroup') }
    ok(!!rgroup, '对比页出现插件工具条（布局流内，跟着官方头部）')
    ok(!!rgroup && rgroup.previousElementSibling === rhead, '工具条插在官方头部之后')
    const rbtns = () => [...rgroup.querySelectorAll('.dshsp-bar button')]
    const rbtn = (t) => rbtns().find((b) => (b.textContent || '').trim() === t || (b.textContent || '').trim().startsWith(t))
    const rfindRow = rgroup.querySelector('.dshsp-find')
    ok(!!rbtn('编辑右侧') && !!rbtn('搜索') && !!rbtn('A−') && !!rbtn('A+'), '对比页按钮齐全（编辑右侧/搜索/字号）')
    ok(!!rfindRow && rfindRow.style.display === 'none', '对比页搜索条默认收起')
    ok(rbtn('保存').style.display === 'none' && rbtn('退出编辑').style.display === 'none', '对比页阅读态不显示保存/退出')

    // 编辑：官方此刻是单栏，点「编辑右侧」应先替它切到「左右分栏 + 不换行」
    const savesBefore = fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).length
    const readsBefore = remoteCalls.readBytes.length
    await act(async () => { rbtn('编辑右侧').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    await act(async () => { await new Promise((r) => setTimeout(r, 600)) })
    ok(splitBtn.getAttribute('aria-pressed') === 'true' && wrapBtn.getAttribute('aria-pressed') === 'false', '点「编辑右侧」先替官方切到左右分栏 + 不换行')
    const leftCol = rbody.querySelector('[data-diff-side="left"]')
    const rightCol = rbody.querySelector('[data-diff-side="right"]')
    const rbox = rroot.querySelector('[data-dshsp-rvedit]')
    const colsEl = rbox && rbox.parentElement
    ok(!!rbox && !!leftCol && !!rightCol, '对比页进入编辑：右侧出现编辑框')
    ok(rightCol.style.display === 'none' && leftCol.style.display !== 'none', '只有右侧被换成编辑器，左侧保持只读对照')
    ok(colsEl === leftCol.parentElement && colsEl === rightCol.parentElement && [...colsEl.children].filter((el) => el.style.display !== 'none').length === 2,
      '编辑器与左栏同格并排（被隐藏的官方右栏不占格）')
    const rta = rbox.querySelector('textarea.dshsp-ta')
    ok(!!rta && rta.value === MD, '编辑初始内容 = 磁盘上的当前文件')
    ok(rta.selectionStart === 0, '进编辑光标落在第 1 行（不再被 focus 甩到文件末尾）', 'selectionStart=' + rta.selectionStart)
    const jump = rgroup.querySelector('.dshsp-jump')
    ok(!!jump && jump.parentElement.style.display !== 'none', '对比页编辑态出现「跳行」输入框')
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
      setter.call(jump, '5')
      jump.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    })
    const off5 = MD.split('\n').slice(0, 4).join('\n').length + 1
    ok(rta.selectionStart === off5, '输入行号回车：光标跳到第 5 行开头', 'selectionStart=' + rta.selectionStart + ' 期望 ' + off5)
    ok(remoteCalls.readBytes[readsBefore] && remoteCalls.readBytes[readsBefore].sessionId === 's1' && remoteCalls.readBytes[readsBefore].path === 'temp/rv.md',
      '对比页按「会话 id + 相对路径」读整文件', JSON.stringify(remoteCalls.readBytes[readsBefore] || {}))
    ok(rbtn('保存').style.display !== 'none' && rbtn('退出编辑').style.display !== 'none' && rbtn('编辑右侧').style.display === 'none', '对比页编辑态切换按钮')
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, 'value').set
      setter.call(rta, MD + '对比页追加\n')
      rta.dispatchEvent(new win.Event('input', { bubbles: true }))
    })
    ok(/保存 \*/.test(rbtn('保存').textContent), '对比页改动后 保存 * 脏标记')
    await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })) })
    await act(async () => { await new Promise((r) => setTimeout(r, 300)) })
    const rSaved = fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).pop()
    ok(fetchCalls.filter((c) => c.url.startsWith('/dsh-sp/save')).length === savesBefore + 1 && JSON.parse(rSaved.init.body).text.includes('对比页追加'), '对比页 Ctrl+S 保存，正文完整')
    ok(JSON.parse(rSaved.init.body).abs === FAKE_ABS && JSON.parse(rSaved.init.body).ifMtimeMs === 1000, '对比页保存带绝对路径 + 编辑基线')
    await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
    await act(async () => { await new Promise((r) => setTimeout(r, 250)) })
    ok(!rroot.querySelector('[data-dshsp-rvedit]') && rightCol.style.display !== 'none', 'Esc 退出对比页编辑，右栏恢复为对比内容')

    // 点行选起点：点左栏第 2 行（行号 3）→ 映射到右栏同一行 → 再点编辑就从第 3 行开始
    const leftRows = leftCol.querySelectorAll('[data-diff-line]')
    await act(async () => { leftRows[1].dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    ok(rightCol.querySelectorAll('[data-diff-line]')[1].className.includes('dshsp-anchor'), '点对比页任意一行：右栏对应行被标成编辑起点')
    ok(leftRows[1].className.includes('dshsp-anchor') === false, '起点标记只落在右栏（左栏是只读历史）')
    await act(async () => { rbtn('编辑右侧').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
    const rta2 = rroot.querySelector('[data-dshsp-rvedit] textarea.dshsp-ta')
    const off3 = MD.split('\n').slice(0, 2).join('\n').length + 1
    ok(!!rta2 && rta2.selectionStart === off3, '编辑从刚才选的那一行开始（第 3 行），不再跳到别处', 'selectionStart=' + (rta2 && rta2.selectionStart) + ' 期望 ' + off3)
    await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
    await act(async () => { await new Promise((r) => setTimeout(r, 250)) })

    // 搜索：一次遍历左右两侧
    const revKey = new win.KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true })
    await act(async () => { win.dispatchEvent(revKey) })
    ok(revKey.defaultPrevented, '对比页 Ctrl+F 拦下原生查找')
    ok(rfindRow.style.display === 'flex', '对比页搜索条展开')
    const rin = rfindRow.querySelector('input')
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set
      setter.call(rin, '内容')
      rin.dispatchEvent(new win.Event('input', { bubbles: true }))
    })
    const rcount = () => rfindRow.querySelector('.dshsp-count').textContent
    const rside = (t) => [...rfindRow.querySelectorAll('button')].find((b) => b.textContent === t)
    ok(rcount() === '1 / 4', '默认两侧一起搜：左 2 处 + 右 2 处', rcount())
    ok(!!rside('两侧') && rside('两侧').className.includes('dshsp-btn-on'), '默认选中「两侧」')
    await act(async () => { rside('右').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    ok(rcount() === '1 / 2' && rside('右').className.includes('dshsp-btn-on'), '点「右」只搜右侧：只算右栏 2 处', rcount())
    await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'F3', bubbles: true, cancelable: true })) })
    ok(rcount() === '2 / 2', '只搜右侧时上下箭头只在右侧自己的顺序里走', rcount())
    await act(async () => { rside('左').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    ok(rcount() === '1 / 2', '点「左」只搜左侧：2 处', rcount())
    await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'F3', bubbles: true, cancelable: true })) })
    ok(rcount() === '2 / 2', '上下箭头按所选那一侧自己的顺序走', rcount())
    await act(async () => { rside('两侧').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    ok(rcount() === '1 / 4', '切回「两侧」恢复 4 处', rcount())
    await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
    ok(rfindRow.style.display === 'none', '对比页 Esc 关闭搜索条')

    // 字号：缩放打在对比体内容区，左右两侧一起变
    ok(bus.css.includes('[data-changes-review][data-dshsp-rv]>[data-review-view]>*{zoom:var(--dshsp-rvz,1)}'), '对比页字号规则作用于对比体内容区（两侧同缩放）')
    await act(async () => { rbtn('A+').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    const rz = rroot.style.getPropertyValue('--dshsp-rvz')
    ok(Number(rz) > 1 && rroot.getAttribute('data-dshsp-rv') === '1', '对比页 A+ 放大（一个变量管住两侧）', 'zoom=' + rz)
    ok(/px$/.test((rbtn('A+').previousElementSibling || {}).textContent || ''), '对比页字号数字夹在 A± 之间', (rbtn('A+').previousElementSibling || {}).textContent)
    await act(async () => { rbtn('A+').previousElementSibling.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    ok(!rroot.hasAttribute('data-dshsp-rv') && rroot.style.getPropertyValue('--dshsp-rvz') === '', '点字号数字回到官方字号')
    const revWheel = new win.WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true })
    await act(async () => { rbody.dispatchEvent(revWheel) })
    ok(revWheel.defaultPrevented === true && Number(rroot.style.getPropertyValue('--dshsp-rvz')) > 1, '对比页 Ctrl+滚轮也改两侧字号')
    await act(async () => { rbtn('A+').previousElementSibling.dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })

    // 单边对比（例如新增文件只有新增行）：官方根本不画左右栏，编辑器占满对比体
    rroot.remove()
    await act(async () => { await new Promise((r) => setTimeout(r, 300)) })
    const wroot = win.document.createElement('div')
    wroot.setAttribute('data-changes-review', '1')
    const whead = win.document.createElement('div')
    const wfile = win.document.createElement('button')
    wfile.setAttribute('data-review-file', 'temp/new.md')
    whead.appendChild(wfile)
    wroot.appendChild(whead)
    const wbody = win.document.createElement('div')
    wbody.setAttribute('data-review-view', 'unified')
    wbody.textContent = '只有新增行'
    wroot.appendChild(wbody)
    scopeEl.appendChild(wroot)
    await act(async () => { await new Promise((r) => setTimeout(r, 200)) })
    const wgroup = wroot.querySelector(':scope > .dshsp-ogroup')
    const wbtn = (t) => wgroup && [...wgroup.querySelectorAll('.dshsp-bar button')].find((b) => (b.textContent || '').trim() === t)
    ok(!!wgroup && !!wbtn('编辑右侧'), '第二个对比页（单边）也挂上工具条')
    const wside = (t) => [...wgroup.querySelectorAll('.dshsp-find button')].find((b) => b.textContent === t)
    ok(!!wside('左') && wside('左').disabled === true && wside('右').disabled === true && wside('两侧').className.includes('dshsp-btn-on'),
      '单边对比没有左右栏：「左/右」自动禁用并回落两侧')
    await act(async () => { wbtn('编辑右侧').dispatchEvent(new win.MouseEvent('click', { bubbles: true })) })
    await act(async () => { await new Promise((r) => setTimeout(r, 1200)) })
    ok(!!wroot.querySelector('[data-dshsp-rvedit]') && wbody.style.display === 'none' && !wbody.querySelector('[data-diff-side="right"]'),
      '单边对比没有右栏时编辑器占满对比体（官方历史内容整体让位，只写当前文件）')
    await act(async () => { win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) })
    await act(async () => { await new Promise((r) => setTimeout(r, 250)) })
    ok(!wroot.querySelector('[data-dshsp-rvedit]') && wbody.style.display !== 'none', 'Esc 退出后单边对比体恢复显示')
    scopeEl.remove()
  }

  await act(async () => { bus.teardown() })
  ok(!win.document.querySelector('.dshsp-ogroup'), 'teardown 后增强层工具条回收（含对比页）')
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
  ok(api._test.bus.cur && api._test.bus.cur.version === '0.4.0', '首轮 tick 已完成业务热装载')
  ok(!!win.document.querySelector('style[data-plugin-css="dsh-sidebar-plus"]'), '样式由业务 css 注入')
  for (const fn of effectDisposers) { try { const inner = fn(); if (typeof inner === 'function') inner() } catch (e) { /* ignore */ } }
  await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
  ok(reg.defDisposed === true && reg.slotDisposed === true, '插件停用：渲染器与插槽注册全部回收')
  ok(!win.document.querySelector('style[data-plugin-css="dsh-sidebar-plus"]'), '插件停用：样式移除')
  ok(api._test.bus.cur === null, '插件停用：业务总线清空')
}

console.log('\ntest-dom 通过 ' + passed + ' / 失败 ' + failed)
if (failed) process.exit(1)
