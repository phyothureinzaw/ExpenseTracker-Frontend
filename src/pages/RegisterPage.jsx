import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getApiFieldError } from '../api/apiClient'
import { useAuth } from '../auth/useAuth'

const initialForm = { email: '', password: '', confirmPassword: '' }

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
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords must match.'
  }
  return errors
}

function FieldError({ children }) {
  return <span className="field-error" role="alert">{children}</span>
}

export function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
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
      await register({
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          email: getApiFieldError(error, 'email'),
          password: getApiFieldError(error, 'password'),
          confirmPassword: getApiFieldError(error, 'confirmPassword'),
        })
        setServerError(error.message)
      } else {
        setServerError('Registration could not be completed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page auth-page-register">
      <section className="auth-intro">
         <span className="eyebrow">A small start</span>
        <h1>Give your spending a home.</h1>
        <p>One account keeps your personal finance notes private and organized.</p>
      </section>
      <section className="auth-card" aria-labelledby="register-title">
         <div className="card-kicker">Get started</div>
        <h2 id="register-title">Create your account</h2>
        <p className="card-copy">You can add categories and expenses next.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            className={`text-input ${errors.email ? 'has-error' : ''}`}
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            autoCapitalize="none"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
          {errors.email && <span id="register-email-error"><FieldError>{errors.email}</FieldError></span>}

          <label className="field-label" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            className={`text-input ${errors.password ? 'has-error' : ''}`}
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'register-password-error' : 'password-policy'}
          />
          <p className="password-policy" id="password-policy">
            At least 8 characters, with uppercase, lowercase, a number, and a symbol.
          </p>
          {errors.password && <span id="register-password-error"><FieldError>{errors.password}</FieldError></span>}

          <label className="field-label" htmlFor="register-confirm-password">Confirm password</label>
          <input
            id="register-confirm-password"
            className={`text-input ${errors.confirmPassword ? 'has-error' : ''}`}
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={updateField}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
          />
          {errors.confirmPassword && <span id="register-confirm-password-error"><FieldError>{errors.confirmPassword}</FieldError></span>}

          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  )
}
