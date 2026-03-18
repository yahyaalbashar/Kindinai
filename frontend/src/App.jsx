import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CreatePage from './pages/CreatePage'
import StoryPage from './pages/StoryPage'

function App() {
  return (
    <div className="min-h-screen bg-cream font-cairo">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/story/:id" element={<StoryPage />} />
      </Routes>
    </div>
  )
}

export default App
