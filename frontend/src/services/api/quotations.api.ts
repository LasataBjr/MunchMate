import { api } from '../../lib/api'

import type {
  MyQuotationsResponse,
  MyQuotationDetailsResponse,
  QuotationDecision,
  QuotationDecisionResponse,
} from '../../features/customer/quotations/types/quotation.types'

export async function getMyQuotations() {
  const response = await api.get<MyQuotationsResponse>(
    '/quotations/my'
  )

  return response.data
}

export async function getMyQuotationById(id: number) {
  const response = await api.get<MyQuotationDetailsResponse>(
    `/quotations/my/${id}`
  )

  return response.data
}

export async function decideMyQuotation(
  id: number,
  status: QuotationDecision
) {
  const response = await api.patch<QuotationDecisionResponse>(
    `/quotations/${id}/decision`,
    { status }
  )

  return response.data
}