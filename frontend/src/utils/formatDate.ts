const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

// SQLite stores UTC times like "2026-11-28 10:15:00".
// A plain date (no time) means "until the end of that day" in Nepal time.
export function parseDbDate(value: string): Date {
  if (DATE_ONLY.test(value)) return new Date(`${value}T23:59:59+05:45`)

  const hasZone = /[zZ]$|[+-]\d\d:\d\d$/.test(value)
  return new Date(hasZone ? value : `${value.replace(' ', 'T')}Z`)
}

export function formatDate(value: string): string {
  const date = parseDbDate(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kathmandu',
  }).format(date)
}

export function formatDateTime(value: string): string {
  const date = parseDbDate(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kathmandu',
  }).format(date)
}

// Whole days from now until the date. Negative means it has passed.
export function daysUntil(value: string): number | null {
  const date = parseDbDate(value)
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000)
}