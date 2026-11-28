
import type { StatusTone } from '../../../components/ui/StatusBadge'
import type { PaymentFilter, PaymentStatus } from './types/payment.types'

type PaymentStatusInfo = {
  label: string
  tone: StatusTone
  hint: string
}

const paymentStatuses = {
  pending: {
    label: 'Pending',
    tone: 'warning',
    hint: 'We are waiting for payment confirmation.',
  },
  successful: {
    label: 'Successful',
    tone: 'success',
    hint: 'Payment received successfully.',
  },
  failed: {
    label: 'Failed',
    tone: 'danger',
    hint: 'This payment attempt was unsuccessful.',
  },
  expired: {
    label: 'Expired',
    tone: 'neutral',
    hint: 'This payment attempt has expired.',
  },
} satisfies Record<PaymentStatus, PaymentStatusInfo>

export function getPaymentStatus(status: string): PaymentStatusInfo {
  return (
    paymentStatuses[status as PaymentStatus] ?? {
      label: status.replaceAll('_', ' '),
      tone: 'neutral',
      hint: 'Payment status information is unavailable.',
    }
  )
}

export const paymentFilterLabels: Record<PaymentFilter, string> = {
  all: 'All payments',
  pending: 'Pending',
  successful: 'Successful',
  failed: 'Failed',
  expired: 'Expired',
}

export function matchesPaymentFilter(
  payment: { status: string },
  filter: PaymentFilter
): boolean {
  return filter === 'all' || payment.status === filter
}

export function formatPaymentAmount(amountPaisa: number, currency: string): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPaisa / 100)
}
