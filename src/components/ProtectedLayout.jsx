import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Icon } from './ui'

const navigation = [
  { to: '/', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/expenses', label: 'Expenses', icon: 'receipt' },
  { to: '/budgets', label: 'Budgets', icon: 'wallet' },
  { to: '/categories', label: 'Categories', icon: 'tags' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/recurring', label: 'Recurring', icon: 'calendar' },
]

export function ProtectedLayout() {
  const { logout, retrySessionValidation, user, warning } = useAuth()
  const navigate = useNavigate()
  const menuButtonRef = useRef(null)
  const firstNavRef = useRef(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstNavRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileNavOpen])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? 'U'

  async function handleRetrySession() {
    setIsRetrying(true)
    await retrySessionValidation()
    setIsRetrying(false)
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button
          ref={menuButtonRef}
          className="icon-button mobile-menu-button"
          type="button"
          aria-label="Open navigation"
          aria-expanded={isMobileNavOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMobileNavOpen(true)}
        >
          <Icon name="menu" />
        </button>
        <Link className="mobile-brand" to="/">Expense Tracker</Link>
        <span className="user-avatar" aria-hidden="true">{userInitial}</span>
      </header>
      {isMobileNavOpen && <button className="drawer-backdrop" type="button" aria-label="Close navigation" onClick={() => setIsMobileNavOpen(false)} />}
      <aside id="primary-navigation" className={`app-sidebar ${isMobileNavOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-brand-row">
          <Link className="brand" to="/" onClick={() => setIsMobileNavOpen(false)}>
            <span className="brand-mark" aria-hidden="true">E</span>
            <span>Expense Tracker</span>
          </Link>
          <button className="icon-button sidebar-close" type="button" aria-label="Close navigation" onClick={() => setIsMobileNavOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="sidebar-section-label">Your money</div>
        <nav className="sidebar-nav">
          {navigation.map((item, index) => (
            <NavLink
              key={item.to}
              ref={index === 0 ? firstNavRef : undefined}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileNavOpen(false)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-account">
          <div className="account-avatar" aria-hidden="true">{userInitial}</div>
          <div className="account-copy">
            <strong>{user.email}</strong>
            <span>Personal account</span>
          </div>
          <button className="icon-button account-logout" type="button" aria-label="Log out" onClick={handleLogout}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>
      <div className="app-main">
      {warning && (
        <div className="session-warning" role="status">
          <span>{warning}</span>
          <button className="button button-quiet button-small" type="button" onClick={handleRetrySession} disabled={isRetrying}>
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}
      <Outlet />
      </div>
    </div>
  )
}
