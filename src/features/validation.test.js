import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSafeRedirectPath } from '../auth/redirects.js'
import { validateAmount } from './amountValidation.js'
import { getLocalDateValue, validateDate } from './dateUtils.js'
import { getPreviousBudgetMonth } from './budgets/budgetCopyUtils.js'
import { formatCurrency, supportedCurrencies } from './settings/currencyFormatting.js'
import { getCategoryPercentageLabel, getComparisonPercentageLabel, getComparisonStatus } from './dashboard/dashboardComparison.js'

test('validateAmount accepts positive exact cent values', () => {
  assert.equal(validateAmount('0.01'), null)
  assert.equal(validateAmount('12'), null)
  assert.equal(validateAmount('12.30'), null)
})

test('validateAmount rejects malformed, non-positive, and unsafe values', () => {
  assert.equal(validateAmount(''), 'Amount is required.')
  assert.equal(validateAmount('0'), 'Amount must be greater than zero.')
  assert.equal(validateAmount('12.345'), 'Enter a positive amount with no more than two decimal places.')
  assert.equal(validateAmount('1e2'), 'Enter a positive amount with no more than two decimal places.')
  assert.equal(validateAmount('9999999999999999.99'), 'Amount is too large for exact browser entry.')
})

test('date utilities preserve local calendar dates', () => {
  assert.equal(getLocalDateValue(new Date(2026, 0, 5)), '2026-01-05')
  assert.equal(validateDate('2024-02-29'), null)
  assert.equal(validateDate('2025-02-29'), 'Enter a valid calendar date.')
  assert.equal(validateDate('2026-2-7'), 'Enter a date in YYYY-MM-DD format.')
})

test('redirect helper allows safe private paths only', () => {
  assert.equal(getSafeRedirectPath({ from: '/expenses' }), '/expenses')
  assert.equal(getSafeRedirectPath({ from: { pathname: '/budgets', search: '?month=2026-10', hash: '#top' } }), '/budgets?month=2026-10#top')
  assert.equal(getSafeRedirectPath({ from: '//evil.example' }), '/')
  assert.equal(getSafeRedirectPath({ from: '/login' }), '/')
})

test('dashboard comparison labels handle zero and signed changes', () => {
  assert.equal(getComparisonStatus({ difference: 100 }), 'Spent more')
  assert.equal(getComparisonStatus({ difference: -100 }), 'Spent less')
  assert.equal(getComparisonStatus({ difference: 0 }), 'No change')
  assert.equal(getComparisonPercentageLabel({ previousTotalSpent: 0, currentTotalSpent: 50, percentageChange: null }), 'No spending last month')
  assert.equal(getComparisonPercentageLabel({ previousTotalSpent: 0, currentTotalSpent: 0, percentageChange: null }), 'No change')
  assert.equal(getComparisonPercentageLabel({ previousTotalSpent: 400, currentTotalSpent: 500, percentageChange: 25 }), '+25.00%')
  assert.equal(getCategoryPercentageLabel({ previousSpent: 0, currentSpent: 25, percentageChange: null }), 'New spending')
  assert.equal(getCategoryPercentageLabel({ previousSpent: 100, currentSpent: 0, percentageChange: -100 }), '-100.00%')
})

test('budget copy month helper handles January boundaries', () => {
  assert.equal(getPreviousBudgetMonth('2026-01'), '2025-12')
  assert.equal(getPreviousBudgetMonth('2026-02'), '2026-01')
  assert.equal(getPreviousBudgetMonth('0001-01'), null)
  assert.equal(getPreviousBudgetMonth('2026-13'), null)
})

test('currency formatting supports the account allowlist with two decimals', () => {
  assert.deepEqual(supportedCurrencies.map((currency) => currency.code), ['USD', 'MMK', 'EUR', 'GBP', 'SGD', 'THB'])
  assert.match(formatCurrency(1234.5, 'EUR'), /1,?234\.50|1\.234,50/)
  assert.equal(formatCurrency(1234.5, null), '—')
})
