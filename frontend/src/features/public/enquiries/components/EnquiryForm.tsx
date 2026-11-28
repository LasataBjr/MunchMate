import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

import type { Machine } from '../../machine-catalog/types/machine.types'
import type { SelectedEnquiryItem } from '../types/enquiry.types'

import MachineSelector from './MachineSelector'
import EnquiryItemCard from './EnquiryItemCard'

interface EnquiryFormProps {
  machines: Machine[]
  selected: SelectedEnquiryItem[]
  message: string
  submitting: boolean
  onAddMachine: (id: number) => void
  onQuantityChange: (machineId: number, quantity: number) => void
  onNotesChange: (machineId: number, notes: string) => void
  onRemoveMachine: (machineId: number) => void
  onMessageChange: (message: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function StepHeading({
  number,
  title,
  hint,
}: {
  number: number
  title: string
  hint: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        <p className="mt-0.5 text-sm text-fg-muted">{hint}</p>
      </div>
    </div>
  )
}

function EnquiryForm({
  machines,
  selected,
  message,
  submitting,
  onAddMachine,
  onQuantityChange,
  onNotesChange,
  onRemoveMachine,
  onMessageChange,
  onSubmit,
}: EnquiryFormProps) {
  const selectedIds = new Set(selected.map(({ item }) => item.machine_model_id))

  return (
    // The submit button lives in the summary panel and points here with form="enquiry-form"
    <form id="enquiry-form" onSubmit={onSubmit} className="space-y-10">
      <section aria-label="Choose machines" className="space-y-4">
        <StepHeading
          number={1}
          title="Choose your machines"
          hint="Tap Add on one or more models. You can change quantities next."
        />
        <MachineSelector
          machines={machines}
          selectedIds={selectedIds}
          onAddMachine={onAddMachine}
          disabled={submitting}
        />
      </section>

      <section aria-label="Selected machines" className="space-y-4">
        <StepHeading
          number={2}
          title="Set quantities"
          hint="Add notes if a machine needs something special."
        />

        {selected.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-alt px-5 py-10 text-center">
            <FileText className="mx-auto h-9 w-9 text-fg-muted" aria-hidden="true" />
            <p className="mt-3 font-medium text-fg">No machines selected yet</p>
            <p className="mt-1 text-sm text-fg-muted">
              Pick a machine in step 1, or{' '}
              <Link to="/machines" className="font-medium text-accent hover:underline">
                browse the catalogue
              </Link>
              .
            </p>
          </div>
        ) : (
          selected.map(({ machine, item }) => (
            <EnquiryItemCard
              key={machine.id}
              machine={machine}
              quantity={item.quantity}
              notes={item.notes ?? ''}
              onQuantityChange={(quantity) => onQuantityChange(machine.id, quantity)}
              onNotesChange={(notes) => onNotesChange(machine.id, notes)}
              onRemove={() => onRemoveMachine(machine.id)}
              disabled={submitting}
            />
          ))
        )}
      </section>

      <section aria-label="Additional message" className="space-y-4">
        <StepHeading
          number={3}
          title="Anything else we should know?"
          hint="Optional. Share details about your business or delivery needs."
        />

        <div className="rounded-xl border border-line bg-card p-5 shadow-sm">
          <label htmlFor="enquiry-message" className="sr-only">
            Additional message
          </label>
          <textarea
            id="enquiry-message"
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            maxLength={5000}
            rows={5}
            disabled={submitting}
            placeholder="For example: where the machine will be placed, how many people use the space, preferred delivery dates..."
            className="w-full resize-y rounded-md border border-line bg-card px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 disabled:bg-surface-alt"
          />
          <p className="mt-1 text-right text-xs text-fg-muted">{message.length}/5000</p>
        </div>
      </section>
    </form>
  )
}

export default EnquiryForm;