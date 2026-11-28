import { useId, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import FormField from './FormField'
import { describedByIds, fieldClass } from './fieldStyles'

type PasswordInputProps = Omit<ComponentProps<'input'>, 'size' | 'type'> & {
  label: string
  hint?: string
  error?: string
}

function PasswordInput({
  label,
  hint,
  error,
  id,
  className = '',
  required,
  ...rest
}: PasswordInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <FormField id={inputId} label={label} required={required} hint={hint} error={error}>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedByIds(inputId, hint, error)}
          className={`${fieldClass(Boolean(error))} pr-11 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-brand-red"
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </FormField>
  )
}

export default PasswordInput;