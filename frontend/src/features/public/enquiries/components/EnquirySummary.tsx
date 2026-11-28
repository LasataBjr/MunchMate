import { Link } from 'react-router-dom'
import { ClipboardCheck, CreditCard, FileText, ShoppingBag } from 'lucide-react'

import Button from '../../../../components/ui/Button'
import { formatNpr } from '../../../../utils/formatPrice'
import type { SelectedEnquiryItem } from '../types/enquiry.types'

interface EnquirySummaryProps {
  selected: SelectedEnquiryItem[]
  submitting: boolean
  error: string | null
}

const nextSteps = [
  { icon: ClipboardCheck, text: 'We review your request' },
  { icon: FileText, text: 'You receive a quotation' },
  { icon: CreditCard, text: 'Accept it and pay to confirm' },
]

function EnquirySummary({ selected, submitting, error }: EnquirySummaryProps) {
  const totalMachines = selected.reduce((sum, { item }) => sum + item.quantity, 0)
  const estimate = selected.reduce(
    (sum, { machine, item }) => sum + machine.price_npr * item.quantity,
    0
  )

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="summary-heading"
        className="rounded-xl border border-line border-t-4 border-t-brand-red bg-card p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 id="summary-heading" className="text-lg font-semibold text-fg">
            Your request
          </h2>
          <span className="rounded-full bg-brand-red/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
            {totalMachines} {totalMachines === 1 ? 'machine' : 'machines'}
          </span>
        </div>

        {selected.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-fg-muted" aria-hidden="true" />
            <p className="mt-2 text-sm text-fg-muted">
              Machines you add will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 max-h-64 divide-y divide-line overflow-y-auto">
            {selected.map(({ machine, item }) => (
              <li key={machine.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{machine.name}</p>
                  <p className="text-xs text-fg-muted">
                    {item.quantity} × {formatNpr(machine.price_npr)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums text-fg">
                  {formatNpr(machine.price_npr * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-fg-muted">Estimated total</p>
            <p className="text-xl font-bold tabular-nums text-accent">{formatNpr(estimate)}</p>
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            This is an estimate. The final price is confirmed in your quotation.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}

            {(error.includes('log in') || error.includes('sign in')) && (
              <div className="mt-2">
                <Link to="/login" className="font-semibold underline underline-offset-2">
                  Go to customer login
                </Link>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          form="enquiry-form"
          size="lg"
          loading={submitting}
          disabled={selected.length === 0}
          className="mt-4 w-full"
        >
          Submit enquiry
        </Button>
        <p className="mt-2 text-center text-xs text-fg-muted">
          You will review a quotation before anything is ordered.
        </p>
      </section>

      <section
        aria-labelledby="next-heading"
        className="rounded-xl border border-line bg-surface-alt p-5"
      >
        <h2 id="next-heading" className="text-sm font-semibold text-fg">
          What happens next
        </h2>
        <ol className="mt-3 space-y-3">
          {nextSteps.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-fg-muted">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default EnquirySummary;