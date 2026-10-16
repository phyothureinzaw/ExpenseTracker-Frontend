export function getComparisonStatus(comparison) {
  if (comparison.difference === 0) {
    return 'No change'
  }

  return comparison.difference > 0 ? 'Spent more' : 'Spent less'
}

export function getComparisonPercentageLabel(comparison) {
  if (comparison.previousTotalSpent === 0 && comparison.currentTotalSpent > 0) {
    return 'No spending last month'
  }

  if (comparison.percentageChange === null || comparison.percentageChange === undefined) {
    return 'No change'
  }

  const sign = comparison.percentageChange > 0 ? '+' : ''
  return `${sign}${comparison.percentageChange.toFixed(2)}%`
}

export function getCategoryPercentageLabel(row) {
  if (row.previousSpent === 0 && row.currentSpent > 0) {
    return 'New spending'
  }

  if (row.percentageChange === null || row.percentageChange === undefined) {
    return row.currentSpent === 0 ? 'No change' : 'New spending'
  }

  const sign = row.percentageChange > 0 ? '+' : ''
  return `${sign}${row.percentageChange.toFixed(2)}%`
}
