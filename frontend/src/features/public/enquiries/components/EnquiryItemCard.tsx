import { Minus, Plus, Trash2 } from 'lucide-react'

import Button from '../../../../components/ui/Button'
import type { Machine } from '../../machine-catalog/types/machine.types'
import { formatNpr } from '../../../../utils/formatPrice'

interface EnquiryItemCardProps {
  machine: Machine
  quantity: number
  notes: string
  onQuantityChange: (quantity: number) => void
  onNotesChange: (notes: string) => void
  onRemove: () => void
  disabled?: boolean
}

const stepperButton =
  'flex h-9 w-9 items-center justify-center rounded-md border border-line text-fg-muted transition-colors ' +
  'hover:bg-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red'

function EnquiryItemCard({
  machine,
  quantity,
  notes,
  onQuantityChange,
  onNotesChange,
  onRemove,
  disabled = false,
}: EnquiryItemCardProps) {
  return (
    <article className="rounded-xl border border-line border-l-4 border-l-brand-red bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <p className="text-sm font-medium text-accent">{machine.category_name}</p>
          <h3 className="mt-1 text-lg font-semibold text-fg">{machine.name}</h3>
          <p className="mt-1 text-sm text-fg-muted">Model: {machine.model_number}</p>

          <p className="mt-2 text-sm font-medium text-fg">
            {formatNpr(machine.price_npr)}
            <span className="ml-1 font-normal text-fg-muted">per machine</span>
          </p>

          {quantity > 1 && (
            <p className="mt-1 text-sm text-fg-muted">
              Subtotal:{' '}
              <span className="font-semibold text-fg">
                {formatNpr(machine.price_npr * quantity)}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-start">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove ${machine.name}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div role="group" aria-labelledby={`qty-label-${machine.id}`}>
          <p id={`qty-label-${machine.id}`} className="text-sm font-medium text-fg">
            Quantity
          </p>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={disabled || quantity <= 1}
              className={stepperButton}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>

            <span className="min-w-8 text-center font-semibold tabular-nums text-fg" aria-live="polite">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={disabled || quantity >= 10000}
              className={stepperButton}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div>
          <label htmlFor={`machine-notes-${machine.id}`} className="block text-sm font-medium text-fg">
            Notes for this machine
            <span className="ml-1 font-normal text-fg-muted">(optional)</span>
          </label>

          <textarea
            id={`machine-notes-${machine.id}`}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            maxLength={1000}
            rows={2}
            disabled={disabled}
            placeholder="Any specific requirements?"
            className="mt-2 w-full resize-y rounded-md border border-line bg-card px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 disabled:bg-surface-alt"
          />

          <p className="mt-1 text-right text-xs text-fg-muted">{notes.length}/1000</p>
        </div>
      </div>
    </article>
  )
}

export default EnquiryItemCard;