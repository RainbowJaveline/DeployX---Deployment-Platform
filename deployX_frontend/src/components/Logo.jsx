import './Logo.css'

export default function Logo() {
  return (
    <div className="logo">
      <span className="logo__mark" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M12 2.5V21.5M3.5 7.5L12 12L20.5 7.5"
            stroke="#6d5ef0"
            strokeWidth="1"
          />
        </svg>
      </span>
      <span className="logo__name">DeployX</span>
    </div>
  )
}
