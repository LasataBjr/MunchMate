import type { ReactNode } from 'react'

type FormFieldProps = {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  counter?: string
  children: ReactNode
}

function FormField({ id, label, required, hint, error, counter, children }: FormFieldProps) {
  const message = error ?? hint

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {(message || counter) && (
        <div className="mt-1.5 flex justify-between gap-3 text-xs">
          {message ? (
            <p id={error ? `${id}-error` : `${id}-hint`} className={error ? 'text-danger' : 'text-fg-muted'}>
              {message}
            </p>
          ) : (
            <span />
          )}
          {counter && <span className="shrink-0 tabular-nums text-fg-muted">{counter}</span>}
        </div>
      )}
    </div>
  )
}

export default FormField;