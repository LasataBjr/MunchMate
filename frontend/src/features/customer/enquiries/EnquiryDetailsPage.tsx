import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Hash,
  MessageSquare,
  Package,
  RefreshCw,
  XCircle,
} from 'lucide-react'

import { buttonStyles } from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import Skeleton from '../../../components/ui/Skeleton'
import StatusBadge from '../../../components/ui/StatusBadge'
import { getMyEnquiryById } from '../../../services/api/enquiries.api'
import { formatDateTime } from '../../../utils/formatDate'

import type { MyEnquiryDetailsResponse } from '../../public/enquiries/types/enquiry.types'
import EnquiryTimeline from './components/EnquiryTimeline'
import { getEnquiryStatus, getProgressIndex } from './enquiryStatus'

type EnquiryDetails = MyEnquiryDetailsResponse['enquiry']

function NextStepCard({ status }: { status: string }) {
  const key = status.toLowerCase()
  const info = getEnquiryStatus(status)

  return (
    <section
      aria-labelledby="next-step-heading"
      className={`rounded-xl border p-5 ${
        key === 'quoted' ? 'border-brand-red/40 bg-brand-red/5' : 'border-line bg-card'
      }`}
    >
      <h2 id="next-step-heading" className="text-sm font-semibold text-fg">
        {key === 'quoted' ? 'Your quotation is ready' : 'What happens next'}
      </h2>
      <p className="mt-2 text-sm leading-6 text-fg-muted">{info.hint}</p>

      {key === 'quoted' && (
        <Link to="/customer/quotations" className={`${buttonStyles()} mt-4 w-full`}>
          View quotation
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {(key === 'rejected' || key === 'cancelled') && (
        <Link
          to="/machines"
          className={`${buttonStyles({ variant: 'secondary' })} mt-4 w-full`}
        >
          Browse machines
        </Link>
      )}
    </section>
  )
}

function EnquiryDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const validId = Boolean(id && /^\d+$/.test(id) && Number(id) > 0)

  const [enquiry, setEnquiry] = useState<EnquiryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!validId) return

    let cancelled = false

    async function fetchEnquiry() {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)
        setEnquiry(null)

        const response = await getMyEnquiryById(Number(id))
        if (!cancelled) setEnquiry(response.enquiry)
      } catch (err) {
        if (cancelled) return

        if (isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError('Unable to load this enquiry. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchEnquiry()
    return () => {
      cancelled = true
    }
  }, [id, validId, retryCount])

  const backLink = (
    <Link
      to="/customer/enquiries"
      className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition-colors hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      My enquiries
    </Link>
  )

  if (!validId || notFound) {
    return (
      <div>
        {backLink}
        <EmptyState
          as="h2"
          className="mt-6"
          icon={<ClipboardList className="h-7 w-7" aria-hidden="true" />}
          title="Enquiry not found"
          message="This enquiry does not exist or is not available in your account."
          action={
            <Link to="/customer/enquiries" className={buttonStyles()}>
              Back to my enquiries
            </Link>
          }
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading enquiry details">
        {backLink}
        <Skeleton className="mt-6 h-9 w-72" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !enquiry) {
    return (
      <div>
        {backLink}
        <ErrorMessage
          className="mt-6"
          title="Unable to load enquiry"
          message={error ?? 'Something went wrong.'}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      </div>
    )
  }

  const status = getEnquiryStatus(enquiry.status)
  const offTrack = getProgressIndex(enquiry.status) === null
  const totalUnits = enquiry.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div>
      {backLink}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-fg-muted">Enquiry</p>
          <h1 className="break-all font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
            {enquiry.enquiry_number}
          </h1>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Progress */}
          <section
            aria-label="Progress"
            className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
          >
            {offTrack ? (
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-fg-muted" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-fg">{status.label}</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {status.hint || 'This enquiry is no longer active.'}
                  </p>
                </div>
              </div>
            ) : (
              <EnquiryTimeline status={enquiry.status} />
            )}
          </section>

          {/* Machines */}
          <section
            aria-labelledby="machines-heading"
            className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                <Package className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="machines-heading" className="font-semibold text-fg">
                  Requested machines
                </h2>
                <p className="text-sm text-fg-muted">
                  {enquiry.items.length} {enquiry.items.length === 1 ? 'model' : 'models'},{' '}
                  {totalUnits} {totalUnits === 1 ? 'unit' : 'units'} in total
                </p>
              </div>
            </div>

            {enquiry.items.length === 0 ? (
              <p className="mt-5 text-sm text-fg-muted">No machine items found for this enquiry.</p>
            ) : (
              <ul className="mt-5 divide-y divide-line rounded-lg border border-line">
                {enquiry.items.map((item) => (
                  <li key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-fg">{item.machine_name}</h3>
                        <p className="mt-0.5 text-sm text-fg-muted">Model: {item.model_number}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-surface-alt px-3 py-1.5 text-sm font-semibold tabular-nums text-fg">
                        × {item.quantity}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="mt-3 rounded-lg bg-surface-alt p-3">
                        <p className="text-xs font-medium text-fg-muted">Your notes</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-fg">{item.notes}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Message */}
          <section
            aria-labelledby="message-heading"
            className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
          >
            <h2 id="message-heading" className="flex items-center gap-2 font-semibold text-fg">
              <MessageSquare className="h-5 w-5 text-fg-muted" aria-hidden="true" />
              Your message
            </h2>

            {enquiry.message ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-fg-muted">
                {enquiry.message}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-fg-muted">
                No additional message was provided.
              </p>
            )}
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <NextStepCard status={enquiry.status} />

          <section
            aria-labelledby="summary-heading"
            className="rounded-xl border border-line bg-card p-5 shadow-sm"
          >
            <h2 id="summary-heading" className="text-sm font-semibold text-fg">
              Summary
            </h2>

            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Hash className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-fg-muted">Enquiry number</dt>
                  <dd className="break-all font-mono font-medium text-fg">
                    {enquiry.enquiry_number}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                <div>
                  <dt className="text-fg-muted">Submitted</dt>
                  <dd className="font-medium text-fg">{formatDateTime(enquiry.created_at)}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                <div>
                  <dt className="text-fg-muted">Last updated</dt>
                  <dd className="font-medium text-fg">{formatDateTime(enquiry.updated_at)}</dd>
                </div>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default EnquiryDetailsPage;