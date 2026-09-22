import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HeroPanel from '../components/HeroPanel'
import StarField from '../components/StarField'
import { setStoredName } from '../utils/user'
import '../components/LoginCard.css'
import '../App.css'

export default function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!name || !email || !password || !confirmPassword) {
      setError('Fill in every field to create your account.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)

    try {
      const response = await fetch(
        'http://localhost:8082/api/v1.0/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Unable to create account.')
        return
      }

      setStoredName(data.name)

      navigate('/')
    } catch (error) {
      setError('Unable to connect to the server.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleGithubSignUp() {
    // Replace with your real GitHub OAuth redirect.
    console.log('Continue with GitHub')
  }

  return (
    <main className="page">
      <StarField />
      <div className="page__grid">
        <HeroPanel />
        <div className="login-card">
      <div className="login-card__header">
        <h2 className="login-card__title">Create your account</h2>
        <p className="login-card__subtitle">Start deploying in minutes — no card required.</p>
      </div>

      <form className="login-card__form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            className="field__input"
            placeholder="Shraddha Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            className="field__input"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            className="field__input"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            className="field__input"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="login-card__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <div className="login-card__divider">
        <span>or</span>
      </div>

      <button type="button" className="btn btn--github" onClick={handleGithubSignUp}>
        <GithubIcon />
        Continue with GitHub
      </button>

      <p className="login-card__footer">
        Already have an account?{' '}
        <Link to="/" className="field__link">
          Sign in
        </Link>
      </p>
        </div>
      </div>
    </main>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55C20.21 21.38 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  )
}
