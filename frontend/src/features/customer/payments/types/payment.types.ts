
export type PaymentStatus =
  | 'pending'
  | 'successful'
  | 'failed'
  | 'expired'

export type PaymentFilter = 'all' | PaymentStatus

export type CustomerPayment = {
  id: number
  order_id: number
  order_number: string
  provider: string
  payment_method: string | null
  amount_paisa: number
  currency: string
  status: PaymentStatus
  provider_reference: string
  provider_transaction_id: string | null
  initiated_at: string
  confirmed_at: string | null
}
