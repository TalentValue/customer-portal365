#!/usr/bin/env node
'use strict'

const { spawn } = require('child_process')
const path = require('path')

// ─── ANSI colours ────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',  bold:    '\x1b[1m',  dim:  '\x1b[2m',
  red:     '\x1b[31m', green:   '\x1b[32m', yellow: '\x1b[33m',
  blue:    '\x1b[34m', magenta: '\x1b[35m', cyan:   '\x1b[36m',
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT       = path.resolve(__dirname, '..')
const SERVER_DIR = path.join(ROOT, 'server')
const CLIENT_DIR = path.join(ROOT, 'client')

// ─── State ───────────────────────────────────────────────────────────────────
let serverProc = null
let clientProc = null
const debounceTimers = {}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ts() {
  return `${C.dim}${new Date().toLocaleTimeString('en-GB')}${C.reset}`
}

function banner(icon, title, color, file) {
  const line = color + '─'.repeat(58) + C.reset
  console.log(`\n${line}`)
  console.log(`${ts()}  ${color}${C.bold}${icon}  ${title}${C.reset}`)
  console.log(`${C.dim}   changed: ${file}${C.reset}`)
  console.log(`${line}\n`)
}

// Kill a process cross-platform (Windows needs taskkill /t to kill the tree)
function killProc(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.exitCode !== null) return resolve()
    proc.once('exit', resolve)
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'],
        { stdio: 'ignore', shell: true })
    } else {
      proc.kill('SIGTERM')
    }
    // Force-kill fallback after 3 s
    setTimeout(() => { try { proc.kill('SIGKILL') } catch {} }, 3000)
  })
}

// ─── Process spawners ─────────────────────────────────────────────────────────
function spawnServer() {
  const p = spawn('npx', ['ts-node', 'src/index.ts'], {
    cwd: SERVER_DIR, shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  p.stdout.on('data', d => process.stdout.write(`${C.blue}[api]  ${C.reset} ${d}`))
  p.stderr.on('data', d => process.stderr.write(`${C.red}[api]  ${C.reset} ${d}`))
  p.on('exit', code => {
    if (code !== null && code !== 0)
      console.log(`\n${ts()} ${C.red}[api] process exited with code ${code}${C.reset}`)
  })
  return p
}

function spawnClient() {
  const p = spawn('npx', ['vite'], {
    cwd: CLIENT_DIR, shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  p.stdout.on('data', d => process.stdout.write(`${C.magenta}[vite] ${C.reset} ${d}`))
  p.stderr.on('data', d => process.stderr.write(`${C.yellow}[vite] ${C.reset} ${d}`))
  p.on('exit', code => {
    if (code !== null && code !== 0)
      console.log(`\n${ts()} ${C.yellow}[vite] process exited with code ${code}${C.reset}`)
  })
  return p
}

// ─── Restart actions ──────────────────────────────────────────────────────────
async function restartServer(file) {
  banner('🔄', 'API SERVER RESTARTING', C.blue, file)
  await killProc(serverProc)
  serverProc = spawnServer()
  console.log(`${ts()} ${C.green}${C.bold}✓ API server restarted${C.reset}\n`)
}

async function restartClient(file) {
  banner('🔄', 'VITE CLIENT RESTARTING', C.magenta, file)
  await killProc(clientProc)
  clientProc = spawnClient()
  console.log(`${ts()} ${C.green}${C.bold}✓ Vite server restarted${C.reset}\n`)
}

async function restartBoth(file) {
  banner('🔄', 'BOTH SERVERS RESTARTING', C.yellow, file)
  await Promise.all([killProc(serverProc), killProc(clientProc)])
  serverProc = spawnServer()
  clientProc = spawnClient()
  console.log(`${ts()} ${C.green}${C.bold}✓ Both servers restarted${C.reset}\n`)
}

// ─── Debounce ─────────────────────────────────────────────────────────────────
function debounce(key, fn, delay = 400) {
  clearTimeout(debounceTimers[key])
  debounceTimers[key] = setTimeout(fn, delay)
}

// ─── File-change routing ──────────────────────────────────────────────────────
function onFileChange(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/')

  // Server TypeScript source or Prisma schema → restart API only
  if (rel.startsWith('server/src/') || rel === 'server/prisma/schema.prisma') {
    debounce('server', () => restartServer(rel))
    return
  }

  // Any .env file → restart both (env vars affect both sides)
  if (rel === 'server/.env' || rel === '.env') {
    debounce('both', () => restartBoth(rel))
    return
  }

  // Vite / Tailwind / PostCSS / HTML config → restart Vite only
  const clientConfigs = [
    'client/vite.config.ts',
    'client/tailwind.config.ts',
    'client/postcss.config.js',
    'client/index.html',
  ]
  if (clientConfigs.includes(rel)) {
    debounce('client', () => restartClient(rel))
    return
  }

  // client/src/** handled by Vite HMR — no restart needed
}

// ─── Port cleanup (Windows) ───────────────────────────────────────────────────
function freePort(port) {
  if (process.platform !== 'win32') return
  try {
    const { execSync } = require('child_process')
    const out = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim()
    if (!out) return
    const pid = out.trim().split(/\s+/).pop()
    if (pid && pid !== '0') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
      console.log(`${ts()} ${C.yellow}Freed port ${port} (PID ${pid})${C.reset}`)
    }
  } catch { /* port already free */ }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Free any stuck ports before starting
  freePort(3001)

  // Startup banner
  console.clear()
  const line = C.green + C.bold + '═'.repeat(58) + C.reset
  console.log(`\n${line}`)
  console.log(`${C.green}${C.bold}  🚀  ClientPortal365 — Dev Watcher${C.reset}`)
  console.log(line)
  console.log(`${C.dim}  API    →  http://localhost:3001${C.reset}`)
  console.log(`${C.dim}  App    →  http://localhost:5173${C.reset}`)
  console.log(`${C.dim}  Stop   →  Ctrl + C${C.reset}`)
  console.log(`${C.green}${C.bold}${'═'.repeat(58)}${C.reset}\n`)

  // Boot both servers
  serverProc = spawnServer()
  clientProc = spawnClient()

  // Set up file watcher
  const chokidar = require('chokidar')

  const watched = [
    path.join(SERVER_DIR, 'src/**/*.ts'),
    path.join(SERVER_DIR, 'prisma/schema.prisma'),
    path.join(SERVER_DIR, '.env'),
    path.join(CLIENT_DIR, 'vite.config.ts'),
    path.join(CLIENT_DIR, 'tailwind.config.ts'),
    path.join(CLIENT_DIR, 'postcss.config.js'),
    path.join(CLIENT_DIR, 'index.html'),
    path.join(ROOT, '.env'),
  ]

  const watcher = chokidar.watch(watched, {
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
  })

  watcher.on('change', onFileChange)
  watcher.on('add',    onFileChange)

  // Print watch legend
  console.log(`${ts()} ${C.cyan}${C.bold}👁  Watching for changes${C.reset}`)
  console.log(`${C.dim}`)
  console.log(`  server/src/**/*.ts        →  restart API server`)
  console.log(`  server/prisma/schema.prisma →  restart API server`)
  console.log(`  vite.config.ts / tailwind   →  restart Vite`)
  console.log(`  .env                        →  restart both`)
  console.log(`  client/src/**               →  Vite HMR (no restart)`)
  console.log(`${C.reset}`)

  // Graceful shutdown on Ctrl+C
  async function shutdown() {
    console.log(`\n${ts()} ${C.yellow}Shutting down...${C.reset}`)
    watcher.close()
    await Promise.all([killProc(serverProc), killProc(clientProc)])
    process.exit(0)
  }
  process.on('SIGINT',  shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(err => { console.error(err); process.exit(1) })
