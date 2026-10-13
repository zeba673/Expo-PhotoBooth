import { useCallback, useEffect, useRef, useState } from 'react'

const BRAND = { purple: '#7C3AED', pink: '#F472B6', yellow: '#FACC15', dark: '#1C1034' }
const FILTERS = [
  { id: 'none', label: 'Sin filtro', css: 'none' },
  { id: 'mono', label: 'Blanco y negro', css: 'grayscale(1) contrast(1.08)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(.85) saturate(1.1) contrast(1.05)' },
  { id: 'expo', label: 'Colores Expo', css: 'saturate(1.55) contrast(1.08) hue-rotate(-8deg)' },
]
const POSES = [
  'Hacé una pose de estrella ✨',
  'Mandá un corazón con las manos 💖',
  'Poné cara de sorpresa 😲',
  'Saludá como una celebridad 👋',
  'Mostrá tu mejor sonrisa 😊',
  'Hacé tu pose de superhéroe 🦸',
  'Posá como tapa de revista 💅',
  '¡Una pose divertida en equipo! 🤗',
]

export default function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timeoutRef = useRef(null)
  const runRef = useRef(0)
  const originalUploadsRef = useRef([])
  const [screen, setScreen] = useState(() => window.location.pathname === '/gallery' ? 'gallery' : 'welcome')
  const [layout, setLayout] = useState('single')
  const [filter, setFilter] = useState(FILTERS[0])
  const [pose, setPose] = useState('¿Qué pose te va a tocar?')
  const [poseChosen, setPoseChosen] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [cameraState, setCameraState] = useState('idle')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [captured, setCaptured] = useState([])
  const [photoUrl, setPhotoUrl] = useState('')
  const [shareQr, setShareQr] = useState(null)
  const [photoSaved, setPhotoSaved] = useState(false)
  const [originalStatus, setOriginalStatus] = useState('idle')
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const photoUrlRef = useRef('')

  const setPhoto = (url) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    photoUrlRef.current = url
    setPhotoUrl(url)
  }

  const stopCamera = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    runRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCountdown(null)
  }, [])

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    runRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
  }, [])

  const openCamera = async () => {
    const requestId = ++runRef.current
    setCameraState('loading')
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error')
      setMessage('La cámara necesita un navegador moderno y una conexión segura (HTTPS o localhost).')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      if (requestId !== runRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = stream
      setCameraState('ready')
    } catch (error) {
      if (requestId !== runRef.current) return
      setCameraState('error')
      setMessage(error.name === 'NotAllowedError'
        ? 'No se autorizó el uso de la cámara. Habilitala desde el ícono de permisos del navegador.'
        : error.name === 'NotFoundError'
          ? 'No encontramos una cámara conectada. Conectá una y volvé a intentarlo.'
          : 'No pudimos iniciar la cámara. Revisá que no esté en uso en otra aplicación.')
    }
  }

  useEffect(() => {
    if (!streamRef.current || !videoRef.current) return
    videoRef.current.srcObject = streamRef.current
    videoRef.current.play().catch(() => setMessage('No pudimos mostrar la cámara. Volvé a habilitarla e intentá de nuevo.'))
  }, [cameraState, screen])

  useEffect(() => {
    if (screen !== 'gallery') return
    fetch('/api/photos').then((response) => response.json()).then(setGalleryPhotos).catch(() => setGalleryPhotos([]))
  }, [screen])

  useEffect(() => {
    fetch('/api/qr').then((response) => response.json()).then(setShareQr).catch(() => setShareQr(null))
  }, [])

  const takeShot = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setMessage('La cámara todavía se está preparando. Esperá un segundo.')
      return
    }
    setMessage('')
    const run = ++runRef.current
    let tick = 3
    setCountdown(tick)
    const step = () => {
      if (runRef.current !== run) return
      tick -= 1
      if (tick === 0) {
        setCountdown(null)
        const original = document.createElement('canvas')
        original.width = videoRef.current.videoWidth
        original.height = videoRef.current.videoHeight
        const originalCtx = original.getContext('2d')
        originalCtx.translate(original.width, 0)
        originalCtx.scale(-1, 1)
        originalCtx.drawImage(videoRef.current, 0, 0)
        const backup = canvasToJpeg(original).then((blob) => fetch('/api/originals', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob }))
          .then((response) => { if (!response.ok) throw new Error('No se pudo guardar el original.') })
        backup.catch(() => {})
        originalUploadsRef.current.push(backup)
        setOriginalStatus('saving')
        const frame = document.createElement('canvas')
        frame.width = original.width
        frame.height = original.height
        const ctx = frame.getContext('2d')
        ctx.filter = filter.css
        ctx.drawImage(original, 0, 0)
        const next = [...captured, frame].slice(0, layout === 'strip' ? 4 : 1)
        setCaptured(next)
        if (layout === 'single' || next.length === 4) {
          const dataUrl = makePhotoFromFrames(next, layout === 'strip').toDataURL('image/jpeg', 0.94)
          setPhoto(dataUrl)
          setPhotoSaved(false)
          setOriginalStatus('saving')
          Promise.allSettled(originalUploadsRef.current).then((results) => {
            setOriginalStatus(results.every((result) => result.status === 'fulfilled') ? 'saved' : 'error')
          })
          setScreen('result')
          setCameraState('idle')
          stopCamera()
          fetch(dataUrl).then((response) => response.blob())
            .then((blob) => fetch('/api/photos', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob }))
            .then((response) => { if (!response.ok) throw new Error('No se pudo guardar la foto para el QR.'); setPhotoSaved(true) })
            .catch(() => setMessage('La foto se puede descargar acá, pero no se pudo guardar para el QR. Revisá que el servidor siga abierto.'))
        }
        return
      }
      setCountdown(tick)
      timeoutRef.current = window.setTimeout(step, 1000)
    }
    timeoutRef.current = window.setTimeout(step, 1000)
  }

  const spinPose = () => {
    const current = POSES.indexOf(pose)
    let next = Math.floor(Math.random() * (POSES.length - Number(current >= 0)))
    if (current >= 0 && next >= current) next += 1
    setPose(POSES[next])
    setPoseChosen(true)
    setWheelRotation((angle) => angle + 1080 + Math.floor(Math.random() * 360))
  }

  const startSession = (selectedLayout) => {
    setLayout(selectedLayout)
    setFilter(FILTERS[0])
    setCaptured([])
    originalUploadsRef.current = []
    setOriginalStatus('idle')
    setPhoto('')
    setPose('¿Qué pose te va a tocar?')
    setPoseChosen(false)
    setScreen('poses')
  }

  const beginPhoto = async () => {
    setCameraState('loading')
    setScreen('camera')
    await openCamera()
  }

  const cancelCountdown = () => {
    runRef.current += 1
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    setCountdown(null)
  }

  const reset = () => {
    stopCamera()
    setPhoto('')
    setCaptured([])
    setPoseChosen(false)
    setCameraState('idle')
    setMessage('')
    setScreen('welcome')
  }

  const remaining = layout === 'strip' ? 4 - captured.length : 0

  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark" aria-hidden="true">✦</div><div className="brand-copy"><strong>EXPO <span>PHOTOBOOTH</span></strong><small>Expo CET 1 · Laboratorio de Redes I</small></div><div className="topbar-tag">UN RECUERDO PARA COMPARTIR <span>✳</span></div></header>
    {screen === 'gallery' && <section className="gallery-screen screen-card"><span className="eyebrow">EXPO CET 1 · LABORATORIO DE REDES I</span><h1>La galería<br /><em>de la Expo.</em></h1><p>Descargá tus recuerdos en el celular.</p>{galleryPhotos.length ? <div className="gallery-grid">{galleryPhotos.map((name) => <a className="gallery-photo" href={`/photos/${encodeURIComponent(name)}`} download={`expo-${name}`} key={name}><img src={`/photos/${encodeURIComponent(name)}`} alt="Foto de Expo CET 1 - Laboratorio de Redes I" /><span>DESCARGAR ↓</span></a>)}</div> : <p className="gallery-empty">Todavía no hay fotos. Volvé a escanear el QR después de sacar una.</p>}</section>}
    {screen === 'welcome' && <section className="welcome screen-card">
      <div className="confetti confetti-one" /><div className="confetti confetti-two" />
      <div className="welcome-copy"><span className="eyebrow">¡HOLA, EXPO!</span><h1>Tu momento<br />se vuelve <em>recuerdo.</em></h1><p>Elegí tu foto, prepará tu mejor sonrisa y llevate un recuerdo de Expo Redes I.</p>
        <div className="feature-row"><span>📸 Cámara en vivo</span><span>⏱ Cuenta regresiva</span><span>💛 Descarga al instante</span></div></div>
      <div className="welcome-art" aria-hidden="true"><div className="sunburst" /><div className="polaroid"><div className="polaroid-img"><span>☺</span><i>✦</i><b>✳</b></div><div className="polaroid-caption">¡EXPO 2026!</div></div><div className="sparkle sparkle-a">✦</div><div className="sparkle sparkle-b">✳</div><div className="sparkle sparkle-c">●</div></div>
      <div className="welcome-actions"><button className="primary-button" onClick={() => { setScreen('choose'); setMessage('') }}>EMPEZAR <span>→</span></button><span className="welcome-note">No guardamos tus fotos en internet</span></div>
    </section>}
    {screen === 'choose' && <section className="choose screen-card"><div className="section-heading"><button className="back-button" onClick={() => setScreen('welcome')}>← Volver</button><span className="eyebrow">PASO 1 DE 2</span><h1>¿Qué recuerdo<br />querés llevarte?</h1><p>Elegí un formato para tu foto.</p></div>
      <div className="choice-grid"><button className="choice-card choice-single" onClick={() => startSession('single')}><span className="choice-badge">RÁPIDA</span><div className="choice-icon single-icon">☺</div><h2>Foto individual</h2><p>Una foto, un gran recuerdo.</p><span className="choice-go">ELEGIR <b>→</b></span></button><button className="choice-card choice-strip" onClick={() => startSession('strip')}><span className="choice-badge">FAVORITA</span><div className="mini-strip"><i>☺</i><i>✦</i><i>☺</i><i>✳</i></div><h2>Tira de 4 fotos</h2><p>Cuatro poses para divertirse.</p><span className="choice-go">ELEGIR <b>→</b></span></button></div>
    </section>}
    {screen === 'poses' && <section className="pose-screen screen-card"><button className="back-button" onClick={() => setScreen('choose')}>← Volver</button><div className="pose-intro"><span className="eyebrow">PASO 2 · {layout === 'strip' ? 'TIRA DE 4 FOTOS' : 'FOTO INDIVIDUAL'}</span><h1>¡A jugar<br /><em>con la pose!</em></h1><p>Giramos la ruleta antes de la foto. Prepará tu mejor versión.</p></div><div className={`pose-stage ${poseChosen ? 'pose-selected' : ''}`}><div className="pose-pointer">▼</div><div className="pose-wheel-large" style={{ transform: `rotate(${wheelRotation}deg)` }} aria-hidden="true">✦</div><span className="pose-result-label">{poseChosen ? 'TU RETO PARA LA FOTO' : '¿QUÉ POSE TE TOCA?'}</span><strong className="pose-result" aria-live="polite">{pose}</strong><button type="button" className="spin-button pose-spin" onClick={spinPose}><span>✦</span> {poseChosen ? 'GIRAR DE NUEVO' : 'GIRAR RULETA'} <b>↻</b></button></div><div className="pose-next"><span>📸 {layout === 'strip' ? 'Después vas a sacar 4 fotos con esta idea.' : 'Después de elegir, abrimos la cámara.'}</span><button className="primary-button" disabled={!poseChosen} onClick={beginPhoto}>IR A LA CÁMARA <span>→</span></button></div></section>}
    {screen === 'camera' && <section className="camera-screen screen-card"><div className="camera-heading"><button className="back-button" onClick={reset}>← Salir</button><div><span className="eyebrow">{layout === 'strip' ? 'TIRA DE 4 FOTOS' : 'FOTO INDIVIDUAL'}</span><h1>{countdown !== null ? '¡Preparados!' : layout === 'strip' && captured.length ? `Foto ${captured.length + 1} de 4` : 'Una sonrisa y…'}</h1><p>{cameraState === 'loading' ? 'Estamos preparando la cámara…' : layout === 'strip' ? `Fotos restantes: ${remaining}` : 'Mirá a la cámara y tocá el botón.'}</p></div><span className="step-pill">{layout === 'strip' ? `${captured.length}/4` : 'EN VIVO'}</span></div>
      <div className="filter-picker" role="group" aria-label="Elegí un efecto"><span>EFECTOS</span>{FILTERS.map((option) => <button type="button" key={option.id} className={`filter-chip ${filter.id === option.id ? 'selected' : ''}`} aria-pressed={filter.id === option.id} onClick={() => setFilter(option)}>{option.label}</button>)}</div>
      <div className="camera-stage"><video ref={videoRef} autoPlay playsInline muted className={cameraState === 'ready' ? 'video-ready' : ''} style={{ filter: filter.css }} /><div className="camera-placeholder"><span>📷</span><p>{cameraState === 'loading' ? 'Conectando la cámara…' : cameraState === 'error' ? 'Cámara no disponible' : 'Tu cámara aparecerá acá'}</p></div>{cameraState === 'ready' && <div className="live-label"><i /> EN VIVO</div>}{countdown !== null && <div className="countdown-overlay"><span>{countdown || '¡YA!'}</span></div>}</div>
      {message && <div className="inline-message" role="alert">{message}<button onClick={() => setMessage('')}>×</button></div>}
      {cameraState === 'error' ? <div className="camera-actions"><button className="primary-button" onClick={openCamera}>REINTENTAR <span>↻</span></button><button className="text-button" onClick={reset}>Elegir otro formato</button></div> : <div className="camera-actions">{cameraState === 'ready' && countdown === null && <button className="capture-button" onClick={takeShot}><span>📸</span>{layout === 'strip' && captured.length ? 'SIGUIENTE FOTO' : 'SACAR FOTO'} <b>→</b></button>}{countdown !== null && <button className="text-button cancel-button" onClick={cancelCountdown}>Cancelar temporizador</button>}</div>}
      {captured.length > 0 && layout === 'strip' && <div className="shot-progress">{captured.map((_, i) => <span key={i} className="shot-dot done">✓</span>)}{Array.from({ length: 4 - captured.length }, (_, i) => <span key={`empty-${i}`} className="shot-dot">{captured.length + i + 1}</span>)}</div>}
      <p className="privacy-note">🔒 Tus fotos se procesan en esta computadora.</p>
    </section>}
    {screen === 'result' && <section className="result-screen screen-card"><div className="result-copy"><span className="eyebrow">¡LISTO!</span><h1>Un recuerdo<br /><em>para vos.</em></h1><p>Descargá la foto o escaneá el QR con tu celular.</p><p className={`original-status ${originalStatus}`} role="status">{originalStatus === 'saving' ? 'Guardando respaldo original…' : originalStatus === 'saved' ? `Original${layout === 'strip' ? 'es' : ''} guardado${layout === 'strip' ? 's' : ''} en data/originals.` : originalStatus === 'error' ? 'No se pudo guardar el respaldo original. Revisá data/originals.' : ''}</p><a className="primary-button download-button" href={photoUrl} download={`expo-cet-1-${layout === 'strip' ? 'tira' : 'foto'}-${new Date().toISOString().slice(0, 10)}.jpg`}>DESCARGAR FOTO <span>↓</span></a><button className="secondary-button" onClick={() => startSession(layout)}>SACAR OTRA FOTO <span>↻</span></button><button className="text-button" onClick={reset}>Volver al inicio</button></div><div className="result-preview"><div className="preview-label">EXPO CET 1 · LABORATORIO DE REDES I</div>{photoUrl && <img src={photoUrl} alt="Vista previa de tu recuerdo de Expo CET 1 - Laboratorio de Redes I" />}{shareQr && photoSaved ? <div className="share-qr"><img src={shareQr.qr} alt="Código QR para abrir la galería en tu celular" /><div><strong>ESCANEÁ Y DESCARGÁ</strong><small>Conectate a la Wi‑Fi de la Expo</small><small>{shareQr.galleryUrl}</small></div></div> : <p className="qr-loading">{shareQr ? 'Guardando tu foto para el celular…' : 'Preparando el QR para compartir…'}</p>}</div></section>}
    <footer className="footer"><span>EXPO REDES I <b>·</b> 2026</span><span>HECHO CON <i>♥</i> EN LA EXPO</span></footer>
  </main>
}

function makePhotoFromFrames(frames, strip) {
  const width = frames[0]?.width || 1280
  const height = frames[0]?.height || 720
  const pad = Math.round(width * 0.035)
  const gap = Math.round(width * 0.022)
  const footer = Math.round(height * 0.22)
  const canvas = document.createElement('canvas')
  canvas.width = width + pad * 2
  const count = strip ? 4 : 1
  canvas.height = height * count + gap * (count - 1) + footer + pad * 2
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = BRAND.dark
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  frames.forEach((frame, i) => {
    const y = pad + i * (height + gap)
    ctx.drawImage(frame, pad, y, width, height)
    ctx.strokeStyle = i % 2 ? BRAND.pink : BRAND.yellow
    ctx.lineWidth = Math.max(8, Math.round(width * 0.009))
    ctx.strokeRect(pad + ctx.lineWidth / 2, y + ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth)
  })
  const bandY = canvas.height - footer - pad
  ctx.fillStyle = '#2a1748'
  ctx.fillRect(0, bandY, canvas.width, footer + pad)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.font = `900 ${Math.round(width * 0.044)}px system-ui, sans-serif`
  ctx.fillText('EXPO CET 1 - LABORATORIO DE REDES I', canvas.width / 2, bandY + footer * 0.52, width * 0.94)
  ctx.fillStyle = BRAND.yellow
  ctx.font = `700 ${Math.round(width * 0.031)}px system-ui, sans-serif`
  ctx.fillText('Expo PhotoBooth  ·  2026', canvas.width / 2, bandY + footer * 0.82)
  return canvas
}

function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo convertir la imagen.')), 'image/jpeg', 0.94))
}

