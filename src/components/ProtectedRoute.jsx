import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getSafeRedirectPath } from '../auth/redirects'
import { AuthLoading } from './RouteStates'

export function ProtectedRoute() {
  const { isAuthenticated, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <AuthLoading />
  }

  if (isAuthenticated) {
    return <Navigate to={getSafeRedirectPath(location.state)} replace />
  }

  return <Outlet />
}
