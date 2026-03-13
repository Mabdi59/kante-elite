const fs = require('fs')
const net = require('net')
const path = require('path')
const { spawn } = require('child_process')

const PORT = 3000
const HOST = '127.0.0.1'

function isPortInUse(port, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

async function main() {
  const nodeMajor = Number(process.versions.node.split('.')[0] || 0)
  const unsupported = Number.isNaN(nodeMajor) || nodeMajor < 18
  const aheadOfTestedRange = !Number.isNaN(nodeMajor) && nodeMajor > 22
  if (unsupported && process.env.ALLOW_UNSUPPORTED_NODE !== '1') {
    console.error(
      `[dev] Unsupported Node.js ${process.versions.node}. Use Node >=18.18.`
    )
    console.error('[dev] If needed temporarily, run with ALLOW_UNSUPPORTED_NODE=1.')
    process.exit(1)
  }
  if (unsupported || aheadOfTestedRange) {
    console.warn(
      `[dev] Warning: running with untested Node.js ${process.versions.node}; runtime chunk errors may occur.`
    )
  }

  const projectRoot = process.cwd()
  const nextCacheDir = path.join(projectRoot, '.next')
  const webpackCacheDir = path.join(nextCacheDir, 'cache', 'webpack')
  const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next')

  // Webpack filesystem cache can become invalid on synced folders (OneDrive) and node upgrades.
  // Clear it each run to avoid non-deterministic module factory runtime errors.
  try {
    fs.rmSync(webpackCacheDir, { recursive: true, force: true })
    console.log('[dev] Cleared webpack cache')
  } catch (error) {
    console.warn('[dev] Failed to clear webpack cache:', error.message)
  }

  // Optionally clear the full Next.js cache.
  if (process.env.CLEAR_NEXT_CACHE === '1') {
    try {
      fs.rmSync(nextCacheDir, { recursive: true, force: true })
      console.log('[dev] Cleared .next cache')
    } catch (error) {
      console.warn('[dev] Failed to clear .next cache:', error.message)
    }
  }

  const portBusy = await isPortInUse(PORT, HOST)
  if (portBusy) {
    console.error(`[dev] Port ${PORT} is already in use.`)
    console.error('[dev] Stop the existing Next.js process, then run npm run dev again.')
    process.exit(1)
  }

  const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(PORT)], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((error) => {
  console.error('[dev] Failed to start dev server:', error)
  process.exit(1)
})
