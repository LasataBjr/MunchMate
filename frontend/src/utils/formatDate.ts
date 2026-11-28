// SQLite stores UTC times like "2026-11-28 10:15:00". Show them in Nepal time.
function parse(value: string): Date {
  const hasZone = /[zZ]$|[+-]\d\d:\d\d$/.test(value)
  return new Date(hasZone ? value : `${value.replace(' ', 'T')}Z`)
}

export function formatDate(value: string): string {
  const date = parse(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kathmandu',
  }).format(date)
}

export function formatDateTime(value: string): string {
  const date = parse(value)
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