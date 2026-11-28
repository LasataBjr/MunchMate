import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, RefreshCw, SearchX } from 'lucide-react'

import Button, { buttonStyles } from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import FilterChips from '../../../components/ui/FilterChips'
import Skeleton from '../../../components/ui/Skeleton'
import { getMyQuotations } from '../../../services/api/quotations.api'

import type { MyQuotationListItem } from './types/quotation.types'
import QuotationCard from './components/QuotationCard'
import {
  isAwaitingResponse,
  matchesQuotationFilter,
  quotationFilterLabels,
  type QuotationFilter,
} from './quotationStatus'

const filters = Object.keys(quotationFilterLabels) as QuotationFilter[]

function MyQuotationsPage() {
  // null means "not loaded yet"
  const [quotations, setQuotations] = useState<MyQuotationListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<QuotationFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadQuotations() {
      try {
        setError(null)
        const response = await getMyQuotations()
        if (!cancelled) setQuotations(response.quotations)
      } catch {
        if (!cancelled) setError('Unable to load your quotations. Please try again.')
      } finally {
        if (!cancelled) setRefreshing(false)
      }
    }

    void loadQuotations()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function reload() {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }

  // Quotations waiting for a decision first, then newest first
  const sorted = useMemo(
    () =>
      [...(quotations ?? [])].sort(
        (a, b) =>
          Number(isAwaitingResponse(b.status)) - Number(isAwaitingResponse(a.status)) ||
          b.created_at.localeCompare(a.created_at)
      ),
    [quotations]
  )

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [f, sorted.filter((q) => matchesQuotationFilter(q.status, f)).length])
      ) as Record<QuotationFilter, number>,
    [sorted]
  )

  const visible = useMemo(
    () => sorted.filter((q) => matchesQuotationFilter(q.status, filter)),
    [sorted, filter]
  )

    const awaitingCount = counts.sent;
    const loading = quotations === null && !error;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My quotations</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Review the quotations prepared for your enquiries.
          </p>
        </div>

        <Link to="/customer/enquiries" className={`${buttonStyles({ variant: 'secondary' })} w-fit`}>
          View my enquiries
        </Link>
      </div>

      <div className="mt-8">
        {loading && (
          <div role="status" aria-label="Loading your quotations" className="space-y-4">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-48 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && quotations === null && (
          <ErrorMessage title="Unable to load quotations" message={error} onRetry={reload} />
        )}

        {quotations !== null && quotations.length === 0 && (
          <EmptyState
            as="h2"
            icon={<FileText className="h-7 w-7" aria-hidden="true" />}
            title="No quotations yet"
            message="Once our team prepares a quotation for one of your enquiries, it will appear here."
            action={
              <Link to="/customer/enquiries" className={buttonStyles()}>
                View my enquiries
              </Link>
            }
          />
        )}

        {quotations !== null && quotations.length > 0 && (
          <>
            {error && (
              <ErrorMessage
                className="mb-5"
                title="Unable to refresh quotations"
                message={error}
                onRetry={reload}
              />
            )}


            {awaitingCount > 0 && filter !== 'sent' && (
                <div className="mb-5 flex flex-col gap-3 rounded-xl border border-brand-red/40 bg-brand-red/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-fg">
                    {awaitingCount} {awaitingCount === 1 ? 'quotation is' : 'quotations are'} waiting
                    for your response.
                    </p>
                    <Button size="sm" onClick={() => setFilter('sent')}>
                    Show {awaitingCount === 1 ? 'it' : 'them'}
                    </Button>
                </div>
            )}

            <div className="mb-5 flex flex-wrap items-center gap-2">
              <FilterChips
                label="Filter quotations by status"
                options={filters}
                labels={quotationFilterLabels}
                counts={counts}
                value={filter}
                onChange={setFilter}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={reload}
                disabled={refreshing}
                className="sm:ml-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Refresh
              </Button>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                as="h2"
                icon={<SearchX className="h-7 w-7" aria-hidden="true" />}
                title="No quotations in this view"
                message="Try another filter to see your other quotations."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                    Show all
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {visible.map((quotation) => (
                  <QuotationCard key={quotation.id} quotation={quotation} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MyQuotationsPage;