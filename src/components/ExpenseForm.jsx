import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiFieldError } from '../api/apiClient'
import { validateAmount } from '../features/amountValidation'
import { getLocalDateValue, validateDate } from '../features/dateUtils'

function initialValues(expense) {
  return {
    categoryId: expense ? String(expense.categoryId) : '',
    amount: expense ? Number(expense.amount).toFixed(2) : '',
    expenseDate: expense?.expenseDate ?? getLocalDateValue(),
    note: expense?.note ?? '',
  }
}

function validateForm(values, categories) {
  const errors = {}
  if (!values.categoryId) {
    errors.categoryId = 'Category is required.'
  } else if (!categories.some((category) => String(category.id) === values.categoryId)) {
    errors.categoryId = 'Select a valid category.'
  }

  const amountError = validateAmount(values.amount)
  if (amountError) errors.amount = amountError

  const dateError = validateDate(values.expenseDate)
  if (dateError) errors.expenseDate = dateError

  if (values.note.length > 500) {
    errors.note = 'Note must be 500 characters or fewer.'
  }

  return errors
}

export function ExpenseForm({ expense, categories, isSubmitting, serverError, onSubmit, onCancel, onClearError }) {
  const [values, setValues] = useState(() => initialValues(expense))
  const [clientErrors, setClientErrors] = useState({})

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setClientErrors((current) => ({ ...current, [name]: undefined }))
    onClearError()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validateForm(values, categories)
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors)
      return
    }

    await onSubmit({
      categoryId: Number(values.categoryId),
      amount: Number(values.amount.trim()),
      expenseDate: values.expenseDate,
      note: values.note.trim() || null,
    })
  }

  const fieldError = (field) => clientErrors[field] ?? getApiFieldError(serverError, field)
  const title = expense ? 'Edit expense' : 'Add expense'

  return (
    <section className="expense-form-card" aria-labelledby="expense-form-title">
      <div className="form-card-heading">
         <span className="card-kicker">{expense ? 'Make a correction' : 'Record a purchase'}</span>
        <h2 id="expense-form-title">{title}</h2>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="expense-form-grid">
          <div className="expense-field">
            <label htmlFor="expense-category">Category</label>
            <select
              id="expense-category"
              name="categoryId"
              value={values.categoryId}
              onChange={updateField}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldError('categoryId'))}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {fieldError('categoryId') && <span className="field-error" role="alert">{fieldError('categoryId')}</span>}
          </div>
          <div className="expense-field">
            <label htmlFor="expense-amount">Amount</label>
            <input
              id="expense-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={values.amount}
              onChange={updateField}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldError('amount'))}
            />
            {fieldError('amount') && <span className="field-error" role="alert">{fieldError('amount')}</span>}
          </div>
          <div className="expense-field">
            <label htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              name="expenseDate"
              type="date"
              value={values.expenseDate}
              onChange={updateField}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldError('expenseDate'))}
            />
            {fieldError('expenseDate') && <span className="field-error" role="alert">{fieldError('expenseDate')}</span>}
          </div>
          <div className="expense-field expense-note-field">
            <label htmlFor="expense-note">Note <span>(optional)</span></label>
            <textarea
              id="expense-note"
              name="note"
              rows="2"
              maxLength={500}
              value={values.note}
              onChange={updateField}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldError('note'))}
            />
            <span className="field-hint">{values.note.length}/500</span>
            {fieldError('note') && <span className="field-error" role="alert">{fieldError('note')}</span>}
          </div>
        </div>
        {serverError?.message && <p className="form-error" role="alert">{serverError.message}</p>}
        <div className="expense-form-actions">
          <button className="button button-primary button-small" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : expense ? 'Save expense' : 'Add expense'}
          </button>
          <button className="button button-quiet button-small" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export function NoCategoriesNotice() {
  return (
    <div className="expense-no-categories">
      <h2>Add a category first</h2>
      <p>Every expense needs a category before it can be saved.</p>
      <Link className="button button-quiet button-small" to="/categories">Go to categories</Link>
    </div>
  )
}
