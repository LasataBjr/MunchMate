import { ChevronDown } from 'lucide-react'
import type { MachineCategory } from '../types/machine.types'

interface MachineFiltersProps {
  categories: MachineCategory[]
  value: string
  onChange: (value: string) => void
}

function MachineFilters({ categories, value, onChange }: MachineFiltersProps) {
  return (
    <div className="relative w-full sm:w-52">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Filter machines by category"
        className="w-full appearance-none rounded-md border border-line bg-card py-2.5 pl-3 pr-9 text-sm text-fg focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
        aria-hidden="true"
      />
    </div>
  )
}

export default MachineFilters;