import { Link, useLocation } from 'react-router-dom'
import { Activity, Users, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const isManagerView = location.pathname.startsWith('/manager')

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <Activity size={20} />
          </div>
          <div className="navbar-title">
            Dev<span>Pulse</span>
          </div>
        </Link>
        <div className="navbar-nav">
          <Link
            to="/"
            className={`nav-link ${!isManagerView ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} />
            IC View
          </Link>
          <Link
            to="/manager/MGR-01"
            className={`nav-link ${isManagerView ? 'active' : ''}`}
          >
            <Users size={16} />
            Manager View
          </Link>
        </div>
      </div>
    </nav>
  )
}
