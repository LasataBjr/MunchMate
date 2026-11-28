import { Loader2 } from 'lucide-react'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

function LoadingSpinner({ size = 'md', label = 'Loading', className = '' }: LoadingSpinnerProps) {
  return (
    <span role="status" className={`inline-flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-accent`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export default LoadingSpinner;