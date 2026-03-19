import { useState } from 'react'
import api from '../api'

function StoryIllustrations({ orderId, illustrations: initialIllustrations, illustrationsStatus: initialStatus }) {
  const [status, setStatus] = useState(initialStatus || 'pending')
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setStatus('generating')
    setError(null)
    try {
      await api.post('/api/generate-illustrations/', { order_id: orderId })
      // Reload the page to show illustrations inline with paragraphs
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.error || 'فشل في إنشاء الرسومات')
      setStatus('failed')
    }
  }

  if (status === 'completed') {
    return null
  }

  if (status === 'generating') {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md text-center">
        <div className="flex items-center justify-center gap-2 text-lavender">
          <span className="w-5 h-5 border-2 border-bubblegum border-t-transparent rounded-full animate-spin" />
          <span className="font-bold">جاري إنشاء الرسومات... قد يستغرق بضع دقائق</span>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md text-center">
        <p className="text-red-600 mb-3">{error || 'فشل في إنشاء الرسومات'}</p>
        <button
          onClick={handleGenerate}
          className="bg-bubblegum text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-md text-center">
      <button
        onClick={handleGenerate}
        className="bg-bubblegum text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
      >
        🎨 أنشئ رسومات للقصة
      </button>
    </div>
  )
}

export default StoryIllustrations
