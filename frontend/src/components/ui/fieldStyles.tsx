export function fieldClass(hasError: boolean) {
  return (
    'w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm text-fg outline-none transition ' +
    'placeholder:text-fg-muted focus:ring-2 ' +
    'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-fg-muted ' +
    (hasError
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-line focus:border-brand-red focus:ring-brand-red/20')
  )
}

// Which messages should screen readers read with this field
export function describedByIds(id: string, hint?: string, error?: string) {
    if (error) return `${id}-error`;
    if (hint) return `${id}-hint`;
    return undefined;
}