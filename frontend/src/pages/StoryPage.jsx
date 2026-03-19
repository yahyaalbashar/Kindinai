import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import LoadingAnimation from '../components/LoadingAnimation'
import AudioPlayer from '../components/AudioPlayer'
import StoryIllustrations from '../components/StoryIllustrations'

function StoryPage() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await api.get(`/api/story/${id}/`)
        setStory(response.data)

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          clearInterval(pollRef.current)
        }
      } catch (err) {
        setError('لم نتمكن من تحميل القصة')
        clearInterval(pollRef.current)
      }
    }

    fetchStory()
    pollRef.current = setInterval(fetchStory, 2000)

    return () => clearInterval(pollRef.current)
  }, [id])

  const handleCopy = async () => {
    if (story?.story_text) {
      await navigator.clipboard.writeText(story.story_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="font-amiri text-2xl text-navy font-bold mb-4">{error}</h2>
          <Link to="/create" className="text-forest hover:underline font-bold">
            حاول مرة أخرى
          </Link>
        </div>
      </div>
    )
  }

  if (!story || story.status === 'generating' || story.status === 'paid') {
    return <LoadingAnimation childName={story?.child_name || ''} />
  }

  if (story.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="font-amiri text-2xl text-navy font-bold mb-4">
            عذرًا، حدث خطأ في إنشاء القصة
          </h2>
          <p className="text-sage mb-6">يرجى التواصل معنا لاسترداد المبلغ أو إعادة المحاولة</p>
          <Link to="/create" className="inline-block bg-forest text-cream px-8 py-3 rounded-xl font-bold">
            حاول مرة أخرى
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Actions bar - hidden on print */}
        <div className="no-print flex items-center justify-between mb-6">
          <Link to="/" className="text-sage hover:text-forest transition-colors">
            ← الرئيسية
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="bg-white text-navy px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-bold"
            >
              {copied ? '✓ تم النسخ!' : '📋 نسخ القصة'}
            </button>
            <button
              onClick={handlePrint}
              className="bg-white text-navy px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-bold"
            >
              🖨️ طباعة
            </button>
          </div>
        </div>

        {/* Audio Player - disabled until better TTS provider is integrated */}
        {/* <div className="no-print mb-6">
          <AudioPlayer orderId={id} audioUrl={story.audio_url} audioStatus={story.audio_status} />
        </div> */}

        {/* Illustrations */}
        <div className="no-print mb-6">
          <StoryIllustrations
            orderId={id}
            illustrations={story.illustrations}
            illustrationsStatus={story.illustrations_status}
          />
        </div>

        {/* Story card */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg print-only">
          {/* Story title */}
          <div className="text-center mb-8 pb-6 border-b border-cream-dark">
            <div className="text-4xl mb-3">📖</div>
            <h1 className="font-amiri text-4xl font-bold text-navy">
              قصة {story.child_name}
            </h1>
          </div>

          {/* Story text */}
          <div className="font-amiri text-xl md:text-2xl leading-loose text-navy whitespace-pre-line">
            {story.story_text}
          </div>

          {/* Decorative footer */}
          <div className="text-center mt-10 pt-6 border-t border-cream-dark">
            <span className="text-gold text-2xl">✨ النهاية ✨</span>
          </div>
        </div>

        {/* Bottom CTA - hidden on print */}
        <div className="no-print text-center mt-8">
          <Link
            to="/create"
            className="inline-block bg-gold text-navy px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md"
          >
            اصنع قصة لطفل آخر
          </Link>
        </div>
      </div>
    </div>
  )
}

export default StoryPage
