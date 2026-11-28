import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ClipboardList, Package } from 'lucide-react'

import { buttonStyles } from '../../../../components/ui/Button'
import StatusBadge from '../../../../components/ui/StatusBadge'
import { formatDate } from '../../../../utils/formatDate'
import type { MyEnquiryListItem } from '../../../public/enquiries/types/enquiry.types'
import { getEnquiryStatus } from '../enquiryStatus'

function EnquiryCard({ enquiry }: { enquiry: MyEnquiryListItem }) {
  const status = getEnquiryStatus(enquiry.status)
  const isQuoted = enquiry.status.toLowerCase() === 'quoted'

  return (
    <article
      className={`rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        isQuoted ? 'border-brand-red/40' : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-fg-muted">Enquiry number</p>
            <h2 className="truncate font-mono text-base font-semibold text-fg">
              {enquiry.enquiry_number}
            </h2>
          </div>
        </div>

        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <dt className="sr-only">Submitted on</dt>
          <dd>{formatDate(enquiry.created_at)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" aria-hidden="true" />
          <dt className="sr-only">Machine items</dt>
          <dd>
            {enquiry.total_items} {enquiry.total_items === 1 ? 'machine' : 'machines'}
          </dd>
        </div>
      </dl>

      {enquiry.message && (
        <blockquote className="mt-4 border-l-2 border-line pl-3">
          <p className="text-xs font-medium text-fg-muted">Your message</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-fg">{enquiry.message}</p>
        </blockquote>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">{status.hint}</p>

        <div className="flex flex-col gap-2 sm:flex-row">
            <Link
            to={`/customer/enquiries/${enquiry.id}`}
            className={`${buttonStyles({ variant: 'secondary', size: 'sm' })} w-full sm:w-auto`}
            >
            View details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {isQuoted && (
            <Link
                to="/customer/quotations"
                className={`${buttonStyles({ size: 'sm' })} w-full sm:w-auto`}
            >
                View quotation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            )}
        </div>
      </div>
    </article>
  )
}

export default EnquiryCard;