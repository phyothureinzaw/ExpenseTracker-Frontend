import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/apiClient'
import { useAuth } from '../../auth/useAuth'

function shouldRetry(error, failureCount) {
  return (error?.isNetworkError || error?.status >= 500) && failureCount < 1
}

export function recurringRulesQueryKey(userId, page = 1, pageSize = 50) {
  return ['recurring-rules', userId, page, pageSize]
}

export function dueOccurrencesQueryKey(userId, asOf, page = 1, pageSize = 50) {
  return ['recurring-due', userId, asOf, page, pageSize]
}

export function useRecurringRules({ page = 1, pageSize = 50 } = {}) {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null
  return useQuery({
    queryKey: recurringRulesQueryKey(userId, page, pageSize),
    queryFn: ({ signal }) => apiFetch(`/api/recurring?page=${page}&pageSize=${pageSize}`, { signal }),
    enabled: Boolean(userId) && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useDueOccurrences(asOf, { page = 1, pageSize = 50 } = {}) {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null
  return useQuery({
    queryKey: dueOccurrencesQueryKey(userId, asOf, page, pageSize),
    queryFn: ({ signal }) => apiFetch(`/api/recurring/occurrences/due?asOf=${encodeURIComponent(asOf)}&page=${page}&pageSize=${pageSize}`, { signal }),
    enabled: Boolean(userId) && Boolean(asOf) && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useRecurringMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const invalidateRecurring = async () => {
    await queryClient.invalidateQueries({ queryKey: ['recurring-rules', userId] })
    await queryClient.invalidateQueries({ queryKey: ['recurring-due', userId] })
  }
  const invalidateFinancials = async () => {
    await queryClient.invalidateQueries({ queryKey: ['expenses', userId] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
  }

  const deleteRule = useMutation({
    mutationFn: ({ id }) => apiFetch(`/api/recurring/${id}`, { method: 'DELETE' }),
    retry: false,
    onSuccess: invalidateRecurring,
  })

  const createRule = useMutation({
    mutationFn: (body) => apiFetch('/api/recurring', { method: 'POST', body }),
    retry: false,
    onSuccess: invalidateRecurring,
  })
  const updateRule = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/recurring/${id}`, { method: 'PUT', body }),
    retry: false,
    onSuccess: invalidateRecurring,
  })
  const pauseRule = useMutation({
    mutationFn: ({ id }) => apiFetch(`/api/recurring/${id}/pause`, { method: 'POST' }),
    retry: false,
    onSuccess: invalidateRecurring,
  })
  const resumeRule = useMutation({
    mutationFn: ({ id }) => apiFetch(`/api/recurring/${id}/resume`, { method: 'POST' }),
    retry: false,
    onSuccess: invalidateRecurring,
  })
  const stopRule = useMutation({
    mutationFn: ({ id }) => apiFetch(`/api/recurring/${id}/stop`, { method: 'POST' }),
    retry: false,
    onSuccess: invalidateRecurring,
  })
  const recordOccurrence = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/recurring/occurrences/${id}/record`, { method: 'POST', body }),
    retry: false,
    onSuccess: async () => { await invalidateRecurring(); await invalidateFinancials() },
  })
  const skipOccurrence = useMutation({
    mutationFn: ({ id, body }) => apiFetch(`/api/recurring/occurrences/${id}/skip`, { method: 'POST', body }),
    retry: false,
    onSuccess: invalidateRecurring,
  })

  return { createRule, updateRule, deleteRule, pauseRule, resumeRule, stopRule, recordOccurrence, skipOccurrence }
}
