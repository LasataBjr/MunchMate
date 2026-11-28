import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I get a quotation?',
    answer:
      'Create an account, send an enquiry for the machines you are interested in, and our team will prepare a quotation for you to review.',
  },
  {
    question: 'How do I pay?',
    answer:
      'After you accept a quotation and confirm your order, you can pay with Fonepay QR from your account.',
  },
  {
    question: 'Do you deliver and install the machine?',
    answer:
      'Yes. Once your order is confirmed, we arrange delivery and installation, and you can follow the progress in your account.',
  },
]

function ContactFaq() {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl text-accent font-bold tracking-tight">
        Frequently Asked Questions
      </h2>

      <div className="mt-6 divide-y divide-line border border-line bg-card">
        {faqs.map(({ question, answer }) => (
          <details key={question} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-fg [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-fg-muted transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 text-sm leading-6 text-fg-muted">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default ContactFaq;