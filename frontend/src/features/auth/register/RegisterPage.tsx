import { useState, type FormEventHandler } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Building2, User } from 'lucide-react'

import { useAuth } from '../../../app/providers/AuthProvider'
import AuthShell from '../../../components/layout/AuthShell'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PasswordInput from '../../../components/ui/PasswordInput'

type CustomerType = 'individual' | 'company'

const accountTypes: { value: CustomerType; label: string; hint: string; icon: typeof User }[] = [
  { value: 'individual', label: 'Individual', hint: 'Buying for yourself', icon: User },
  { value: 'company', label: 'Company', hint: 'Buying for a business', icon: Building2 },
]

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [customerType, setCustomerType] = useState<CustomerType>('individual')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Shown only after the person leaves the confirm field
  const confirmError =
    confirmTouched && confirmPassword && password !== confirmPassword
      ? 'Passwords do not match.'
      : undefined

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError('')
    setConfirmTouched(true)

    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (customerType === 'company' && companyName.trim().length < 2) {
      setError('Please enter a valid company name.')
      return
    }

    setIsSubmitting(true)

    try {
      const user = await register({
        customer_type: customerType,
        name: name.trim(),
        company_name: customerType === 'company' ? companyName.trim() : null,
        email: email.trim(),
        phone: phone.trim(),
        password,
      })

      if (user.role !== 'Customer' || !user.customer_id) {
        setError('This account is not authorized for the customer portal.')
        return
      }

      navigate('/customer', { replace: true })
    } catch (err) {
      if (isAxiosError(err)) {
        const message = err.response?.data?.message

        setError(
          typeof message === 'string'
            ? message
            : 'Unable to create your account. Please try again.'
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
      contentWidth="max-w-lg"
      panel={
        <>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Set up your account in about a minute
          </h2>

          <dl className="mt-10 space-y-6">
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <User className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-semibold">Individual</dt>
                <dd className="mt-1 text-sm text-white/85">
                  For personal or small purchases. Quotations are addressed to you.
                </dd>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-semibold">Company</dt>
                <dd className="mt-1 text-sm text-white/85">
                  Enter your company name so quotations are addressed to your business, with you
                  as the contact person.
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-10 border-t border-white/20 pt-5 text-sm text-white/85">
            Have your name, email address and phone number ready
          </p>
        </>
      }
    >
      <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Manage your enquiries, quotations and orders in one place.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-fg">Account type</legend>
          <div className="grid grid-cols-2 gap-3">
            {accountTypes.map(({ value, label, hint, icon: Icon }) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="customer_type"
                  value={value}
                  checked={customerType === value}
                  onChange={() => setCustomerType(value)}
                  className="peer sr-only"
                />
                <span className="flex items-center gap-3 rounded-lg border border-line bg-card p-3 transition-colors hover:bg-hover peer-checked:border-brand-red peer-checked:bg-brand-red/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-red">
                  <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-fg">{label}</span>
                    <span className="block text-xs text-fg-muted">{hint}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          label={customerType === 'company' ? 'Contact person name' : 'Full name'}
          autoComplete="name"
          required
          minLength={2}
          maxLength={150}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
        />

        {customerType === 'company' && (
          <Input
            label="Company name"
            autoComplete="organization"
            required
            minLength={2}
            maxLength={150}
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Enter your company name"
          />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
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

          <Input
            label="Phone number"
            type="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={20}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter your phone number"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint="At least 8 characters"
          />

          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onBlur={() => setConfirmTouched(true)}
            error={confirmError}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-danger-line bg-danger-bg px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          loadingText="Creating account..."
        >
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

export default RegisterPage;