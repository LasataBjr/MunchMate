import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { ArrowLeft, ArrowRight, CalendarDays, CreditCard, Package, Truck, XCircle } from 'lucide-react'

import { buttonStyles } from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import ProgressSteps from '../../../components/ui/ProgressSteps'
import Skeleton from '../../../components/ui/Skeleton'
import StatusBadge from '../../../components/ui/StatusBadge'
import { useDelayedVisible } from '../../../hooks/useDelayedVisible'
import { getMyOrderById } from '../../../services/api/orders.api'
import { formatDateTime } from '../../../utils/formatDate'
import { formatOrderAmount } from '../../../utils/orderFormatters'

import type { MyOrderDetails } from './types/order.types'
import {
  getFulfillmentStatus,
  getOrderProgress,
  getOrderStatus,
  getPaymentStatus,
  needsPayment,
  orderSteps,
} from './orderStatus'

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const validId = Boolean(id && /^\d+$/.test(id) && Number(id) > 0)

  const [order, setOrder] = useState<MyOrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const showSkeleton = useDelayedVisible(loading)

  useEffect(() => {
    if (!validId) return

    let cancelled = false

    async function loadOrder() {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)
        setOrder(null)

        const response = await getMyOrderById(Number(id))
        if (!cancelled) setOrder(response.order)
      } catch (err) {
        if (cancelled) return

        if (isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError('We could not load this order. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadOrder()
    return () => {
      cancelled = true
    }
  }, [id, validId, retryCount])

  const backLink = (
    <Link
      to="/customer/orders"
      className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition-colors hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      My orders
    </Link>
  )

  if (!validId || notFound) {
    return (
      <div>
        {backLink}
        <EmptyState
          as="h2"
          className="mt-6"
          icon={<Package className="h-7 w-7" aria-hidden="true" />}
          title="Order not found"
          message="This order does not exist or is not available in your account."
          action={
            <Link to="/customer/orders" className={buttonStyles()}>
              Back to my orders
            </Link>
          }
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading order" className="min-h-[32rem]">
        {backLink}
        {showSkeleton && (
          <>
            <Skeleton className="mt-6 h-9 w-72" />
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
              </div>
              <Skeleton className="h-80 rounded-xl" />
            </div>
          </>
        )}
      </div>
    )
  }

  if (error || !order) {
    return (
      <div>
        {backLink}
        <ErrorMessage
          className="mt-6"
          title="Unable to load order"
          message={error ?? 'Something went wrong.'}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      </div>
    )
  }

  const orderStatus = getOrderStatus(order.status)
  const paymentStatus = getPaymentStatus(order.payment_status)
  const fulfillmentStatus = getFulfillmentStatus(order.fulfillment_status)
  const progress = getOrderProgress(order.status)
  const due = needsPayment(order)

  return (
    <div>
      {backLink}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-fg-muted">Order</p>
          <h1 className="break-all font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
            {order.order_number}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-fg-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <StatusBadge tone={orderStatus.tone}>{orderStatus.label}</StatusBadge>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <section
            aria-label="Order progress"
            className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
          >
            {progress === null ? (
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-fg-muted" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-fg">{orderStatus.label}</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {orderStatus.hint || 'This order is no longer active.'}
                  </p>
                </div>
              </div>
            ) : (
              <ProgressSteps steps={orderSteps} current={progress} label="Order progress" />
            )}
          </section>

          <section
            aria-labelledby="items-heading"
            className="rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                <Package className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="items-heading" className="font-semibold text-fg">
                  Ordered machines
                </h2>
                <p className="text-sm text-fg-muted">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order
                </p>
              </div>
            </div>

            {order.items.length === 0 ? (
              <p className="mt-5 text-sm text-fg-muted">No machine items were found for this order.</p>
            ) : (
              <div className="mt-5 overflow-hidden rounded-lg border border-line">
                <div
                  aria-hidden="true"
                  className="hidden grid-cols-12 gap-4 bg-surface-alt px-4 py-2 text-xs font-medium text-fg-muted sm:grid"
                >
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-right">Quantity</span>
                  <span className="col-span-2 text-right">Unit price</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>

                <ul className="divide-y divide-line">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-12 items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
                    >
                      <p className="col-span-12 font-medium text-fg sm:col-span-6">
                        {item.description}
                      </p>

                      <p className="col-span-8 text-fg-muted sm:hidden">
                        {item.quantity} × {formatOrderAmount(item.unit_price_paisa)}
                      </p>

                      <p className="hidden text-right tabular-nums text-fg sm:col-span-2 sm:block">
                        {item.quantity}
                      </p>
                      <p className="hidden text-right tabular-nums text-fg-muted sm:col-span-2 sm:block">
                        {formatOrderAmount(item.unit_price_paisa)}
                      </p>

                      <p className="col-span-4 text-right font-semibold tabular-nums text-fg sm:col-span-2">
                        {formatOrderAmount(item.line_total_paisa)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <section
            aria-labelledby="summary-heading"
            className="rounded-xl border border-line border-t-4 border-t-brand-red bg-card p-5 shadow-sm"
          >
            <h2 id="summary-heading" className="text-sm font-semibold text-fg">
              Order summary
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">Subtotal</dt>
                <dd className="font-medium tabular-nums text-fg">
                  {formatOrderAmount(order.subtotal_paisa)}
                </dd>
              </div>

              {order.discount_paisa > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-muted">Discount</dt>
                  <dd className="font-medium tabular-nums text-success">
                    − {formatOrderAmount(order.discount_paisa)}
                  </dd>
                </div>
              )}

              {order.tax_amount_paisa > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-muted">Tax</dt>
                  <dd className="font-medium tabular-nums text-fg">
                    {formatOrderAmount(order.tax_amount_paisa)}
                  </dd>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <dt className="font-semibold text-fg">Total</dt>
                <dd className="text-2xl font-extrabold tabular-nums text-accent">
                  {formatOrderAmount(order.total_amount_paisa)}
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="status-heading"
            className="rounded-xl border border-line bg-card p-5 shadow-sm"
          >
            <h2 id="status-heading" className="text-sm font-semibold text-fg">
              Payment and delivery
            </h2>

            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-fg-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-fg-muted">Payment</p>
                  <div className="mt-1">
                    <StatusBadge tone={paymentStatus.tone}>{paymentStatus.label}</StatusBadge>
                  </div>
                  {paymentStatus.hint && (
                    <p className="mt-1.5 text-xs text-fg-muted">{paymentStatus.hint}</p>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-fg-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-fg-muted">Delivery</p>
                  <div className="mt-1">
                    <StatusBadge tone={fulfillmentStatus.tone}>{fulfillmentStatus.label}</StatusBadge>
                  </div>
                  {fulfillmentStatus.hint && (
                    <p className="mt-1.5 text-xs text-fg-muted">{fulfillmentStatus.hint}</p>
                  )}
                </div>
              </li>
            </ul>

            <Link
              to="/customer/payments"
              className={`${buttonStyles({ variant: due ? 'primary' : 'secondary' })} mt-5 w-full`}
            >
              {due ? 'Go to payments' : 'View payments'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}