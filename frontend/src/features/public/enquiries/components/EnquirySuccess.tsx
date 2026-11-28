import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

import Button, { buttonStyles } from '../../../../components/ui/Button'

interface EnquirySuccessProps {
  enquiryNumber: string
  onNewEnquiry: () => void
}

function EnquirySuccess({ enquiryNumber, onNewEnquiry }: EnquirySuccessProps) {
  return (
    <div
      role="status"
      className="mx-auto max-w-xl rounded-2xl border border-line bg-card px-6 py-12 text-center shadow-sm"
    >
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>

      <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-fg">Enquiry submitted</h2>
      <p className="mt-2 text-fg-muted">Your enquiry number is</p>
      <p className="mt-1 inline-block rounded-lg bg-surface-alt px-4 py-2 font-mono text-lg font-bold text-fg">
        {enquiryNumber}
      </p>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-fg-muted">
        Our team will review your request and prepare a quotation. Keep this number if you need to
        contact us about your enquiry.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/machines" className={buttonStyles()}>
          Browse more machines
        </Link>
        <Button type="button" variant="secondary" onClick={onNewEnquiry}>
          Send another enquiry
        </Button>
      </div>
    </div>
  )
}

export default EnquirySuccess;