import { useQuery } from '@tanstack/react-query'
import { apiFetch, getApiBaseUrl } from '../api/apiClient'

export function HealthPage() {
  const { data, error, isError, isPending } = useQuery({
    queryKey: ['api-health'],
    queryFn: ({ signal }) => apiFetch('/api/health', { auth: false, signal }),
    retry: false,
  })

  return (
    <main className="health-page">
      <span className="eyebrow">SYSTEM CHECK</span>
      <h1>Backend connection</h1>
      <p className="intro">This page keeps the Day 1 API check available while the app grows.</p>
      <section className="health-card" aria-live="polite">
        {isPending && <p className="status loading">Checking the API...</p>}
        {isError && <p className="status error">Could not connect: {error.message}</p>}
        {data && (
          <div>
            <p className="status success">API connected successfully</p>
            <p className="response">Response status: <strong>{data.status}</strong></p>
          </div>
        )}
      </section>
      <p className="endpoint"><span>Endpoint</span>{getApiBaseUrl()}/api/health</p>
    </main>
  )
}
