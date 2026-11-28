import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Package } from 'lucide-react'

import { buttonStyles } from '../../../../components/ui/Button'
import StatusBadge from '../../../../components/ui/StatusBadge'
import { formatDate } from '../../../../utils/formatDate'
import { formatOrderAmount } from '../../../../utils/orderFormatters'

import type { MyOrderListItem } from '../types/order.types'
import {
  getFulfillmentStatus,
  getOrderStatus,
  getPaymentStatus,
  needsPayment,
} from '../orderStatus'

export default function OrderCard({ order }: { order: MyOrderListItem }) {
  const orderStatus = getOrderStatus(order.status)
  const paymentStatus = getPaymentStatus(order.payment_status)
  const fulfillmentStatus = getFulfillmentStatus(order.fulfillment_status)
  const due = needsPayment(order)

  return (
    <article
      className={`rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        due ? 'border-brand-red/40' : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
            <Package className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-mono text-base font-semibold text-fg">
              {order.order_number}
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-fg-muted">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Placed {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <StatusBadge tone={orderStatus.tone}>{orderStatus.label}</StatusBadge>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-fg-muted">Payment</dt>
          <dd className="mt-1.5">
            <StatusBadge tone={paymentStatus.tone}>{paymentStatus.label}</StatusBadge>
          </dd>
        </div>

        <div>
          <dt className="text-xs text-fg-muted">Delivery</dt>
          <dd className="mt-1.5">
            <StatusBadge tone={fulfillmentStatus.tone}>{fulfillmentStatus.label}</StatusBadge>
          </dd>
        </div>

        <div>
          <dt className="text-xs text-fg-muted">Order total</dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-fg">
            {formatOrderAmount(order.total_amount_paisa)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">
          {due ? 'Payment is needed to continue with this order.' : orderStatus.hint}
        </p>

        <Link
          to={`/customer/orders/${order.id}`}
          className={`${buttonStyles({ variant: due ? 'primary' : 'secondary', size: 'sm' })} w-full sm:w-auto`}
        >
          {due ? 'View and pay' : 'View details'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}