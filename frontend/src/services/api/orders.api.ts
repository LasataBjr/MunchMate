import { api } from '../../lib/api'

import type {
  MyOrdersResponse,
  MyOrderDetailsResponse,
} from '../../features/customer/orders/types/order.types'

export async function getMyOrders() {
  const response = await api.get<MyOrdersResponse>('/orders/my')
  return response.data
}

export async function getMyOrderById(id: number) {
  const response = await api.get<MyOrderDetailsResponse>(`/orders/my/${id}`)
  return response.data
}