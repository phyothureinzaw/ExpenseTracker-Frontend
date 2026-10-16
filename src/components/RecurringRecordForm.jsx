import { useState } from 'react'
import { getApiFieldError } from '../api/apiClient'
import { validateAmount } from '../features/amountValidation'
import { validateDate } from '../features/dateUtils'

export function RecurringRecordForm({ occurrence, currencyCode, isSubmitting, serverError, onSubmit, onCancel }) {
  const [expenseDate, setExpenseDate] = useState(occurrence.scheduledDate)
  const [amount, setAmount] = useState(Number(occurrence.amount).toFixed(2))
  const [note, setNote] = useState(occurrence.note ?? '')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const dateError = validateDate(expenseDate)
    if (dateError) nextErrors.expenseDate = dateError
    const amountError = validateAmount(amount)
    if (amountError) nextErrors.amount = amountError
    if (note.length > 500) nextErrors.note = 'Note must be 500 characters or fewer.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSubmit({ scheduledDate: occurrence.scheduledDate, expenseDate, amount: Number(amount.trim()), note })
  }

  const fieldError = (field) => errors[field] ?? getApiFieldError(serverError, field)

  return <section className="recurring-confirm-card" aria-labelledby="record-expense-title"><div className="form-card-heading"><div><span className="card-kicker">Confirmation required</span><h2 id="record-expense-title">Record expense</h2></div></div><p className="recurring-confirm-copy">This will add a normal expense for <strong>{occurrence.ruleName}</strong>. Nothing is recorded until you confirm.</p><form onSubmit={handleSubmit} noValidate><div className="recurring-record-grid"><div className="recurring-field"><label htmlFor="record-expense-date">Actual expense date</label><input id="record-expense-date" type="date" value={expenseDate} onChange={(event) => { setExpenseDate(event.target.value); setErrors((current) => ({ ...current, expenseDate: undefined })) }} disabled={isSubmitting} aria-invalid={Boolean(fieldError('expenseDate'))} />{fieldError('expenseDate') && <span className="field-error" role="alert">{fieldError('expenseDate')}</span>}</div><div className="recurring-field"><label htmlFor="record-expense-amount">Amount ({currencyCode ?? 'currency'})</label><input id="record-expense-amount" type="text" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setErrors((current) => ({ ...current, amount: undefined })) }} disabled={isSubmitting} aria-invalid={Boolean(fieldError('amount'))} />{fieldError('amount') && <span className="field-error" role="alert">{fieldError('amount')}</span>}</div><div className="recurring-field recurring-note-field"><label htmlFor="record-expense-note">Note <span className="field-optional">Optional</span></label><textarea id="record-expense-note" maxLength="500" value={note} onChange={(event) => setNote(event.target.value)} disabled={isSubmitting} aria-invalid={Boolean(fieldError('note'))} />{fieldError('note') && <span className="field-error" role="alert">{fieldError('note')}</span>}</div></div>{serverError?.message && <p className="form-error" role="alert">{serverError.message}</p>}<div className="recurring-form-actions"><button className="button button-primary button-small" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Recording...' : 'Record expense'}</button><button className="button button-quiet button-small" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button></div></form></section>
}
