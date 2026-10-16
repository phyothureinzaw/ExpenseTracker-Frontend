import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/apiClient'
import { ExpenseForm } from '../components/ExpenseForm'
import { AlertBanner, EmptyState, Icon, LoadingState, PageHeader } from '../components/ui'
import { useCategories } from '../features/categories/categoryHooks'
import { useExpenseMutations, useExpenses } from '../features/expenses/expenseHooks'
import { formatCurrency } from '../features/settings/currencyFormatting'
import { useSettings } from '../features/settings/settingsHooks'

const emptyFilters = { from: '', to: '', categoryId: '', search: '' }

function errorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
}

function formatDate(dateOnly) {
  const [year, month, day] = dateOnly.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    .format(new Date(year, month - 1, day))
}

function validateFilterDates(filters) {
  const errors = {}
  const parse = (value, field) => {
    if (!value) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      errors[field] = 'Use YYYY-MM-DD format.'
      return null
    }
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) errors[field] = 'Enter a valid calendar date.'
    return value
  }
  const from = parse(filters.from, 'from')
  const to = parse(filters.to, 'to')
  if (!errors.from && !errors.to && from && to && from > to) errors.from = 'From cannot be later than To.'
  if (filters.search.trim().length > 100) errors.search = 'Search must be 100 characters or fewer.'
  return errors
}

export function ExpensesPage() {
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterErrors, setFilterErrors] = useState({})
  const [editingExpense, setEditingExpense] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [formError, setFormError] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const expensesQuery = useExpenses({ ...appliedFilters, page, pageSize })
  const categoriesQuery = useCategories()
  const settingsQuery = useSettings()
  const { createExpense, updateExpense, deleteExpense } = useExpenseMutations()

  const response = expensesQuery.data ?? { items: [], totalCount: 0, page, pageSize }
  const expenses = response.items ?? []
  const categories = categoriesQuery.data ?? []
  const currencyCode = settingsQuery.data?.currencyCode ?? null
  const formatAmount = (amount) => formatCurrency(amount, currencyCode)
  const totalPages = response.totalCount === 0 ? 1 : Math.ceil(response.totalCount / pageSize)
  const hasFilters = Object.values(appliedFilters).some(Boolean)
  const isSaving = createExpense.isPending || updateExpense.isPending

  function updateDraft(event) {
    const { name, value } = event.target
    setDraftFilters((current) => ({ ...current, [name]: value }))
    setFilterErrors((current) => ({ ...current, [name]: undefined }))
  }

  function applyFilters(event) {
    event.preventDefault()
    const errors = validateFilterDates(draftFilters)
    if (Object.keys(errors).length > 0) {
      setFilterErrors(errors)
      return
    }
    setFilterErrors({})
    setAppliedFilters({ ...draftFilters, search: draftFilters.search.trim() })
    setPage(1)
    setSuccessMessage(null)
  }

  function clearFilters() {
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setFilterErrors({})
    setPage(1)
  }

  function changePageSize(event) {
    setPageSize(Number(event.target.value))
    setPage(1)
  }

  function openCreate() {
    setEditingExpense(null)
    setFormError(null)
    setSuccessMessage(null)
    setShowCreate(true)
    setPendingDelete(null)
  }

  function cancelForm() {
    setEditingExpense(null)
    setShowCreate(false)
    setFormError(null)
  }

  async function saveExpense(request) {
    setFormError(null)
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense.id, request })
        setSuccessMessage('Expense updated. It may be hidden if it no longer matches the active filters.')
      } else {
        await createExpense.mutateAsync(request)
        setSuccessMessage('Expense added.')
      }
      cancelForm()
    } catch (error) {
      setFormError(error)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleteError(null)
    try {
      await deleteExpense.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
      setSuccessMessage('Expense deleted.')
      if (page > 1 && expenses.length === 1) setPage((current) => Math.max(1, current - 1))
    } catch (error) {
      setDeleteError(error)
    }
  }

  const categoryError = categoriesQuery.isError
  const expenseError = expensesQuery.isError
  const rangeStart = response.totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, response.totalCount)

  return (
    <main className="expenses-page">
      <PageHeader
        className="expenses-heading"
         eyebrow="Transactions"
        title="Expenses"
        description="Keep the small purchases visible so the bigger picture stays honest."
        actions={<button className="button button-primary page-action" type="button" onClick={openCreate} disabled={categories.length === 0}><Icon name="plus" size={17} />Add expense</button>}
      />

      <form className="expense-filter-card" onSubmit={applyFilters} noValidate>
         <div className="filter-heading"><span className="card-kicker">Filter expenses</span><span className="filter-status">{expensesQuery.isFetching && !expensesQuery.isPending ? 'Refreshing...' : 'Filters apply on submit'}</span></div>
        <div className="expense-filter-grid">
          <div className="expense-filter-field"><label htmlFor="expense-filter-from">From</label><input id="expense-filter-from" name="from" type="date" value={draftFilters.from} onChange={updateDraft} aria-invalid={Boolean(filterErrors.from)} />{filterErrors.from && <span className="field-error" role="alert">{filterErrors.from}</span>}</div>
          <div className="expense-filter-field"><label htmlFor="expense-filter-to">To</label><input id="expense-filter-to" name="to" type="date" value={draftFilters.to} onChange={updateDraft} aria-invalid={Boolean(filterErrors.to)} />{filterErrors.to && <span className="field-error" role="alert">{filterErrors.to}</span>}</div>
          <div className="expense-filter-field"><label htmlFor="expense-filter-category">Category</label><select id="expense-filter-category" name="categoryId" value={draftFilters.categoryId} onChange={updateDraft}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          <div className="expense-filter-field expense-search-field"><label htmlFor="expense-filter-search">Search</label><input id="expense-filter-search" name="search" type="search" maxLength="100" placeholder="Note or category" value={draftFilters.search} onChange={updateDraft} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyFilters(event) } }} aria-invalid={Boolean(filterErrors.search)} />{filterErrors.search && <span className="field-error" role="alert">{filterErrors.search}</span>}</div>
        </div>
        <div className="expense-filter-actions"><button className="button button-primary button-small" type="submit">Apply filters</button><button className="button button-quiet button-small" type="button" onClick={clearFilters}>Clear filters</button></div>
      </form>

      {categoryError && <AlertBanner title="Categories could not load." action={<button className="button button-quiet button-small" type="button" onClick={() => categoriesQuery.refetch()}>Try again</button>}>{errorMessage(categoriesQuery.error, 'The category API could not be reached.')}</AlertBanner>}
      {!categoryError && categories.length === 0 && !categoriesQuery.isPending && <EmptyState icon="tags" title="Add a category first">Every expense needs a category before it can be saved.<Link className="button button-secondary button-small" to="/categories">Go to categories</Link></EmptyState>}
      {!categoryError && categories.length > 0 && (showCreate || editingExpense) && <ExpenseForm key={editingExpense?.id ?? 'create'} expense={editingExpense} categories={categories} isSubmitting={isSaving} serverError={formError} onSubmit={saveExpense} onCancel={cancelForm} onClearError={() => setFormError(null)} />}
      {successMessage && <div className="expense-success" role="status">{successMessage}</div>}
      {deleteError && <AlertBanner title={deleteError.status === 404 ? 'Expense is no longer available.' : 'Expense could not be deleted.'}>{deleteError.message}</AlertBanner>}
      {expensesQuery.isPending && <LoadingState label="Loading expenses..." />}
      {expenseError && !expensesQuery.isPending && <div className="expense-state expense-state-error" role="alert"><h2>Expenses could not load.</h2><p>{errorMessage(expensesQuery.error, 'The expense API could not be reached.')}</p><button className="button button-quiet" type="button" onClick={() => expensesQuery.refetch()}>Try again</button></div>}
      {!expensesQuery.isPending && !expenseError && response.totalCount === 0 && <EmptyState icon={hasFilters ? 'search' : 'receipt'} title={hasFilters ? 'No matching expenses' : 'No expenses yet'}>{hasFilters ? 'Try clearing a filter or changing the search.' : 'Use Add expense to record your first purchase.'}{!hasFilters && <button className="button button-primary button-small" type="button" onClick={openCreate}><Icon name="plus" size={16} />Add expense</button>}</EmptyState>}
      {!expensesQuery.isPending && !expenseError && response.totalCount > 0 && expenses.length === 0 && <div className="expense-state"><h2>No expenses on this page</h2><p>Move back a page to continue browsing the filtered record.</p></div>}
      {!expensesQuery.isPending && !expenseError && expenses.length > 0 && <section className="expense-list" aria-labelledby="expense-list-title"><div className="list-heading"><span className="card-kicker" id="expense-list-title">RECENT EXPENSES</span><span className="list-rule" aria-hidden="true" /></div><div className="expense-table" role="list">{expenses.map((expense) => <article className="expense-row" key={expense.id} role="listitem"><div className="expense-date">{formatDate(expense.expenseDate)}</div><div className="expense-summary"><strong>{expense.categoryName}</strong><span>{expense.note || 'No note'}</span></div><div className="expense-amount">{formatAmount(expense.amount)}</div><div className="expense-actions"><button className="button button-secondary button-small" type="button" aria-label={`Edit ${expense.categoryName} expense`} onClick={() => { setEditingExpense(expense); setShowCreate(false); setFormError(null); setSuccessMessage(null) }} disabled={isSaving || deleteExpense.isPending}><Icon name="edit" size={15} />Edit</button><button className="button button-danger button-small" type="button" aria-label={`Delete ${expense.categoryName} expense`} onClick={() => { setPendingDelete(expense); setDeleteError(null) }} disabled={isSaving || deleteExpense.isPending}><Icon name="trash" size={15} />Delete</button></div>{pendingDelete?.id === expense.id && <div className="expense-delete-confirmation" role="group" aria-label={`Delete expense from ${expense.categoryName}`}><p>Delete the {formatAmount(expense.amount)} expense from <strong>{expense.categoryName}</strong>?</p><div className="expense-actions"><button className="button button-danger button-small" type="button" onClick={confirmDelete} disabled={deleteExpense.isPending}>{deleteExpense.isPending ? 'Deleting...' : 'Yes, delete'}</button><button className="button button-secondary button-small" type="button" onClick={() => setPendingDelete(null)} disabled={deleteExpense.isPending}>Keep it</button></div></div>}</article>)}</div></section>}
      {!expensesQuery.isPending && !expenseError && response.totalCount > 0 && <div className="expense-pagination"><label htmlFor="expense-page-size">Per page<select id="expense-page-size" value={pageSize} onChange={changePageSize}><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label><span>Showing {rangeStart}-{rangeEnd} of {response.totalCount}</span><div className="pagination-actions"><button className="button button-quiet button-small" type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || expensesQuery.isFetching}>Previous</button><span>Page {page} of {totalPages}</span><button className="button button-quiet button-small" type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages || expensesQuery.isFetching}>Next</button></div></div>}
    </main>
  )
}
