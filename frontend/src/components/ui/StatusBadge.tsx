import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'info' | 'warning' | 'accent' | 'success' | 'danger'

const tones: Record<StatusTone, string> = {
  neutral: 'bg-hover text-fg-muted',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  accent: 'bg-brand-red/10 text-accent',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
}

function StatusBadge({ tone = 'neutral', children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

export default StatusBadge;