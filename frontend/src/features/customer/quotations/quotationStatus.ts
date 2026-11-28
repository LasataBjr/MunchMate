import type { StatusTone } from '../../../components/ui/StatusBadge'
import { daysUntil } from '../../../utils/formatDate'

import type { QuotationStatus } from './types/quotation.types'

type StatusInfo = { label: string; hint: string; tone: StatusTone }

const quotationStatuses: Record<QuotationStatus, StatusInfo> = {
  draft: {
    label: 'Draft',
    hint: 'Your quotation is being prepared.',
    tone: 'neutral',
  },
  sent: {
    label: 'Awaiting response',
    hint: 'Please review this quotation and respond before it expires.',
    tone: 'accent',
  },
  accepted: {
    label: 'Accepted',
    hint: 'You accepted this quotation. An order has been created.',
    tone: 'success',
  },
  rejected: {
    label: 'Rejected',
    hint: 'You rejected this quotation.',
    tone: 'danger',
  },
}

export function getQuotationStatus(status: string): StatusInfo {
  return (
    quotationStatuses[status as QuotationStatus] ?? {
      label: status.replaceAll('_', ' '),
      hint: 'Check the quotation details for more information.',
      tone: 'neutral',
    }
  )
}

export function isAwaitingResponse(status: string): boolean {
  return status === 'sent'
}

// Customers do not act on drafts, so there is no Draft chip.
// Drafts (if the backend ever sends any) still show under "All".
export type QuotationFilter = 'all' | Exclude<QuotationStatus, 'draft'>

export const quotationFilterLabels: Record<QuotationFilter, string> = {
  all: 'All',
  sent: 'Awaiting response',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

export function matchesQuotationFilter(status: string, filter: QuotationFilter): boolean {
  return filter === 'all' || status === filter
}

export type Validity = { text: string; state: 'ok' | 'soon' | 'expired' }

export function getValidity(validUntil: string | null): Validity | null {
  if (!validUntil) return null

  const days = daysUntil(validUntil)
  if (days === null) return null

  if (days < 0) return { text: 'Expired', state: 'expired' }
  if (days === 0) return { text: 'Expires today', state: 'soon' }
  if (days === 1) return { text: 'Expires tomorrow', state: 'soon' }
  if (days <= 3) return { text: `Expires in ${days} days`, state: 'soon' }
  return { text: `${days} days left`, state: 'ok' }
}