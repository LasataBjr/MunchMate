import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { ChevronRight, FileText, QrCode, SearchX, Truck } from 'lucide-react'

import Container from '../../../components/layout/Container'
import { buttonStyles } from '../../../components/ui/Button'
import { getMachineById } from '../../../services/api/machines.api'
import { getImageUrl } from '../../../utils/imageUrl'
import { formatNpr } from '../../../utils/formatPrice'

import type { Machine, MachineImage  } from '../machine-catalog/types/machine.types'

import MachineGallery, { type GalleryImage } from './components/MachineGallery'
import MachineSpecifications from './components/MachineSpecifications'
import MachineEnquiryButton from './components/MachineEnquiryButton'

const highlights = [
  { icon: FileText, text: 'Request a quotation online' },
  { icon: QrCode, text: 'Pay with Fonepay QR' },
  { icon: Truck, text: 'Delivery and installation arranged' },
]

// Uses the images list when the API sends it, otherwise falls back to primary_image
function buildGalleryImages(machine: Machine): GalleryImage[] {
  const list: MachineImage[] = machine.images?.length
    ? [...machine.images].sort((a, b) => {
      const primary = Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary))
      return primary || (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
    : machine.primary_image
      ? [{ id: 0, image_path: machine.primary_image }]
      : [];

  return list.flatMap((image, i) => {
    const url = getImageUrl(image.image_path)
    if (!url) return []
    return [{ id: image.id, url, alt: image.alt_text || `${machine.name}, image ${i + 1}` }]
  })
}

function MachineDetailsPage() {
  const { machineId } = useParams()

  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchMachineDetails() {
      const id = Number(machineId)

      if (!Number.isInteger(id) || id <= 0) {
        setError('Invalid machine ID.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        setMachine(null)

        const response = await getMachineById(id)
        if (!cancelled) setMachine(response.machine)
      } catch (err) {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Machine not found.')
        } else {
          setError('Unable to load machine details. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchMachineDetails()
    return () => {
      cancelled = true
    }
  }, [machineId])

  if (loading) {
    return (
      <Container className="py-10">
        <div role="status" aria-label="Loading machine details" className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-hover" />
          <div className="space-y-4">
            <div className="h-5 w-24 animate-pulse rounded bg-hover" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-hover" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-hover" />
            <div className="h-40 animate-pulse rounded-xl bg-hover" />
          </div>
        </div>
      </Container>
    )
  }

  if (error || !machine) {
    return (
      <Container className="py-20 text-center">
        <SearchX className="mx-auto h-12 w-12 text-fg-muted" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">{error || 'Machine not found.'}</h1>
        <Link
          to="/machines"
          className={`${buttonStyles({ variant: 'secondary' })} mt-6`}
        >
          Back to machines
        </Link>
      </Container>
    )
  }

  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:text-accent">Home</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li><Link to="/machines" className="hover:text-accent">Machines</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li aria-current="page" className="font-medium text-fg">{machine.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* key resets the gallery when you open another machine */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MachineGallery key={machine.id} images={buildGalleryImages(machine)} />
        </div>

        <div>
          <p className="inline-block rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-accent">
            {machine.category_name}
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {machine.name}
          </h1>
          <p className="mt-2 text-fg-muted">Model: {machine.model_number}</p>

          <div className="mt-6 rounded-xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm text-fg-muted">Price</p>
            <p className="mt-1 text-3xl font-bold text-accent">{formatNpr(machine.price_npr)}</p>
            <p className="mt-1 text-xs text-fg-muted">
              The final amount is confirmed in your quotation.
            </p>

            <div className="mt-5">
              <MachineEnquiryButton  machineId={machine.id} />
            </div>

            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-fg-muted">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-fg-muted">
              {machine.description || 'No description available.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-14 border-t border-line pt-10">
        <MachineSpecifications specifications={machine.specifications} />
      </div>
    </Container>
  )
}

export default MachineDetailsPage;