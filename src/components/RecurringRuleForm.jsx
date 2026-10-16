import { useState } from 'react'
import { getApiFieldError } from '../api/apiClient'
import { validateAmount } from '../features/amountValidation'
import { getLocalDateValue, validateDate } from '../features/dateUtils'

function initialValues(rule) {
  return {
    name: rule?.name ?? '',
    categoryId: rule ? String(rule.categoryId) : '',
    amount: rule ? Number(rule.amount).toFixed(2) : '',
    note: rule?.note ?? '',
    startDate: rule?.startDate ?? getLocalDateValue(),
    endDate: rule?.endDate ?? '',
  }
}

export function RecurringRuleForm({ rule, categories, currencyCode, isSubmitting, serverError, onSubmit, onCancel, onClearError }) {
  const [values, setValues] = useState(() => initialValues(rule))
  const [errors, setErrors] = useState({})
  const editing = Boolean(rule)

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    onClearError()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    else if (values.name.trim().length > 100) nextErrors.name = 'Name must be 100 characters or fewer.'
    if (!editing && !values.categoryId) nextErrors.categoryId = 'Category is required.'
    if (!editing && values.categoryId && !categories.some((category) => String(category.id) === values.categoryId)) nextErrors.categoryId = 'Select a valid category.'
    const startError = validateDate(values.startDate)
    if (!editing && startError) nextErrors.startDate = startError
    if (!editing && values.endDate) {
      const endError = validateDate(values.endDate)
      if (endError) nextErrors.endDate = endError
      else if (values.endDate < values.startDate) nextErrors.endDate = 'End date cannot be earlier than the start date.'
    }
    const amountError = validateAmount(values.amount)
    if (amountError) nextErrors.amount = amountError.replace('Amount', 'Rule amount')
    if (values.note.length > 500) nextErrors.note = 'Note must be 500 characters or fewer.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    await onSubmit(editing
      ? { name: values.name.trim(), amount: Number(values.amount.trim()), note: values.note }
      : { name: values.name.trim(), categoryId: Number(values.categoryId), amount: Number(values.amount.trim()), note: values.note, startDate: values.startDate, endDate: values.endDate || null })
  }

  const fieldError = (field) => errors[field] ?? getApiFieldError(serverError, field)

  return (
    <section className="recurring-form-card" aria-labelledby="recurring-form-title">
      <div className="form-card-heading"><div><span className="card-kicker">{editing ? 'Make a change' : 'Monthly schedule'}</span><h2 id="recurring-form-title">{editing ? 'Edit recurring rule' : 'Add recurring expense'}</h2></div>{editing && <button className="button button-quiet button-small" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>}</div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="recurring-form-grid">
          <div className="recurring-field"><label htmlFor="recurring-name">Name</label><input id="recurring-name" name="name" type="text" maxLength="100" value={values.name} onChange={updateField} disabled={isSubmitting} aria-invalid={Boolean(fieldError('name'))} />{fieldError('name') && <span className="field-error" role="alert">{fieldError('name')}</span>}</div>
          <div className="recurring-field"><label htmlFor="recurring-category">Category</label><select id="recurring-category" name="categoryId" value={values.categoryId} onChange={updateField} disabled={editing || isSubmitting} aria-invalid={Boolean(fieldError('categoryId'))}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{fieldError('categoryId') && <span className="field-error" role="alert">{fieldError('categoryId')}</span>}</div>
          <div className="recurring-field"><label htmlFor="recurring-amount">Amount ({currencyCode ?? 'currency'})</label><input id="recurring-amount" name="amount" type="text" inputMode="decimal" placeholder="0.00" value={values.amount} onChange={updateField} disabled={isSubmitting} aria-invalid={Boolean(fieldError('amount'))} />{fieldError('amount') && <span className="field-error" role="alert">{fieldError('amount')}</span>}</div>
          <div className="recurring-field"><label htmlFor="recurring-start-date">Start date</label><input id="recurring-start-date" name="startDate" type="date" value={values.startDate} onChange={updateField} disabled={editing || isSubmitting} aria-invalid={Boolean(fieldError('startDate'))} />{fieldError('startDate') && <span className="field-error" role="alert">{fieldError('startDate')}</span>}</div>
          <div className="recurring-field"><label htmlFor="recurring-end-date">End date <span className="field-optional">Optional</span></label><input id="recurring-end-date" name="endDate" type="date" value={values.endDate} onChange={updateField} disabled={editing || isSubmitting} aria-invalid={Boolean(fieldError('endDate'))} />{fieldError('endDate') && <span className="field-error" role="alert">{fieldError('endDate')}</span>}</div>
          <div className="recurring-field recurring-note-field"><label htmlFor="recurring-note">Note <span className="field-optional">Optional</span></label><textarea id="recurring-note" name="note" maxLength="500" value={values.note} onChange={updateField} disabled={isSubmitting} aria-invalid={Boolean(fieldError('note'))} />{fieldError('note') && <span className="field-error" role="alert">{fieldError('note')}</span>}</div>
        </div>
        <p className="recurring-form-hint">Monthly dates follow the original day. If a month is shorter, its last day is used without changing future months.</p>
        {serverError?.message && <p className="form-error" role="alert">{serverError.message}</p>}
        <div className="recurring-form-actions"><button className="button button-primary button-small" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editing ? 'Save rule' : 'Add recurring rule'}</button>{!editing && <button className="button button-quiet button-small" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>}</div>
      </form>
    </section>
  )
}
