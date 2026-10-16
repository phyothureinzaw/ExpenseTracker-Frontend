import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError, onUnauthorized } from '../api/apiClient'
import {
  clearStoredSession,
  isSessionExpired,
  readStoredSession,
  writeStoredSession,
} from './sessionStorage'
import { AuthContext } from './AuthContext'

function toSession(response) {
  if (
    !response ||
    typeof response.accessToken !== 'string' ||
    response.accessToken.length === 0 ||
    typeof response.expiresAtUtc !== 'string' ||
    !Number.isFinite(Date.parse(response.expiresAtUtc)) ||
    !response.user ||
    typeof response.user.id !== 'string' ||
    typeof response.user.email !== 'string'
  ) {
    throw new ApiError('The API returned an invalid authentication response.', { status: 502 })
  }

  return {
    accessToken: response.accessToken,
    expiresAtUtc: response.expiresAtUtc,
    user: {
      id: response.user.id,
      email: response.user.email,
    },
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [authState, setAuthState] = useState(() => {
    const storedSession = readStoredSession()
    return {
      status: storedSession && !isSessionExpired(storedSession)
        ? 'loading'
        : 'unauthenticated',
      session: storedSession && !isSessionExpired(storedSession) ? storedSession : null,
      warning: null,
    }
  })
  const authStateRef = useRef(authState)
  const clearSessionRef = useRef(() => {})
  const validateSessionRef = useRef(async () => {})

  const updateAuthState = useCallback((nextState) => {
    authStateRef.current = nextState
    setAuthState(nextState)
  }, [])

  const clearSession = useCallback(() => {
    const previousSession = authStateRef.current.session
    clearStoredSession()
    queryClient.clear()
    updateAuthState({ status: 'unauthenticated', session: null, warning: null })
    return previousSession
  }, [queryClient, updateAuthState])

  const validateSession = useCallback(async (session, { startup = false } = {}) => {
    if (!session) {
      return
    }

    if (isSessionExpired(session)) {
      clearSessionRef.current()
      return
    }

    try {
      const currentUser = await apiFetch('/api/auth/me', { token: session.accessToken })
      if (
        !currentUser ||
        typeof currentUser.id !== 'string' ||
        typeof currentUser.email !== 'string'
      ) {
        throw new ApiError('The API returned an invalid current-user response.', { status: 502 })
      }
      const validatedSession = {
        ...session,
        user: currentUser,
      }
      writeStoredSession(validatedSession)
      updateAuthState({ status: 'authenticated', session: validatedSession, warning: null })
    } catch (error) {
      if (error.status === 401) {
        clearSessionRef.current()
        return
      }

      updateAuthState({
        status: startup ? 'authenticated' : authStateRef.current.status,
        session,
        warning: 'The session is saved, but the API is temporarily unavailable.',
      })
    }
  }, [updateAuthState])

  const retrySessionValidation = useCallback(async () => {
    const session = authStateRef.current.session
    if (!session) {
      return
    }

    updateAuthState({
      status: 'authenticated',
      session,
      warning: 'Checking your session...',
    })
    await validateSession(session)
  }, [updateAuthState, validateSession])

  useEffect(() => {
    clearSessionRef.current = clearSession
    validateSessionRef.current = validateSession
  }, [clearSession, validateSession])

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      if (authStateRef.current.session) {
        clearSessionRef.current()
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false
    const storedSession = authStateRef.current.session

    if (!storedSession || isSessionExpired(storedSession)) {
      clearStoredSession()
      return () => {
        cancelled = true
      }
    }

    validateSession(storedSession, { startup: true }).then(() => {
      if (cancelled) {
        return
      }
    })

    return () => {
      cancelled = true
    }
  }, [validateSession])

  useEffect(() => {
    const session = authState.session
    if (!session) {
      return undefined
    }

    const expirationDelay = Math.max(0, Date.parse(session.expiresAtUtc) - Date.now())
    const expirationTimer = window.setTimeout(() => {
      clearSessionRef.current()
    }, Math.min(expirationDelay, 2_147_000_000))

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSessionRef.current(authStateRef.current.session)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearTimeout(expirationTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authState.session, authState.session?.accessToken, authState.session?.expiresAtUtc])

  async function login(credentials) {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
      auth: false,
    })
    const session = toSession(response)
    const previousSession = authStateRef.current.session

    if (previousSession && previousSession.user.id !== session.user.id) {
      queryClient.clear()
    }

    writeStoredSession(session)
    updateAuthState({ status: 'authenticated', session, warning: null })
    return session
  }

  async function register(credentials) {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: credentials,
      auth: false,
    })
    const session = toSession(response)
    const previousSession = authStateRef.current.session

    if (previousSession && previousSession.user.id !== session.user.id) {
      queryClient.clear()
    }

    writeStoredSession(session)
    updateAuthState({ status: 'authenticated', session, warning: null })
    return session
  }

  function logout() {
    clearSessionRef.current()
  }

  const value = {
    status: authState.status,
    session: authState.session,
    user: authState.session?.user ?? null,
    warning: authState.warning,
    isAuthenticated: authState.status === 'authenticated',
    login,
    register,
    logout,
    retrySessionValidation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
