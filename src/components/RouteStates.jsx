export function AuthLoading() {
  return (
    <main className="route-state" aria-live="polite">
      <span className="eyebrow">EXPENSE TRACKER</span>
      <h1>Checking your session...</h1>
      <p>One moment while we confirm your account.</p>
    </main>
  )
}

export function PageNotFound() {
  return (
    <main className="route-state">
      <span className="eyebrow">404</span>
      <h1>That page is not here.</h1>
      <p>Use the address bar to return to the expense tracker.</p>
    </main>
  )
}
