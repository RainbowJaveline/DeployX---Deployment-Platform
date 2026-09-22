import Logo from './Logo'
import StatsRow from './StatsRow'
import TerminalWindow from './TerminalWindow'
import './HeroPanel.css'

export default function HeroPanel() {
  return (
    <section className="hero-panel">
      <Logo />

      <div className="hero-panel__copy">
        <h1 className="hero-panel__heading">
          Ship code.
          <br />
          Not infrastructure.
        </h1>
        <p className="hero-panel__subheading">
          Deploy full-stack apps from GitHub in minutes — zero DevOps
          knowledge required.
        </p>
      </div>

      <StatsRow />

      <TerminalWindow />
    </section>
  )
}
