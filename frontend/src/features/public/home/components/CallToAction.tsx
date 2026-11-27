import { Link } from 'react-router-dom'
import { Check, Wrench } from 'lucide-react'
import Container from '../../../../components/layout/Container'

const perks = [
  'Track enquiries, quotations and orders in your account',
  'Pay securely with Fonepay QR',
  'Delivery and installation arranged for you',
]

function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-red to-brand-dark text-white">
      {/* Texture: faint dots */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decoration: soft circle and a large faded icon */}
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10"
      />
      <Wrench
        aria-hidden="true"
        className="absolute -bottom-10 right-4 h-72 w-72 rotate-12 text-white/10"
      />

      {/* Curved top edge, painted in the previous section's color */}
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-8 w-full text-surface-alt sm:h-12"
      >
        <path fill="currentColor" d="M0 0H1440V16C1200 40 960 32 720 16C480 0 240 0 0 32Z" />
      </svg>

      <Container className="relative grid items-center gap-10 pb-16 pt-24 sm:pt-28 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to find your vending machine?
          </h2>

          <p className="mt-4 max-w-xl text-lg text-white/90">
            Explore our machines or talk to our team about what your business needs
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/machines"
              className="rounded-md bg-white px-6 py-3 font-semibold text-brand-red transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore machines
            </Link>
            <Link
              to="/contact"
              className="rounded-md border border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Contact us
            </Link>
          </div>
        </div>

        <ul className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm sm:p-8">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-red">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-white/95">{perk}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

export default CallToAction;