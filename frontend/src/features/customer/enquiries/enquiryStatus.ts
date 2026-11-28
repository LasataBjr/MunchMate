import type { StatusTone } from '../../../components/ui/StatusBadge'

type StatusInfo = { label: string; tone: StatusTone; hint: string }

const statuses: Record<string, StatusInfo> = {
  new: { label: 'Submitted', tone: 'info', hint: 'We have received your request.' },
  reviewing: { label: 'Under review', tone: 'warning', hint: 'Our team is reviewing your request.' },
  quoted: { label: 'Quotation ready', tone: 'accent', hint: 'A quotation is ready for you to review.' },
  accepted: { label: 'Accepted', tone: 'success', hint: 'This enquiry has been accepted.' },
  rejected: { label: 'Declined', tone: 'danger', hint: 'This enquiry was not taken forward.' },
  cancelled: { label: 'Cancelled', tone: 'neutral', hint: 'This enquiry was cancelled.' },
}

export function getEnquiryStatus(status: string): StatusInfo {
  return (
    statuses[status.toLowerCase()] ?? {
      label: status.replaceAll('_', ' '),
      tone: 'neutral',
      hint: '',
    }
  )
}

export type EnquiryFilter = 'all' | 'open' | 'quoted' | 'closed'

export const filterLabels: Record<EnquiryFilter, string> = {
  all: 'All',
  open: 'In progress',
  quoted: 'Quotation ready',
  closed: 'Closed',
}

const groups: Record<EnquiryFilter, string[] | null> = {
  all: null,
  open: ['new', 'reviewing'],
  quoted: ['quoted'],
  closed: ['accepted', 'rejected', 'cancelled'],
}

export function matchesFilter(status: string, filter: EnquiryFilter): boolean {
  const group = groups[filter]
  return group === null || group.includes(status.toLowerCase())
}