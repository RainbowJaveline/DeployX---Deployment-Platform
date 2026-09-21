import { Plus } from 'lucide-react'
import './WelcomeBanner.css'

export default function WelcomeBanner({ name = 'there', onNewDeployment }) {
  const greeting = getGreeting()

  return (
    <section className="welcome-banner">
      <div className="welcome-banner__copy">
        <span className="welcome-banner__status">
          <span className="welcome-banner__status-dot" />
          All systems operational
        </span>
        <h2 className="welcome-banner__heading">
          {greeting}, {name}
        </h2>
        <p className="welcome-banner__subtext">Here&apos;s what&apos;s happening with your applications.</p>
      </div>

      <button type="button" className="welcome-banner__cta" onClick={onNewDeployment}>
        <Plus size={16} strokeWidth={2.4} />
        New Deployment
      </button>
    </section>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
