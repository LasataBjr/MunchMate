
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonStyles } from '../../../../components/ui/Button'

const details = [
  { icon: MapPin, title: 'Location', value: 'To be confirmed' },
  { icon: Phone, title: 'Phone', value: 'To be announced' },
  { icon: Mail, title: 'Email', value: 'To be announced' },
  { icon: Clock, title: 'Opening hours', value: 'To be confirmed' },
]

function ContactInformation() {
  return (
    <section aria-labelledby="contact-info-heading">
      <h2
        id="contact-info-heading"
        className="text-xl font-semibold text-fg"
      >
        Contact information
      </h2>

      <p className="mt-2 text-sm leading-6 text-fg-muted">
        Our contact details will be added soon.
      </p>

      <ul className="mt-6 space-y-3">
        {details.map(({ icon: Icon, title, value }) => (
          <li
            key={title}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>

            <div>
              <p className="font-medium text-gray-900">{title}</p>
              <p className="text-sm text-gray-600">{value}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-line bg-surface-alt p-5">
        <h3 className="font-semibold text-fg">Looking for a machine?</h3>

        <p className="mt-1 text-sm text-fg-muted">
          Browse our catalogue and send an enquiry for the model you like.
        </p>

        <Link
          to="/machines"
          className={`${buttonStyles({ variant: 'secondary', size: 'sm' })} mt-4`}
        >
          Browse machines
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

export default ContactInformation;
