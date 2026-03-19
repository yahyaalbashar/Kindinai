import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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

  // Book flip state
  const [currentPage, setCurrentPage] = useState(0)
  const [animatingPage, setAnimatingPage] = useState(null)
  const [animatingDir, setAnimatingDir] = useState(null)

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

  // Split story into paragraphs and group illustrations
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

  // Build ordered book pages: cover → paragraphs → end
  const bookPages = useMemo(() => {
    const pages = [{ type: 'cover' }]
    paragraphs.forEach((para, idx) => {
      pages.push({
        type: 'content',
        text: para.trim(),
        illustrations: illustrationsByParagraph[idx] || [],
        pageNumber: idx + 1,
      })
    })
    pages.push({ type: 'end' })
    return pages
  }, [paragraphs, illustrationsByParagraph])

  const totalPages = bookPages.length

  const flipForward = useCallback(() => {
    if (animatingPage !== null || currentPage >= totalPages - 1) return
    const page = currentPage
    setAnimatingPage(page)
    setAnimatingDir('forward')
    setTimeout(() => {
      setCurrentPage(page + 1)
      setAnimatingPage(null)
      setAnimatingDir(null)
    }, 700)
  }, [animatingPage, currentPage, totalPages])

  const flipBack = useCallback(() => {
    if (animatingPage !== null || currentPage <= 0) return
    const page = currentPage - 1
    setAnimatingPage(page)
    setAnimatingDir('backward')
    setTimeout(() => {
      setCurrentPage(page)
      setAnimatingPage(null)
      setAnimatingDir(null)
    }, 700)
  }, [animatingPage, currentPage])

  const isPageTurned = (i) => {
    if (animatingDir === 'forward' && i === animatingPage) return true
    if (animatingDir === 'backward' && i === animatingPage) return false
    return i < currentPage
  }

  const getPageZIndex = (i) => {
    if (i === animatingPage) return totalPages * 3
    if (i < currentPage) return i
    return totalPages * 2 - i
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') flipForward()
      if (e.key === 'ArrowRight') flipBack()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [flipForward, flipBack])

  const handleCopy = async () => {
    if (story?.story_text) {
      await navigator.clipboard.writeText(story.story_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const goToFirstPage = useCallback(() => {
    if (animatingPage !== null) return
    setCurrentPage(0)
  }, [animatingPage])

  // Map wish to a thematic icon
  const wishIcon = {
    brave: '🦁',
    kind: '💖',
    smart: '🌟',
    curious: '🔭',
    strong: '⛰️',
  }[story?.wish] || '📖'

  // Map theme to a decorative accent
  const themeAccent = {
    adventure: '🌿',
    magic: '✨',
    animals: '🐾',
    space: '🚀',
    ocean: '🐚',
  }[story?.theme] || '✦'

  const renderPageContent = (page) => {
    if (page.type === 'cover') {
      const title = story.story_title || `قصة ${story.child_name}`
      return (
        <div className="book-page-inner cover-inner">
          <div className="cover-ornament top-ornament">{themeAccent} {themeAccent} {themeAccent}</div>
          <div className="cover-icon">{wishIcon}</div>
          <h1 className="font-amiri cover-title">{title}</h1>
          <div className="cover-divider"></div>
          <p className="cover-subtitle font-amiri">{story.child_name}</p>
          {story.story_moral && (
            <p className="cover-moral font-amiri">« {story.story_moral} »</p>
          )}
          <p className="cover-hint">اضغط لفتح الكتاب</p>
          <div className="cover-ornament bottom-ornament">{themeAccent} {themeAccent} {themeAccent}</div>
        </div>
      )
    }

    if (page.type === 'end') {
      return (
        <div className="book-page-inner end-inner">
          <div className="cover-divider"></div>
          <span className="font-amiri end-text">✨ النهاية ✨</span>
          {story.story_moral && (
            <p className="font-amiri end-moral">« {story.story_moral} »</p>
          )}
          <div className="cover-divider"></div>
          <button
            onClick={(e) => { e.stopPropagation(); goToFirstPage(); }}
            className="end-restart-btn"
          >
            ↩ العودة للغلاف
          </button>
        </div>
      )
    }

    // Content page with optional illustrations
    const hasImages = page.illustrations.length > 0

    return (
      <div className="book-page-inner content-inner">
        {hasImages ? (
          <>
            <div className="page-illustrations">
              {page.illustrations.map((ill, idx) => (
                <img
                  key={idx}
                  src={ill.image_url}
                  alt="رسمة من القصة"
                  className="page-ill-img"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="page-text">
              <p className="font-amiri text-content">{page.text}</p>
            </div>
          </>
        ) : (
          <div className="page-text-full">
            <p className="font-amiri text-content">{page.text}</p>
          </div>
        )}
        <div className="page-number">{page.pageNumber}</div>
      </div>
    )
  }

  // Error / loading states
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
        {/* Actions bar */}
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
              onClick={() => window.print()}
              className="bg-white text-navy px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-bold"
            >
              🖨️ طباعة
            </button>
          </div>
        </div>

        {/* Audio Player */}
        <div className="no-print mb-6">
          <AudioPlayer orderId={id} audioUrl={story.audio_url} audioStatus={story.audio_status} />
        </div>

        {/* Generate illustrations button */}
        {!hasIllustrations && (
          <div className="no-print mb-6">
            <StoryIllustrations
              orderId={id}
              illustrations={story.illustrations}
              illustrationsStatus={story.illustrations_status}
            />
          </div>
        )}

        {/* ═══ Interactive Flip Book (screen only) ═══ */}
        <div className="no-print book-scene">
          <div className="book-wrapper">
            {bookPages.map((page, i) => (
              <div
                key={i}
                className={`book-leaf${isPageTurned(i) ? ' turned' : ''}${i === 0 ? ' cover-leaf' : ''}${i === 0 && currentPage === 0 && animatingPage === null ? ' cover-closed' : ''}`}
                style={{ zIndex: getPageZIndex(i) }}
                onClick={i === currentPage ? flipForward : undefined}
              >
                <div className="leaf-front">
                  {renderPageContent(page)}
                </div>
                <div className="leaf-back">
                  <div className="leaf-back-pattern">
                    <div className="back-pattern-border">
                      <div className="back-pattern-inner"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation controls */}
          {currentPage > 0 && (
            <div className="book-nav">
              <button
                onClick={flipBack}
                disabled={animatingPage !== null || currentPage <= 0}
                className="book-nav-btn"
              >
                → السابق
              </button>
              <span className="book-nav-counter">
                {currentPage} / {totalPages - 2}
              </span>
              <button
                onClick={flipForward}
                disabled={animatingPage !== null || currentPage >= totalPages - 1}
                className="book-nav-btn"
              >
                التالي ←
              </button>
            </div>
          )}
        </div>

        {/* ═══ Print version (hidden on screen) ═══ */}
        <div className="print-book">
          {/* Cover */}
          <div className="print-cover">
            <div className="text-6xl mb-4">{wishIcon}</div>
            <h1 className="font-amiri text-4xl font-bold text-navy">{story.story_title || `قصة ${story.child_name}`}</h1>
            <p className="font-amiri text-xl text-sage mt-2">{story.child_name}</p>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full mt-4"></div>
            {story.story_moral && (
              <p className="font-amiri text-lg text-navy mt-4 italic">« {story.story_moral} »</p>
            )}
          </div>

          {/* Content pages */}
          {paragraphs.map((para, idx) => {
            const paraIlls = illustrationsByParagraph[idx] || []
            return (
              <div key={idx} className="print-page">
                {paraIlls.length > 0 ? (
                  <div className="print-spread">
                    <div className="print-text-col">
                      <p className="font-amiri text-xl leading-loose text-navy">{para.trim()}</p>
                    </div>
                    <div className="print-img-col">
                      {paraIlls.map((ill, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={ill.image_url}
                          alt="رسمة من القصة"
                          className="print-img"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="print-text-only">
                    <p className="font-amiri text-xl leading-loose text-navy">{para.trim()}</p>
                  </div>
                )}
              </div>
            )
          })}

          {/* End */}
          <div className="print-endpage">
            <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-4"></div>
            <span className="font-amiri text-gold text-3xl">✨ النهاية ✨</span>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full mt-4"></div>
          </div>
        </div>

        {/* Bottom CTA */}
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
