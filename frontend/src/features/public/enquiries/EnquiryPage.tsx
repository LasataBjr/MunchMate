import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

import Container from '../../../components/layout/Container'
import { getMachines } from '../../../services/api/machines.api'
import { createEnquiry } from '../../../services/api/enquiries.api'

import type { Machine } from '../machine-catalog/types/machine.types'
import type {
  CreateEnquiryInput,
  EnquiryItemInput,
  SelectedEnquiryItem,
} from './types/enquiry.types'

import EnquiryForm from './components/EnquiryForm'
import EnquirySummary from './components/EnquirySummary'
import EnquirySuccess from './components/EnquirySuccess'

function EnquiryPage() {
  const [searchParams] = useSearchParams()
  const requestedMachineId = searchParams.get('machineId')

  const [machines, setMachines] = useState<Machine[]>([])
  const [items, setItems] = useState<EnquiryItemInput[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null)

  // Load active machines and preselect a machine from the URL, if provided.
  useEffect(() => {
    let cancelled = false

    async function loadMachines() {
      try {
        setLoading(true)
        setError(null)

        const response = await getMachines()
        if (cancelled) return

        setMachines(response.machines)

        if (requestedMachineId) {
          const id = Number(requestedMachineId)
          const requestedMachine = response.machines.find((machine) => machine.id === id)

          if (Number.isInteger(id) && requestedMachine) {
            setItems([{ machine_model_id: requestedMachine.id, quantity: 1, notes: null }])
          } else {
            setError(
              'The machine from your link is unavailable. You can still select another machine.'
            )
          }
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load machines. Please refresh the page and try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadMachines()
    return () => {
      cancelled = true
    }
  }, [requestedMachineId])

  const selected: SelectedEnquiryItem[] = items.flatMap((item) => {
    const machine = machines.find((m) => m.id === item.machine_model_id)
    return machine ? [{ machine, item }] : []
  })

  function handleAddMachine(id: number) {
    setItems((current) =>
      current.some((item) => item.machine_model_id === id)
        ? current
        : [...current, { machine_model_id: id, quantity: 1, notes: null }]
    )
    setError(null)
  }

  function handleQuantityChange(machineId: number, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) return

    setItems((current) =>
      current.map((item) =>
        item.machine_model_id === machineId ? { ...item, quantity } : item
      )
    )
  }

  function handleNotesChange(machineId: number, notes: string) {
    setItems((current) =>
      current.map((item) =>
        item.machine_model_id === machineId ? { ...item, notes } : item
      )
    )
  }

  function handleRemoveMachine(machineId: number) {
    setItems((current) => current.filter((item) => item.machine_model_id !== machineId))
  }

  function handleNewEnquiry() {
    setSubmittedNumber(null)
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Please select at least one machine.')
      return
    }

    if (items.length > 50) {
      setError('You can select a maximum of 50 different machines.')
      return
    }

    const input: CreateEnquiryInput = {
      message: message.trim() || null,
      items: items.map((item) => ({
        machine_model_id: item.machine_model_id,
        quantity: item.quantity,
        notes: item.notes?.trim() || null,
      })),
    }

    try {
      setSubmitting(true)

      const response = await createEnquiry(input)

      setSubmittedNumber(response.enquiry.enquiry_number)
      setItems([])
      setMessage('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status

        if (status === 401 || status === 403) {
          setError(
            'Please log in with your customer account before submitting this enquiry. Your current selections are still on this page.'
          )
        } else if (status === 400) {
          setError(
            err.response?.data?.message ||
              'One or more selected machines are unavailable. Please review your selection.'
          )
        } else {
          setError(
            err.response?.data?.message || 'Unable to submit your enquiry. Please try again.'
          )
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container className="py-16">
        <div role="status" aria-label="Loading machines" className="space-y-5">
          <div className="h-8 w-64 animate-pulse rounded bg-hover" />
          <div className="h-24 animate-pulse rounded-xl bg-hover" />
          <div className="h-48 animate-pulse rounded-xl bg-hover" />
        </div>
      </Container>
    )
  }

  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-surface-alt to-surface">
        <Container className="py-10 sm:py-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Request a <span className="text-accent">quotation</span>
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-fg-muted">
            Choose the vending machines you are interested in, set the quantities and share any
            requirements. Our team will then prepare a quotation for you.
          </p>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        {error && selected.length === 0 && !submittedNumber && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {submittedNumber ? (
          <EnquirySuccess enquiryNumber={submittedNumber} onNewEnquiry={handleNewEnquiry} />
        ) : machines.length === 0 ? (
          <div className="rounded-xl border border-line bg-card p-8 text-center">
            <h2 className="font-semibold text-fg">No machines currently available</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Please check back later or contact our team.
            </p>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EnquiryForm
                machines={machines}
                selected={selected}
                message={message}
                submitting={submitting}
                onAddMachine={handleAddMachine}
                onQuantityChange={handleQuantityChange}
                onNotesChange={handleNotesChange}
                onRemoveMachine={handleRemoveMachine}
                onMessageChange={setMessage}
                onSubmit={handleSubmit}
              />
            </div>

            <aside className="lg:sticky lg:top-24">
              <EnquirySummary
                selected={selected}
                submitting={submitting}
                error={selected.length > 0 ? error : null}
              />
            </aside>
          </div>
        )}
      </Container>
    </>
  )
}

export default EnquiryPage;