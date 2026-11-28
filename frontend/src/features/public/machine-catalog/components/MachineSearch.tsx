import { Search } from 'lucide-react'

interface MachineSearchProps {
  value: string
  onChange: (value: string) => void
}

function MachineSearch({ value, onChange }: MachineSearchProps) {
  return (
    <div className="relative w-full sm:max-w-sm sm:flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name or model"
        aria-label="Search machines"
        className="w-full rounded-md border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
      />
    </div>
  )
}

export default MachineSearch;