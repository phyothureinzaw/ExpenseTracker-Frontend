import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/apiClient'
import { useAuth } from '../../auth/useAuth'

export function dashboardQueryKey(userId, month) {
  return ['dashboard', userId, month]
}

function shouldRetry(error, failureCount) {
  return (error?.isNetworkError || error?.status >= 500) && failureCount < 1
}

export function useDashboard(month) {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: dashboardQueryKey(userId, month),
    queryFn: ({ signal }) => apiFetch(`/api/dashboard?month=${encodeURIComponent(month)}`, { signal }),
    enabled: Boolean(userId) && Boolean(month) && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useDashboardInvalidation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return () => queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id ?? null] })
}
