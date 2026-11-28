import { useMemo, useState } from 'react'
import { Check, Package, Plus, Search } from 'lucide-react'

import Button from '../../../../components/ui/Button'
import { formatNpr } from '../../../../utils/formatPrice'
import type { Machine } from '../../machine-catalog/types/machine.types'

interface MachineSelectorProps {
  machines: Machine[]
  selectedIds: Set<number>
  onAddMachine: (id: number) => void
  disabled?: boolean
}

function MachineSelector({
  machines,
  selectedIds,
  onAddMachine,
  disabled = false,
}: MachineSelectorProps) {
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return machines;
    return machines.filter((m) =>
      `${m.name} ${m.model_number} ${m.category_name}`.toLowerCase().includes(term)
    )
  }, [machines, search]);

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, model or category"
          aria-label="Search machines to add"
          className="w-full rounded-md border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">
          No machines match your search.
        </p>
      ) : (
        <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {visible.map((machine) => {
            const added = selectedIds.has(machine.id)

            return (
              <li
                key={machine.id}
                className={`flex items-center gap-3 p-3 transition-colors ${
                  added ? 'bg-brand-red/5' : 'hover:bg-hover'
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-fg-muted">
                  <Package className="h-5 w-5" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-fg">{machine.name}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {machine.category_name} · Model {machine.model_number}
                  </p>
                </div>

                <p className="hidden text-sm font-semibold text-fg sm:block">
                  {formatNpr(machine.price_npr)}
                </p>

                {added ? (
                  <span className="inline-flex w-24 items-center justify-center gap-1 text-sm font-semibold text-accent">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Added
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-24"
                    onClick={() => onAddMachine(machine.id)}
                    disabled={disabled}
                    aria-label={`Add ${machine.name}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default MachineSelector