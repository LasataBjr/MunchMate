import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Truck,
  UserRound,
} from 'lucide-react'

import { useAuth } from '../../app/providers/AuthProvider'
import { siteInfo } from '../../config/site'
import Button, { buttonStyles } from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'

const links = [
  { to: '/customer', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customer/enquiries', label: 'My enquiries', icon: ClipboardList },
  { to: '/customer/quotations', label: 'My quotations', icon: FileText },
  { to: '/customer/orders', label: 'My orders', icon: Package },
  { to: '/customer/payments', label: 'Payments', icon: CreditCard },
  { to: '/customer/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/customer/profile', label: 'My profile', icon: UserRound },
]

function sideLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-red/10 text-accent'
      : 'text-fg-muted hover:bg-hover hover:text-fg'
  }`
}

function tabLinkClass({ isActive }: { isActive: boolean }) {
  return `flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
    isActive
      ? 'border-brand-red text-accent'
      : 'border-transparent text-fg-muted hover:text-fg'
  }`
}

function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Adjust this one line to match the fields your user object really has
  const displayName = user?.email ?? 'Customer'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <a
        href="#portal-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-fg focus:shadow"
      >
        Skip to content
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link to="/customer" className="text-xl font-extrabold tracking-tight">
            {siteInfo.name}
          </Link>
          <span className="hidden rounded-full bg-brand-red/10 px-2.5 py-0.5 text-xs font-semibold text-accent sm:inline">
            Customer portal
          </span>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg md:inline-flex"
            >
              View website
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
              <span className="sr-only sm:hidden">Log out</span>
            </Button>
          </div>
        </div>

        {/* Phone and tablet: scrolling tab bar */}
        <nav aria-label="Customer portal" className="border-t border-line lg:hidden">
          <div className="flex overflow-x-auto px-2">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={tabLinkClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <div className="flex flex-1">
        {/* Desktop: sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col p-4">
            <div className="mb-4 rounded-lg bg-surface-alt px-3 py-3">
              <p className="text-xs text-fg-muted">Signed in as</p>
              <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
            </div>

            <nav aria-label="Customer portal" className="flex flex-col gap-1">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={sideLinkClass}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-line pt-4">
              <Link
                to="/machines"
                className={`${buttonStyles({ variant: 'secondary', size: 'sm' })} w-full`}
              >
                Browse machines
              </Link>
            </div>
          </div>
        </aside>

        <main
          id="portal-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default CustomerLayout