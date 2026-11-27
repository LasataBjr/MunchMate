import type { LucideIcon } from 'lucide-react'
import { ClipboardList, CreditCard, FileText, Search } from 'lucide-react'
import Container from '../../../../components/layout/Container'

type Step = { icon: LucideIcon; title: string; description: string }

const steps: Step[] = [
  {
    icon: Search,
    title: 'Explore machines',
    description: 'Browse our catalogue and find a model that suits your business.',
  },
  {
    icon: ClipboardList,
    title: 'Submit an enquiry',
    description: 'Create an account and tell us which machines you are interested in.',
  },
  {
    icon: FileText,
    title: 'Receive a quotation',
    description: 'Our team reviews your needs and prepares a quotation for you.',
  },
  {
    icon: CreditCard,
    title: 'Confirm your order',
    description: 'Accept the quotation and pay. We then arrange delivery and installation.',
  },
]

function HowItWorks() {
  return (
    <section className="bg-surface-alt py-16">
      <Container>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-brand-red" aria-hidden="true" />
          <p className="mt-4 text-fg-muted">
            Getting your vending machine takes four simple steps
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title}
              className="relative rounded-xl border border-line border-t-4 border-t-brand-red bg-card p-6 transition 
              hover:-translate-y-1 hover:shadow-md lg:not-last:after:absolute lg:not-last:after:left-full lg:not-last:after:top-[3.1rem] lg:not-last:after:h-0.5 lg:not-last:after:w-6 lg:not-last:after:bg-brand-red/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-red/10 text-accent">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-4xl font-extrabold text-fg-muted/30" aria-hidden="true">
                  0{index + 1}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">{description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

export default HowItWorks