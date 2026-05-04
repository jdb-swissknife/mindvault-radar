#!/usr/bin/env node
// Simple static file server for MindVault Radar
const { createServer } = require('http')
const { readFile, stat } = require('fs/promises')
const { join, extname } = require('path')

const DIST = join(__dirname, 'dist')
const PORT = 8082

const MIME: Record<string, string> = {
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
  let path = join(DIST, req.url === '/' ? 'index.html' : req.url!)
  
  // SPA fallback: if no extension and file doesn't exist, serve index.html
  const ext = extname(path)
  if (!ext) path = join(DIST, 'index.html')

  try {
    const data = await readFile(path)
    const ct = MIME[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': ct })
    res.end(data)
  } catch {
    // 404: serve index.html for SPA routing
    try {
      const index = await readFile(join(DIST, 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(index)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  }
}).listen(PORT, () => console.log(`MindVault Radar on :${PORT}`))
