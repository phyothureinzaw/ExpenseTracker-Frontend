import { useState } from 'react'
import { ApiError } from '../api/apiClient'
import { RecurringRecordForm } from '../components/RecurringRecordForm'
import { RecurringRuleForm } from '../components/RecurringRuleForm'
import { AlertBanner, EmptyState, Icon, LoadingState, PageHeader } from '../components/ui'
import { getLocalDateValue } from '../features/dateUtils'
import { useCategories } from '../features/categories/categoryHooks'
import { useRecurringMutations, useRecurringRules, useDueOccurrences } from '../features/recurring/recurringHooks'
import { formatCurrency } from '../features/settings/currencyFormatting'
import { useSettings } from '../features/settings/settingsHooks'

function errorMessage(error, fallback = 'The recurring expenses API could not be reached.') {
  return error instanceof ApiError ? error.message : fallback
}

function stateLabel(rule) {
  if (rule.isStopped) return 'Stopped'
  if (rule.isPaused) return 'Paused'
  return 'Active'
}

export function RecurringPage() {
  const [asOf, setAsOf] = useState(getLocalDateValue)
  const [showCreate, setShowCreate] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [formError, setFormError] = useState(null)
  const [pendingRecord, setPendingRecord] = useState(null)
  const [pendingSkip, setPendingSkip] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingStop, setPendingStop] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const rulesQuery = useRecurringRules()
  const dueQuery = useDueOccurrences(asOf)
  const categoriesQuery = useCategories()
  const settingsQuery = useSettings()
  const mutations = useRecurringMutations()
  const rules = rulesQuery.data?.items ?? []
  const dueItems = dueQuery.data?.items ?? []
  const categories = categoriesQuery.data ?? []
  const currencyCode = settingsQuery.data?.currencyCode ?? null
  const isSaving = mutations.createRule.isPending || mutations.updateRule.isPending
  const isActionPending = mutations.pauseRule.isPending || mutations.resumeRule.isPending || mutations.stopRule.isPending || mutations.deleteRule.isPending || mutations.recordOccurrence.isPending || mutations.skipOccurrence.isPending

  function closeForm() {
    setShowCreate(false)
    setEditingRule(null)
    setFormError(null)
  }

  async function saveRule(request) {
    setFormError(null)
    try {
      if (editingRule) {
        await mutations.updateRule.mutateAsync({ id: editingRule.id, body: request })
        setSuccessMessage('Recurring rule updated.')
      } else {
        await mutations.createRule.mutateAsync(request)
        setSuccessMessage('Recurring rule added.')
      }
      closeForm()
    } catch (error) {
      setFormError(error)
    }
  }

  async function runRuleAction(mutation, id, success) {
    setActionError(null)
    try {
      await mutation.mutateAsync({ id })
      setSuccessMessage(success)
      setPendingStop(null)
      setPendingDelete(null)
    } catch (error) {
      setActionError(error)
    }
  }

  async function recordOccurrence(request) {
    setActionError(null)
    try {
      await mutations.recordOccurrence.mutateAsync({ id: pendingRecord.id, body: request })
      setPendingRecord(null)
      setSuccessMessage('Expense recorded.')
    } catch (error) {
      setActionError(error)
    }
  }

  async function skipOccurrence() {
    if (!pendingSkip) return
    setActionError(null)
    try {
      await mutations.skipOccurrence.mutateAsync({ id: pendingSkip.id, body: { scheduledDate: pendingSkip.scheduledDate } })
      setPendingSkip(null)
      setSuccessMessage('Occurrence skipped.')
    } catch (error) {
      setActionError(error)
    }
  }

  const categoryError = categoriesQuery.isError
  const rulesError = rulesQuery.isError
  const dueError = dueQuery.isError

  return <main className="recurring-page page-container">
    <PageHeader eyebrow="Planned spending" title="Recurring expenses" description="Review monthly due dates and confirm each expense when it actually happens." actions={<><div className="month-control recurring-asof-control"><label htmlFor="recurring-as-of">Due through</label><input id="recurring-as-of" type="date" value={asOf} onChange={(event) => { setAsOf(event.target.value); setSuccessMessage(null) }} /></div><button className="button button-primary" type="button" onClick={() => { setShowCreate(true); setEditingRule(null); setFormError(null); setSuccessMessage(null) }} disabled={categories.length === 0 || categoryError}><Icon name="plus" size={17} />Add recurring</button></>} />

    {categoryError && <AlertBanner title="Categories could not load." action={<button className="button button-quiet button-small" type="button" onClick={() => categoriesQuery.refetch()}>Try again</button>}>{errorMessage(categoriesQuery.error)}</AlertBanner>}
    {!categoryError && categories.length === 0 && !categoriesQuery.isPending && <EmptyState icon="tags" title="Add a category first">Every recurring expense needs a category before it can be saved.</EmptyState>}
    {!categoryError && categories.length > 0 && (showCreate || editingRule) && <RecurringRuleForm key={editingRule?.id ?? 'new'} rule={editingRule} categories={categories} currencyCode={currencyCode} isSubmitting={isSaving} serverError={formError} onSubmit={saveRule} onCancel={closeForm} onClearError={() => setFormError(null)} />}
    {pendingRecord && <RecurringRecordForm occurrence={pendingRecord} currencyCode={currencyCode} isSubmitting={mutations.recordOccurrence.isPending} serverError={actionError} onSubmit={recordOccurrence} onCancel={() => { setPendingRecord(null); setActionError(null) }} />}
    {successMessage && <div className="expense-success" role="status">{successMessage}</div>}
    {actionError && !pendingRecord && <AlertBanner title="Recurring action could not be completed.">{errorMessage(actionError)}</AlertBanner>}

    <section className="recurring-section" aria-labelledby="due-occurrences-title">
      <div className="list-heading"><span className="card-kicker" id="due-occurrences-title">DUE OCCURRENCES</span><span className="list-rule" /></div>
      <p className="recurring-section-intro">Nothing is added to expenses automatically. Confirm or skip each occurrence.</p>
      {dueQuery.isPending && <LoadingState label="Loading due occurrences..." />}
      {dueError && !dueQuery.isPending && <div className="recurring-state recurring-state-error" role="alert"><h2>Due occurrences could not load.</h2><p>{errorMessage(dueQuery.error)}</p><button className="button button-quiet" type="button" onClick={() => dueQuery.refetch()}>Try again</button></div>}
      {!dueQuery.isPending && !dueError && dueItems.length === 0 && <EmptyState icon="calendar" title="Nothing due">There are no unresolved monthly occurrences through {asOf}.</EmptyState>}
      {!dueQuery.isPending && !dueError && dueItems.length > 0 && <div className="recurring-due-list">{dueItems.map((item) => <article className="recurring-due-row" key={item.id}><div className="recurring-due-date"><strong>{item.scheduledDate}</strong><span>Scheduled</span></div><div className="recurring-due-summary"><strong>{item.ruleName}</strong><span>{item.categoryName}{item.note ? ` · ${item.note}` : ''}</span></div><div className="recurring-due-amount">{formatCurrency(item.amount, currencyCode)}</div><div className="recurring-due-status">{item.isPaused ? 'Paused' : item.isStopped ? 'Stopped' : 'Awaiting confirmation'}</div><div className="recurring-due-actions">{item.canRecord ? <><button className="button button-primary button-small" type="button" onClick={() => { setPendingRecord(item); setPendingSkip(null); setActionError(null) }}>Record expense</button><button className="button button-quiet button-small" type="button" onClick={() => { setPendingSkip(item); setActionError(null) }}>Skip</button></> : <span className="field-hint">Resume the rule to record</span>}</div>{pendingSkip?.id === item.id && <div className="recurring-inline-confirm" role="group" aria-label={`Skip ${item.ruleName} occurrence`}><p>Skip the {item.scheduledDate} occurrence? It will stay resolved without creating an expense.</p><button className="button button-danger button-small" type="button" onClick={skipOccurrence} disabled={mutations.skipOccurrence.isPending}>{mutations.skipOccurrence.isPending ? 'Skipping...' : 'Yes, skip'}</button><button className="button button-quiet button-small" type="button" onClick={() => setPendingSkip(null)}>Cancel</button></div>}</article>)}</div>}
    </section>

    <section className="recurring-section" aria-labelledby="rules-title">
      <div className="list-heading"><span className="card-kicker" id="rules-title">MONTHLY RULES</span><span className="list-rule" /></div>
      {rulesQuery.isPending && <LoadingState label="Loading recurring rules..." />}
      {rulesError && !rulesQuery.isPending && <div className="recurring-state recurring-state-error" role="alert"><h2>Recurring rules could not load.</h2><p>{errorMessage(rulesQuery.error)}</p><button className="button button-quiet" type="button" onClick={() => rulesQuery.refetch()}>Try again</button></div>}
      {!rulesQuery.isPending && !rulesError && rules.length === 0 && <EmptyState icon="calendar" title="No recurring rules yet">Add a monthly rule to create due reminders without automatic recording.</EmptyState>}
      {!rulesQuery.isPending && !rulesError && rules.length > 0 && <div className="recurring-rule-list">{rules.map((rule) => <article className="recurring-rule-row" key={rule.id}><div className="recurring-rule-summary"><strong>{rule.name}</strong><span>{rule.categoryName} · {formatCurrency(rule.amount, currencyCode)} monthly · starts {rule.startDate}{rule.endDate ? ` · ends ${rule.endDate}` : ''}</span></div><span className={`recurring-state-pill ${rule.isStopped ? 'is-stopped' : rule.isPaused ? 'is-paused' : 'is-active'}`}>{stateLabel(rule)}</span><div className="recurring-rule-actions"><button className="button button-secondary button-small" type="button" onClick={() => { setEditingRule(rule); setShowCreate(false); setFormError(null) }} disabled={isActionPending}>Edit</button>{!rule.isStopped && (rule.isPaused ? <button className="button button-quiet button-small" type="button" onClick={() => runRuleAction(mutations.resumeRule, rule.id, 'Recurring rule resumed.')} disabled={isActionPending}>Resume</button> : <button className="button button-quiet button-small" type="button" onClick={() => runRuleAction(mutations.pauseRule, rule.id, 'Recurring rule paused.')} disabled={isActionPending}>Pause</button>)}{!rule.isStopped && <button className="button button-danger button-small" type="button" onClick={() => setPendingStop(rule)} disabled={isActionPending}>Stop</button>}<button className="button button-danger button-small" type="button" onClick={() => setPendingDelete(rule)} disabled={isActionPending}>Delete</button></div>{pendingStop?.id === rule.id && <div className="recurring-inline-confirm" role="group" aria-label={`Stop ${rule.name}`}><p>Stop this rule? Existing resolved history stays, and no future occurrences will be generated.</p><button className="button button-danger button-small" type="button" onClick={() => runRuleAction(mutations.stopRule, rule.id, 'Recurring rule stopped.')} disabled={mutations.stopRule.isPending}>{mutations.stopRule.isPending ? 'Stopping...' : 'Yes, stop'}</button><button className="button button-quiet button-small" type="button" onClick={() => setPendingStop(null)}>Cancel</button></div>}{pendingDelete?.id === rule.id && <div className="recurring-inline-confirm" role="group" aria-label={`Delete ${rule.name}`}><p>{rule.isStopped ? 'Delete this rule? Rules with occurrence history cannot be removed.' : 'Delete this rule only if it has no occurrence history.'}</p><button className="button button-danger button-small" type="button" onClick={() => runRuleAction(mutations.deleteRule, rule.id, 'Recurring rule deleted.')} disabled={mutations.deleteRule.isPending}>{mutations.deleteRule.isPending ? 'Deleting...' : 'Yes, delete'}</button><button className="button button-quiet button-small" type="button" onClick={() => setPendingDelete(null)}>Cancel</button></div>}</article>)}</div>}
    </section>
  </main>
}
