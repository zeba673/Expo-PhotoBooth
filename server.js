import { createServer } from 'node:http'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import QRCode from 'qrcode'
import { pathToFileURL } from 'node:url'

export async function startServer({ production = false } = {}) {
  let port = Number(process.env.PORT || 5173)
  const dataDir = process.env.PHOTOBOOTH_DATA_DIR || join(process.cwd(), 'data')
  const photosDir = join(dataDir, 'photos')
  const originalsDir = join(dataDir, 'originals')
  await Promise.all([mkdir(photosDir, { recursive: true }), mkdir(originalsDir, { recursive: true })])
  const portIsFree = (candidate) => new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', (error) => error.code === 'EADDRINUSE' ? resolve(false) : reject(error))
    probe.listen(candidate, '0.0.0.0', () => probe.close(() => resolve(true)))
  })
  while (!(await portIsFree(port))) port += 1
  await writeFile(join(dataDir, 'server-port.txt'), String(port))
  const candidates = Object.entries(networkInterfaces()).flatMap(([name, addresses]) =>
    addresses.filter((item) => item.family === 'IPv4' && !item.internal && !item.address.startsWith('169.254.'))
      .map((item) => ({ address: item.address, priority: /virtual|vmware|vethernet|loopback|wsl|docker|host.only/i.test(name) || item.mac.startsWith('0a:00:27:') ? 2 : /wi.fi|wireless|wlan/i.test(name) ? 0 : 1 })))
  candidates.sort((a, b) => a.priority - b.priority)
  const galleryHost = process.env.PHOTOBOOTH_LAN_IP || candidates[0]?.address || 'localhost'
  const galleryUrl = 'http://' + galleryHost + ':' + port + '/gallery'
  const galleryQr = await QRCode.toDataURL(galleryUrl, { width: 240, margin: 1, color: { dark: '#111919', light: '#FFFFFF' } })

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    if (url.pathname === '/api/originals' && req.method === 'POST') {
      if (!req.headers['content-type']?.startsWith('image/jpeg')) return res.writeHead(415).end('Solo se aceptan imágenes JPG.')
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 12 * 1024 * 1024) return res.writeHead(413).end('La imagen supera el límite de 12 MB.')
        chunks.push(chunk)
      }
      const id = `${Date.now()}-${randomUUID()}.jpg`
      await writeFile(join(originalsDir, id), Buffer.concat(chunks), { flag: 'wx' })
      return res.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify({ id }))
    }
    if (url.pathname === '/api/photos' && req.method === 'POST') {
      if (!req.headers['content-type']?.startsWith('image/jpeg')) return res.writeHead(415).end('Solo se aceptan imágenes JPG.')
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 12 * 1024 * 1024) return res.writeHead(413).end('La imagen supera el límite de 12 MB.')
        chunks.push(chunk)
      }
      const id = `${Date.now()}-${randomUUID()}.jpg`
      await writeFile(join(photosDir, id), Buffer.concat(chunks), { flag: 'wx' })
      return res.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify({ id }))
    }
    if (url.pathname === '/api/photos' && req.method === 'GET') {
      const photos = (await readdir(photosDir)).filter((name) => /^\d+-[0-9a-f-]+\.jpg$/i.test(name)).sort().reverse()
      return res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(photos))
    }
    if (url.pathname === '/api/qr' && req.method === 'GET') {
      return res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify({ galleryUrl, qr: galleryQr }))
    }
    if (url.pathname.startsWith('/photos/') && req.method === 'GET') {
      const name = decodeURIComponent(url.pathname.slice('/photos/'.length))
      if (!/^\d+-[0-9a-f-]+\.jpg$/i.test(name)) return res.writeHead(400).end('Nombre de archivo inválido.')
      try {
        const image = await readFile(join(photosDir, name))
        return res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600', 'content-length': image.length }).end(image)
      } catch { return res.writeHead(404).end('No se encontró la foto.') }
    }
    if (production) {
      try {
        const path = url.pathname === '/' || url.pathname === '/gallery' ? '/index.html' : url.pathname
        if (path !== '/index.html' && !/^\/assets\/[\w.-]+\.(js|css)$/.test(path)) return res.writeHead(404).end()
        const file = await readFile(join(process.cwd(), 'dist', path))
        const type = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html'
        return res.writeHead(200, { 'content-type': type }).end(file)
      } catch { return res.writeHead(404).end('No encontrado.') }
    }
    vite.middlewares(req, res, (error) => {
      if (error) { res.writeHead(500).end('Error interno.'); console.error(error) }
      else if (!res.writableEnded) res.writeHead(404).end('No encontrado.')
    })
  })

  const vite = production ? null : await (await import('vite')).createServer({ server: { middlewareMode: true, hmr: { server } } })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '0.0.0.0', resolve)
  })
  console.log('Expo PhotoBooth: http://localhost:' + port)
  console.log('Galería: ' + galleryUrl)
  return { server, port }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startServer({ production: process.argv.includes('--preview') })
}
