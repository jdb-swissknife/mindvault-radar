#!/usr/bin/env node
const { createServer } = require('http')
const { readFile } = require('fs/promises')
const { join, extname } = require('path')

const DIST = join(__dirname, 'dist')
const PORT = 8082

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
}

createServer(async (req, res) => {
  let path = join(DIST, req.url === '/' ? 'index.html' : req.url)
  const ext = extname(path)

  try {
    const data = await readFile(path)
    const ct = MIME[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': ct })
    res.end(data)
  } catch {
    // SPA fallback
    try {
      const index = await readFile(join(DIST, 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(index)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  }
}).listen(PORT, () => console.log('MindVault Radar on :' + PORT))
