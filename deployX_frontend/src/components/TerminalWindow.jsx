import './TerminalWindow.css'

const LINES = [
  { type: 'command', text: 'deployx connect github.com/alex/demoshop' },
  { type: 'success', text: 'Repository cloned in 1.8s' },
  { type: 'success', text: 'Detected: React 18, Spring Boot, PostgreSQL' },
  { type: 'command', text: 'deployx deploy --env production' },
  { type: 'pending', text: 'Building Docker images...' },
  { type: 'success', text: 'Images pushed to registry' },
  { type: 'success', text: 'Deployed in 2m 31s — https://demoshop.deployx.app' },
]

function LinePrefix({ type }) {
  if (type === 'command') return <span className="term-line__prefix term-line__prefix--cmd">$</span>
  if (type === 'success') return <span className="term-line__prefix term-line__prefix--ok">✓</span>
  return <span className="term-line__prefix term-line__prefix--pending">●</span>
}

export default function TerminalWindow() {
  return (
    <div className="terminal" role="img" aria-label="Terminal showing a DeployX deployment completing in 2 minutes 31 seconds">
      <div className="terminal__titlebar">
        <div className="terminal__dots">
          <span className="terminal__dot terminal__dot--red" />
          <span className="terminal__dot terminal__dot--yellow" />
          <span className="terminal__dot terminal__dot--green" />
        </div>
        <span className="terminal__title">deployx — terminal</span>
        <span className="terminal__live">
          <span className="terminal__live-dot" />
          live
        </span>
      </div>

      <div className="terminal__body">
        {LINES.map((line, i) => (
          <p className={`term-line term-line--${line.type}`} key={i}>
            <LinePrefix type={line.type} />
            <span className="term-line__text">{line.text}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
