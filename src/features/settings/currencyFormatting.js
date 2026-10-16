export const supportedCurrencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'MMK', name: 'Myanmar Kyat' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'THB', name: 'Thai Baht' },
]

export function formatCurrency(value, currencyCode) {
  if (!currencyCode || !Number.isFinite(Number(value))) {
    return '—'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}
