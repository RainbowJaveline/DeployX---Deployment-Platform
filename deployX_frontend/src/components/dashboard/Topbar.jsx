import { Search, Bell, Plus } from 'lucide-react'
import './Topbar.css'

export default function Topbar({ title = 'Dashboard', onNewDeployment }) {
  return (
    <header className="topbar">
      <h1 className="topbar__title">{title}</h1>

      <div className="topbar__actions">
        <label className="topbar__search">
          <Search size={16} strokeWidth={2} />
          <input type="text" placeholder="Search..." />
        </label>

        <button type="button" className="topbar__icon-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={2} />
          <span className="topbar__icon-dot" />
        </button>

        <button type="button" className="topbar__cta" onClick={onNewDeployment}>
          <Plus size={16} strokeWidth={2.4} />
          New Deployment
        </button>
      </div>
    </header>
  )
}
