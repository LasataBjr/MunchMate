import Container from '../../../components/layout/Container'
import ContactInformation from './components/ContactInformation'
import ContactMessageForm from './components/ContactMessageForm'

function ContactPage() {
  return (
    <>
      {/* Full-width header band */}
      <div className="border-b border-line bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-12 text-center sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Contact <span className="text-black">Grab <span className="text-accent">24</span></span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-fg-muted">
            Have a question about our vending machines or services? We are
            making it easier to get in touch.
          </p>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <ContactInformation />
          </div>
          <div className="lg:col-span-3">
            <ContactMessageForm />
          </div>
        </div>
      </Container>
    </>
  )
}

export default ContactPage;