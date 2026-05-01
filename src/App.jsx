import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import DeveloperSelector from './pages/DeveloperSelector'
import ICProfile from './pages/ICProfile'
import ManagerSummary from './pages/ManagerSummary'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DeveloperSelector />} />
          <Route path="/developer/:id" element={<ICProfile />} />
          <Route path="/manager/:id" element={<ManagerSummary />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
