import { useState } from 'react'
import { ApiError } from '../api/apiClient'
import { AlertBanner, LoadingState, PageHeader } from '../components/ui'
import { formatCurrency, supportedCurrencies } from '../features/settings/currencyFormatting'
import { useSettings, useUpdateSettings } from '../features/settings/settingsHooks'

function errorMessage(error) {
  return error instanceof ApiError ? error.message : 'The settings API could not be reached.'
}

export function SettingsPage() {
  const settingsQuery = useSettings()
  const updateSettings = useUpdateSettings()
  const [draftCurrency, setDraftCurrency] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const settings = settingsQuery.data
  const currencyCode = draftCurrency ?? settings?.currencyCode ?? null
  const isSaving = updateSettings.isPending

  function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage(null)
    updateSettings.mutate({ currencyCode }, {
      onSuccess: () => {
        setDraftCurrency(null)
        setSuccessMessage('Currency preference saved.')
      },
    })
  }

  if (settingsQuery.isPending) {
    return <main className="settings-page page-container"><LoadingState label="Loading settings..." /></main>
  }

  if (settingsQuery.isError) {
    return <main className="settings-page page-container"><div className="settings-state settings-state-error" role="alert"><h2>Settings could not load.</h2><p>{errorMessage(settingsQuery.error)}</p><button className="button button-quiet" type="button" onClick={() => settingsQuery.refetch()}>Try again</button></div></main>
  }

  const canChangeCurrency = settings.canChangeCurrency

  return (
    <main className="settings-page page-container">
      <PageHeader eyebrow="Account" title="Settings" description="Choose the currency used to display your financial amounts." />
      <section className="settings-card dashboard-card" aria-labelledby="currency-settings-title">
        <div className="dashboard-card-heading">
          <span className="card-kicker">Currency preference</span>
          <h2 id="currency-settings-title">Account currency</h2>
          <p>One currency is used across your account. The app does not convert exchange rates or support mixed-currency records.</p>
        </div>
        {!canChangeCurrency && <div className="settings-restriction" role="note">{settings.changeBlockedReason}</div>}
        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-field">
            <label htmlFor="settings-currency">Currency</label>
            <select id="settings-currency" value={currencyCode ?? ''} onChange={(event) => { setDraftCurrency(event.target.value); setSuccessMessage(null) }} disabled={!canChangeCurrency || isSaving}>
              {supportedCurrencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>)}
            </select>
          </div>
          <div className="currency-preview" aria-live="polite"><span>Display preview</span><strong>{formatCurrency(1234.56, currencyCode)}</strong><small>Amounts are stored and displayed using two decimal places as this app's convention.</small></div>
          {updateSettings.isError && <AlertBanner title={updateSettings.error.status === 409 ? 'Currency change is unavailable.' : 'Currency could not be saved.'}>{errorMessage(updateSettings.error)}</AlertBanner>}
          {successMessage && <div className="expense-success" role="status">{successMessage}</div>}
          <button className="button button-primary" type="submit" disabled={!canChangeCurrency || !currencyCode || currencyCode === settings.currencyCode || isSaving}>{isSaving ? 'Saving...' : 'Save currency'}</button>
        </form>
      </section>
    </main>
  )
}
