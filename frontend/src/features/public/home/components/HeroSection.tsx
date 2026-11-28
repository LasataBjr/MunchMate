import { Link } from 'react-router-dom'
import { QrCode, ShieldCheck, Truck } from 'lucide-react'
import Container from '../../../../components/layout/Container'
import { buttonStyles } from '../../../../components/ui/Button'
import heroImage from '../../../../assets/images/hero-vending.webp'

const benefits = [
  { icon: ShieldCheck, text: 'Clear quotations' },
  { icon: QrCode, text: 'Pay with Fonepay QR' },
  { icon: Truck, text: 'Delivery and installation' },
]

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-surface">
      {/* Background image: faint behind the text on phones, right half on large screens */}
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-15 dark:opacity-10 lg:w-1/2 lg:opacity-100 lg:dark:opacity-90 dark:brightness-75"
      />
      {/* Fade on the image's left edge (large screens), matches the page background */}
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-r from-surface-alt to-transparent lg:block" />
       {/* top fade */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-surface-alt/90 to-transparent" />

       <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-8 w-full text-surface sm:h-12"
    >
        <path
        fill="currentColor"
        d="M0 32C240 0 480 0 720 16C960 32 1200 40 1440 16V48H0Z"
        />
    </svg>
          
      <Container className="relative pb-20 pt-28 sm:pb-28 sm:pt-36">   
        <div className="max-w-xl">
          <p className="inline-block rounded-full border border-line bg-card px-4 py-1 text-sm font-medium text-fg">
            Vending machines for business
          </p>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
            Smart vending solutions for your <span className="text-accent">business</span>
          </h1>

          <p className="mt-5 text-lg text-fg-muted">
            Explore our vending machines, ask for a quotation, and we take care of
            delivery and installation.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/machines" className={buttonStyles({ size: 'lg' })}>
              Explore machines
            </Link>
            <Link to="/contact" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Contact us
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-fg">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}

export default HeroSection