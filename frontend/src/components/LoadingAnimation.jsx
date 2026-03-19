function LoadingAnimation({ childName }) {
  return (
    <div className="fixed inset-0 bg-cream bg-opacity-95 flex items-center justify-center z-50">
      <div className="text-center max-w-md px-6">
        {/* Animated stars */}
        <div className="relative h-32 mb-8">
          <span className="absolute text-5xl animate-float" style={{ right: '20%', animationDelay: '0s' }}>⭐</span>
          <span className="absolute text-4xl animate-float" style={{ right: '50%', animationDelay: '0.5s' }}>🌙</span>
          <span className="absolute text-5xl animate-float" style={{ right: '75%', animationDelay: '1s' }}>✨</span>
        </div>

        <h2 className="font-amiri text-3xl text-navy font-bold mb-4 animate-shimmer">
          نكتب قصة {childName} الآن...
        </h2>

        <p className="text-lavender text-lg mb-8">
          قد يستغرق هذا بضع ثوانٍ
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-sky rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingAnimation
