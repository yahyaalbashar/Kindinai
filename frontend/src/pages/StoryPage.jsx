import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import LoadingAnimation from '../components/LoadingAnimation'
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

  // Split story into paragraphs and group illustrations by paragraph
  const { paragraphs, illustrationsByParagraph } = useMemo(() => {
    if (!story?.story_text) return { paragraphs: [], illustrationsByParagraph: {} }

    const paras = story.story_text.split('\n\n').filter(p => p.trim())
    const illMap = {}
    if (story.illustrations?.length) {
      for (const ill of story.illustrations) {
        const idx = ill.paragraph_index ?? 0
        if (!illMap[idx]) illMap[idx] = []
        illMap[idx].push(ill)
      }
    }
    return { paragraphs: paras, illustrationsByParagraph: illMap }
  }, [story?.story_text, story?.illustrations])

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

  const hasIllustrations = story.illustrations_status === 'completed' && story.illustrations?.length > 0

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
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

        {/* Illustration generate button - hidden on print */}
        {!hasIllustrations && (
          <div className="no-print mb-6">
            <StoryIllustrations
              orderId={id}
              illustrations={story.illustrations}
              illustrationsStatus={story.illustrations_status}
            />
          </div>
        )}

        {/* Book container */}
        <div className="story-book bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Book cover / title page */}
          <div className="story-page story-cover text-center py-16 px-8 border-b-2 border-cream-dark">
            <div className="text-6xl mb-6">📖</div>
            <h1 className="font-amiri text-4xl md:text-5xl font-bold text-navy mb-4">
              قصة {story.child_name}
            </h1>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full"></div>
          </div>

          {/* Story paragraphs with illustrations */}
          {paragraphs.map((paragraph, index) => {
            const paraIllustrations = illustrationsByParagraph[index] || []
            const hasParagraphImages = paraIllustrations.length > 0

            return (
              <div
                key={index}
                className={`story-page border-b border-cream-dark last:border-b-0 ${
                  hasParagraphImages ? 'story-page-illustrated' : ''
                }`}
              >
                {hasParagraphImages ? (
                  <div className="story-spread">
                    {/* Text side (left in LTR visual, which is left on screen) */}
                    <div className="story-text-column">
                      <p className="font-amiri text-xl md:text-2xl leading-loose text-navy whitespace-pre-line">
                        {paragraph.trim()}
                      </p>
                    </div>
                    {/* Image side (right) */}
                    <div className="story-image-column">
                      {paraIllustrations.map((ill, imgIdx) => (
                        <div key={imgIdx} className="story-illustration">
                          <img
                            src={ill.image_url}
                            alt={`رسمة من القصة`}
                            className="w-full h-auto rounded-xl shadow-md"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="story-text-full">
                    <p className="font-amiri text-xl md:text-2xl leading-loose text-navy whitespace-pre-line">
                      {paragraph.trim()}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Decorative footer / back cover */}
          <div className="story-page story-endpage text-center py-12">
            <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6"></div>
            <span className="font-amiri text-gold text-3xl">✨ النهاية ✨</span>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full mt-6"></div>
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
