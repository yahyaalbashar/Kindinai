import { useState, useRef, useCallback, useEffect } from 'react'

const CANVAS_W = 1080
const CANVAS_H = 1920 // 9:16 vertical (mobile-friendly story video)
const COVER_DURATION = 4000
const END_DURATION = 5000
const FADE_DURATION = 600

// Time per paragraph: base + per-character reading time
function slideDuration(text) {
  return Math.max(5000, 2000 + text.length * 60)
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''
  for (const word of words) {
    const test = currentLine ? currentLine + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = test
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function StoryVideoGenerator({ story, paragraphs, illustrationsByParagraph }) {
  const [status, setStatus] = useState('idle') // idle | recording | done | error
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState(null)
  const canvasRef = useRef(null)
  const recorderRef = useRef(null)
  const audioRef = useRef(null)
  const cancelledRef = useRef(false)

  // Preload illustration images
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }, [])

  // Draw a cover slide
  const drawCover = useCallback((ctx) => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
    grad.addColorStop(0, '#1B4332')
    grad.addColorStop(0.4, '#2D6A4F')
    grad.addColorStop(1, '#1B4332')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Gold ornament line
    ctx.fillStyle = '#D4A843'
    ctx.fillRect(CANVAS_W / 2 - 60, 420, 120, 4)

    // Title
    const title = story.story_title || `قصة ${story.child_name}`
    ctx.fillStyle = '#FFF8F0'
    ctx.font = 'bold 64px Amiri, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.direction = 'rtl'
    const titleLines = wrapText(ctx, title, CANVAS_W - 120)
    const titleStartY = CANVAS_H / 2 - (titleLines.length * 80) / 2
    titleLines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, titleStartY + i * 80)
    })

    // Divider
    const divY = titleStartY + titleLines.length * 80 + 40
    ctx.fillStyle = '#D4A843'
    ctx.fillRect(CANVAS_W / 2 - 60, divY, 120, 4)

    // Child name
    ctx.fillStyle = '#D4A843'
    ctx.font = 'bold 44px Amiri, serif'
    ctx.fillText(story.child_name, CANVAS_W / 2, divY + 70)

    // Moral
    if (story.story_moral) {
      ctx.fillStyle = 'rgba(255, 248, 240, 0.7)'
      ctx.font = 'italic 36px Amiri, serif'
      const moralLines = wrapText(ctx, `« ${story.story_moral} »`, CANVAS_W - 160)
      moralLines.forEach((line, i) => {
        ctx.fillText(line, CANVAS_W / 2, divY + 150 + i * 50)
      })
    }
  }, [story])

  // Draw a content slide (text + optional illustration)
  const drawContentSlide = useCallback((ctx, text, illustration) => {
    // Warm background
    ctx.fillStyle = '#FFF8F0'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    let textStartY = 180

    // Draw illustration if available
    if (illustration) {
      const imgMaxH = 800
      const imgMaxW = CANVAS_W - 120
      const aspect = illustration.width / illustration.height
      let drawW, drawH
      if (aspect > imgMaxW / imgMaxH) {
        drawW = imgMaxW
        drawH = imgMaxW / aspect
      } else {
        drawH = imgMaxH
        drawW = imgMaxH * aspect
      }
      const imgX = (CANVAS_W - drawW) / 2
      const imgY = 100

      // Rounded rectangle clip for illustration
      const r = 24
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(imgX + r, imgY)
      ctx.lineTo(imgX + drawW - r, imgY)
      ctx.quadraticCurveTo(imgX + drawW, imgY, imgX + drawW, imgY + r)
      ctx.lineTo(imgX + drawW, imgY + drawH - r)
      ctx.quadraticCurveTo(imgX + drawW, imgY + drawH, imgX + drawW - r, imgY + drawH)
      ctx.lineTo(imgX + r, imgY + drawH)
      ctx.quadraticCurveTo(imgX, imgY + drawH, imgX, imgY + drawH - r)
      ctx.lineTo(imgX, imgY + r)
      ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(illustration, imgX, imgY, drawW, drawH)
      ctx.restore()

      // Subtle border
      ctx.strokeStyle = '#F5EBD8'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(imgX + r, imgY)
      ctx.lineTo(imgX + drawW - r, imgY)
      ctx.quadraticCurveTo(imgX + drawW, imgY, imgX + drawW, imgY + r)
      ctx.lineTo(imgX + drawW, imgY + drawH - r)
      ctx.quadraticCurveTo(imgX + drawW, imgY + drawH, imgX + drawW - r, imgY + drawH)
      ctx.lineTo(imgX + r, imgY + drawH)
      ctx.quadraticCurveTo(imgX, imgY + drawH, imgX, imgY + drawH - r)
      ctx.lineTo(imgX, imgY + r)
      ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY)
      ctx.closePath()
      ctx.stroke()

      textStartY = imgY + drawH + 80
    }

    // Draw text
    ctx.fillStyle = '#1B2A4A'
    ctx.font = '42px Amiri, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.direction = 'rtl'
    const lines = wrapText(ctx, text, CANVAS_W - 140)
    const lineHeight = 68
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, textStartY + i * lineHeight)
    })
  }, [])

  // Draw end slide
  const drawEnd = useCallback((ctx) => {
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
    grad.addColorStop(0, '#FFFDF8')
    grad.addColorStop(1, '#F5EBD8')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.direction = 'rtl'

    // Divider
    ctx.fillStyle = '#D4A843'
    ctx.fillRect(CANVAS_W / 2 - 60, CANVAS_H / 2 - 100, 120, 4)

    // End text
    ctx.fillStyle = '#D4A843'
    ctx.font = 'bold 72px Amiri, serif'
    ctx.fillText('النهاية', CANVAS_W / 2, CANVAS_H / 2)

    // Moral
    if (story.story_moral) {
      ctx.fillStyle = '#52796F'
      ctx.font = 'italic 36px Amiri, serif'
      const moralLines = wrapText(ctx, `« ${story.story_moral} »`, CANVAS_W - 160)
      moralLines.forEach((line, i) => {
        ctx.fillText(line, CANVAS_W / 2, CANVAS_H / 2 + 100 + i * 50)
      })
    }

    // Divider
    ctx.fillStyle = '#D4A843'
    const bottomDivY = story.story_moral ? CANVAS_H / 2 + 200 : CANVAS_H / 2 + 100
    ctx.fillRect(CANVAS_W / 2 - 60, bottomDivY, 120, 4)
  }, [story])

  // Draw fade overlay
  const drawFade = useCallback((ctx, opacity) => {
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }, [])

  const generateVideo = useCallback(async () => {
    cancelledRef.current = false
    setStatus('recording')
    setProgress(0)
    setVideoUrl(null)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Build slides
    const slides = []

    // Cover
    slides.push({ type: 'cover', duration: COVER_DURATION })

    // Content slides
    for (let i = 0; i < paragraphs.length; i++) {
      const ills = illustrationsByParagraph[i] || []
      const imageUrl = ills[0]?.image_url || null
      slides.push({
        type: 'content',
        text: paragraphs[i].trim(),
        imageUrl,
        duration: slideDuration(paragraphs[i]),
      })
    }

    // End
    slides.push({ type: 'end', duration: END_DURATION })

    // Preload all images
    const loadedImages = {}
    for (const slide of slides) {
      if (slide.imageUrl) {
        try {
          loadedImages[slide.imageUrl] = await loadImage(slide.imageUrl)
        } catch {
          // Image failed to load, skip it
        }
      }
    }

    // Total duration
    const totalDuration = slides.reduce((sum, s) => sum + s.duration, 0)

    // Set up MediaRecorder
    const stream = canvas.captureStream(30) // 30 FPS

    // Try to attach audio if available
    let audioEl = null
    if (story.audio_url) {
      audioEl = new Audio(story.audio_url)
      audioEl.crossOrigin = 'anonymous'
      try {
        const audioCtx = new AudioContext()
        const source = audioCtx.createMediaElementSource(audioEl)
        const dest = audioCtx.createMediaStreamDestination()
        source.connect(dest)
        source.connect(audioCtx.destination) // Also play through speakers
        for (const track of dest.stream.getAudioTracks()) {
          stream.addTrack(track)
        }
      } catch {
        // Audio capture failed, proceed without audio
        audioEl = null
      }
    }
    audioRef.current = audioEl

    const chunks = []
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      if (cancelledRef.current) return
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setStatus('done')
    }

    recorder.onerror = () => {
      setStatus('error')
    }

    recorder.start(100) // Collect data every 100ms

    // Start audio playback
    if (audioEl) {
      try { await audioEl.play() } catch { /* silent fail */ }
    }

    // Animate through slides
    let elapsed = 0
    for (let si = 0; si < slides.length; si++) {
      if (cancelledRef.current) break
      const slide = slides[si]
      const startTime = performance.now()

      // Draw the slide
      const drawSlide = () => {
        if (slide.type === 'cover') drawCover(ctx)
        else if (slide.type === 'end') drawEnd(ctx)
        else drawContentSlide(ctx, slide.text, loadedImages[slide.imageUrl] || null)
      }

      // Fade in
      const fadeInEnd = Math.min(FADE_DURATION, slide.duration / 2)
      await new Promise((resolve) => {
        const fadeIn = (ts) => {
          if (cancelledRef.current) { resolve(); return }
          const dt = ts - startTime
          drawSlide()
          if (dt < fadeInEnd) {
            drawFade(ctx, 1 - dt / fadeInEnd)
            requestAnimationFrame(fadeIn)
          } else {
            resolve()
          }
        }
        requestAnimationFrame(fadeIn)
      })

      // Hold (main display time)
      const holdTime = slide.duration - fadeInEnd * 2
      if (holdTime > 0 && !cancelledRef.current) {
        drawSlide()
        await new Promise(r => setTimeout(r, holdTime))
      }

      // Fade out
      if (!cancelledRef.current) {
        const fadeOutStart = performance.now()
        await new Promise((resolve) => {
          const fadeOut = (ts) => {
            if (cancelledRef.current) { resolve(); return }
            const dt = ts - fadeOutStart
            drawSlide()
            if (dt < fadeInEnd) {
              drawFade(ctx, dt / fadeInEnd)
              requestAnimationFrame(fadeOut)
            } else {
              resolve()
            }
          }
          requestAnimationFrame(fadeOut)
        })
      }

      elapsed += slide.duration
      setProgress(Math.round((elapsed / totalDuration) * 100))
    }

    // Stop
    if (audioEl) audioEl.pause()
    if (recorder.state !== 'inactive') recorder.stop()
  }, [story, paragraphs, illustrationsByParagraph, loadImage, drawCover, drawEnd, drawContentSlide, drawFade])

  const handleCancel = useCallback(() => {
    cancelledRef.current = true
    if (audioRef.current) audioRef.current.pause()
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
    setStatus('idle')
  }, [])

  const handleDownload = useCallback(() => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `story_${story.child_name}.webm`
    a.click()
  }, [videoUrl, story.child_name])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  const hasContent = paragraphs.length > 0

  if (!hasContent) return null

  return (
    <div className="story-video-generator">
      {/* Hidden canvas for recording */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'none' }}
      />

      {status === 'idle' && (
        <button onClick={generateVideo} className="video-gen-btn">
          🎬 إنشاء فيديو القصة
        </button>
      )}

      {status === 'recording' && (
        <div className="video-gen-progress">
          <div className="video-gen-progress-info">
            <span className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin inline-block" />
            <span className="font-bold">جاري تسجيل الفيديو... {progress}%</span>
          </div>
          <div className="video-gen-bar-bg">
            <div className="video-gen-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <button onClick={handleCancel} className="video-gen-cancel">
            إلغاء
          </button>
        </div>
      )}

      {status === 'done' && videoUrl && (
        <div className="video-gen-done">
          <video
            src={videoUrl}
            controls
            className="video-gen-preview"
            playsInline
          />
          <button onClick={handleDownload} className="video-gen-btn">
            تحميل الفيديو
          </button>
          <button onClick={() => { setStatus('idle'); setVideoUrl(null) }} className="video-gen-retry">
            إعادة الإنشاء
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="video-gen-error">
          <p className="text-red-600 font-bold">فشل في إنشاء الفيديو</p>
          <button onClick={() => setStatus('idle')} className="video-gen-retry">
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  )
}

export default StoryVideoGenerator
