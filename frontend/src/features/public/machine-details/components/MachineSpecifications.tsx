interface MachineSpecificationsProps {
  specifications: string | null
}

function parseSpecs(text: string): [string, string][] | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  const rows: [string, string][] = []
  for (const line of lines) {
    const colon = line.indexOf(':')
    if (colon <= 0 || colon === line.length - 1) return null // not "Key: Value" format
    rows.push([line.slice(0, colon).trim(), line.slice(colon + 1).trim()])
  }
  return rows
}

function MachineSpecifications({ specifications }: MachineSpecificationsProps) {
  const rows = specifications ? parseSpecs(specifications) : null

  return (
    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading" className="text-xl font-semibold">
        Specifications
      </h2>

      {!specifications && (
        <p className="mt-3 text-fg-muted">Specifications are not available yet.</p>
      )}

      {specifications && rows && (
        <dl className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-fg-muted">{label}</dt>
              <dd className="text-sm text-fg sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {specifications && !rows && (
        <div className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-line bg-surface-alt p-5 text-sm text-fg">
          {specifications}
        </div>
      )}
    </section>
  )
}

export default MachineSpecifications