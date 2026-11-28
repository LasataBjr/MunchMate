import { useId, type ComponentProps } from 'react'
import { ChevronDown } from 'lucide-react'
import FormField from './FormField'
import { describedByIds, fieldClass } from './fieldStyles'

export type SelectOption = {
  label: string
  value: string
  disabled?: boolean
}

type SelectProps = ComponentProps<'select'> & {
  label: string
  options: SelectOption[]
  placeholder?: string
  hint?: string
  error?: string
}

function Select({
  label,
  options,
  placeholder,
  hint,
  error,
  id,
  className = '',
  required,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <FormField id={selectId} label={label} required={required} hint={hint} error={error}>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedByIds(selectId, hint, error)}
          className={`${fieldClass(Boolean(error))} appearance-none pr-10 ${className}`}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
          aria-hidden="true"
        />
      </div>
    </FormField>
  )
}

export default Select;