export function getPreviousBudgetMonth(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null
  }

  const year = Number(month.slice(0, 4))
  const monthNumber = Number(month.slice(5))
  if (monthNumber < 1 || monthNumber > 12 || (year === 1 && monthNumber === 1)) {
    return null
  }

  const previousYear = monthNumber === 1 ? year - 1 : year
  const previousMonth = monthNumber === 1 ? 12 : monthNumber - 1
  return `${previousYear.toString().padStart(4, '0')}-${previousMonth.toString().padStart(2, '0')}`
}
