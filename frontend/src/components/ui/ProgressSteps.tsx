import { Check } from 'lucide-react'

type ProgressStepsProps = {
  steps: string[]
  current: number // steps before this are done; steps.length means all done
  label: string
}

function ProgressSteps({ steps, current, label }: ProgressStepsProps) {
  return (
    <ol aria-label={label} className="flex flex-col gap-4 sm:flex-row sm:gap-0">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current

        return (
          <li
            key={step}
            aria-current={active ? 'step' : undefined}
            className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center"
          >
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
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default ProgressSteps;