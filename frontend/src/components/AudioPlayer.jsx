import { useState, useRef } from 'react'
import api from '../api'

function AudioPlayer({ orderId, audioUrl: initialAudioUrl, audioStatus: initialStatus }) {
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl)
  const [status, setStatus] = useState(initialStatus || 'pending')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const audioRef = useRef(null)

  const handleGenerateAudio = async () => {
    setStatus('generating')
    setError(null)
    try {
      const response = await api.post('/api/generate-audio/', { order_id: orderId })
      setAudioUrl(response.data.audio_url)
      setStatus('completed')
    } catch (err) {
      setError(err.response?.data?.error || 'فشل في إنشاء الصوت')
      setStatus('failed')
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(pct)
    }
  }

  const handleSeek = (e) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    // RTL: progress bar fills from right, so invert
    const pct = 1 - (clickX / rect.width)
    audioRef.current.currentTime = pct * audioRef.current.duration
    setProgress(pct * 100)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(0)
  }

  // Not yet generated — show generate button
  if (status === 'pending' || (!audioUrl && status !== 'generating')) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md text-center">
        <button
          onClick={handleGenerateAudio}
          disabled={status === 'generating'}
          className="bg-sky text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-dark transition-all disabled:opacity-50"
        >
          {status === 'generating' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري إنشاء الصوت...
            </span>
          ) : (
            '🎧 استمع للقصة'
          )}
        </button>
        {error && (
          <p className="text-red-600 text-sm mt-3">{error}</p>
        )}
      </div>
    )
  }

  if (status === 'generating') {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md text-center">
        <div className="flex items-center justify-center gap-2 text-lavender">
          <span className="w-5 h-5 border-2 border-sky border-t-transparent rounded-full animate-spin" />
          <span className="font-bold">جاري إنشاء الصوت...</span>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md text-center">
        <p className="text-red-600 mb-3">{error || 'فشل في إنشاء الصوت'}</p>
        <button
          onClick={handleGenerateAudio}
          className="bg-sky text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-dark transition-all"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  // Audio ready — show player
  return (
    <div className="bg-white rounded-xl p-5 shadow-md">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlayback}
          className="w-12 h-12 bg-sky text-white rounded-full flex items-center justify-center text-xl hover:bg-sky-dark transition-all flex-shrink-0"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="flex-1">
          <p className="text-navy font-bold text-sm mb-2">🎧 استمع للقصة</p>
          {/* Progress bar */}
          <div
            className="h-2 bg-cream-dark rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-sky rounded-full transition-all duration-200"
              style={{ width: `${progress}%`, marginRight: 'auto', marginLeft: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
