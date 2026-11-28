import { useId, type ComponentProps } from 'react'
import FormField from './FormField'
import { describedByIds, fieldClass } from './fieldStyles'

type TextareaProps = ComponentProps<'textarea'> & {
  label: string
  hint?: string
  error?: string
  showCount?: boolean
}

function Textarea({
  label,
  hint,
  error,
  showCount = false,
  id,
  className = '',
  required,
  maxLength,
  value,
  ...rest
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  const counter =
    showCount && maxLength && typeof value === 'string' ? `${value.length}/${maxLength}` : undefined

  return (
    <FormField id={textareaId} label={label} required={required} hint={hint} error={error} counter={counter}>
      <textarea
        id={textareaId}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={describedByIds(textareaId, hint, error)}
        className={`${fieldClass(Boolean(error))} resize-y ${className}`}
        {...rest}
      />
    </FormField>
  )
}

export default Textarea;