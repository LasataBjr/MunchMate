import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { buttonStyles } from '../ui/Button'
import ThemeToggle from '../ui/ThemeToggle'
import Container from './Container'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/machines', label: 'Vending Machines' },
  { to: '/contact', label: 'Contact' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-accent' : 'text-fg-muted hover:bg-hover hover:text-fg'
  }`
}

function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const closeMenu = () => setMenuOpen(false)

  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  // Transparent only on Home, at the very top, with the mobile menu closed
  const transparent = isHome && !scrolled && !menuOpen

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-fg focus:shadow"
      >
        Skip to content
      </a>

      <header
        className={`${isHome ? 'fixed inset-x-0' : 'sticky'} top-0 z-40 border-b transition-colors duration-200 ${
          transparent
            ? 'border-transparent bg-transparent'
            : 'border-line bg-surface/95 shadow-sm backdrop-blur'
        }`}
      >
        <nav aria-label="Main">
          <Container className="flex items-center justify-between py-3">
            <Link to="/" onClick={closeMenu} className="text-xl font-extrabold tracking-tight">
              Grab<span className="text-accent">24</span>
            </Link>

            {/* Desktop menu */}
            <div className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                  {l.label}
                </NavLink>
              ))}
              <ThemeToggle />
              <Link to="/login" className={`${buttonStyles({ size: 'sm' })} ml-2`}>
                Login
              </Link>
            </div>

            {/* Mobile: theme toggle + menu button */}
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="rounded-md p-2 text-fg-muted hover:bg-hover hover:text-fg"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </Container>
        </nav>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div id="mobile-menu" className="border-t border-line md:hidden">
            <Container className="flex flex-col gap-1 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={closeMenu}
                  className={(state) => `block ${navClass(state)}`}
                >
                  {l.label}
                </NavLink>
              ))}
              <Link to="/login" onClick={closeMenu} className={`${buttonStyles()} mt-2`}>
                Login
              </Link>
            </Container>
          </div>
        )}
      </header>

     <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
      <div key={pathname} className="page-enter">
        <Outlet />
      </div>
    </main>

      <footer className="border-t border-line bg-surface-alt">
        <Container className="py-4 text-center text-sm text-fg-muted">
          © {new Date().getFullYear()} Grab24. All rights reserved.
        </Container>
      </footer>
    </div>
  )
}

export default PublicLayout