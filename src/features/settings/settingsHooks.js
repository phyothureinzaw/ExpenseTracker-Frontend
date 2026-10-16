import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/apiClient'
import { useAuth } from '../../auth/useAuth'

export function settingsQueryKey(userId) {
  return ['settings', userId]
}

function shouldRetry(error, failureCount) {
  return (error?.isNetworkError || error?.status >= 500) && failureCount < 1
}

export function useSettings() {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: settingsQueryKey(userId),
    queryFn: ({ signal }) => apiFetch('/api/settings', { signal }),
    enabled: Boolean(userId) && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (request) => apiFetch('/api/settings', { method: 'PUT', body: request }),
    retry: false,
    onSuccess: async (response) => {
      queryClient.setQueryData(settingsQueryKey(userId), response)
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey(userId) })
    },
  })
}
