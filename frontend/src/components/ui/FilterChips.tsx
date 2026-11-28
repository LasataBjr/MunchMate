type FilterChipsProps<T extends string> = {
  label: string
  options: readonly T[]
  labels: Record<T, string>
  counts: Record<T, number>
  value: T
  onChange: (value: T) => void
}

function FilterChips<T extends string>({
  label,
  options,
  labels,
  counts,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red ${
            value === option
              ? 'border-fg bg-fg font-medium text-surface'
              : 'border-line bg-card text-fg-muted hover:bg-hover hover:text-fg'
          }`}
        >
          {labels[option]}
          <span className="ml-1.5 tabular-nums opacity-70">{counts[option]}</span>
        </button>
      ))}
    </div>
  )
}

export default FilterChips