import { SearchX } from 'lucide-react'
import type { Machine } from '../types/machine.types'
import { buttonStyles } from '../../../../components/ui/Button'
import MachineCard from './MachineCard'

interface MachineGridProps {
  machines: Machine[]
  onReset?: () => void
}

function MachineGrid({ machines, onReset }: MachineGridProps) {
  if (machines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-alt px-6 py-14 text-center">
        <SearchX className="mx-auto h-10 w-10 text-fg-muted" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">No machines found</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Try a different search word or category.
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className={`${buttonStyles({ variant: 'secondary', size: 'sm' })} mt-5`}
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {machines.map((machine) => (
        <MachineCard key={machine.id} machine={machine} />
      ))}
    </div>
  )
}

export default MachineGrid;