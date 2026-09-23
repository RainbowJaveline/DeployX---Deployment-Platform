import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoredName, setStoredName, nameFromEmail } from '../utils/user'
import './LoginCard.css'

export default function LoginCard() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Enter your email and password to continue.')
      return
    }

    setIsSubmitting(true)
    // Replace with a real authentication call.
    try {
    const response = await fetch(
        'http://localhost:8082/api/v1.0/login',
        {
            method : 'POST',
            headers : {
                'Content-type' : 'application/json'
                },
            credentials : 'include',
            body : JSON.stringify({
                email : email,
                password : password,
                }),
            }
        )

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Unable to create account.')
            return
          }
      console.log('Login successful:', data)
      setStoredName(nameFromEmail(data.email))
      navigate('/dashboard')

        } catch (error) {
          console.error(error)
          setError('Unable to connect to the server.')
        } finally {
          setIsSubmitting(false)
        }
    }


  function handleGithubSignIn() {
    // this is the oauth2 redirect to the spring backend
    window.location.href = 'http://localhost:8082/api/v1.0/oauth2/authorization/github'

  }

  return (
    <div className="login-card">
      <div className="login-card__header">
        <h2 className="login-card__title">Welcome back</h2>
        <p className="login-card__subtitle">Sign in to your account to continue.</p>
      </div>

      <form className="login-card__form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="field__input"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <div className="field__row">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <a className="field__link" href="#forgot-password">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            className="field__input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="login-card__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="login-card__divider">
        <span>or</span>
      </div>

      <button type="button" className="btn btn--github" onClick={handleGithubSignIn}>
        <GithubIcon />
        Continue with GitHub
      </button>

      <p className="login-card__footer">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="field__link">
          Create account
        </Link>
      </p>
    </div>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55C20.21 21.38 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  )
}
