const MAX_SAFE_CENTS = 9007199254740991n

function serializedNumberCents(value) {
  const token = JSON.stringify(value)
  const [coefficient, exponentText] = token.split('e')
  const [whole, fraction = ''] = coefficient.split('.')
  const digits = BigInt(`${whole}${fraction}`)
  const power = Number(exponentText ?? 0) - fraction.length + 2

  if (power >= 0) {
    return digits * (10n ** BigInt(power))
  }

  const divisor = 10n ** BigInt(-power)
  return digits % divisor === 0n ? digits / divisor : null
}

export function validateAmount(value) {
  const amount = value.trim()
  if (!amount) {
    return 'Amount is required.'
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    return 'Enter a positive amount with no more than two decimal places.'
  }

  const [integerPart, fractionPart = ''] = amount.split('.')
  const integer = integerPart.replace(/^0+(?=\d)/, '')
  const cents = BigInt(integer) * 100n + BigInt(fractionPart.padEnd(2, '0') || '0')
  if (cents <= 0n) {
    return 'Amount must be greater than zero.'
  }
  if (cents > MAX_SAFE_CENTS) {
    return 'Amount is too large for exact browser entry.'
  }

  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || serializedNumberCents(numericAmount) !== cents) {
    return 'Amount cannot be transmitted exactly by this browser.'
  }

  return null
}
