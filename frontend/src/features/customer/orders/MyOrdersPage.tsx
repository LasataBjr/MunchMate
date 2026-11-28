import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, SearchX, ShoppingBag } from 'lucide-react'

import Button, { buttonStyles } from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import FilterChips from '../../../components/ui/FilterChips'
import Skeleton from '../../../components/ui/Skeleton'
import { useDelayedVisible } from '../../../hooks/useDelayedVisible'
import { getMyOrders } from '../../../services/api/orders.api'

import type { MyOrderListItem } from './types/order.types'
import OrderCard from './components/OrderCard'
import { matchesOrderFilter, needsPayment, orderFilterLabels, type OrderFilter } from './orderStatus'

const filters = Object.keys(orderFilterLabels) as OrderFilter[]

export default function MyOrdersPage() {
  // null means "not loaded yet"
  const [orders, setOrders] = useState<MyOrderListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<OrderFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadOrders() {
      try {
        setError(null)
        const response = await getMyOrders()
        if (!cancelled) setOrders(response.orders)
      } catch {
        if (!cancelled) setError('We could not load your orders. Please try again.')
      } finally {
        if (!cancelled) setRefreshing(false)
      }
    }

    void loadOrders()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function reload() {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }

  // Orders that need payment first, then newest first
  const sorted = useMemo(
    () =>
      [...(orders ?? [])].sort(
        (a, b) =>
          Number(needsPayment(b)) - Number(needsPayment(a)) ||
          b.created_at.localeCompare(a.created_at)
      ),
    [orders]
  )

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [f, sorted.filter((o) => matchesOrderFilter(o, f)).length])
      ) as Record<OrderFilter, number>,
    [sorted]
  )

  const visible = useMemo(
    () => sorted.filter((o) => matchesOrderFilter(o, filter)),
    [sorted, filter]
  )

  const dueCount = useMemo(() => sorted.filter(needsPayment).length, [sorted])

  // Loading from the very first render, so there is no blank flash
  const loading = orders === null && !error
  const showSkeleton = useDelayedVisible(loading)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My orders</h1>
          <p className="mt-1 text-sm text-fg-muted">View and track your machine orders.</p>
        </div>

        <Button
          variant="secondary"
          onClick={reload}
          disabled={refreshing}
          className="w-fit"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <div className="mt-8">
        {loading && (
          <div role="status" aria-label="Loading your orders" className="min-h-96 space-y-4">
            {showSkeleton &&
              [0, 1, 2].map((n) => <Skeleton key={n} className="h-52 rounded-xl" />)}
          </div>
        )}

        {!loading && error && orders === null && (
          <ErrorMessage title="Unable to load orders" message={error} onRetry={reload} />
        )}

        {orders !== null && orders.length === 0 && (
          <EmptyState
            as="h2"
            icon={<ShoppingBag className="h-7 w-7" aria-hidden="true" />}
            title="No orders yet"
            message="When you accept a quotation, your order will appear here."
            action={
              <Link to="/customer/quotations" className={buttonStyles()}>
                View my quotations
              </Link>
            }
          />
        )}

        {orders !== null && orders.length > 0 && (
          <>
            {error && (
              <ErrorMessage
                className="mb-5"
                title="Unable to refresh orders"
                message={error}
                onRetry={reload}
              />
            )}

            {dueCount > 0 && (
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-brand-red/40 bg-brand-red/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-fg">
                  {dueCount} {dueCount === 1 ? 'order is' : 'orders are'} waiting for payment.
                </p>
                <Link to="/customer/payments" className={buttonStyles({ size: 'sm' })}>
                  Go to payments
                </Link>
              </div>
            )}

            <div className="mb-5">
              <FilterChips
                label="Filter orders by status"
                options={filters}
                labels={orderFilterLabels}
                counts={counts}
                value={filter}
                onChange={setFilter}
              />
            </div>

            {/* key={filter} replays the fade when you change tabs */}
            <div key={filter} className="page-enter">
              {visible.length === 0 ? (
                <EmptyState
                  as="h2"
                  icon={<SearchX className="h-7 w-7" aria-hidden="true" />}
                  title="No orders in this view"
                  message="There are no orders with this status."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                      Show all
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {visible.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}