import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, FileText } from 'lucide-react'

import { buttonStyles } from '../../../../components/ui/Button'
import StatusBadge from '../../../../components/ui/StatusBadge'
import { formatDate } from '../../../../utils/formatDate'
import { formatPaisa } from '../../../../utils/quotationFormatters'

import type { MyQuotationListItem } from '../types/quotation.types'
import { getQuotationStatus, getValidity, isAwaitingResponse } from '../quotationStatus'

function QuotationCard({ quotation }: { quotation: MyQuotationListItem }) {
  const status = getQuotationStatus(quotation.status)
  const awaiting = isAwaitingResponse(quotation.status)
  const validity = awaiting ? getValidity(quotation.valid_until) : null

  return (
    <article
      className={`rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        awaiting ? 'border-brand-red/40' : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-mono text-base font-semibold text-fg">
              {quotation.quotation_number}
            </h2>
            <p className="text-xs text-fg-muted">
              For enquiry {quotation.enquiry_number}
              {quotation.version_number > 1 && ` · Version ${quotation.version_number}`}
            </p>
          </div>
        </div>

        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-fg-muted">Total amount</dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-fg">
            {formatPaisa(quotation.total_amount_paisa)}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-fg-muted">Created</dt>
          <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-fg">
            <CalendarDays className="h-4 w-4 text-fg-muted" aria-hidden="true" />
            {formatDate(quotation.created_at)}
          </dd>
        </div>

        {quotation.valid_until && (
          <div>
            <dt className="text-xs text-fg-muted">Valid until</dt>
            <dd className="mt-1 text-sm font-medium text-fg">
              {formatDate(quotation.valid_until)}
              {validity && (
                <span
                  className={`ml-2 text-xs font-semibold ${
                    validity.state === 'expired'
                      ? 'text-danger'
                      : validity.state === 'soon'
                        ? 'text-accent'
                        : 'text-fg-muted'
                  }`}
                >
                  {validity.text}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">{status.hint}</p>

        <Link
          to={`/customer/quotations/${quotation.id}`}
          className={`${buttonStyles({ variant: awaiting ? 'primary' : 'secondary', size: 'sm' })} w-full sm:w-auto`}
        >
          {awaiting ? 'Review and respond' : 'View details'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export default QuotationCard;