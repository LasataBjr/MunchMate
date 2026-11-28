import { useEffect, useMemo, useState } from 'react'

import Container from '../../../components/layout/Container'
import Button from '../../../components/ui/Button'
import { getMachineCategories, getMachines } from '../../../services/api/machines.api'

import type { Machine, MachineCategory } from './types/machine.types'

import MachineSearch from './components/MachineSearch'
import MachineFilters from './components/MachineFilters'
import MachineGrid from './components/MachineGrid'

function MachineCatalogPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [categories, setCategories] = useState<MachineCategory[]>([])

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadCatalogue() {
      try {
        setLoading(true)
        setError(null)

        const [machineData, categoryData] = await Promise.all([
          getMachines(),
          getMachineCategories(),
        ])

        if (cancelled) return

        setMachines(machineData.machines)
        setCategories(categoryData.categories)
      } catch {
        if (!cancelled) setError('Unable to load machines. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCatalogue()

    return () => {
      cancelled = true
    }
  }, [retryCount])

  const filteredMachines = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return machines.filter((machine) => {
      const matchesSearch =
        machine.name.toLowerCase().includes(searchTerm) ||
        machine.model_number.toLowerCase().includes(searchTerm) ||
        machine.category_name.toLowerCase().includes(searchTerm)

      const matchesCategory =
        selectedCategory === 'all' || machine.category_id.toString() === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [machines, search, selectedCategory])

  const resetFilters = () => {
    setSearch('')
    setSelectedCategory('all')
  }

  return (
    <>
      {/* Header band, same style as the Contact page */}
      <div className="border-b border-line bg-gradient-to-b from-surface-alt to-surface">
        <Container className="py-10 sm:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Vending machine <span className="text-accent">catalogue</span>
          </h1>
          <p className="mt-3 max-w-2xl text-fg-muted">
            Explore our vending machines and find the right model for your business.
          </p>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        {/* Compact toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <MachineSearch value={search} onChange={setSearch} />
          <MachineFilters
            categories={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />

          {!loading && !error && (
            <p className="text-sm text-fg-muted sm:ml-auto" aria-live="polite">
              Showing {filteredMachines.length} of {machines.length}
            </p>
          )}
        </div>

        {loading ? (
          <div
            role="status"
            aria-label="Loading machines"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-96 animate-pulse rounded-xl bg-hover" />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-500/30 dark:bg-red-500/10"
          >
            <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
            <Button className="mt-4" onClick={() => setRetryCount((count) => count + 1)}>
              Try again
            </Button>
          </div>
        ) : (
          <MachineGrid machines={filteredMachines} onReset={resetFilters} />
        )}
      </Container>
    </>
  )
}

export default MachineCatalogPage;