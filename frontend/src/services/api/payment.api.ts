
import { api } from "../../lib/api";

// Payment statuses stored in our database
export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "expired";

export type Payment = {
  id: number;
  order_id: number;
  order_number: string;
  provider: string;
  payment_method: string | null;
  amount_paisa: number;
  currency: string;
  status: PaymentStatus;
  provider_reference: string;
  provider_transaction_id: string | null;
  initiated_at: string;
  confirmed_at: string | null;
};

export type CustomerPaymentsResponse = {
  success: boolean;
  count: number;
  payments: Payment[];
};

// Response from checking Fonepay payment status
export type CheckPaymentStatusResponse = {
  success: boolean;
  message: string;
  payment_id: number;
  order_id: number;
  payment_status: "pending" | "successful" | "failed";
  transaction_id: string | null;
  already_processed?: boolean;
  verification_required?: boolean;
};

// Get payment history for the logged-in customer
export async function getMyPayments() {
  const response = await api.get<CustomerPaymentsResponse>(
    "/payments/my"
  );

  return response.data;
}

// Check the status of an existing Fonepay payment
export async function checkPaymentStatus(paymentId: number) {
  const response = await api.post<CheckPaymentStatusResponse>(
    `/payments/${paymentId}/check-status`
  );

  return response.data;
}
