import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/apiClient'
import { useAuth } from '../../auth/useAuth'

export function expensesQueryKey(userId, filters) {
  return ['expenses', userId, filters]
}

function shouldRetry(error, failureCount) {
  return (error?.isNetworkError || error?.status >= 500) && failureCount < 1
}

export function useExpenses(filters) {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: expensesQueryKey(userId, filters),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (filters.categoryId) params.set('categoryId', filters.categoryId)
      if (filters.search) params.set('search', filters.search)
      return apiFetch(`/api/expenses?${params.toString()}`, { signal })
    },
    enabled: Boolean(userId) && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useExpenseMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = ['expenses', user?.id ?? null]

  const invalidateExpenses = () => queryClient.invalidateQueries({ queryKey })
  const invalidateDashboard = () => queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id ?? null] })

  const createExpense = useMutation({
    mutationFn: (request) => apiFetch('/api/expenses', {
      method: 'POST',
      body: request,
    }),
    retry: false,
    onSuccess: async () => { await invalidateExpenses(); await invalidateDashboard() },
  })

  const updateExpense = useMutation({
    mutationFn: ({ id, request }) => apiFetch(`/api/expenses/${id}`, {
      method: 'PUT',
      body: request,
    }),
    retry: false,
    onSuccess: async () => { await invalidateExpenses(); await invalidateDashboard() },
  })

  const deleteExpense = useMutation({
    mutationFn: (id) => apiFetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),
    retry: false,
    onSuccess: async () => { await invalidateExpenses(); await invalidateDashboard() },
    onError: async (error) => {
      if (error.status === 404) {
        await invalidateExpenses()
        await invalidateDashboard()
      }
    },
  })

  return { createExpense, updateExpense, deleteExpense }
}
