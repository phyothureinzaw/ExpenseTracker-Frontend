import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, getApiFieldError } from '../api/apiClient'
import { useAuth } from '../auth/useAuth'
import { getSafeRedirectPath } from '../auth/redirects'

const initialForm = { email: '', password: '' }

function validateForm(form) {
  const errors = {}
  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!form.password) {
    errors.password = 'Password is required.'
  }
  return errors
}

function FieldError({ children }) {
  return <span className="field-error" role="alert">{children}</span>
}

export function LoginPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setServerError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const clientErrors = validateForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setServerError(null)
    try {
      await login({ email: form.email.trim(), password: form.password })
      navigate(getSafeRedirectPath(location.state), { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          email: getApiFieldError(error, 'email'),
          password: getApiFieldError(error, 'password'),
        })
        setServerError(error.message)
      } else {
        setServerError('Login could not be completed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <span className="eyebrow">Personal finance</span>
        <h1>Know where your money goes.</h1>
        <p>Sign in to keep your categories, expenses, and budgets in one calm place.</p>
      </section>
      <section className="auth-card" aria-labelledby="login-title">
         <div className="card-kicker">Welcome back</div>
        <h2 id="login-title">Sign in</h2>
        <p className="card-copy">Your expense log is waiting.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className={`text-input ${errors.email ? 'has-error' : ''}`}
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            autoCapitalize="none"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && <span id="login-email-error"><FieldError>{errors.email}</FieldError></span>}

          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className={`text-input ${errors.password ? 'has-error' : ''}`}
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
          {errors.password && <span id="login-password-error"><FieldError>{errors.password}</FieldError></span>}

          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  )
}
