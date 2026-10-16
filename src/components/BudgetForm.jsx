import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiFieldError } from '../api/apiClient'
import { validateAmount } from '../features/amountValidation'
import { getLocalBudgetMonth } from '../features/budgets/budgetUtils'

function initialValues(budget, month) {
  return {
    categoryId: budget ? String(budget.categoryId) : '',
    month: budget?.month ?? month ?? getLocalBudgetMonth(),
    limit: budget ? Number(budget.limit).toFixed(2) : '',
  }
}

function validateMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return 'Month must use YYYY-MM format.'
  }

  const month = Number(value.slice(5))
  return month >= 1 && month <= 12 ? null : 'Choose a valid month.'
}

export function BudgetForm({ budget, month, categories, isSubmitting, serverError, onSubmit, onCancel, onClearError }) {
  const [values, setValues] = useState(() => initialValues(budget, month))
  const [clientErrors, setClientErrors] = useState({})

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setClientErrors((current) => ({ ...current, [name]: undefined }))
    onClearError()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!values.categoryId) errors.categoryId = 'Category is required.'
    else if (!categories.some((category) => String(category.id) === values.categoryId)) errors.categoryId = 'Select a valid category.'

    const monthError = validateMonth(values.month)
    if (monthError) errors.month = monthError
    const limitError = validateAmount(values.limit)
    if (limitError) errors.limit = limitError.replace('Amount', 'Limit')

    if (Object.keys(errors).length > 0) {
      setClientErrors(errors)
      return
    }

    await onSubmit({
      categoryId: Number(values.categoryId),
      month: values.month,
      limit: Number(values.limit.trim()),
    })
  }

  const fieldError = (field) => clientErrors[field] ?? getApiFieldError(serverError, field)
  const editing = Boolean(budget)

  return (
    <section className="budget-form-card" aria-labelledby="budget-form-title">
      <div className="form-card-heading">
         <span className="card-kicker">{editing ? 'Make a change' : 'Set a monthly limit'}</span>
        <h2 id="budget-form-title">{editing ? 'Edit budget' : 'Add budget'}</h2>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="budget-form-grid">
          <div className="budget-field">
            <label htmlFor="budget-category">Category</label>
            <select id="budget-category" name="categoryId" value={values.categoryId} onChange={updateField} disabled={editing || isSubmitting} aria-invalid={Boolean(fieldError('categoryId'))}>
              <option value="">Choose a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {fieldError('categoryId') && <span className="field-error" role="alert">{fieldError('categoryId')}</span>}
          </div>
          <div className="budget-field">
            <label htmlFor="budget-month">Month</label>
            <input id="budget-month" name="month" type="month" value={values.month} onChange={updateField} disabled={editing || isSubmitting} aria-invalid={Boolean(fieldError('month'))} />
            {fieldError('month') && <span className="field-error" role="alert">{fieldError('month')}</span>}
          </div>
          <div className="budget-field budget-limit-field">
            <label htmlFor="budget-limit">Monthly limit</label>
            <input id="budget-limit" name="limit" type="text" inputMode="decimal" placeholder="0.00" value={values.limit} onChange={updateField} disabled={isSubmitting} aria-invalid={Boolean(fieldError('limit'))} />
            {fieldError('limit') && <span className="field-error" role="alert">{fieldError('limit')}</span>}
          </div>
        </div>
        {serverError?.message && <p className="form-error" role="alert">{serverError.message}</p>}
        <div className="budget-form-actions">
          <button className="button button-primary button-small" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editing ? 'Save budget' : 'Add budget'}</button>
          {editing && <button className="button button-quiet button-small" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>}
        </div>
      </form>
    </section>
  )
}

export function NoBudgetCategoriesNotice() {
  return (
    <div className="budget-no-categories">
      <h2>Add a category first</h2>
      <p>Every budget needs a category before it can be saved.</p>
      <Link className="button button-quiet button-small" to="/categories">Go to categories</Link>
    </div>
  )
}
