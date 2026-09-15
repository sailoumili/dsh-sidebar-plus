import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-sidebar-plus'
export const inject = ['webServer']

const LOADER_VERSION = '0.3.2'
const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url))
const HOT_HOST = path.join(PLUGIN_DIR, '..', 'hot-host.cjs')
const HOT_CLIENT = path.join(PLUGIN_DIR, '..', 'hot-client.cjs')
const SAVE_BODY_CAP = 40 * 1024 * 1024
const POLL_MS = 2000

const DSH_HOME = (process.env.DSH_HOME && process.env.DSH_HOME.trim())
  ? process.env.DSH_HOME
  : path.join(os.homedir(), '.dsh')

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
}

function requestRejection(req) {
  const host = String(req.headers?.host || '')
  const origin = req.headers?.origin
  if (!origin) return 0
  try {
    return new URL(String(origin)).host === host ? 0 : 403
  } catch {
    return 403
  }
}

function wantsJsonBody(req) {
  return /application\/json/i.test(String(req.headers?.['content-type'] || ''))
}

function readJsonBody(req, limit) {
  return new Promise((resolve) => {
    let data = ''
    let done = false
    const finish = (v) => { if (!done) { done = true; resolve(v) } }
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > limit) { finish(null); try { req.destroy() } catch {  } }
    })
    req.on('end', () => { if (!done) { try { finish(JSON.parse(data || '{}')) } catch { finish(null) } } })
    req.on('error', () => finish(null))
  })
}

function sendJson(res, status, body) {
  try {
    res.writeHead(status, JSON_HEADERS)
    res.end(JSON.stringify(body))
  } catch {  }
}

function parseSub(urlPath) {
  const raw = String(urlPath || '')
  const q = raw.indexOf('?')
  const p = (q === -1 ? raw : raw.slice(0, q)).replace(/\/+$/, '')
  return p.startsWith('/dsh-sp') ? (p.slice(7) || '/') : p
}

const log = (...a) => { try { console.log('[dsh-sidebar-plus]', ...a) } catch {  } }

function readHash(file) {
  try { return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 16) } catch { return 'missing' }
}

function loadHostBus(hotPath) {
  const src = fs.readFileSync(hotPath, 'utf8')
  const factory = new Function('fs', 'os', 'path', 'crypto', 'DSH_HOME', 'log', src)
  const bus = factory(fs, os, path, crypto, DSH_HOME, log)
  if (!bus || typeof bus.handlers !== 'object' || bus.handlers === null) throw new Error('hot-host.cjs 必须 return { handlers }')
  return bus
}

export function apply(ctx) {
  let hostBus = null
  let hostHash = 'none'
  let clientSeenVersion = ''
  let poll = null
  const disposers = []

  const tryLoadHost = () => {
    const h = readHash(HOT_HOST)
    if (h === hostHash && hostBus) return
    try {
      const next = loadHostBus(HOT_HOST)
      if (hostBus && typeof hostBus.teardown === 'function') { try { hostBus.teardown() } catch (e) { log('旧宿主业务 teardown 出错:', e && e.message) } }
      hostBus = next
      hostHash = h
      log('宿主业务已装载/热更新 →', next.version || '?')
    } catch (err) {
      hostHash = h
      log('宿主业务加载失败（保留旧版）:', err && err.message)
    }
  }
  tryLoadHost()
  poll = setInterval(tryLoadHost, POLL_MS)

  const handler = async (req, res) => {
    const rej = requestRejection(req)
    if (rej) return sendJson(res, rej, { ok: false, error: 'forbidden' })
    let url
    try { url = new URL(req.url ?? '/', 'http://localhost') } catch { return sendJson(res, 400, { ok: false, error: 'bad-url' }) }
    const sub = parseSub(url.pathname)
    try {
      if (sub === '/health') {
        return sendJson(res, 200, {
          ok: true, loader: LOADER_VERSION,
          hostV: hostBus ? hostBus.version : null,
          clientV: clientSeenVersion,
          rev: { h: hostHash, c: readHash(HOT_CLIENT) },
        })
      }
      if (sub === '/rev') {
        return sendJson(res, 200, { ok: true, h: hostHash, c: readHash(HOT_CLIENT) })
      }
      if (sub === '/pull') {
        const c = readHash(HOT_CLIENT)
        let code = ''
        try { code = fs.readFileSync(HOT_CLIENT, 'utf8') } catch { return sendJson(res, 200, { ok: false, error: 'client-code-missing' }) }
        return sendJson(res, 200, { ok: true, code, c })
      }
      if (sub === '/ping-client') {
        clientSeenVersion = String(url.searchParams.get('v') || '').slice(0, 40)
        return sendJson(res, 200, { ok: true })
      }
      if (!hostBus) return sendJson(res, 503, { ok: false, error: 'host-business-not-loaded' })
      const h = hostBus.handlers
      if (sub === '/stat' && typeof h.stat === 'function') {
        const out = await h.stat(url.searchParams)
        return sendJson(res, (out && out.http) || 200, out && ('body' in out) ? out.body : out)
      }
      if (sub === '/save') {
        if (String(req.method || 'GET').toUpperCase() !== 'POST') return sendJson(res, 405, { ok: false, error: 'post-only' })
        if (!wantsJsonBody(req)) return sendJson(res, 415, { ok: false, error: 'json-body-required' })
        if (typeof h.save !== 'function') return sendJson(res, 200, { ok: false, error: 'save-handler-missing' })
        const body = await readJsonBody(req, SAVE_BODY_CAP)
        if (!body) return sendJson(res, 200, { ok: false, error: 'body-too-large-or-bad-json' })
        const out = await h.save(body)
        return sendJson(res, (out && out.http) || 200, out && ('body' in out) ? out.body : out)
      }
      const key = sub.slice(1)
      if (key && Object.prototype.hasOwnProperty.call(h, key) && typeof h[key] === 'function') {
        const out = await h[key](url.searchParams, req, res)
        if (out && typeof out === 'object' && 'body' in out) return sendJson(res, out.http || 200, out.body)
        return
      }
      return sendJson(res, 404, { ok: false, error: 'unknown-endpoint', sub })
    } catch (err) {
      return sendJson(res, 200, { ok: false, error: String((err && err.message) || err).slice(0, 200) })
    }
  }

  disposers.push(ctx.webServer.register({ kind: 'prefix', path: '/dsh-sp', handler }))
  ctx.effect(() => () => {
    if (poll) { try { clearInterval(poll) } catch {  } poll = null; }
    if (hostBus && typeof hostBus.teardown === 'function') { try { hostBus.teardown() } catch {  } }
    for (const d of disposers) { try { d() } catch {  } }
  })
}

export const _test = {
  LOADER_VERSION,
  requestRejection,
  wantsJsonBody,
  parseSub,
  readHash,
  loadHostBus,
  HOT_HOST,
  HOT_CLIENT,
}
