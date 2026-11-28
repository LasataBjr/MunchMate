import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, type LucideIcon } from 'lucide-react'

import { buttonStyles } from '../../../../components/ui/Button'

export type AttentionItem = {
  key: string
  icon: LucideIcon
  title: string
  detail: string
  to: string
  action: string
}

const MAX_SHOWN = 4

function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <section
        aria-labelledby="attention-heading"
        className="flex items-start gap-4 rounded-xl border border-success-line bg-success-bg p-5"
      >
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden="true" />
        <div>
          <h2 id="attention-heading" className="font-semibold text-fg">
            You are all caught up
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Nothing needs your attention right now. We will show new quotations and payments here.
          </p>
        </div>
      </section>
    )
  }

  const shown = items.slice(0, MAX_SHOWN)
  const hidden = items.length - shown.length

  return (
    <section
      aria-labelledby="attention-heading"
      className="overflow-hidden rounded-xl border border-brand-red/40 bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 bg-brand-red/5 px-5 py-4">
        <h2 id="attention-heading" className="font-semibold text-fg">
          Needs your attention
        </h2>
        <span className="rounded-full bg-brand-red px-2.5 py-0.5 text-xs font-bold text-white">
          {items.length}
        </span>
      </div>

      <ul className="divide-y divide-line">
        {shown.map(({ key, icon: Icon, title, detail, to, action }) => (
          <li
            key={key}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-fg">{title}</p>
                <p className="truncate text-sm text-fg-muted">{detail}</p>
              </div>
            </div>

            <Link to={to} className={`${buttonStyles({ size: 'sm' })} w-full sm:w-auto`}>
              {action}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <p className="border-t border-line px-5 py-3 text-sm text-fg-muted">
          And {hidden} more. Open{' '}
          <Link to="/customer/quotations" className="font-medium text-accent hover:underline">
            quotations
          </Link>{' '}
          or{' '}
          <Link to="/customer/orders" className="font-medium text-accent hover:underline">
            orders
          </Link>{' '}
          to see them all.
        </p>
      )}
    </section>
  )
}

export default AttentionPanel;