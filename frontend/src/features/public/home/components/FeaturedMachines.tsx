import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Boxes } from 'lucide-react'

import Container from '../../../../components/layout/Container'
import { buttonStyles } from '../../../../components/ui/Button'
import { getMachines } from '../../../../services/api/machines.api'

import type { Machine } from '../../machine-catalog/types/machine.types'
import MachineCard from '../../machine-catalog/components/MachineCard'

function FeaturedMachines() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchMachines() {
      try {
        setLoading(true)
        setError(false)
        const response = await getMachines()
        if (!cancelled) setMachines(response.machines.slice(0, 4))
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMachines()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="bg-surface py-16">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl text-accent font-bold tracking-tight">Featured machines</h2>
            <p className="mt-2 text-fg-muted">
              Explore some of our available vending machines
            </p>
          </div>

          {/* Desktop only: on phones the button below the cards is used instead */}
          <Link
            to="/machines"
            className="hidden items-center gap-2 text-sm font-semibold text-accent hover:underline sm:inline-flex"
          >
            See all machines
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8">
          {loading && (
            <div
              role="status"
              aria-label="Loading featured machines"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="h-72 animate-pulse rounded-xl bg-hover" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
              <p className="font-medium text-red-700 dark:text-red-400">
                Unable to load featured machines.
              </p>
              <p className="mt-2 text-sm text-fg-muted">
                Please visit our catalogue to explore available machines.
              </p>
              <Link
                to="/machines"
                className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
              >
                Browse catalogue
              </Link>
            </div>
          )}

          {!loading && !error && machines.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {machines.map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
          )}

          {!loading && !error && machines.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-surface-alt px-6 py-14 text-center">
              <Boxes className="mx-auto h-10 w-10 text-fg-muted" aria-hidden="true" />
              <p className="mt-4 font-medium text-fg">No machines available yet</p>
              <p className="mt-1 text-sm text-fg-muted">Please check back soon.</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/machines" className={buttonStyles({ variant: 'secondary' })}>
            Browse all machines
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  )
}

export default FeaturedMachines