import { useId, type ComponentProps } from 'react'
import FormField from './FormField'
import { describedByIds, fieldClass } from './fieldStyles'

type InputProps = Omit<ComponentProps<'input'>, 'size'> & {
  label: string
  hint?: string
  error?: string
}

function Input({ label, hint, error, id, className = '', required, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FormField id={inputId} label={label} required={required} hint={hint} error={error}>
      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedByIds(inputId, hint, error)}
        className={`${fieldClass(Boolean(error))} ${className}`}
        {...rest}
      />
    </FormField>
  )
}

export default Input;