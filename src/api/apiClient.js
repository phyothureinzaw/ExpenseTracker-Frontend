import { getStoredAccessToken } from '../auth/sessionStorage'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const unauthorizedListeners = new Set()

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, fieldErrors = {}, isNetworkError = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.isNetworkError = isNetworkError
  }
}

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener())
}

function normalizeFieldErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String) : [String(value)],
    ]),
  )
}

async function readResponseBody(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiFetch(
  path,
  { method = 'GET', body, token, auth = true, signal, headers = {} } = {},
) {
  if (!apiBaseUrl) {
    throw new ApiError('VITE_API_BASE_URL is not configured.')
  }

  const currentToken = token ?? (auth ? getStoredAccessToken() : null)
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (currentToken) {
    requestHeaders.Authorization = `Bearer ${currentToken}`
  }

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new ApiError('The API could not be reached.', { isNetworkError: true })
  }

  const responseBody = await readResponseBody(response)
  if (!response.ok) {
    if (response.status === 401 && currentToken) {
      notifyUnauthorized()
    }

    throw new ApiError(
      responseBody?.message ||
        responseBody?.title ||
        responseBody?.detail ||
        `The request failed with HTTP ${response.status}.`,
      {
        status: response.status,
        code: responseBody?.code ?? null,
        fieldErrors: normalizeFieldErrors(responseBody?.errors),
      },
    )
  }

  return responseBody
}

export function getApiFieldError(error, fieldName) {
  const key = Object.keys(error?.fieldErrors ?? {}).find(
    (candidate) => candidate.toLowerCase() === fieldName.toLowerCase(),
  )

  return key ? error.fieldErrors[key][0] : null
}

export function getApiBaseUrl() {
  return apiBaseUrl
}
