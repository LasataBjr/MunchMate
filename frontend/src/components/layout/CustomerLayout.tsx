import { Link, Outlet } from "react-router-dom";

function CustomerLayout() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-black px-6 py-4 text-white">
        <Link to="/customer" className="text-xl font-bold">
          MUNCHMATE
        </Link>
        <span>Customer Portal</span>
      </header>

      <div className="flex">
        <aside className="min-h-screen w-56 border-r bg-surface-alt p-5">
          <nav className="flex flex-col gap-4">
            <Link to="/customer">Dashboard</Link>
            <Link to="/customer/enquiries">My Enquiries</Link>
            <Link to="/customer/quotations">My Quotations</Link>
            <Link to="/customer/orders">My Orders</Link>
            <Link to="/customer/payments">Payments</Link>
            <Link to="/customer/deliveries">Deliveries</Link>
            <Link to="/customer/profile">My Profile</Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default CustomerLayout;