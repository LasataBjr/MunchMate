import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  CreditCard,
  FileText,
  HelpCircle,
  MessageSquare,
  Package,
  Truck,
  UserRound,
} from 'lucide-react'

import { useAuth } from '../../../app/providers/AuthProvider'
import { buttonStyles } from '../../../components/ui/Button'
import ErrorMessage from '../../../components/ui/ErrorMessage'
import Skeleton from '../../../components/ui/Skeleton'
import { useDelayedVisible } from '../../../hooks/useDelayedVisible'
import { getMyEnquiries } from '../../../services/api/enquiries.api'
import { getMyOrders } from '../../../services/api/orders.api'
import { getMyQuotations } from '../../../services/api/quotations.api'
import { parseDbDate } from '../../../utils/formatDate'
import { formatOrderAmount } from '../../../utils/orderFormatters'

import type { MyEnquiryListItem } from '../../public/enquiries/types/enquiry.types'
import type { MyOrderListItem } from '../orders/types/order.types'
import type { MyQuotationListItem } from '../quotations/types/quotation.types'

import { getEnquiryStatus, matchesFilter } from '../enquiries/enquiryStatus'
import { getOrderStatus, needsPayment } from '../orders/orderStatus'
import { getQuotationStatus, getValidity, isAwaitingResponse } from '../quotations/quotationStatus'

import AttentionPanel, { type AttentionItem } from './components/AttentionPanel'
import RecentActivity, { type ActivityItem } from './components/RecentActivity'
import StatCard from './components/StatCard'

const quickActions = [
  { to: '/machines', label: 'Request a quotation', icon: ClipboardList },
  { to: '/customer/payments', label: 'My payments', icon: CreditCard },
  { to: '/customer/deliveries', label: 'My deliveries', icon: Truck },
  { to: '/customer/profile', label: 'My profile', icon: UserRound },
]

export default function DashboardPage() {
  const { user } = useAuth()

  // null means "not loaded" (or this one request failed)
  const [enquiries, setEnquiries] = useState<MyEnquiryListItem[] | null>(null)
  const [quotations, setQuotations] = useState<MyQuotationListItem[] | null>(null)
  const [orders, setOrders] = useState<MyOrderListItem[] | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [failedCount, setFailedCount] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  const showSkeleton = useDelayedVisible(!loaded)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      // allSettled: one failed request does not wipe the parts that loaded
      const [enquiryResult, quotationResult, orderResult] = await Promise.allSettled([
        getMyEnquiries(),
        getMyQuotations(),
        getMyOrders(),
      ])

      if (cancelled) return

      // On a failed refresh, keep what we already had
      setEnquiries((prev) => (enquiryResult.status === 'fulfilled' ? enquiryResult.value.enquiries : prev))
      setQuotations((prev) => (quotationResult.status === 'fulfilled' ? quotationResult.value.quotations : prev))
      setOrders((prev) => (orderResult.status === 'fulfilled' ? orderResult.value.orders : prev))

      setFailedCount(
        [enquiryResult, quotationResult, orderResult].filter((r) => r.status === 'rejected').length
      )
      setLoaded(true)
      setRefreshing(false)
    }

    void loadDashboard()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function reload() {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }

  const attention = useMemo<AttentionItem[]>(() => {
    const quotationItems: AttentionItem[] = (quotations ?? [])
      .filter((q) => isAwaitingResponse(q.status))
      .map((q) => {
        const validity = getValidity(q.valid_until)
        return {
          key: `quotation-${q.id}`,
          icon: FileText,
          title: 'Quotation waiting for your response',
          detail: `${q.quotation_number}${validity ? ` · ${validity.text}` : ''}`,
          to: `/customer/quotations/${q.id}`,
          action: 'Review',
        }
      })

    const orderItems: AttentionItem[] = (orders ?? []).filter(needsPayment).map((o) => ({
      key: `order-${o.id}`,
      icon: CreditCard,
      title: 'Order waiting for payment',
      detail: `${o.order_number} · ${formatOrderAmount(o.total_amount_paisa)}`,
      to: `/customer/orders/${o.id}`,
      action: 'View and pay',
    }))

    return [...quotationItems, ...orderItems]
  }, [quotations, orders])

  const activities = useMemo<ActivityItem[]>(() => {
    const fromEnquiries: ActivityItem[] = (enquiries ?? []).map((item) => {
      const status = getEnquiryStatus(item.status)
      return {
        key: `enquiry-${item.id}`,
        type: 'enquiry',
        title: 'Enquiry submitted',
        reference: item.enquiry_number,
        label: status.label,
        tone: status.tone,
        date: item.created_at,
        to: `/customer/enquiries/${item.id}`,
      }
    })

    const fromQuotations: ActivityItem[] = (quotations ?? []).map((item) => {
      const status = getQuotationStatus(item.status)
      return {
        key: `quotation-${item.id}`,
        type: 'quotation',
        title: 'Quotation received',
        reference: item.quotation_number,
        label: status.label,
        tone: status.tone,
        date: item.created_at,
        to: `/customer/quotations/${item.id}`,
      }
    })

    const fromOrders: ActivityItem[] = (orders ?? []).map((item) => {
      const status = getOrderStatus(item.status)
      return {
        key: `order-${item.id}`,
        type: 'order',
        title: 'Order created',
        reference: item.order_number,
        label: status.label,
        tone: status.tone,
        date: item.created_at,
        to: `/customer/orders/${item.id}`,
      }
    })

    return [...fromEnquiries, ...fromQuotations, ...fromOrders]
      .sort((a, b) => parseDbDate(b.date).getTime() - parseDbDate(a.date).getTime())
      .slice(0, 5)
  }, [enquiries, quotations, orders])

  const inProgressEnquiries = (enquiries ?? []).filter((e) => matchesFilter(e.status, 'open')).length
  const awaitingQuotations = (quotations ?? []).filter((q) => isAwaitingResponse(q.status)).length
  const activeOrders = (orders ?? []).filter((o) => o.status === 'confirmed' || o.status === 'processing').length
  const awaitingPayment = (orders ?? []).filter(needsPayment).length

  const firstName = user?.name?.trim().split(/\s+/)[0]
  const allFailed = loaded && failedCount === 3 && enquiries === null && quotations === null && orders === null

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-red to-brand-dark p-6 text-white sm:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div aria-hidden="true" className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-white/10" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-2 max-w-xl text-white/90">
              {!loaded
                ? 'Loading your account...'
                : attention.length > 0
                  ? `You have ${attention.length} ${attention.length === 1 ? 'item' : 'items'} that ${attention.length === 1 ? 'needs' : 'need'} your attention.`
                  : 'Everything is up to date.'}
            </p>
          </div>

          <Link
            to="/machines"
            className="inline-flex w-fit shrink-0 items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand-red transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Request a quotation
          </Link>
        </div>
      </section>

      {!loaded && (
        <div role="status" aria-label="Loading your dashboard" className="min-h-[36rem]">
          {showSkeleton && (
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-40 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          )}
        </div>
      )}

      {allFailed && (
        <ErrorMessage
          title="Unable to load your dashboard"
          message="Please check your connection and try again."
          onRetry={reload}
        />
      )}

      {loaded && !allFailed && (
        <>
          {failedCount > 0 && (
            <ErrorMessage
              title="Some information could not be loaded"
              message="Parts of your dashboard may be missing or out of date."
              onRetry={reload}
            />
          )}

          <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Enquiries in progress"
              value={enquiries === null ? null : inProgressEnquiries}
              description={`${enquiries?.length ?? 0} submitted in total`}
              icon={ClipboardList}
              to="/customer/enquiries"
            />
            <StatCard
              title="Quotations to review"
              value={quotations === null ? null : awaitingQuotations}
              description={`${quotations?.length ?? 0} received in total`}
              icon={FileText}
              to="/customer/quotations"
              highlight={awaitingQuotations > 0}
            />
            <StatCard
              title="Active orders"
              value={orders === null ? null : activeOrders}
              description={`${orders?.length ?? 0} placed in total`}
              icon={Package}
              to="/customer/orders"
            />
            <StatCard
              title="Awaiting payment"
              value={orders === null ? null : awaitingPayment}
              description="Orders that need payment"
              icon={CreditCard}
              to="/customer/payments"
              highlight={awaitingPayment > 0}
            />
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <AttentionPanel items={attention} />
              <RecentActivity activities={activities} refreshing={refreshing} onRefresh={reload} />
            </div>

            <aside className="space-y-6">
              <section
                aria-labelledby="quick-heading"
                className="rounded-xl border border-line bg-card p-5 shadow-sm"
              >
                <h2 id="quick-heading" className="font-semibold text-fg">
                  Quick actions
                </h2>

                <ul className="mt-4 space-y-2">
                  {quickActions.map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-brand-red"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="help-heading"
                className="rounded-xl border border-line bg-surface p-5"
              >
                <h2 id="help-heading" className="flex items-center gap-2 font-semibold text-fg">
                  <HelpCircle className="h-5 w-5 text-accent" aria-hidden="true" />
                  Need help?
                </h2>
                <p className="mt-2 text-sm leading-6 text-fg-muted">
                  Have a question about a quotation, an order or a delivery? Our team is happy to
                  help.
                </p>
                <Link to="/contact" className={`${buttonStyles({ variant: 'secondary', size: 'sm' })} mt-4`}>
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  Contact us
                </Link>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}