export const SESSION_STORAGE_KEY = 'expense-tracker-session'

function isUser(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.email === 'string' &&
    value.email.length > 0
  )
}

export function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const value = JSON.parse(raw)
    if (
      !value ||
      typeof value !== 'object' ||
      typeof value.accessToken !== 'string' ||
      value.accessToken.length === 0 ||
      typeof value.expiresAtUtc !== 'string' ||
      !Number.isFinite(Date.parse(value.expiresAtUtc)) ||
      !isUser(value.user)
    ) {
      return null
    }

    return {
      accessToken: value.accessToken,
      expiresAtUtc: value.expiresAtUtc,
      user: {
        id: value.user.id,
        email: value.user.email,
      },
    }
  } catch {
    return null
  }
}

export function writeStoredSession(session) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    throw new Error('This browser could not save the current session.')
  }
}

export function clearStoredSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function isSessionExpired(session) {
  return Date.parse(session.expiresAtUtc) <= Date.now()
}

export function getStoredAccessToken() {
  return readStoredSession()?.accessToken ?? null
}
