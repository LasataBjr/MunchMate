import { Info } from 'lucide-react'
import Button from '../../../../components/ui/Button'

const inputClass =
  'w-full rounded-md border border-line bg-card px-4 py-2.5 text-sm text-fg placeholder:text-fg-muted ' +
  'focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-fg-muted'

function ContactMessageForm() {
  return (
    <section
      aria-labelledby="contact-form-heading"
      className="rounded-xl border border-line bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 id="contact-form-heading" className="text-xl font-semibold text-fg">
        Send us a message
      </h2>

      <div className="mt-4 flex items-start gap-3 rounded-lg bg-surface-alt p-3 text-sm text-fg-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>The message form is not open yet. It will be available soon.</p>
      </div>

      <form className="mt-6">
        <fieldset disabled className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-fg">
              Name
            </label>
            <input id="name" name="name" type="text" autoComplete="name" className={inputClass} />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-fg">
              Email address
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-fg">
              Message
            </label>
            <textarea id="message" name="message" rows={5} className={`${inputClass} resize-y`} />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Send message
          </Button>
        </fieldset>
      </form>
    </section>
  )
}

export default ContactMessageForm;