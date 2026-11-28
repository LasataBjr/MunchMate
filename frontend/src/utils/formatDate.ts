// SQLite stores UTC times like "2026-11-28 10:15:00". Show them in Nepal time.
export function formatDate(value: string): string {
  const hasZone = /[zZ]$|[+-]\d\d:\d\d$/.test(value)
  const date = new Date(hasZone ? value : `${value.replace(' ', 'T')}Z`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kathmandu',
  }).format(date)
}