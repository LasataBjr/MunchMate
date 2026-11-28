import { Link } from 'react-router-dom'
import { ArrowRight, type LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: number | null // null means "could not load"
  description: string
  icon: LucideIcon
  to: string
  highlight?: boolean
}

function StatCard({ title, value, description, icon: Icon, to, highlight = false }: StatCardProps) {
  return (
    <Link
      to={to}
      className={`group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red ${
        highlight ? 'border-brand-red/40' : 'border-line'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <ArrowRight
          className="h-4 w-4 text-fg-muted transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>

      <p className="mt-4 text-sm font-medium text-fg-muted">{title}</p>
      <p
        className={`mt-1 text-3xl font-extrabold tabular-nums ${
          highlight ? 'text-accent' : 'text-fg'
        }`}
      >
        {value ?? '—'}
      </p>
      <p className="mt-1 text-xs text-fg-muted">{value === null ? 'Could not load' : description}</p>
    </Link>
  )
}

export default StatCard