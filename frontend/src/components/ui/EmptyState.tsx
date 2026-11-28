import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  title: string
  message?: string
  icon?: ReactNode
  action?: ReactNode
  as?: 'h2' | 'h3'
  className?: string
}

function EmptyState({ title, message, icon, action, as: Heading = 'h3', className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-alt px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-fg-muted shadow-sm">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden="true" />}
      </div>

      <Heading className="mt-5 text-lg font-semibold text-fg">{title}</Heading>

      {message && <p className="mt-2 max-w-md text-sm leading-6 text-fg-muted">{message}</p>}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState;