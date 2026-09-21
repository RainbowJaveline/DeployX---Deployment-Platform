import HeroPanel from '../components/HeroPanel'
import LoginCard from '../components/LoginCard'
import StarField from '../components/StarField'
import '../App.css'

export default function Login() {
  return (
    <main className="page">
      <StarField />
      <div className="page__grid">
        <HeroPanel />
        <LoginCard />
      </div>
    </main>
  )
}
