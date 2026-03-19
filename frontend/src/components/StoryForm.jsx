import { useState } from 'react'

const WISH_OPTIONS = [
  { value: 'brave', label: 'شجاع' },
  { value: 'kind', label: 'طيب القلب' },
  { value: 'smart', label: 'ذكي' },
  { value: 'curious', label: 'فضولي ومحب للاكتشاف' },
  { value: 'strong', label: 'قوي' },
]

const THEME_OPTIONS = [
  { value: 'adventure', label: 'مغامرة في الغابة' },
  { value: 'magic', label: 'عالم سحري' },
  { value: 'animals', label: 'مملكة الحيوانات' },
  { value: 'space', label: 'رحلة إلى الفضاء' },
  { value: 'ocean', label: 'أعماق البحر' },
]

function StoryForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    child_name: '',
    child_age: '',
    child_gender: 'boy',
    favorite_animal: '',
    wish: 'brave',
    theme: 'adventure',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...formData, child_age: parseInt(formData.child_age) })
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-cream-dark bg-white text-navy font-cairo text-lg focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
  const labelClass = "block text-navy font-bold mb-2 text-lg"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>اسم الطفل</label>
        <input
          type="text"
          name="child_name"
          value={formData.child_name}
          onChange={handleChange}
          placeholder="مثال: أحمد"
          className={inputClass}
          required
          maxLength={100}
        />
      </div>

      <div>
        <label className={labelClass}>عمر الطفل</label>
        <input
          type="number"
          name="child_age"
          value={formData.child_age}
          onChange={handleChange}
          min={3}
          max={10}
          placeholder="٣ - ١٠ سنوات"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>الجنس</label>
        <div className="flex gap-4">
          <label className={`flex-1 text-center py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.child_gender === 'boy' ? 'border-sky bg-sky text-white' : 'border-cream-dark bg-white text-navy hover:border-lavender'}`}>
            <input
              type="radio"
              name="child_gender"
              value="boy"
              checked={formData.child_gender === 'boy'}
              onChange={handleChange}
              className="sr-only"
            />
            <span className="text-lg font-bold">ولد 👦</span>
          </label>
          <label className={`flex-1 text-center py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.child_gender === 'girl' ? 'border-bubblegum bg-bubblegum text-white' : 'border-cream-dark bg-white text-navy hover:border-lavender'}`}>
            <input
              type="radio"
              name="child_gender"
              value="girl"
              checked={formData.child_gender === 'girl'}
              onChange={handleChange}
              className="sr-only"
            />
            <span className="text-lg font-bold">بنت 👧</span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>الحيوان المفضل</label>
        <input
          type="text"
          name="favorite_animal"
          value={formData.favorite_animal}
          onChange={handleChange}
          placeholder="مثال: أسد، قطة، حصان"
          className={inputClass}
          required
          maxLength={100}
        />
      </div>

      <div>
        <label className={labelClass}>أتمنى أن يكون طفلي...</label>
        <select
          name="wish"
          value={formData.wish}
          onChange={handleChange}
          className={inputClass}
        >
          {WISH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>موضوع القصة</label>
        <select
          name="theme"
          value={formData.theme}
          onChange={handleChange}
          className={inputClass}
        >
          {THEME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-sky text-white py-4 rounded-xl text-xl font-bold hover:bg-sky-dark transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'جاري التحضير...' : 'متابعة للدفع'}
      </button>
    </form>
  )
}

export default StoryForm
