import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronDown, CreditCard, RefreshCw } from 'lucide-react'

import Button, { buttonStyles } from '../../../../components/ui/Button'
import StatusBadge from '../../../../components/ui/StatusBadge'
import { formatDateTime } from '../../../../utils/formatDate'

import type { CustomerPayment } from '../types/payment.types'
import { formatPaymentAmount, getPaymentStatus } from '../paymentStatus'

type PaymentCardProps = {
  payment: CustomerPayment
  checking: boolean
  onCheckStatus: (paymentId: number) => void
}

export default function PaymentCard({ payment, checking, onCheckStatus }: PaymentCardProps) {
  const status = getPaymentStatus(payment.status)
  const canCheckStatus = payment.provider === 'fonepay' && payment.status === 'pending'

  const providerLabel =
    payment.provider === 'fonepay'
      ? 'Fonepay'
      : payment.provider === 'development_simulator'
        ? 'Development simulator'
        : payment.provider.replaceAll('_', ' ')

  const methodLabel = payment.payment_method
    ? payment.payment_method.replaceAll('_', ' ')
    : 'Not specified'

  return (
    <article
      className={`rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        canCheckStatus ? 'border-brand-red/40' : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-xs text-fg-muted">Payment for order</p>
            <h2 className="truncate font-mono text-base font-semibold text-fg">
              {payment.order_number}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Started {formatDateTime(payment.initiated_at)}
            </p>
          </div>
        </div>

        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-fg-muted">Amount</dt>
          <dd className="mt-1 text-2xl font-extrabold tabular-nums text-fg">
            {formatPaymentAmount(payment.amount_paisa, payment.currency)}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-fg-muted">Payment method</dt>
          <dd className="mt-1.5 text-sm capitalize text-fg">{methodLabel}</dd>
        </div>

        <div>
          <dt className="text-xs text-fg-muted">Provider</dt>
          <dd className="mt-1.5 text-sm text-fg">{providerLabel}</dd>
        </div>
      </dl>

      {(status.hint || payment.confirmed_at) && (
        <div className="mt-5 rounded-lg bg-surface-alt p-3">
          {status.hint && <p className="text-sm text-fg-muted">{status.hint}</p>}
          {payment.confirmed_at && (
            <p className="mt-1 text-xs text-fg-muted">
              Confirmed {formatDateTime(payment.confirmed_at)}
            </p>
          )}
        </div>
      )}

      <details className="group mt-4 rounded-lg border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-fg [&::-webkit-details-marker]:hidden">
          Payment details
          <ChevronDown
            className="h-4 w-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <dl className="grid gap-4 border-t border-line px-4 py-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-fg-muted">Payment number</dt>
            <dd className="mt-0.5 font-mono text-fg">#{payment.id}</dd>
          </div>

          <div>
            <dt className="text-fg-muted">Reference</dt>
            <dd className="mt-0.5 break-all font-mono text-fg">{payment.provider_reference}</dd>
          </div>

          {payment.provider_transaction_id && (
            <div className="sm:col-span-2">
              <dt className="text-fg-muted">Transaction ID</dt>
              <dd className="mt-0.5 break-all font-mono text-fg">
                {payment.provider_transaction_id}
              </dd>
            </div>
          )}
        </dl>
      </details>

      <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        {canCheckStatus && (
          <Button
            size="sm"
            onClick={() => onCheckStatus(payment.id)}
            loading={checking}
            loadingText="Checking..."
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Check status
          </Button>
        )}

        <Link
          to={`/customer/orders/${payment.order_id}`}
          className={`${buttonStyles({ variant: 'secondary', size: 'sm' })} w-full sm:w-auto`}
        >
          View order
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}