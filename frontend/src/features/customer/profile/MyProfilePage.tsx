import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { isAxiosError } from 'axios'

import { getMyProfile, updateMyProfile } from '../../../services/api/customers.api'
import { changePassword } from '../../../services/api/auth.api'

import type { CustomerProfile } from './types/profile.types'

import Button from '../../../components/ui/Button'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import Input from '../../../components/ui/Input'
import PasswordInput from '../../../components/ui/PasswordInput'
import Skeleton from '../../../components/ui/Skeleton'
import StatusBadge from '../../../components/ui/StatusBadge'
import { useDelayedVisible } from '../../../hooks/useDelayedVisible'
import { formatDate } from '../../../utils/formatDate'

type ProfileFormData = {
  name: string
  email: string
  phone: string
  company_name: string
}

type PasswordFormData = {
  current_password: string
  new_password: string
  confirm_password: string
}

function getInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return letters || '?'
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-fg-muted">{label}</dt>
        <dd className="mt-0.5 break-words font-medium text-fg">{value}</dd>
      </div>
    </div>
  )
}

function FormError({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger-line bg-danger-bg px-4 py-3 text-sm text-danger"
    >
      {children}
    </p>
  )
}

function FormSuccess({ children }: { children: string }) {
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-lg border border-success-line bg-success-bg px-4 py-3 text-sm text-success"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

export default function MyProfilePage() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [form, setForm] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
  })

  // Password change state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const showSkeleton = useDelayedVisible(loading)

  async function fetchProfile() {
    try {
      setLoading(true)
      setError('')

      const response = await getMyProfile()

      setProfile(response.customer)
    } catch {
      setError('Unable to load your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProfile()
  }, [])

  function startEditing() {
    if (!profile) return

    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      company_name: profile.company_name ?? '',
    })

    setSaveError('')
    setSuccessMessage('')
    setEditing(true)
  }

  function cancelEditing() {
    if (!profile) return

    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      company_name: profile.company_name ?? '',
    })

    setSaveError('')
    setEditing(false)
  }

  function updateFormField(field: keyof ProfileFormData, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!profile) return

    try {
      setSaving(true)
      setSaveError('')
      setSuccessMessage('')

      const response = await updateMyProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        company_name:
          profile.customer_type === 'company' ? form.company_name.trim() : null,
      })

      setProfile(response.customer)
      setEditing(false)
      setSuccessMessage('Your profile has been updated successfully.')
    } catch (error) {
      if (isAxiosError(error)) {
        const responseData = error.response?.data

        if (responseData?.errors) {
          const fieldErrors = responseData.errors as Record<string, string[]>

          const firstError = Object.values(fieldErrors).flat()[0]

          setSaveError(
            firstError || responseData.message || 'Please check your details.'
          )
        } else {
          setSaveError(
            responseData?.message ||
              'Unable to update your profile. Please try again.'
          )
        }
      } else {
        setSaveError('Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  function updatePasswordField(field: keyof PasswordFormData, value: string) {
    setPasswordForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (passwordForm.new_password.length > 128) {
      setPasswordError('New password cannot exceed 128 characters.')
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.')
      return
    }

    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordError(
        'Your new password must be different from your current password.'
      )
      return
    }

    try {
      setChangingPassword(true)

      await changePassword(passwordForm)

      setPasswordSuccess('Password changed successfully. Redirecting to login...')

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })

      // Backend clears the authentication cookie after a successful change.
      // Redirect to login so the customer can sign in with the new password.
      navigate('/login', {
        replace: true,
        state: {
          message: 'Your password has been changed. Please log in again.',
        },
      })
    } catch (error) {
      if (isAxiosError(error)) {
        const responseData = error.response?.data

        if (responseData?.errors) {
          const fieldErrors = responseData.errors as Record<string, string[]>

          const firstError = Object.values(fieldErrors).flat()[0]

          setPasswordError(
            firstError ||
              responseData.message ||
              'Please check your password details.'
          )
        } else {
          setPasswordError(
            responseData?.message ||
              'Unable to change your password. Please try again.'
          )
        }
      } else {
        setPasswordError('Something went wrong. Please try again.')
      }
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading your profile" className="min-h-[32rem]">
        {showSkeleton && (
          <>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </>
        )}
      </div>
    )
  }

  if (error || !profile) {
    return (
      <ErrorMessage
        title="Unable to load your profile"
        message={error || 'Profile not found.'}
        onRetry={fetchProfile}
      />
    )
  }

  const isCompany = profile.customer_type === 'company'

  return (
    <div>
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My profile</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Manage your personal and account information.
          </p>
        </div>

        {!editing && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchProfile}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
            <Button onClick={startEditing}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit profile
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {successMessage && !editing && <FormSuccess>{successMessage}</FormSuccess>}

          {editing ? (
            <section
              aria-labelledby="edit-heading"
              className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
            >
              <h2 id="edit-heading" className="text-lg font-semibold text-fg">
                Edit personal information
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                Update your contact and personal details below.
              </p>

              {saveError && (
                <div className="mt-5">
                  <FormError>{saveError}</FormError>
                </div>
              )}

              <form onSubmit={handleSave} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Input
                    label="Full name"
                    value={form.name}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    required
                    maxLength={150}
                    autoComplete="name"
                    placeholder="Enter your full name"
                  />

                  <Input
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateFormField('email', e.target.value)}
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="Enter your email"
                  />

                  <Input
                    label="Phone number"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateFormField('phone', e.target.value)}
                    required
                    maxLength={150}
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                  />

                  {isCompany && (
                    <Input
                      label="Company name"
                      value={form.company_name}
                      onChange={(e) => updateFormField('company_name', e.target.value)}
                      required
                      maxLength={150}
                      autoComplete="organization"
                      placeholder="Enter your company name"
                    />
                  )}
                </div>

                <p className="rounded-lg bg-surface-alt px-4 py-3 text-sm text-fg-muted">
                  Customer type:{' '}
                  <span className="font-medium capitalize text-fg">{profile.customer_type}</span>.
                  It cannot be changed from your profile.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </Button>

                  <Button type="submit" loading={saving} loadingText="Saving...">
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save changes
                  </Button>
                </div>
              </form>
            </section>
          ) : (
            <>
              <section
                aria-labelledby="personal-heading"
                className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
              >
                <h2 id="personal-heading" className="text-lg font-semibold text-fg">
                  Personal information
                </h2>
                <p className="mt-1 text-sm text-fg-muted">Your registered customer details.</p>

                <dl className="mt-4 divide-y divide-line">
                  <InfoRow icon={UserRound} label="Full name" value={profile.name} />
                  <InfoRow icon={Mail} label="Email address" value={profile.email} />
                  <InfoRow icon={Phone} label="Phone number" value={profile.phone} />
                  <InfoRow
                    icon={UserRoundCheck}
                    label="Customer type"
                    value={isCompany ? 'Company' : 'Individual'}
                  />
                  {isCompany && (
                    <InfoRow
                      icon={Building2}
                      label="Company name"
                      value={profile.company_name || 'Not provided'}
                    />
                  )}
                </dl>
              </section>

              <section
                aria-labelledby="password-heading"
                className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                    <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="password-heading" className="text-lg font-semibold text-fg">
                      Change password
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      Update your password to keep your account secure.
                    </p>
                  </div>
                </div>

                {(passwordError || passwordSuccess) && (
                  <div className="mt-5">
                    {passwordError && <FormError>{passwordError}</FormError>}
                    {passwordSuccess && <FormSuccess>{passwordSuccess}</FormSuccess>}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                  <div className="max-w-md">
                    <PasswordInput
                      label="Current password"
                      value={passwordForm.current_password}
                      onChange={(e) => updatePasswordField('current_password', e.target.value)}
                      required
                      maxLength={128}
                      autoComplete="current-password"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <PasswordInput
                      label="New password"
                      value={passwordForm.new_password}
                      onChange={(e) => updatePasswordField('new_password', e.target.value)}
                      required
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      hint="At least 8 characters"
                    />

                    <PasswordInput
                      label="Confirm new password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => updatePasswordField('confirm_password', e.target.value)}
                      required
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-lg bg-surface-alt p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-fg-muted" aria-hidden="true" />
                    <p className="text-sm text-fg-muted">
                      After changing your password, you will be logged out and asked to sign in
                      again.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={changingPassword}
                      loadingText="Changing password..."
                    >
                      <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                      Change password
                    </Button>
                  </div>
                </form>
              </section>
            </>
          )}
        </div>

        {/* Side column: profile summary */}
        <aside className="lg:sticky lg:top-24">
          <section
            aria-label="Profile summary"
            className="overflow-hidden rounded-xl border border-line bg-card shadow-sm"
          >
            <div className="h-16 bg-gradient-to-br from-brand-red to-brand-dark" aria-hidden="true" />

            <div className="px-5 pb-6">
              <span
                aria-hidden="true"
                className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-card bg-brand-red text-xl font-bold text-white"
              >
                {getInitials(profile.name)}
              </span>

              <h2 className="mt-3 text-lg font-semibold text-fg">{profile.name}</h2>
              <p className="break-all text-sm text-fg-muted">{profile.email}</p>

              <div className="mt-3">
                <StatusBadge tone="accent">
                  {isCompany ? 'Company customer' : 'Individual customer'}
                </StatusBadge>
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <CalendarDays className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                <div>
                  <p className="text-xs text-fg-muted">Member since</p>
                  <p className="text-sm font-medium text-fg">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}