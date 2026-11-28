import type { StatusTone } from '../../../components/ui/StatusBadge'
import type {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from './types/order.types'

export type StatusInfo = { label: string; tone: StatusTone; hint: string }

function humanize(value: string): string {
  const text = value.replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Unknown values fall back to a plain grey badge, so a new backend status never breaks a page
function lookup(map: Record<string, StatusInfo>, value: string): StatusInfo {
  return map[value] ?? { label: humanize(value), tone: 'neutral', hint: '' }
}

const orderStatuses = {
  confirmed: { label: 'Confirmed', tone: 'info', hint: 'Your order is confirmed.' },
  processing: { label: 'Processing', tone: 'warning', hint: 'We are working on your order.' },
  completed: { label: 'Completed', tone: 'success', hint: 'This order is complete.' },
  cancelled: { label: 'Cancelled', tone: 'neutral', hint: 'This order was cancelled.' },
} satisfies Record<OrderStatus, StatusInfo>

const paymentStatuses = {
  unpaid: { label: 'Unpaid', tone: 'danger', hint: 'Payment is needed to continue with this order.' },
  pending: { label: 'Payment pending', tone: 'warning', hint: 'Your payment has not been confirmed yet.' },
  paid: { label: 'Paid', tone: 'success', hint: 'Payment received. Thank you.' },
  partially_refunded: { label: 'Partly refunded', tone: 'warning', hint: 'Part of this payment was refunded.' },
  refunded: { label: 'Refunded', tone: 'neutral', hint: 'This payment was refunded.' },
} satisfies Record<PaymentStatus, StatusInfo>

const fulfillmentStatuses = {
  awaiting_stock: { label: 'Awaiting stock', tone: 'warning', hint: 'We are waiting for stock to be available.' },
  stock_reserved: { label: 'Stock reserved', tone: 'info', hint: 'Your machines are reserved for you.' },
  partially_dispatched: { label: 'Partly dispatched', tone: 'info', hint: 'Some of your machines are on their way.' },
  partially_delivered: { label: 'Partly delivered', tone: 'info', hint: 'Some of your machines have been delivered.' },
  delivered: { label: 'Delivered', tone: 'success', hint: 'All your machines have been delivered.' },
} satisfies Record<FulfillmentStatus, StatusInfo>

export const getOrderStatus = (status: string) => lookup(orderStatuses, status)
export const getPaymentStatus = (status: string) => lookup(paymentStatuses, status)
export const getFulfillmentStatus = (status: string) => lookup(fulfillmentStatuses, status)

export type OrderFilter = 'all' | OrderStatus

export const orderFilterLabels: Record<OrderFilter, string> = {
  all: 'All orders',
  confirmed: 'Confirmed',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function matchesOrderFilter(order: { status: string }, filter: OrderFilter): boolean {
  return filter === 'all' || order.status === filter
}

// A cancelled order never needs payment, even if it was unpaid
export function needsPayment(order: { status: string; payment_status: string }): boolean {
  return (
    order.status !== 'cancelled' &&
    (order.payment_status === 'unpaid' || order.payment_status === 'pending')
  )
}

export const orderSteps = ['Confirmed', 'Processing', 'Completed']

// null means the order left the normal path (cancelled or unknown).
// 3 means every step is done.
export function getOrderProgress(status: string): number | null {
  const index: Record<string, number> = { confirmed: 0, processing: 1, completed: 3 }
  return index[status] ?? null
}