import { ArrowRight, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Machine } from '../types/machine.types'

interface MachineCardProps {
  machine: Machine
}

// Created once, not on every render
const priceFormatter = new Intl.NumberFormat('en-NP', { maximumFractionDigits: 2 })

function MachineCard({ machine }: MachineCardProps) {
  return (
    <Link
      to={`/machines/${machine.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card text-fg transition-all hover:-translate-y-1 hover:border-brand-red/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red"
    >
      <article className="flex h-full flex-col">
        <div className="flex h-48 items-center justify-center bg-surface-alt">
          {/* Image display will be connected once we verify how the backend serves image paths. */}
          <Package className="h-12 w-12 text-fg-muted/50" aria-hidden="true" />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="inline-block self-start rounded-full bg-brand-red/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
            {machine.category_name}
          </p>

          <h2 className="mt-3 text-lg font-semibold">{machine.name}</h2>
          <p className="mt-1 text-sm text-fg-muted">Model: {machine.model_number}</p>

          {machine.description && (
            <p className="mt-3 line-clamp-2 text-sm text-fg-muted">{machine.description}</p>
          )}

          {/* mt-auto pushes the price row to the bottom so all cards line up */}
          <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
            <p className="text-lg font-bold">NPR {priceFormatter.format(machine.price_npr)}</p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
              View details
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default MachineCard;