import { Link, Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-black px-6 py-4 text-white">
        <Link to="/admin" className="text-xl font-bold">
          MUNCHMATE
        </Link>
        <span>Admin Dashboard</span>
      </header>

      <div className="flex">
        <aside className="min-h-screen w-60 border-r bg-surface-alt p-5">
          <nav className="flex flex-col gap-4">
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/machines">Machine Models</Link>
            <Link to="/admin/inventory">Inventory</Link>
            <Link to="/admin/customers">Customers</Link>
            <Link to="/admin/enquiries">Enquiries</Link>
            <Link to="/admin/quotations">Quotations</Link>
            <Link to="/admin/orders">Orders</Link>
            <Link to="/admin/payments">Payments</Link>
            <Link to="/admin/deliveries">Deliveries</Link>
            <Link to="/admin/installations">Installations</Link>
            <Link to="/admin/staff">Staff</Link>
            <Link to="/admin/settings">Settings</Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;