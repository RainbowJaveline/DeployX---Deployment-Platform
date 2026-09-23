import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import WelcomeBanner from '../components/dashboard/WelcomeBanner'
import StatsGrid from '../components/dashboard/StatsGrid'
import RecentDeployments from '../components/dashboard/RecentDeployments'
import SystemHealth from '../components/dashboard/SystemHealth'
import { getStoredName, firstNameOf } from '../utils/user'
import './Dashboard.css'

export default function Dashboard() {
  const [firstName, setFirstName] = useState('there')

  const navigate = useNavigate()
  
  useEffect(() => {
    const stored = getStoredName()
    const first = firstNameOf(stored)
    if (first) setFirstName(first)
  }, [])

  function handleNewDeployment() {
  navigate('/new-deployment')
}

  return (
    <div className="dashboard">
      <Sidebar userName={firstName} />

      <div className="dashboard__content">
        <Topbar title="Dashboard" onNewDeployment={handleNewDeployment} />

        <main className="dashboard__main">
          <WelcomeBanner name={firstName} onNewDeployment={handleNewDeployment} />
          <StatsGrid />

          <div className="dashboard__lower-grid">
            <RecentDeployments />
            <SystemHealth />
          </div>
        </main>
      </div>
    </div>
  )
}
