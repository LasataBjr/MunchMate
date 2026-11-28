export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'

export interface MyQuotationListItem {
  id: number
  enquiry_id: number
  quotation_number: string
  version_number: number
  status: QuotationStatus
  subtotal_paisa: number
  discount_paisa: number
  tax_amount_paisa: number
  total_amount_paisa: number
  valid_until: string | null
  terms: string | null
  created_at: string
  enquiry_number: string
}

export interface MyQuotationItem {
  id: number
  machine_model_id: number
  description: string
  quantity: number
  unit_price_paisa: number
  line_total_paisa: number
}

export interface MyQuotationDetails extends MyQuotationListItem {
  items: MyQuotationItem[]
}

export interface MyQuotationsResponse {
  success: boolean
  total: number
  quotations: MyQuotationListItem[]
}

export interface MyQuotationDetailsResponse {
  success: boolean
  quotation: MyQuotationDetails
}

export type QuotationDecision = 'accepted' | 'rejected'

export interface QuotationDecisionResponse {
  success: boolean
  message: string
  quotation: MyQuotationDetails
}