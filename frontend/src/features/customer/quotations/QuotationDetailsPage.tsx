import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Package,
  XCircle,
} from 'lucide-react'

import { buttonStyles } from '../../../components/ui/Button'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import Skeleton from '../../../components/ui/Skeleton'
import StatusBadge from '../../../components/ui/StatusBadge'

import {
  decideMyQuotation,
  getMyQuotationById,
} from '../../../services/api/quotations.api'

import type {
  MyQuotationDetails,
  QuotationDecision,
} from './types/quotation.types'

import { getQuotationStatus } from './quotationStatus'
import { formatPaisa } from '../../../utils/quotationFormatters'
import { formatDate } from '../../../utils/formatDate'

function QuotationDetailsPage() {
  const { id } = useParams<{ id: string }>()

  const [quotation, setQuotation] =
    useState<MyQuotationDetails | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pendingDecision, setPendingDecision] =
    useState<QuotationDecision | null>(null)

  const [decisionError, setDecisionError] =
    useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadQuotation() {
      const quotationId = Number(id)

      if (!id || !Number.isInteger(quotationId) || quotationId <= 0) {
        setError('Invalid quotation reference.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await getMyQuotationById(quotationId)

        if (!cancelled) {
          setQuotation(response.quotation)
        }
      } catch {
        if (!cancelled) {
          setError(
            'Unable to find this quotation. It may not exist or may not belong to your account.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadQuotation()

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleDecision() {
    if (!quotation || !pendingDecision || submitting) {
      return
    }

    try {
      setSubmitting(true)
      setDecisionError(null)

      const response = await decideMyQuotation(
        quotation.id,
        pendingDecision
      )

      setQuotation(response.quotation)
      setPendingDecision(null)
    } catch (error) {
      // The backend may reject a decision if the quotation
      // has already received a response or changed status.
      setDecisionError(
        'We could not submit your decision. The quotation may have changed. Please refresh and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div>
        <Link
          to="/customer/quotations"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to quotations
        </Link>

        <ErrorMessage
          title="Quotation unavailable"
          message={error ?? 'We could not find this quotation.'}
        />
      </div>
    )
  }

  const status = getQuotationStatus(quotation.status)
  const canRespond = quotation.status === 'sent'

  return (
    <div>
      <Link
        to="/customer/quotations"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quotations
      </Link>

      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-fg-muted">
            Quotation details
          </p>

          <h1 className="mt-1 break-all font-mono text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
            {quotation.quotation_number}
          </h1>

          <p className="mt-2 text-sm text-fg-muted">
            Enquiry reference: {quotation.enquiry_number}
          </p>
        </div>

        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      {/* Quotation information */}
      <section className="mt-7 rounded-xl border border-line bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold text-fg">
          Quotation information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-fg-muted">
              Quotation version
            </p>
            <p className="mt-1 font-semibold text-fg">
              Version {quotation.version_number}
            </p>
          </div>

          <div>
            <p className="text-xs text-fg-muted">
              Created on
            </p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-fg">
              <CalendarDays className="h-4 w-4 text-fg-muted" />
              {formatDate(quotation.created_at)}
            </p>
          </div>

          <div>
            <p className="text-xs text-fg-muted">
              Valid until
            </p>
            <p className="mt-1 font-semibold text-fg">
              {quotation.valid_until
                ? formatDate(quotation.valid_until)
                : 'Not specified'}
            </p>
          </div>
        </div>

        {quotation.terms && (
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-fg">
              Terms and conditions
            </h3>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-fg-muted">
              {quotation.terms}
            </p>
          </div>
        )}
      </section>

      {/* Quotation items */}
      <section className="mt-6 rounded-xl border border-line bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-fg">
            Quoted machines
          </h2>
        </div>

        <div className="mt-5 space-y-4">
          {quotation.items.map((item, index) => (
            <article
              key={item.id}
              className="rounded-lg border border-line p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-fg-muted">
                    Item {index + 1}
                  </p>

                  <h3 className="mt-1 font-semibold text-fg">
                    {item.description}
                  </h3>

                  <p className="mt-2 text-sm text-fg-muted">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-fg-muted">
                    Unit price
                  </p>

                  <p className="mt-1 font-medium text-fg">
                    {formatPaisa(item.unit_price_paisa)}
                  </p>

                  <p className="mt-2 text-xs text-fg-muted">
                    Line total
                  </p>

                  <p className="font-bold text-fg">
                    {formatPaisa(item.line_total_paisa)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Price summary */}
      <section className="mt-6 rounded-xl border border-line bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold text-fg">
          Price summary
        </h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Subtotal</dt>
            <dd className="font-medium text-fg">
              {formatPaisa(quotation.subtotal_paisa)}
            </dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Discount</dt>
            <dd className="font-medium text-fg">
              - {formatPaisa(quotation.discount_paisa)}
            </dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Tax</dt>
            <dd className="font-medium text-fg">
              {formatPaisa(quotation.tax_amount_paisa)}
            </dd>
          </div>

          <div className="flex justify-between gap-4 border-t border-line pt-4">
            <dt className="font-bold text-fg">Total amount</dt>
            <dd className="text-xl font-extrabold text-accent">
              {formatPaisa(quotation.total_amount_paisa)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Customer decision */}
      <section className="mt-6 rounded-xl border border-line bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold text-fg">
          Your response
        </h2>

        <p className="mt-2 text-sm text-fg-muted">
          {status.hint}
        </p>

        {decisionError && (
          <div className="mt-4">
            <ErrorMessage
              title="Decision not submitted"
              message={decisionError}
            />
          </div>
        )}

        {canRespond && (
          <div className="mt-5">
            {pendingDecision === null ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPendingDecision('accepted')}
                  className={`${buttonStyles()} w-full sm:w-auto`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept quotation
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDecision('rejected')}
                  className={`${buttonStyles({ variant: 'secondary' })} w-full sm:w-auto`}
                >
                  <XCircle className="h-4 w-4" />
                  Reject quotation
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-surface-alt p-4">
                <h3 className="font-semibold text-fg">
                  {pendingDecision === 'accepted'
                    ? 'Accept this quotation?'
                    : 'Reject this quotation?'}
                </h3>

                <p className="mt-2 text-sm text-fg-muted">
                  {pendingDecision === 'accepted'
                    ? 'Accepting will create an order using the prices and items shown above. You can then review the order in your customer portal.'
                    : 'Are you sure you want to reject this quotation? This decision will be recorded.'}
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDecision}
                    disabled={submitting}
                    className={`${buttonStyles()} w-full sm:w-auto`}
                  >
                    {submitting
                      ? 'Submitting...'
                      : 'Confirm decision'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingDecision(null)}
                    disabled={submitting}
                    className={`${buttonStyles({ variant: 'secondary' })} w-full sm:w-auto`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {quotation.status === 'accepted' && (
          <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">
              Your quotation has been accepted.
            </p>
            <p className="mt-1">
              An order has been created. You can check its progress
              from your orders section.
            </p>
            <Link
              to="/customer/orders"
              className="mt-3 inline-flex items-center gap-2 font-semibold underline"
            >
              View my orders
            </Link>
          </div>
        )}

        {quotation.status === 'rejected' && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            This quotation has already been rejected. You can contact
            our team if you need further assistance.
          </div>
        )}
      </section>
    </div>
  )
}

export default QuotationDetailsPage;