import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ApiError } from '../api/apiClient'
import { Icon, LoadingState, PageHeader } from '../components/ui'
import { getLocalBudgetMonth } from '../features/budgets/budgetUtils'
import { getCategoryPercentageLabel, getComparisonPercentageLabel, getComparisonStatus } from '../features/dashboard/dashboardComparison'
import { useDashboard } from '../features/dashboard/dashboardHooks'
import { formatCurrency } from '../features/settings/currencyFormatting'
import { useSettings } from '../features/settings/settingsHooks'

const categoryColors = ['#0f766e', '#2f8f83', '#4f6d8a', '#7561a6', '#9b6a3d', '#3d8c72', '#9f4f67', '#66806f']

function formatDateLabel(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(year, month - 1, day))
}

function errorMessage(error) {
  return error instanceof ApiError ? error.message : 'The dashboard API could not be reached.'
}

function colorForCategory(categoryId) {
  return categoryColors[Math.abs(categoryId) % categoryColors.length]
}

function formatMonthLabel(value) {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function formatSignedCurrency(value, currencyCode) {
  const absoluteValue = formatCurrency(Math.abs(value), currencyCode)
  return value > 0 ? `+${absoluteValue}` : value < 0 ? `-${absoluteValue}` : absoluteValue
}

function SpendingPie({ rows, currencyCode }) {
  if (rows.length === 0) {
    return <div className="chart-empty">No expenses to chart for this month.</div>
  }

  return (
    <>
      <div className="chart-frame" aria-label="Spending by category chart">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={rows} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" innerRadius={62} outerRadius={98} paddingAngle={2}>
              {rows.map((row) => <Cell key={row.categoryId} fill={colorForCategory(row.categoryId)} />)}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value, currencyCode)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <table className="chart-data-table"><caption className="sr-only">Spending by category data</caption><tbody>{rows.map((row) => <tr key={row.categoryId}><th scope="row"><span className="chart-color-dot" style={{ backgroundColor: colorForCategory(row.categoryId) }} />{row.categoryName}</th><td>{formatCurrency(row.amount, currencyCode)}</td></tr>)}</tbody></table>
    </>
  )
}

function DailyLine({ rows, currencyCode }) {
  return (
    <>
      <div className="chart-frame" aria-label="Daily spending chart">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rows} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
            <XAxis dataKey="date" tickFormatter={formatDateLabel} minTickGap={22} />
            <YAxis tickFormatter={(value) => formatCurrency(value, currencyCode)} width={76} />
            <Tooltip labelFormatter={(value) => formatDateLabel(value)} formatter={(value) => formatCurrency(value, currencyCode)} />
            <Line type="monotone" dataKey="amount" name="Spent" stroke="#0f766e" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="chart-data-details">
        <summary>View daily data</summary>
      <table className="chart-data-table"><caption className="sr-only">Daily spending data</caption><tbody>{rows.map((row) => <tr key={row.date}><th scope="row">{formatDateLabel(row.date)}</th><td>{formatCurrency(row.amount, currencyCode)}</td></tr>)}</tbody></table>
      </details>
    </>
  )
}

function BudgetRows({ rows, currencyCode }) {
  if (rows.length === 0) {
    return <div className="dashboard-empty-inline"><strong>Nothing to review yet</strong><span>Add an expense or set a budget to see your monthly picture.</span><div className="dashboard-empty-actions"><Link className="button button-primary button-small" to="/expenses"><Icon name="plus" size={15} />Add expense</Link><Link className="button button-quiet button-small" to="/budgets">Set a budget</Link></div></div>
  }

  return <div className="dashboard-budget-list">{rows.map((row) => {
    const isOver = row.remaining !== null && row.remaining < 0
    const visualPercentage = row.usedPercentage === null ? 0 : Math.min(100, Math.max(0, row.usedPercentage))
    return <article className={`dashboard-budget-row ${isOver ? 'is-over-budget' : ''}`} key={row.categoryId}><div className="dashboard-budget-heading"><strong>{row.categoryName}</strong>{row.limit === null ? <span className="budget-no-limit">No budget set</span> : <span>{formatCurrency(row.spent, currencyCode)} / {formatCurrency(row.limit, currencyCode)}</span>}</div>{row.limit !== null && <><div className="budget-progress-track" role="progressbar" aria-label={`${row.categoryName} budget used`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={row.usedPercentage} aria-valuetext={`${row.usedPercentage}% used`}><span style={{ width: `${visualPercentage}%` }} /></div><div className="dashboard-budget-details"><span>{row.usedPercentage}% used</span><span>{isOver ? `Over budget by ${formatCurrency(Math.abs(row.remaining), currencyCode)}` : `${formatCurrency(row.remaining, currencyCode)} remaining`}</span></div></>}{row.limit === null && <div className="dashboard-budget-details"><span>{formatCurrency(row.spent, currencyCode)} spent</span><Link to="/budgets">Set a budget</Link></div>}</article>
  })}</div>
}

function FullMonthComparison({ comparison, selectedMonth, currencyCode }) {
  const selectedLabel = formatMonthLabel(selectedMonth)
  const previousLabel = formatMonthLabel(comparison.previousMonth)

  return (
    <section className="dashboard-comparison-card dashboard-card" aria-labelledby="full-month-comparison-title">
      <div className="dashboard-card-heading dashboard-comparison-heading">
        <div>
          <span className="card-kicker">Full-month comparison</span>
          <h2 id="full-month-comparison-title">{selectedLabel} vs {previousLabel}</h2>
          <p>Full-month totals include every recorded expense dated in each calendar month.</p>
        </div>
        <div className="comparison-summary" aria-label="Full-month spending summary">
          <strong>{getComparisonStatus(comparison)}</strong>
          <span>{formatSignedCurrency(comparison.difference, currencyCode)}</span>
          <small>{getComparisonPercentageLabel(comparison)}</small>
        </div>
      </div>
      <div className="comparison-totals" aria-label="Monthly spending totals">
        <div><span>{selectedLabel}</span><strong>{formatCurrency(comparison.currentTotalSpent, currencyCode)}</strong></div>
        <div><span>{previousLabel}</span><strong>{formatCurrency(comparison.previousTotalSpent, currencyCode)}</strong></div>
      </div>
      {comparison.byCategory.length === 0 ? (
        <div className="comparison-empty">No spending recorded in either full month.</div>
      ) : (
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <caption>Full-month spending comparison by category</caption>
            <thead>
              <tr><th scope="col">Category</th><th scope="col">{previousLabel}</th><th scope="col">{selectedLabel}</th><th scope="col">Difference</th><th scope="col">Change</th></tr>
            </thead>
            <tbody>
              {comparison.byCategory.map((row) => (
                <tr key={row.categoryId}>
                  <th scope="row">{row.categoryName}</th>
                  <td data-label={previousLabel}>{formatCurrency(row.previousSpent, currencyCode)}</td>
                  <td data-label={selectedLabel}>{formatCurrency(row.currentSpent, currencyCode)}</td>
                  <td data-label="Difference">{formatSignedCurrency(row.difference, currencyCode)}</td>
                  <td data-label="Change">{getCategoryPercentageLabel(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function DashboardPage() {
  const [month, setMonth] = useState(getLocalBudgetMonth)
  const dashboardQuery = useDashboard(month)
  const settingsQuery = useSettings()
  const dashboard = dashboardQuery.data
  const currencyCode = settingsQuery.data?.currencyCode ?? null

  return (
    <main className="dashboard-page page-container">
      <PageHeader
         eyebrow="Monthly overview"
        title="Dashboard"
        description="A clear view of what you spent, what you planned, and what still has room."
        actions={<div className="month-control"><label htmlFor="dashboard-month">Viewing month</label><input id="dashboard-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>}
      />
      {dashboardQuery.isFetching && !dashboardQuery.isPending && <div className="dashboard-refresh" role="status">Refreshing {month}...</div>}
      {dashboardQuery.isPending && <LoadingState label="Loading dashboard..." />}
      {dashboardQuery.isError && !dashboardQuery.isPending && <div className="dashboard-state dashboard-state-error" role="alert"><h2>Dashboard could not load.</h2><p>{errorMessage(dashboardQuery.error)}</p><button className="button button-quiet" type="button" onClick={() => dashboardQuery.refetch()}>Try again</button></div>}
      {dashboard && !dashboardQuery.isPending && !dashboardQuery.isError && <>
        <section className="dashboard-metrics" aria-label="Monthly totals"><article className="metric-card metric-spent"><div className="metric-label"><span className="metric-icon"><Icon name="activity" size={18} /></span><span>Total spent</span></div><strong>{formatCurrency(dashboard.totalSpent, currencyCode)}</strong><small>Across {dashboard.expenseCount} recorded {dashboard.expenseCount === 1 ? 'expense' : 'expenses'}</small></article><article className="metric-card"><div className="metric-label"><span className="metric-icon"><Icon name="receipt" size={18} /></span><span>Expenses</span></div><strong>{dashboard.expenseCount}</strong><small>Items in {month}</small></article><article className="metric-card"><div className="metric-label"><span className="metric-icon"><Icon name="wallet" size={18} /></span><span>Allocated budget</span></div><strong>{formatCurrency(dashboard.totalBudget, currencyCode)}</strong><small><Link to="/budgets">Review monthly limits <Icon name="arrow" size={14} /></Link></small></article></section>
          <FullMonthComparison comparison={dashboard.comparison} selectedMonth={month} currencyCode={currencyCode} />
          <section className="dashboard-chart-grid"><article className="dashboard-card chart-card"><div className="dashboard-card-heading"><span className="card-kicker">Breakdown</span><h2>Spending by category</h2><p>See which parts of your month are carrying the most weight.</p></div><SpendingPie rows={dashboard.spendingByCategory} currencyCode={currencyCode} /></article><article className="dashboard-card chart-card"><div className="dashboard-card-heading"><span className="card-kicker">Daily pace</span><h2>Daily spending</h2><p>Every day in the selected month, including quiet ones.</p></div><DailyLine rows={dashboard.dailySpending} currencyCode={currencyCode} /></article></section>
          <section className="dashboard-budget-card dashboard-card"><div className="dashboard-card-heading dashboard-budget-intro"><div><span className="card-kicker">Budget health</span><h2>Category budgets</h2><p>Stay ahead of overspending by giving each category a clear boundary.</p></div><Link className="text-link" to="/budgets">Manage budgets <Icon name="arrow" size={14} /></Link></div><BudgetRows rows={dashboard.categoryBudgets} currencyCode={currencyCode} /></section>
      </>}
    </main>
  )
}
