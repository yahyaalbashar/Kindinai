import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import StoryForm from '../components/StoryForm'
import PaymentForm from '../components/PaymentForm'
import LoadingAnimation from '../components/LoadingAnimation'
import api from '../api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function CreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=form, 2=payment
  const [formData, setFormData] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const handleFormSubmit = async (data) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post('/api/create-payment-intent/', data)
      setFormData(data)
      setOrderId(response.data.order_id)
      setClientSecret(response.data.client_secret)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ. حاول مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    setIsGenerating(true)
    setError(null)
    try {
      await api.post('/api/generate-story/', { order_id: orderId })
      navigate(`/story/${orderId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في إنشاء القصة.')
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return <LoadingAnimation childName={formData?.child_name || ''} />
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-sage hover:text-forest transition-colors mb-4 inline-block">
            ← الرئيسية
          </Link>
          <h1 className="font-amiri text-3xl font-bold text-navy">
            {step === 1 ? 'أخبرنا عن طفلك' : 'أكمل الدفع'}
          </h1>
          <p className="text-sage mt-2">
            {step === 1 ? 'أجب عن هذه الأسئلة البسيطة لنصنع قصة مخصصة' : '٣ دولارات فقط لقصة فريدة'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-forest text-cream' : 'bg-cream-dark text-sage'}`}>
            ١
          </div>
          <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-forest' : 'bg-cream-dark'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-forest text-cream' : 'bg-cream-dark text-sage'}`}>
            ٢
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center mb-6">
            {error}
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
          {step === 1 && (
            <StoryForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          )}

          {step === 2 && clientSecret && (
            <>
              {/* Order summary */}
              <div className="bg-cream rounded-xl p-4 mb-6">
                <p className="text-navy font-bold mb-1">ملخص الطلب</p>
                <p className="text-sage">قصة نوم مخصصة لـ {formData?.child_name}</p>
                <p className="text-forest font-bold mt-2">المبلغ: ٣.٠٠ دولار</p>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  locale: 'ar',
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#1B4332',
                      fontFamily: 'Cairo, sans-serif',
                      borderRadius: '12px',
                    },
                  },
                }}
              >
                <PaymentForm onPaymentSuccess={handlePaymentSuccess} />
              </Elements>

              <button
                onClick={() => setStep(1)}
                className="w-full mt-4 text-sage hover:text-navy transition-colors text-center py-2"
              >
                ← العودة للنموذج
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreatePage
