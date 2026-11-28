import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, FileText, History, Package, RefreshCw } from 'lucide-react'

import Button, { buttonStyles } from '../../../../components/ui/Button'
import EmptyState from '../../../../components/ui/EmptyState'
import StatusBadge, { type StatusTone } from '../../../../components/ui/StatusBadge'
import { formatDate } from '../../../../utils/formatDate'

export type ActivityItem = {
  key: string
  type: 'enquiry' | 'quotation' | 'order'
  title: string
  reference: string
  label: string
  tone: StatusTone
  date: string
  to: string
}

const icons = {
  enquiry: ClipboardList,
  quotation: FileText,
  order: Package,
}

type RecentActivityProps = {
  activities: ActivityItem[]
  refreshing: boolean
  onRefresh: () => void
}

function RecentActivity({ activities, refreshing, onRefresh }: RecentActivityProps) {
  return (
    <section
      aria-labelledby="activity-heading"
      className="overflow-hidden rounded-xl border border-line bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 id="activity-heading" className="font-semibold text-fg">
            Recent activity
          </h2>
          <p className="text-sm text-fg-muted">Your latest enquiries, quotations and orders.</p>
        </div>

        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span className="hidden sm:inline">Refresh</span>
          <span className="sr-only sm:hidden">Refresh</span>
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<History className="h-7 w-7" aria-hidden="true" />}
            title="No activity yet"
            message="When you send an enquiry, it will show up here."
            action={
              <Link to="/machines" className={buttonStyles({ size: 'sm' })}>
                Browse machines
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {activities.map(({ key, type, title, reference, label, tone, date, to }) => {
            const Icon = icons[type]

            return (
              <li key={key}>
                <Link
                  to={to}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-red"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-fg">{title}</p>
                      <p className="truncate font-mono text-xs text-fg-muted">
                        {reference} · {formatDate(date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge tone={tone}>{label}</StatusBadge>
                    <ArrowRight className="hidden h-4 w-4 text-fg-muted sm:block" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default RecentActivity;