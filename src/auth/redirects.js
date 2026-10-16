const publicPaths = new Set(['/login', '/register'])

export function getSafeRedirectPath(state) {
  const from = state?.from
  if (!from) {
    return '/'
  }

  const pathname = typeof from === 'string' ? from : from.pathname
  if (
    typeof pathname !== 'string' ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    publicPaths.has(pathname)
  ) {
    return '/'
  }

  if (typeof from === 'string') {
    return pathname
  }

  return `${pathname}${from.search ?? ''}${from.hash ?? ''}`
}
