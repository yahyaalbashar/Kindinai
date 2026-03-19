import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-6 pt-16 pb-20 text-center max-w-3xl mx-auto">
        <div className="text-6xl mb-6">✨</div>
        <h1 className="font-amiri text-4xl md:text-5xl lg:text-6xl font-bold text-navy leading-tight mb-6">
          قصة نوم لطفلك، فيها هو البطل
        </h1>
        <p className="text-lg md:text-xl text-lavender mb-10 leading-relaxed max-w-xl mx-auto">
          أدخل اسم طفلك واحصل على قصة عربية جميلة ومخصصة له في دقيقة واحدة
        </p>
        <Link
          to="/create"
          className="inline-block bg-sky text-white px-10 py-4 rounded-xl text-xl font-bold hover:bg-sky-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          ابدأ الآن — ٣ دولار فقط
        </Link>
      </section>

      {/* Value Props */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="font-bold text-xl text-navy mb-3">قصة فريدة لطفلك وحده</h3>
            <p className="text-lavender leading-relaxed">
              كل قصة مكتوبة خصيصًا لطفلك باسمه وشخصيته المميزة
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="font-bold text-xl text-navy mb-3">بالعربية الفصحى الجميلة</h3>
            <p className="text-lavender leading-relaxed">
              لغة عربية سليمة وبسيطة تناسب عمر طفلك وتثري مخزونه اللغوي
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-bold text-xl text-navy mb-3">جاهزة في أقل من دقيقة</h3>
            <p className="text-lavender leading-relaxed">
              أجب عن بضعة أسئلة واحصل على قصة نوم مخصصة فورًا
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <h2 className="font-amiri text-3xl font-bold text-navy mb-10">كيف تعمل؟</h2>
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white rounded-xl p-6 shadow-sm">
            <span className="bg-sky text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">١</span>
            <p className="text-lg text-navy">أدخل اسم طفلك وبعض التفاصيل البسيطة</p>
          </div>
          <div className="flex items-center gap-4 bg-white rounded-xl p-6 shadow-sm">
            <span className="bg-bubblegum text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">٢</span>
            <p className="text-lg text-navy">ادفع ٣ دولارات فقط</p>
          </div>
          <div className="flex items-center gap-4 bg-white rounded-xl p-6 shadow-sm">
            <span className="bg-mint text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">٣</span>
            <p className="text-lg text-navy">احصل على قصة نوم جميلة ومخصصة لطفلك</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 pb-16 text-center">
        <Link
          to="/create"
          className="inline-block bg-bubblegum text-white px-10 py-4 rounded-xl text-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
        >
          اصنع القصة الآن
        </Link>
        <p className="mt-4 text-lavender text-sm">لا حاجة لإنشاء حساب</p>
      </section>
    </div>
  )
}

export default LandingPage
