import { useCallback, useEffect, useRef, useState } from 'react'

const BRAND = { ink: '#111919', paper: '#f3f1e8', accent: '#9fd2c5' }
const FILTERS = [
  { id: 'none', label: 'Sin filtro', css: 'none' },
  { id: 'mono', label: 'Blanco y negro', css: 'grayscale(1) contrast(1.08)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(.85) saturate(1.1) contrast(1.05)' },
  { id: 'expo', label: 'Colores Expo', css: 'saturate(1.55) contrast(1.08) hue-rotate(-8deg)' },
]
const POSES = [
  'Hacé una pose de estrella',
  'Mandá un corazón con las manos',
  'Poné cara de sorpresa',
  'Saludá como una celebridad',
  'Mostrá tu mejor sonrisa',
  'Hacé tu pose de superhéroe',
  'Posá como tapa de revista',
  '¡Una pose divertida en equipo!',
]

export default function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timeoutRef = useRef(null)
  const runRef = useRef(0)
  const originalUploadsRef = useRef([])
  const stageRef = useRef(null)
  const spinTimerRef = useRef(null)
  const sessionRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
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

  useEffect(() => { if (screen !== 'welcome') stageRef.current?.focus() }, [screen])
  useEffect(() => () => clearTimeout(spinTimerRef.current), [])

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
      setMessage('Abrí la cabina desde INICIAR.bat para usar la cámara en esta PC.')
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
        ? 'Revisá Configuración de Windows → Privacidad y seguridad → Cámara. Permití el acceso a las aplicaciones de escritorio.'
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
    fetch('/api/qr', { cache: 'no-store' }).then((response) => response.json()).then(setShareQr).catch(() => setShareQr(null))
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
          const session = sessionRef.current
          Promise.allSettled(originalUploadsRef.current).then((results) => {
            if (session !== sessionRef.current) return
            setOriginalStatus(results.every((result) => result.status === 'fulfilled') ? 'saved' : 'error')
          })
          setScreen('result')
          setCameraState('idle')
          stopCamera()
          fetch(dataUrl).then((response) => response.blob())
            .then((blob) => fetch('/api/photos', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob }))
            .then((response) => { if (!response.ok) throw new Error('No se pudo guardar la foto para el QR.'); if (session === sessionRef.current) setPhotoSaved(true) })
            .catch(() => { if (session === sessionRef.current) setMessage('No se pudo compartir la foto por QR.') })
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
    setSpinning(true)
    setPose('Girando…')
    const target = (360 - next * 45) % 360
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850
    setWheelRotation((angle) => angle + 1080 + (target - angle % 360 + 360) % 360)
    spinTimerRef.current = setTimeout(() => {
      setPose(POSES[next])
      setPoseChosen(true)
      setSpinning(false)
    }, duration)
  }

  const clearSpin = () => {
    clearTimeout(spinTimerRef.current)
    setSpinning(false)
  }

  const startSession = (selectedLayout) => {
    sessionRef.current += 1
    clearSpin()
    setMessage('')
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
    sessionRef.current += 1
    clearSpin()
    stopCamera()
    setPhoto('')
    setCaptured([])
    setPoseChosen(false)
    setCameraState('idle')
    setMessage('')
    setScreen('welcome')
  }

  const total = layout === 'strip' ? 4 : 1
  const step = ['choose', 'poses', 'camera', 'result'].indexOf(screen)
  const localDownload = `expo-cet-1-${layout === 'strip' ? 'tira' : 'foto'}-${new Date().toISOString().slice(0, 10)}.jpg`

  if (screen === 'gallery') return <main className="gallery">
    <Brand />
    <h1>Fotos de la Expo</h1>
    <p>Buscá tu foto y guardala en el celular.</p>
    {galleryPhotos.length ? <div className="gallery-grid">
      {galleryPhotos.map((name, index) => <a className="gallery-card" href={`/photos/${encodeURIComponent(name)}`} download={`expo-${name}`} key={name}>
        <img loading={index < 4 ? 'eager' : 'lazy'} src={`/photos/${encodeURIComponent(name)}`} alt={`Foto ${index + 1} de la Expo`} />
        <span>Descargar JPG <b aria-hidden="true">↓</b></span>
      </a>)}
    </div> : <div className="empty">Todavía no hay fotos. Volvé a abrir la galería después de tu sesión.</div>}
  </main>

  return <div className="shell">
    <header className="toolbar">
      <Brand />
      <div className="toolbar-actions">
        {screen !== 'welcome' && <button className="utility" onClick={reset}>Inicio</button>}
        {window.cabina && <button className="utility" onClick={() => window.cabina.toggleFullscreen()} title="Pantalla completa (F11)"><span aria-hidden="true">⛶</span> Pantalla completa</button>}
      </div>
    </header>
    <div className="workspace">
      <aside className="rail">
        <span className="rail-label">Tu sesión</span>
        <ol aria-label="Progreso de la sesión">
          {['Formato', 'Pose', 'Cámara', 'Entrega'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={index < step ? 'done' : ''}>
            <span>{index < step ? '✓' : index + 1}</span>{label}
          </li>)}
        </ol>
        <div className="rail-event">EXPO CET 1<small>Laboratorio de Redes I</small></div>
      </aside>
      <main className="stage" key={screen} ref={stageRef} tabIndex={-1}>
        {screen === 'welcome' && <section className="start">
          <div className="start-copy">
            <span className="kicker"><i /> Expo CET 1 · Laboratorio de Redes I</span>
            <h1>Cabina<br />fotográfica</h1>
            <p>Sacate una foto o armá una tira de cuatro para llevarte en el celular.</p>
            <button className="button primary" onClick={() => setScreen('choose')}>Empezar sesión <b aria-hidden="true">→</b></button>
          </div>
          <div className="start-art" aria-hidden="true"><div className="focus-mark"><i /><i /><i /><i /><span /></div></div>
        </section>}
        {screen === 'choose' && <section className="page">
          <PageTitle back={() => setScreen('welcome')} title="Elegí un formato" text="¿Una foto o cuatro poses?" />
          <div className="formats">
            <button className="format" onClick={() => startSession('single')}><FormatArt count={1} /><span><strong>Foto individual</strong><small>Una captura con marco</small></span><b aria-hidden="true">→</b></button>
            <button className="format" onClick={() => startSession('strip')}><FormatArt count={4} /><span><strong>Tira de 4 fotos</strong><small>Cuatro capturas, un JPG</small></span><b aria-hidden="true">→</b></button>
          </div>
        </section>}
        {screen === 'poses' && <section className="page">
          <PageTitle back={() => { clearSpin(); setScreen('choose') }} title="Ruleta de poses" text="Girá la rueda para descubrir tu reto." />
          <div className="pose-layout">
            <div className="wheel-frame" aria-hidden="true"><span className="pointer">▼</span><div className="wheel" style={{ transform: `rotate(${wheelRotation}deg)` }}>{POSES.map((_, i) => <span key={i} style={{ '--angle': `${i * 45}deg` }}>{i + 1}</span>)}<b></b></div></div>
            <div className="panel pose-panel">
              <span className="kicker">Reto de pose</span><strong className="pose" aria-live="polite">{pose}</strong>
              <button className="button secondary" disabled={spinning} onClick={spinPose}>{poseChosen ? 'Girar de nuevo' : 'Girar ruleta'} <b aria-hidden="true">↻</b></button>
              <button className="button primary" disabled={!poseChosen || spinning} onClick={beginPhoto}>Abrir cámara <b aria-hidden="true">→</b></button>
            </div>
          </div>
        </section>}
        {screen === 'camera' && <section className="page camera-page">
          <PageTitle back={() => { stopCamera(); setCameraState('idle'); setScreen('poses') }} title={total === 4 ? `Foto ${captured.length + 1} de 4` : 'Foto individual'} text={pose} />
          <div className="capture-layout">
            <div className="viewfinder">
              <video ref={videoRef} autoPlay playsInline muted className={cameraState === 'ready' ? 'ready' : ''} style={{ filter: filter.css }} />
              {cameraState !== 'ready' && <div className="camera-placeholder"><span aria-hidden="true">◎</span>{cameraState === 'error' ? 'Cámara no disponible' : 'Conectando la cámara…'}</div>}
              {cameraState === 'ready' && <span className="live"><i /> En vivo</span>}
              {countdown !== null && <div className="countdown" role="status" aria-label={`Captura en ${countdown} segundos`}>{countdown}</div>}
            </div>
            <div className="panel capture-panel">
              <div className="effects" role="group" aria-label="Efectos de cámara"><h2>Efectos</h2>{FILTERS.map((option) => <button key={option.id} className="effect" aria-pressed={filter.id === option.id} disabled={countdown !== null} onClick={() => setFilter(option)}>{option.label}</button>)}</div>
              {total === 4 && <ol className="shots" aria-label={`${captured.length} de 4 fotos tomadas`}>{Array.from({ length: 4 }, (_, i) => <li className={i < captured.length ? 'taken' : ''} key={i}>{i < captured.length ? '✓' : i + 1}</li>)}</ol>}
              <div className="capture-actions">
                {cameraState === 'error' ? <button className="button primary" onClick={openCamera}>Reintentar cámara</button> : countdown !== null ? <button className="button secondary" onClick={cancelCountdown}>Cancelar cuenta regresiva</button> : <button className="button primary" disabled={cameraState !== 'ready'} onClick={takeShot}>Sacar foto <b aria-hidden="true">◎</b></button>}
              </div>
            </div>
          </div>
          {message && <div className="notice" role="alert">{message}</div>}
        </section>}
        {screen === 'result' && <section className="page">
          <PageTitle title="¡Tu recuerdo está listo!" text="Guardalo acá o escaneá el código desde tu celular." />
          <div className="delivery">
            <div className="photo-preview">{photoUrl && <img src={photoUrl} alt="Foto de la Expo con marco y título del evento" />}</div>
            <div className="panel delivery-panel">
              <a className="button primary" href={photoUrl} download={localDownload}>Guardar JPG <b aria-hidden="true">↓</b></a>
              <div className="qr-card">
                {shareQr && photoSaved && <img src={shareQr.qr} alt="Código QR de la galería de fotos" />}
                <div><strong>Descargar en el celular</strong><p>{photoSaved && shareQr ? 'Conectate al mismo Wi‑Fi que la cabina y escaneá el QR.' : message || (photoSaved ? 'El código QR no está disponible.' : 'Guardando la foto para compartir…')}</p></div>
              </div>
              <p className="backup-status" role="status">{originalStatus === 'saved' ? 'Originales guardados en la cabina.' : originalStatus === 'error' ? 'No se pudieron guardar todos los originales.' : 'Guardando los originales…'}</p>
              <button className="button secondary" onClick={() => startSession(layout)}>Sacar otra foto <b aria-hidden="true">↻</b></button>
              <button className="text-button" onClick={reset}>Terminar sesión</button>
            </div>
          </div>
        </section>}
      </main>
    </div>
  </div>
}

function Brand() {
  return <div className="brand"><span aria-hidden="true">◎</span><strong>Expo PhotoBooth</strong></div>
}

function PageTitle({ title, text, back }) {
  return <header className="page-title">{back && <button className="text-button" onClick={back}>← Atrás</button>}<h1>{title}</h1><p>{text}</p></header>
}

function FormatArt({ count }) {
  return <span aria-hidden="true" className={`format-art art-${count}`}>{Array.from({ length: count }, (_, i) => <i key={i} />)}</span>
}

function makePhotoFromFrames(frames, strip) {
  const width = frames[0]?.width || 1280
  const height = frames[0]?.height || 720
  const pad = Math.round(width * 0.035)
  const gap = Math.round(width * 0.022)
  const footer = Math.round(width * 0.135)
  const canvas = document.createElement('canvas')
  canvas.width = width + pad * 2
  const count = strip ? 4 : 1
  canvas.height = height * count + gap * (count - 1) + footer + pad * 2
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = BRAND.ink
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  frames.forEach((frame, i) => {
    const y = pad + i * (height + gap)
    ctx.drawImage(frame, pad, y, width, height)
    ctx.strokeStyle = BRAND.paper
    ctx.lineWidth = Math.max(2, Math.round(width * 0.003))
    ctx.strokeRect(pad + ctx.lineWidth / 2, y + ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth)
  })
  const bandY = canvas.height - footer - pad
  ctx.fillStyle = BRAND.ink
  ctx.fillRect(0, bandY, canvas.width, footer + pad)
  ctx.fillStyle = BRAND.accent
  ctx.fillRect(0, bandY, canvas.width, Math.round(width * 0.009))

  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.font = `900 ${Math.round(width * 0.044)}px system-ui, sans-serif`
  ctx.fillText('EXPO CET 1 · LABORATORIO DE REDES I', canvas.width / 2, bandY + footer * 0.52, width * 0.84)
  ctx.fillStyle = BRAND.accent
  ctx.font = `700 ${Math.round(width * 0.025)}px system-ui, sans-serif`
  ctx.fillText('Expo PhotoBooth  ·  2026', canvas.width / 2, bandY + footer * 0.82)
  return canvas
}

function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo convertir la imagen.')), 'image/jpeg', 0.94))
}
