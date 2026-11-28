import { Link } from 'react-router-dom'
import { buttonStyles } from '../../../../components/ui/Button'

interface MachineEnquiryButtonProps {
  machineId: number
}

function MachineEnquiryButton({ machineId }: MachineEnquiryButtonProps) {
  return (
    <Link
      to={`/enquiries/new?machineId=${machineId}`}
      className={`${buttonStyles({ size: 'lg' })} w-full`}
    >
      Request a quotation
    </Link>
  )
}

export default MachineEnquiryButton;