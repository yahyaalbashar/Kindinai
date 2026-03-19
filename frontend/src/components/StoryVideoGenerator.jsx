import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../api'

function StoryVideoGenerator({ story, paragraphs }) {
  const [status, setStatus] = useState(story.video_status || 'pending')
  const [clips, setClips] = useState(story.video_clips || [])
  const [error, setError] = useState(null)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const [showText, setShowText] = useState(true)
  const videoRef = useRef(null)
  const audioRef = useRef(null)

  const hasClips = clips.length > 0

  const handleGenerate = async () => {
    setStatus('generating')
    setError(null)
    try {
      const response = await api.post('/api/generate-video/', { order_id: story.id })
      setClips(response.data.video_clips)
      setStatus('completed')
    } catch (err) {
      setError(err.response?.data?.error || 'فشل في إنشاء الفيديو')
      setStatus('failed')
    }
  }

  // Play all clips in sequence with audio narration
  const handlePlay = useCallback(() => {
    setCurrentClipIndex(0)
    setIsPlaying(true)
  }, [])

  // When isPlaying changes or clip index changes, play the current clip
  useEffect(() => {
    if (!isPlaying || !hasClips) return

    const video = videoRef.current
    if (!video) return

    video.load()
    video.play().catch(() => {})

    // Start audio on first clip
    if (currentClipIndex === 0 && audioRef.current && story.audio_url) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [isPlaying, currentClipIndex, hasClips, story.audio_url])

  const handleClipEnded = () => {
    if (currentClipIndex < clips.length - 1) {
      setCurrentClipIndex(prev => prev + 1)
    } else {
      // All clips done
      setIsPlaying(false)
      setCurrentClipIndex(0)
      if (audioRef.current) audioRef.current.pause()
    }
  }

  const handleStop = () => {
    setIsPlaying(false)
    setCurrentClipIndex(0)
    if (videoRef.current) videoRef.current.pause()
    if (audioRef.current) audioRef.current.pause()
  }

  // Not yet generated
  if (status === 'pending' || (!hasClips && status !== 'generating')) {
    return (
      <div className="story-video-generator">
        <button
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="video-gen-btn"
        >
          {status === 'generating' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
              جاري إنشاء الفيديو...
            </span>
          ) : (
            '🎬 إنشاء فيديو متحرك للقصة'
          )}
        </button>
        <p className="video-gen-hint">
          سنحوّل الرسومات إلى مشاهد متحركة مع صوت الراوي
        </p>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>
    )
  }

  if (status === 'generating') {
    return (
      <div className="story-video-generator">
        <div className="video-gen-progress">
          <div className="video-gen-progress-info">
            <span className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin inline-block" />
            <span className="font-bold">جاري إنشاء مشاهد الفيديو...</span>
          </div>
          <p className="video-gen-hint">قد يستغرق هذا عدة دقائق</p>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="story-video-generator">
        <p className="text-red-600 mb-3">{error || 'فشل في إنشاء الفيديو'}</p>
        <button onClick={handleGenerate} className="video-gen-retry">
          إعادة المحاولة
        </button>
      </div>
    )
  }

  // Video ready — show player
  const currentClip = clips[currentClipIndex]
  const currentParaText = currentClip
    ? paragraphs[currentClip.paragraph_index]?.trim()
    : ''

  return (
    <div className="story-video-generator">
      <div className="video-player-container">
        {/* Hidden audio for narration */}
        {story.audio_url && (
          <audio ref={audioRef} src={story.audio_url} preload="auto" />
        )}

        {/* Video display */}
        <div className="video-player-screen">
          {isPlaying && currentClip ? (
            <>
              <video
                ref={videoRef}
                src={currentClip.video_url}
                onEnded={handleClipEnded}
                className="video-player-video"
                playsInline
                muted
              />
              {/* Text overlay */}
              {showText && currentParaText && (
                <div className="video-text-overlay">
                  <p className="font-amiri">{currentParaText}</p>
                </div>
              )}
              {/* Clip counter */}
              <div className="video-clip-counter">
                {currentClipIndex + 1} / {clips.length}
              </div>
            </>
          ) : (
            <div className="video-player-poster">
              <div className="text-4xl mb-3">🎬</div>
              <p className="font-bold text-navy">فيديو القصة جاهز</p>
              <p className="text-sm text-sage">{clips.length} مشاهد متحركة</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="video-player-controls">
          {isPlaying ? (
            <button onClick={handleStop} className="video-gen-btn">
              ⏹ إيقاف
            </button>
          ) : (
            <button onClick={handlePlay} className="video-gen-btn">
              ▶ شاهد القصة
            </button>
          )}

          <button
            onClick={() => setShowText(prev => !prev)}
            className="video-gen-retry"
          >
            {showText ? 'إخفاء النص' : 'إظهار النص'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoryVideoGenerator
