import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api/apiClient'
import { useAuth } from '../../auth/useAuth'

export function categoriesQueryKey(userId) {
  return ['categories', userId]
}

function shouldRetry(error, failureCount) {
  return (error?.isNetworkError || error?.status >= 500) && failureCount < 1
}

export function useCategories() {
  const { isAuthenticated, status, user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: categoriesQueryKey(userId),
    queryFn: ({ signal }) => apiFetch('/api/categories', { signal }),
    enabled: Boolean(userId) && isAuthenticated && status === 'authenticated',
    retry: shouldRetry,
  })
}

export function useCategoryMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = categoriesQueryKey(user?.id ?? null)

  const invalidateCategories = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id ?? null] }),
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id ?? null] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id ?? null] }),
    ])
  }

  const createCategory = useMutation({
    mutationFn: (name) => apiFetch('/api/categories', {
      method: 'POST',
      body: { name },
    }),
    retry: false,
    onSuccess: invalidateCategories,
  })

  const updateCategory = useMutation({
    mutationFn: ({ id, name }) => apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      body: { name },
    }),
    retry: false,
    onSuccess: invalidateCategories,
  })

  const deleteCategory = useMutation({
    mutationFn: (id) => apiFetch(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
    retry: false,
    onSuccess: invalidateCategories,
    onError: async (error) => {
      if (error.status === 404) {
        await invalidateCategories()
      }
    },
  })

  return { createCategory, updateCategory, deleteCategory }
}
