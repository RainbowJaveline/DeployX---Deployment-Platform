import { LayoutGrid, Layers, Rocket, Activity, Settings, HelpCircle, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../Logo'
import { clearStoredName } from '../../utils/user'
import './Sidebar.css'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
  { label: 'Projects', icon: Layers, path: '/projects' },
  { label: 'Deployments', icon: Rocket },
  { label: 'Monitoring', icon: Activity },
]

export default function Sidebar({ userName = 'there' }) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    clearStoredName()
    navigate('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Logo />
        <span className="sidebar__version">v2</span>
      </div>

      <nav className="sidebar__nav" aria-label="Primary">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            type="button"
            className={`sidebar__link${path && location.pathname === path ? ' sidebar__link--active' : ''}`}
            onClick={path ? () => navigate(path) : undefined}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__link">
          <Settings size={18} strokeWidth={2} />
          Settings
        </button>
        <button type="button" className="sidebar__link">
          <HelpCircle size={18} strokeWidth={2} />
          Help &amp; Docs
        </button>

        <div className="sidebar__user">
          <span className="sidebar__avatar">{userName.charAt(0).toUpperCase()}</span>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{userName}</span>
            <span className="sidebar__user-plan">Pro plan</span>
          </div>
        </div>

        <button type="button" className="sidebar__link sidebar__link--logout" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  )
}
