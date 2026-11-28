import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Clock, CreditCard, Info, RefreshCw, SearchX } from 'lucide-react'

import Button, { buttonStyles } from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import FilterChips from '../../../components/ui/FilterChips'
import Skeleton from '../../../components/ui/Skeleton'
import { useDelayedVisible } from '../../../hooks/useDelayedVisible'

import { checkPaymentStatus, getMyPayments } from '../../../services/api/payment.api'

import type { CustomerPayment, PaymentFilter } from './types/payment.types'

import PaymentCard from './components/PaymentCard'
import { matchesPaymentFilter, paymentFilterLabels } from './paymentStatus'

const filters = Object.keys(paymentFilterLabels) as PaymentFilter[]

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState<CustomerPayment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<PaymentFilter>('all')

  const [checkingPaymentId, setCheckingPaymentId] = useState<number | null>(null)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPayments() {
      try {
        setError(null)

        const response = await getMyPayments()

        if (!cancelled) {
          setPayments(response.payments)
        }
      } catch {
        if (!cancelled) {
          setError('We could not load your payments. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false)
        }
      }
    }

    void loadPayments()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function reload() {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }

  async function handleCheckStatus(paymentId: number) {
    try {
      setCheckingPaymentId(paymentId)
      setCheckMessage(null)
      setCheckError(null)

      const response = await checkPaymentStatus(paymentId)

      if (response.payment_status === 'successful') {
        setCheckMessage('Payment confirmed successfully.')
      } else if (response.verification_required) {
        setCheckMessage(
          'Fonepay has not confirmed the final result yet. Your payment remains pending.'
        )
      } else {
        setCheckMessage('Your payment is still pending. Please check again later.')
      }

      // Refresh payment history using the database as the source of truth.
      reload()
    } catch {
      setCheckError(
        'Unable to verify this payment with Fonepay right now. Your payment status has not been changed. Please try again later.'
      )
    } finally {
      setCheckingPaymentId(null)
    }
  }

  const sorted = useMemo(
    () => [...(payments ?? [])].sort((a, b) => b.initiated_at.localeCompare(a.initiated_at)),
    [payments]
  )

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [f, sorted.filter((payment) => matchesPaymentFilter(payment, f)).length])
      ) as Record<PaymentFilter, number>,
    [sorted]
  )

  const visible = useMemo(
    () => sorted.filter((payment) => matchesPaymentFilter(payment, filter)),
    [sorted, filter]
  )

  const pendingCount = useMemo(
    () => sorted.filter((payment) => payment.status === 'pending').length,
    [sorted]
  )

  const loading = payments === null && !error
  const showSkeleton = useDelayedVisible(loading)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My payments</h1>

          <p className="mt-1 text-sm text-fg-muted">
            View your payment history and check payment status.
          </p>
        </div>

        <Button variant="secondary" onClick={reload} disabled={refreshing} className="w-fit">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="mt-8">
        {loading && (
          <div role="status" aria-label="Loading your payments" className="min-h-96 space-y-4">
            {showSkeleton &&
              [0, 1, 2].map((n) => <Skeleton key={n} className="h-60 rounded-xl" />)}
          </div>
        )}

        {!loading && error && payments === null && (
          <ErrorMessage title="Unable to load payments" message={error} onRetry={reload} />
        )}

        {payments !== null && payments.length === 0 && (
          <EmptyState
            as="h2"
            icon={<CreditCard className="h-7 w-7" aria-hidden="true" />}
            title="No payments yet"
            message="Your payment history will appear here when you make a payment."
            action={
              <Link to="/customer/orders" className={buttonStyles()}>
                View my orders
              </Link>
            }
          />
        )}

        {payments !== null && payments.length > 0 && (
          <>
            {error && (
              <ErrorMessage
                className="mb-5"
                title="Unable to refresh payments"
                message={error}
                onRetry={reload}
              />
            )}

            {checkMessage && (
              <div
                role="status"
                className="mb-5 flex items-start gap-3 rounded-xl border border-line bg-card p-4 text-sm text-fg"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <p>{checkMessage}</p>
              </div>
            )}

            {checkError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-danger-line bg-danger-bg p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <p className="text-fg">{checkError}</p>
              </div>
            )}

            {pendingCount > 0 && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-red/40 bg-brand-red/5 p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-fg">
                    {pendingCount}{' '}
                    {pendingCount === 1 ? 'payment is awaiting' : 'payments are awaiting'}{' '}
                    confirmation.
                  </p>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    Use Check status on a pending Fonepay payment to see whether it has been
                    confirmed.
                  </p>
                </div>
              </div>
            )}

            <div className="mb-5">
              <FilterChips
                label="Filter payments by status"
                options={filters}
                labels={paymentFilterLabels}
                counts={counts}
                value={filter}
                onChange={setFilter}
              />
            </div>

            <div key={filter} className="page-enter">
              {visible.length === 0 ? (
                <EmptyState
                  as="h2"
                  icon={<SearchX className="h-7 w-7" aria-hidden="true" />}
                  title="No payments in this view"
                  message="There are no payments with this status."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                      Show all
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {visible.map((payment) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      checking={checkingPaymentId === payment.id}
                      onCheckStatus={handleCheckStatus}
                    />
                  ))}
                </div>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-fg-muted">
              Paid, but the status has not changed?{' '}
              <Link to="/contact" className="font-medium text-accent hover:underline">
                Contact us
              </Link>{' '}
              and include your payment reference.
            </p>
          </>
        )}
      </div>
    </div>
  )
}