import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Button from './Button'

type ErrorMessageProps = {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
  children?: ReactNode // extra content, e.g. a login link
}

function ErrorMessage({
  title = 'Something went wrong',
  message = "We couldn't complete your request. Please try again.",
  onRetry,
  retryLabel = 'Try again',
  className = '',
  children,
}: ErrorMessageProps) {
  return (
    <div role="alert" className={`rounded-xl border border-danger-line bg-danger-bg p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-danger">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-fg-muted">{message}</p>

          {children && <div className="mt-3 text-sm">{children}</div>}

          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage;