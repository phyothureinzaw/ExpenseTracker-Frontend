import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/apiClient'
import { useAuth } from '../../auth/useAuth'

export function budgetsQueryKey(userId, month) {
  return ['budgets', userId, month]
}

function shouldRetry(error, failureCount) {
  return (error?.isNetworkError || error?.status >= 500) && failureCount < 1
}

export function useBudgets(month) {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: budgetsQueryKey(userId, month),
    queryFn: ({ signal }) => apiFetch(`/api/budgets?month=${encodeURIComponent(month)}`, { signal }),
    enabled: Boolean(userId) && Boolean(month) && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useBudgetCopyPreview(targetMonth, enabled = true) {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: ['budget-copy-preview', userId, targetMonth],
    queryFn: ({ signal }) => apiFetch(`/api/budgets/copy-preview?targetMonth=${encodeURIComponent(targetMonth)}`, { signal }),
    enabled: Boolean(userId) && Boolean(targetMonth) && enabled && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useBudgetMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  const invalidateBudgets = (month) => queryClient.invalidateQueries({ queryKey: ['budgets', userId, month] })
  const invalidateDashboard = () => queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })

  const saveBudget = useMutation({
    mutationFn: (request) => apiFetch('/api/budgets', { method: 'PUT', body: request }),
    retry: false,
    onSuccess: async (_data, request) => { await invalidateBudgets(request.month); await invalidateDashboard() },
  })

  const deleteBudget = useMutation({
    mutationFn: (id) => apiFetch(`/api/budgets/${id}`, { method: 'DELETE' }),
    retry: false,
    onSuccess: async (_data, _id, _context) => { await queryClient.invalidateQueries({ queryKey: ['budgets', userId] }); await invalidateDashboard() },
    onError: async (error) => {
      if (error.status === 404) {
        await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
        await invalidateDashboard()
      }
    },
  })

  const copyBudgets = useMutation({
    mutationFn: (request) => apiFetch('/api/budgets/copy', { method: 'POST', body: request }),
    retry: false,
    onSuccess: async (_data, request) => {
      await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
      await queryClient.invalidateQueries({ queryKey: ['budget-copy-preview', userId, request.targetMonth] })
      await invalidateDashboard()
    },
  })

  return { saveBudget, deleteBudget, copyBudgets }
}
