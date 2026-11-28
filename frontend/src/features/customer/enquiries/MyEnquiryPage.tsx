import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus, RefreshCw, SearchX } from 'lucide-react'

import Button, { buttonStyles } from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import Skeleton from '../../../components/ui/Skeleton'
import { getMyEnquiries } from '../../../services/api/enquiries.api'

import type { MyEnquiryListItem } from '../../public/enquiries/types/enquiry.types'
import EnquiryCard from './components/EnquiryCard'
import { filterLabels, matchesFilter, type EnquiryFilter } from './enquiryStatus'

const filters = Object.keys(filterLabels) as EnquiryFilter[]

function MyEnquiriesPage() {
  // null means "not loaded yet"
  const [enquiries, setEnquiries] = useState<MyEnquiryListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<EnquiryFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadEnquiries() {
      try {
        setError(null)
        const response = await getMyEnquiries()
        if (!cancelled) setEnquiries(response.enquiries)
      } catch {
        if (!cancelled) setError('Unable to load your enquiries. Please try again.')
      } finally {
        if (!cancelled) setRefreshing(false)
      }
    }

    void loadEnquiries()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function reload() {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }

  const counts = useMemo(() => {
    const list = enquiries ?? []
    return Object.fromEntries(
      filters.map((f) => [f, list.filter((e) => matchesFilter(e.status, f)).length])
    ) as Record<EnquiryFilter, number>
  }, [enquiries])

  const visible = useMemo(
    () => (enquiries ?? []).filter((e) => matchesFilter(e.status, filter)),
    [enquiries, filter]
  )

  const loading = enquiries === null && !error

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My enquiries</h1>
          <p className="mt-1 text-sm text-fg-muted">Track your requests for quotations.</p>
        </div>

        <Link to="/machines" className={`${buttonStyles()} w-fit`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New enquiry
        </Link>
      </div>

      <div className="mt-8">
        {loading && (
          <div role="status" aria-label="Loading your enquiries" className="space-y-4">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-44 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && enquiries === null && (
          <ErrorMessage title="Unable to load enquiries" message={error} onRetry={reload} />
        )}

        {enquiries !== null && enquiries.length === 0 && (
          <EmptyState
            as="h2"
            icon={<ClipboardList className="h-7 w-7" aria-hidden="true" />}
            title="No enquiries yet"
            message="When you request a quotation for a machine, your enquiries will appear here."
            action={
              <Link to="/machines" className={buttonStyles()}>
                Browse machines
              </Link>
            }
          />
        )}

        {enquiries !== null && enquiries.length > 0 && (
          <>
            {error && (
              <ErrorMessage
                className="mb-4"
                title="Could not refresh"
                message={error}
                onRetry={reload}
              />
            )}

            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Filter enquiries by status" className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red ${
                      filter === f
                        ? 'border-fg bg-fg font-medium text-surface'
                        : 'border-line bg-card text-fg-muted hover:bg-hover hover:text-fg'
                    }`}
                  >
                    {filterLabels[f]}
                    <span className="ml-1.5 tabular-nums opacity-70">{counts[f]}</span>
                  </button>
                ))}
              </div>

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
                title="No enquiries in this view"
                message="Try another filter to see your other enquiries."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                    Show all
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {visible.map((enquiry) => (
                  <EnquiryCard key={enquiry.id} enquiry={enquiry} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MyEnquiriesPage;