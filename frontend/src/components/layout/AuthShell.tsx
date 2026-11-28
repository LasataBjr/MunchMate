import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../common/Logo'

type AuthShellProps = {
  panel: ReactNode
  children: ReactNode
  contentWidth?: string
}

function AuthShell({ panel, children, contentWidth = 'max-w-md' }: AuthShellProps) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand panel: desktop only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-red to-brand-dark text-white lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10" />

        <div className="relative max-w-md">
          <Link
            to="/"
            className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Logo className="h-10" tone="light" textClassName="text-2xl" />
          </Link>
          <div className="mt-10">{panel}</div>
        </div>
      </aside>

      <section className="flex items-center justify-center bg-surface px-4 py-12 sm:px-8">
        <div className={`w-full ${contentWidth}`}>{children}</div>
      </section>
    </div>
  )
}

export default AuthShell;