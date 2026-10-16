import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/apiClient'
import { BudgetForm } from '../components/BudgetForm'
import { AlertBanner, EmptyState, Icon, LoadingState, PageHeader } from '../components/ui'
import { useCategories } from '../features/categories/categoryHooks'
import { useBudgetCopyPreview, useBudgetMutations, useBudgets } from '../features/budgets/budgetHooks'
import { getPreviousBudgetMonth } from '../features/budgets/budgetCopyUtils'
import { getLocalBudgetMonth } from '../features/budgets/budgetUtils'
import { formatCurrency } from '../features/settings/currencyFormatting'
import { useSettings } from '../features/settings/settingsHooks'

function errorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
}

export function BudgetsPage() {
  const [selectedMonth, setSelectedMonth] = useState(getLocalBudgetMonth)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formError, setFormError] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isCopyOpen, setIsCopyOpen] = useState(false)
  const [selectedCopyIds, setSelectedCopyIds] = useState(null)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [copyError, setCopyError] = useState(null)
  const budgetsQuery = useBudgets(selectedMonth)
  const categoriesQuery = useCategories()
  const settingsQuery = useSettings()
  const { saveBudget, deleteBudget, copyBudgets } = useBudgetMutations()
  const copyPreviewQuery = useBudgetCopyPreview(selectedMonth, isCopyOpen)

  const budgets = budgetsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const currencyCode = settingsQuery.data?.currencyCode ?? null
  const formatLimit = (limit) => formatCurrency(limit, currencyCode)
  const isSaving = saveBudget.isPending

  function changeMonth(event) {
    setSelectedMonth(event.target.value)
    setEditingBudget(null)
    setFormError(null)
    setPendingDelete(null)
    setDeleteError(null)
    setSuccessMessage(null)
    setIsCopyOpen(false)
    setSelectedCopyIds(null)
    setCopyError(null)
  }

  function openCreate() {
    setEditingBudget('new')
    setFormError(null)
    setPendingDelete(null)
    setSuccessMessage(null)
  }

  function openCopy() {
    setIsCopyOpen(true)
    setCopyError(null)
    setOverwriteExisting(false)
  }

  function closeCopy() {
    setIsCopyOpen(false)
    setSelectedCopyIds(null)
    setCopyError(null)
  }

  async function handleCopy() {
    const selectedIds = selectedCopyIds ?? copyPreviewQuery.data?.items.map((item) => item.categoryId) ?? []
    if (selectedIds.length === 0) return
    setCopyError(null)
    try {
      const response = await copyBudgets.mutateAsync({
        targetMonth: selectedMonth,
        categoryIds: selectedIds,
        overwriteExisting,
      })
      closeCopy()
      const messages = [`Copied ${response.copiedCount} budget${response.copiedCount === 1 ? '' : 's'}.`]
      if (response.skippedCount > 0) messages.push(`${response.skippedCount} existing budget${response.skippedCount === 1 ? '' : 's'} kept.`)
      if (response.overwrittenCount > 0) messages.push(`${response.overwrittenCount} existing budget${response.overwrittenCount === 1 ? '' : 's'} overwritten.`)
      setSuccessMessage(messages.join(' '))
    } catch (error) {
      setCopyError(error)
    }
  }

  function cancelForm() {
    setEditingBudget(null)
    setFormError(null)
  }

  async function handleSave(request) {
    const wasEditing = Boolean(editingBudget && editingBudget !== 'new')
    setFormError(null)
    try {
      await saveBudget.mutateAsync(request)
      setSelectedMonth(request.month)
      setSuccessMessage(wasEditing ? 'Budget updated.' : 'Budget added.')
      cancelForm()
    } catch (error) {
      setFormError(error)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleteError(null)
    try {
      await deleteBudget.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
      setSuccessMessage('Budget deleted.')
    } catch (error) {
      setDeleteError(error)
    }
  }

  const categoryError = categoriesQuery.isError
  const budgetError = budgetsQuery.isError

  return (
    <main className="budgets-page">
      <PageHeader
        className="budgets-heading"
         eyebrow="Planning"
        title="Budgets"
        description="Give each category a clear monthly boundary without turning spending into a spreadsheet."
        actions={<><div className="month-control"><label htmlFor="selected-budget-month">Viewing month</label><input id="selected-budget-month" type="month" value={selectedMonth} onChange={changeMonth} /></div><button className="button button-secondary budget-page-action" type="button" onClick={openCopy} disabled={categories.length === 0 || categoryError || !getPreviousBudgetMonth(selectedMonth)}><Icon name="copy" size={17} />Copy previous month</button><button className="button button-primary budget-page-action" type="button" onClick={openCreate} disabled={categories.length === 0 || categoryError}><Icon name="plus" size={17} />Add budget</button></>}
      />

      {categoryError && <AlertBanner title="Categories could not load." action={<button className="button button-quiet button-small" type="button" onClick={() => categoriesQuery.refetch()}>Try again</button>}>{errorMessage(categoriesQuery.error, 'The category API could not be reached.')}</AlertBanner>}
      {!categoryError && categories.length === 0 && !categoriesQuery.isPending && <EmptyState icon="tags" title="Add a category first">Every budget needs a category before it can be saved.<Link className="button button-secondary button-small" to="/categories">Go to categories</Link></EmptyState>}

      {isCopyOpen && <section className="budget-copy-card" aria-labelledby="budget-copy-title">
        <div className="form-card-heading">
          <div><span className="card-kicker">Copy budgets</span><h2 id="budget-copy-title">Bring forward {copyPreviewQuery.data?.sourceMonth ?? getPreviousBudgetMonth(selectedMonth) ?? 'the previous month'}</h2></div>
          <button className="button button-quiet button-small" type="button" onClick={closeCopy} disabled={copyBudgets.isPending}>Cancel</button>
        </div>
        <p className="budget-copy-intro">Choose budgets to copy into {selectedMonth}. Existing budgets are preserved unless you explicitly enable overwrite.</p>
        {copyPreviewQuery.isPending && <LoadingState label="Preparing copy preview..." />}
        {copyPreviewQuery.isError && !copyPreviewQuery.isPending && <AlertBanner title="Copy preview could not load.">{errorMessage(copyPreviewQuery.error, 'The budget API could not be reached.')}</AlertBanner>}
        {copyError && <AlertBanner title="Budgets could not be copied.">{errorMessage(copyError, 'The budget API could not be reached.')}</AlertBanner>}
        {copyPreviewQuery.data && !copyPreviewQuery.isPending && copyPreviewQuery.data.items.length === 0 && <div className="comparison-empty">No budgets exist in the previous month.</div>}
        {copyPreviewQuery.data && copyPreviewQuery.data.items.length > 0 && <>
          <div className="budget-copy-list">
            {copyPreviewQuery.data.items.map((item) => <label className="budget-copy-item" key={item.categoryId}><input type="checkbox" checked={(selectedCopyIds ?? copyPreviewQuery.data.items.map((previewItem) => previewItem.categoryId)).includes(item.categoryId)} onChange={() => setSelectedCopyIds((current) => { const selected = current ?? copyPreviewQuery.data.items.map((previewItem) => previewItem.categoryId); return selected.includes(item.categoryId) ? selected.filter((id) => id !== item.categoryId) : [...selected, item.categoryId] })} disabled={copyBudgets.isPending} /><span><strong>{item.categoryName}</strong><small>{formatLimit(item.sourceLimit)} from {copyPreviewQuery.data.sourceMonth}{item.existingLimit !== null ? ` · ${formatLimit(item.existingLimit)} already set` : ''}</small></span></label>)}
          </div>
          <label className="budget-copy-overwrite"><input type="checkbox" checked={overwriteExisting} onChange={(event) => setOverwriteExisting(event.target.checked)} disabled={copyBudgets.isPending} /><span><strong>Overwrite existing budgets</strong><small>Leave unchecked to preserve limits already set for {selectedMonth}.</small></span></label>
          <div className="budget-copy-actions"><button className="button button-primary button-small" type="button" onClick={handleCopy} disabled={(selectedCopyIds ?? copyPreviewQuery.data.items.map((item) => item.categoryId)).length === 0 || copyBudgets.isPending}>{copyBudgets.isPending ? 'Copying...' : `Copy ${(selectedCopyIds ?? copyPreviewQuery.data.items.map((item) => item.categoryId)).length} selected`}</button></div>
        </>}
      </section>}

      {!categoryError && categories.length > 0 && editingBudget && (
        <BudgetForm
          key={editingBudget === 'new' ? `new-${selectedMonth}` : editingBudget.id}
          budget={editingBudget === 'new' ? null : editingBudget}
          month={selectedMonth}
          categories={categories}
          isSubmitting={isSaving}
          serverError={formError}
          onSubmit={handleSave}
          onCancel={cancelForm}
          onClearError={() => setFormError(null)}
        />
      )}

      {successMessage && <div className="expense-success" role="status">{successMessage}</div>}
      {deleteError && <AlertBanner title="Budget could not be deleted.">{deleteError.message}</AlertBanner>}
      {budgetsQuery.isPending && <LoadingState label="Loading budgets..." />}
      {budgetError && !budgetsQuery.isPending && <div className="budget-state budget-state-error" role="alert"><h2>Budgets could not load.</h2><p>{errorMessage(budgetsQuery.error, 'The budget API could not be reached.')}</p><button className="button button-quiet" type="button" onClick={() => budgetsQuery.refetch()}>Try again</button></div>}
      {!budgetsQuery.isPending && !budgetError && categories.length > 0 && budgets.length === 0 && <EmptyState icon="wallet" title={`No budget set for ${selectedMonth}`}>Choose a category and set a limit to give this month some shape.<button className="button button-primary button-small" type="button" onClick={openCreate}><Icon name="plus" size={16} />Add budget</button></EmptyState>}

       {!budgetsQuery.isPending && !budgetError && budgets.length > 0 && <section className="budget-list" aria-labelledby="budget-list-title"><div className="list-heading"><span className="card-kicker" id="budget-list-title">Monthly limits</span><span className="list-rule" aria-hidden="true" /></div><div className="budget-table" role="list">{budgets.map((budget) => <article className="budget-row" key={budget.id} role="listitem"><div className="budget-summary"><strong>{budget.categoryName}</strong><span>{budget.month}</span></div><div className="budget-limit">{formatLimit(budget.limit)}</div><div className="budget-actions"><button className="button button-secondary button-small" type="button" aria-label={`Edit ${budget.categoryName} budget`} onClick={() => { setEditingBudget(budget); setFormError(null); setPendingDelete(null) }} disabled={isSaving || deleteBudget.isPending}><Icon name="edit" size={15} />Edit</button><button className="button button-danger button-small" type="button" aria-label={`Delete ${budget.categoryName} budget`} onClick={() => { setPendingDelete(budget); setDeleteError(null) }} disabled={isSaving || deleteBudget.isPending}><Icon name="trash" size={15} />Delete</button></div>{pendingDelete?.id === budget.id && <div className="budget-delete-confirmation" role="group" aria-label={`Delete ${budget.categoryName} budget`}><p>Delete the {formatLimit(budget.limit)} limit for <strong>{budget.categoryName}</strong>?</p><div className="budget-actions"><button className="button button-danger button-small" type="button" onClick={confirmDelete} disabled={deleteBudget.isPending}>{deleteBudget.isPending ? 'Deleting...' : 'Yes, delete'}</button><button className="button button-secondary button-small" type="button" onClick={() => setPendingDelete(null)} disabled={deleteBudget.isPending}>Keep it</button></div></div>}</article>)}</div></section>}
    </main>
  )
}
