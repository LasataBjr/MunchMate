import { Link } from "react-router-dom";

function MachineEnquiryButton() {
  return (
    <Link
      to="/login"
      className="inline-flex items-center justify-center rounded-lg bg-brand-red px-6 py-3 font-medium text-white transition hover:bg-brand-dark"
    >
      Login to Enquire
    </Link>
  );
}

export default MachineEnquiryButton;