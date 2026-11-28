import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../components/layout/PublicLayout";
import CustomerLayout from "../components/layout/CustomerLayout";
import AdminLayout from "../components/layout/AdminLayout";

//Public Pages
import HomePage from "../features/public/home/HomePage";
import MachineCatalogPage from "../features/public/machine-catalog/MachineCatalogPage";
import MachineDetailsPage from "../features/public/machine-details/MachineDetailsPage";
import ContactPage from "../features/public/contact/ContactPage";
import EnquiryPage from "../features/public/enquiries/EnquiryPage";

//Authentication
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import LoginPage from "../features/auth/login/LoginPage";
import RegisterPage from "../features/auth/register/RegisterPage";

//Customer Portal
import MyEnquiriesPage from "../features/customer/enquiries/MyEnquiryPage";
import EnquiryDetailsPage from "../features/customer/enquiries/EnquiryDetailsPage";
import MyQuotationsPage from '../features/customer/quotations/MyQuotationsPage';
import QuotationDetailsPage from '../features/customer/quotations/QuotationDetailsPage';
import MyOrdersPage from '../features/customer/orders/MyOrdersPage'
import OrderDetailsPage from '../features/customer/orders/OrderDetailsPage'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <h1 className="text-2xl font-bold text-brand-black">{title}</h1>
      <p className="mt-2 text-fg-muted">
        This page is under development.
      </p>
    </section>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/machines", element: <MachineCatalogPage /> },
      {
        path: "/machines/:machineId",
        element: <MachineDetailsPage />,
      },
      { path: "/contact", element: <ContactPage /> },
      { path: "/enquiries/new", element: <EnquiryPage />,},
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/customer",
        element: <CustomerLayout />,
        children: [
          { index: true, element: <PlaceholderPage title="Customer Dashboard" /> },
          { path: "enquiries", element: <MyEnquiriesPage /> },
          { path: "enquiries/:id", element: <EnquiryDetailsPage /> },

          {path: "quotations", element: <MyQuotationsPage /> },
          { path: "quotations/:id", element: <QuotationDetailsPage  /> },
          
          { path: 'orders', element: <MyOrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailsPage /> },

          { path: "payments", element: <PlaceholderPage title="My Payments" /> },
          {
            path: "deliveries",
            element: <PlaceholderPage title="My Deliveries" />,
          },
          { path: "profile", element: <PlaceholderPage title="My Profile" /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Admin Dashboard" /> },
      {
        path: "machines",
        element: <PlaceholderPage title="Machine Models" />,
      },
      {
        path: "inventory",
        element: <PlaceholderPage title="Machine Inventory" />,
      },
      { path: "customers", element: <PlaceholderPage title="Customers" /> },
      { path: "enquiries", element: <PlaceholderPage title="Enquiries" /> },
      { path: "quotations", element: <PlaceholderPage title="Quotations" /> },
      { path: "orders", element: <PlaceholderPage title="Orders" /> },
      { path: "payments", element: <PlaceholderPage title="Payments" /> },
      { path: "deliveries", element: <PlaceholderPage title="Deliveries" /> },
      {
        path: "installations",
        element: <PlaceholderPage title="Installations" />,
      },
      { path: "staff", element: <PlaceholderPage title="Staff" /> },
      { path: "settings", element: <PlaceholderPage title="Settings" /> },
    ],
  },
  {
    path: "*",
    element: <PlaceholderPage title="Page Not Found" />,
  },
]);