import { Check } from 'lucide-react'
import { getProgressIndex, progressSteps } from '../enquiryStatus'

function EnquiryTimeline({ status }: { status: string }) {
  const current = getProgressIndex(status)
  if (current === null) return null

  return (
    <ol aria-label="Enquiry progress" className="grid gap-4 sm:grid-cols-4 sm:gap-0">
      {progressSteps.map((label, i) => {
        const done = i < current
        const active = i === current

        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="relative flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center"
          >
            {/* Connector to the previous step (wide screens) */}
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-4 hidden h-0.5 w-full -translate-y-1/2 sm:block ${
                  i <= current ? 'bg-brand-red' : 'bg-line'
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done
                  ? 'bg-brand-red text-white'
                  : active
                    ? 'border-2 border-brand-red bg-card text-accent'
                    : 'border-2 border-line bg-card text-fg-muted'
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>

            <span
              className={`text-sm ${
                active ? 'font-semibold text-fg' : done ? 'text-fg' : 'text-fg-muted'
              }`}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default EnquiryTimeline;