import { useState, type FormEventHandler } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { CheckCircle2, Info } from 'lucide-react'
import AuthShell from '../../../components/layout/AuthShell'
import MachineArt from '../../../components/common/MachineArt'

import { useAuth } from '../../../app/providers/AuthProvider'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PasswordInput from '../../../components/ui/PasswordInput'
import { siteInfo } from '../../../config/site'


function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only allow redirects back into the customer portal.
  type LoginLocationState = {
    from?: { pathname?: string; search?: string; hash?: string }
    message?: string
  } | null;

  const state = location.state as LoginLocationState
  const previousLocation = state?.from;
  const notice = typeof state?.message === 'string' ? state.message : null;


  const destination = previousLocation?.pathname?.startsWith('/customer')
    ? `${previousLocation.pathname}${previousLocation.search ?? ''}${previousLocation.hash ?? ''}`
    : '/customer'

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login({ email: email.trim(), password })

      if (user.role !== 'Customer' || !user.customer_id) {
        setError('This login is for customer accounts. Please use a customer account.')
        return
      }

      navigate(destination, { replace: true })
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            'Unable to log in. Please check your connection and try again.'
        )
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      panel={
        <>
          <MachineArt className="w-44" />
          <h2 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight">
            Good to see you again.
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Log in to pick up where you left off.
          </p>
        </>
      }
    >
      <h1 className="text-3xl font-extrabold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Use your {siteInfo.name} customer account.
      </p>

      {notice && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-lg border border-success-line bg-success-bg p-3 text-sm"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <p className="text-fg">{notice}</p>
        </div>
      )}

      {!notice && previousLocation && (
        <div className="mt-6 flex items-start gap-3 rounded-lg bg-surface-alt p-3 text-sm text-fg-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Please log in to continue.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
        />

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-danger-line bg-danger-bg px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Logging in...">
          Log in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

export default LoginPage;