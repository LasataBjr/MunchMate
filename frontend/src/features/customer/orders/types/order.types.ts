export type OrderStatus =
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'cancelled'

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'

export type FulfillmentStatus =
  | 'awaiting_stock'
  | 'stock_reserved'
  | 'partially_dispatched'
  | 'partially_delivered'
  | 'delivered'

export interface MyOrderListItem {
  id: number
  customer_id: number
  quotation_id: number
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  subtotal_paisa: number
  discount_paisa: number
  tax_amount_paisa: number
  total_amount_paisa: number
  created_at: string
  updated_at: string
}

export interface MyOrderItem {
  id: number
  order_id: number
  quotation_item_id: number
  machine_model_id: number
  description: string
  quantity: number
  unit_price_paisa: number
  line_total_paisa: number
}

export interface MyOrderDetails extends MyOrderListItem {
  items: MyOrderItem[]
}

export interface MyOrdersResponse {
  success: boolean
  orders: MyOrderListItem[]
}

export interface MyOrderDetailsResponse {
  success: boolean
  order: MyOrderDetails
}