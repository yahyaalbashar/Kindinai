import { useState } from 'react'
import api from '../api'

function StoryIllustrations({ orderId, illustrations: initialIllustrations, illustrationsStatus: initialStatus }) {
  const [illustrations, setIllustrations] = useState(initialIllustrations || [])
  const [status, setStatus] = useState(initialStatus || 'pending')
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setStatus('generating')
    setError(null)
    try {
      const response = await api.post('/api/generate-illustrations/', { order_id: orderId })
      setIllustrations(response.data.illustrations)
      setStatus('completed')
    } catch (err) {
      setError(err.response?.data?.error || 'فشل في إنشاء الرسومات')
      setStatus('failed')
    }
  }

  if (status === 'pending' || (!illustrations.length && status !== 'generating')) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md text-center">
        <button
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="bg-gold text-navy px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {status === 'generating' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              جاري إنشاء الرسومات...
            </span>
          ) : (
            '🎨 أنشئ رسومات للقصة'
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
        <div className="flex items-center justify-center gap-2 text-sage">
          <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="font-bold">جاري إنشاء الرسومات... قد يستغرق دقيقة</span>
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
          className="bg-gold text-navy px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {illustrations.map((ill, index) => (
        <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md">
          <img
            src={ill.image_url}
            alt={`رسمة ${index + 1} من القصة`}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  )
}

export default StoryIllustrations
