
import { randomBytes } from "node:crypto";
import { db } from "../database/connection.js";
import { checkFonepayStatus, createFonepayPrn, generateFonepayQr, } from "./providers/fonepay.provider.js";

type PaymentMethod = "qr" | "mobile_banking";
type FonepayInitiationResult =
  | {
      success: true;
      payment: Payment;
      qrMessage: string | null;
      reused: boolean;
    }
  | {
      success: false;
      code:
        | "ORDER_NOT_FOUND"
        | "ORDER_ALREADY_PAID"
        | "ORDER_CANCELLED"
        | "PAYMENT_AMOUNT_INVALID"
        | "PAYMENT_PROVIDER_CONFLICT"
        | "PAYMENT_ALREADY_PROCESSING";
    };

type SimulationOutcome = "successful" | "failed" | "expired";

type Payment = {
  id: number;
  order_id: number;
  provider: string;
  payment_method: string | null;
  amount_paisa: number;
  currency: string;
  status: string;
  provider_reference: string;
  initiated_at: string;
};

type PaymentInitiationResult =
  | { success: true; payment: Payment; reused: boolean }
  | {
      success: false;
      code:
        | "ORDER_NOT_FOUND"
        | "ORDER_ALREADY_PAID"
        | "ORDER_CANCELLED"
        | "PAYMENT_AMOUNT_INVALID"
        | "PAYMENT_PROVIDER_CONFLICT";
    };

export function initiatePayment(orderId: number, customerId: number, paymentMethod?: PaymentMethod): PaymentInitiationResult {
  const transaction = db.transaction(() => {
    const order = db.prepare(`SELECT id, customer_id, total_amount_paisa, payment_status, status
      FROM orders WHERE id = ? AND customer_id = ?`).get(orderId, customerId) as
      | {
          id: number;
          customer_id: number;
          total_amount_paisa: number;
          payment_status: string;
          status: string;
        }
      | undefined;

    if (!order) return { success: false, code: "ORDER_NOT_FOUND" } as const;
    if (order.payment_status === "paid") {
      return { success: false, code: "ORDER_ALREADY_PAID" } as const;
    }
    if (order.status === "cancelled") {
      return { success: false, code: "ORDER_CANCELLED" } as const;
    }
    if (
      !Number.isSafeInteger(order.total_amount_paisa) ||
      order.total_amount_paisa <= 0
    ) {
      return { success: false, code: "PAYMENT_AMOUNT_INVALID" } as const;
    }

    const existingPayment = db.prepare(`
      SELECT id, order_id, provider, payment_method, amount_paisa,
             currency, status, provider_reference, initiated_at
      FROM payments
      WHERE order_id = ? AND status = 'pending'
    `).get(order.id) as Payment | undefined;

    if (existingPayment) {
        if (existingPayment.provider !== "development_simulator") {
            return {
            success: false,
            code: "PAYMENT_PROVIDER_CONFLICT",
            } as const;
        }

        return {
            success: true,
            payment: existingPayment,
            reused: true,
        } as const;
    }

    const providerReference =
      `DEV-${Date.now()}-${randomBytes(8).toString("hex").toUpperCase()}`;

    const result = db.prepare(`
      INSERT INTO payments (
        order_id, provider, payment_method, amount_paisa,
        currency, status, provider_reference
      )
      VALUES (?, 'development_simulator', ?, ?, 'NPR', 'pending', ?)
    `).run(
      order.id,
      paymentMethod ?? null,
      order.total_amount_paisa,
      providerReference
    );

    db.prepare(`UPDATE orders SET payment_status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order.id);

    const payment = db.prepare(`
      SELECT id, order_id, provider, payment_method, amount_paisa,
             currency, status, provider_reference, initiated_at
      FROM payments WHERE id = ?
    `).get(result.lastInsertRowid) as Payment;

    return { success: true, payment, reused: false } as const;
  });

  return transaction();
}

// Initiate a Fonepay payment returns the payment details and QR code if successful
export async function initiateFonepayPayment(
  orderId: number,
  customerId: number
): Promise<FonepayInitiationResult> {
  const transaction = db.transaction(() => {
    const order = db.prepare(`
      SELECT id, total_amount_paisa, payment_status, status, order_number
      FROM orders
      WHERE id = ? AND customer_id = ?
    `).get(orderId, customerId) as
      | {
          id: number;
          total_amount_paisa: number;
          payment_status: string;
          status: string;
          order_number: string;
        }
      | undefined;

    if (!order) return { success: false, code: "ORDER_NOT_FOUND" } as const;

    if (order.payment_status === "paid") {
      return { success: false, code: "ORDER_ALREADY_PAID" } as const;
    }

    if (order.status === "cancelled") {
      return { success: false, code: "ORDER_CANCELLED" } as const;
    }

    if (
      !Number.isSafeInteger(order.total_amount_paisa) ||
      order.total_amount_paisa <= 0
    ) {
      return { success: false, code: "PAYMENT_AMOUNT_INVALID" } as const;
    }

    const existing = db.prepare(`
      SELECT id, order_id, provider, payment_method, amount_paisa,
             currency, status, provider_reference, initiated_at, qr_message
      FROM payments
      WHERE order_id = ? AND status = 'pending'
    `).get(order.id) as (Payment & { qr_message: string | null }) | undefined;

    if (existing) {
      if (existing.provider !== "fonepay") {
        return {
          success: false,
          code: "PAYMENT_PROVIDER_CONFLICT",
        } as const;
      }

      if (existing.amount_paisa !== order.total_amount_paisa ||
          existing.currency !== "NPR") {
        return {
          success: false,
          code: "PAYMENT_AMOUNT_INVALID",
        } as const;
      }

      return {
        success: true,
        payment: existing,
        qrMessage: existing.qr_message,
        reused: true,
      } as const;
    }

    const prn = createFonepayPrn();

    const result = db.prepare(`
      INSERT INTO payments (
        order_id, provider, payment_method, amount_paisa,
        currency, status, provider_reference
      )
      VALUES (?, 'fonepay', 'qr', ?, 'NPR', 'pending', ?)
    `).run(order.id, order.total_amount_paisa, prn);

    db.prepare(`
      UPDATE orders
      SET payment_status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order.id);

    const payment = db.prepare(`
      SELECT id, order_id, provider, payment_method, amount_paisa,
             currency, status, provider_reference, initiated_at, qr_message
      FROM payments
      WHERE id = ?
    `).get(result.lastInsertRowid) as Payment & {
      qr_message: string | null;
    };

    return {
      success: true,
      payment,
      qrMessage: null,
      reused: false,
    } as const;
  });

  const created = transaction();

  if (!created.success) return created;

  if (created.qrMessage) return created;

  // Only generate the QR for a newly created payment.
  if (created.reused) {
    return {
      success: false,
      code: "PAYMENT_ALREADY_PROCESSING",
    };
  }

  try {
    const qr = await generateFonepayQr(
      created.payment.provider_reference,
      created.payment.amount_paisa,
      `Order ${created.payment.order_id}`
    );

   const qrUpdate = db.prepare(`
    UPDATE payments
    SET qr_message = ?
    WHERE id = ? AND status = 'pending' AND provider = 'fonepay'
    `).run(qr.qrMessage, created.payment.id);

    if (qrUpdate.changes !== 1) {
    throw new Error("Could not save Fonepay QR code");
    }

    const updatedPayment = db.prepare(`
      SELECT id, order_id, provider, payment_method, amount_paisa,
             currency, status, provider_reference, initiated_at, qr_message
      FROM payments
      WHERE id = ?
    `).get(created.payment.id) as Payment & {
      qr_message: string | null;
    };
    if (!updatedPayment || !updatedPayment.qr_message) {
      throw new Error("Fonepay QR code was not saved");
    }

    return {
      success: true,
      payment: updatedPayment,
      qrMessage: qr.qrMessage,
      reused: false,
    };
  } catch {
    // Keep the payment pending. Fonepay may have received the request
    // even if our server did not receive its response.
    return {
      success: false,
      code: "PAYMENT_ALREADY_PROCESSING",
    };
  }
}

// Check the status of a Fonepay payment by its PRN
type FonepayStatusCheckResult =
  | {
      success: true;
      paymentStatus: "pending" | "successful" | "failed";
      paymentId: number;
      orderId: number;
      transactionId: string | null;
      alreadyProcessed?: boolean;
      verificationRequired?: boolean;
    }
  | {
      success: false;
      code:
        | "PAYMENT_NOT_FOUND"
        | "PAYMENT_PROVIDER_INVALID"
        | "PAYMENT_AMOUNT_INVALID"
        | "ORDER_ALREADY_PAID"
        | "ORDER_CANCELLED"
        | "PAYMENT_STATE_CONFLICT";
    };

export async function checkFonepayPaymentStatus(paymentId: number, customerId: number): Promise<FonepayStatusCheckResult> {
  const payment = db.prepare(`
    SELECT
      p.id,
      p.order_id,
      p.provider,
      p.amount_paisa,
      p.currency,
      p.status,
      p.provider_reference,
      p.provider_transaction_id,
      o.total_amount_paisa,
      o.payment_status AS order_payment_status,
      o.status AS order_status
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE p.id = ? AND o.customer_id = ?
  `).get(paymentId, customerId) as
    | {
        id: number;
        order_id: number;
        provider: string;
        amount_paisa: number;
        currency: string;
        status: string;
        provider_reference: string;
        provider_transaction_id: string | null;
        total_amount_paisa: number;
        order_payment_status: string;
        order_status: string;
      }
    | undefined;

  if (!payment) {
    return { success: false, code: "PAYMENT_NOT_FOUND" };
  }

  if (payment.provider !== "fonepay") {
    return { success: false, code: "PAYMENT_PROVIDER_INVALID" };
  }

  if (payment.status === "successful") {
    return {
      success: true,
      paymentStatus: "successful",
      paymentId: payment.id,
      orderId: payment.order_id,
      transactionId: payment.provider_transaction_id,
      alreadyProcessed: true,
    };
  }

  if (payment.status === "failed" || payment.status === "expired") {
    return {
      success: true,
      paymentStatus: "failed",
      paymentId: payment.id,
      orderId: payment.order_id,
      transactionId: payment.provider_transaction_id,
      alreadyProcessed: true,
    };
  }

  if (payment.status !== "pending") {
    return { success: false, code: "PAYMENT_STATE_CONFLICT" };
  }

  if (
    !Number.isSafeInteger(payment.amount_paisa) ||
    payment.amount_paisa <= 0 ||
    payment.amount_paisa !== payment.total_amount_paisa ||
    payment.currency !== "NPR"
  ) {
    return { success: false, code: "PAYMENT_AMOUNT_INVALID" };
  }

  if (payment.order_status === "cancelled") {
    return { success: false, code: "ORDER_CANCELLED" };
  }

  if (payment.order_payment_status === "paid") {
    return { success: false, code: "ORDER_ALREADY_PAID" };
  }

  // Contact Fonepay outside the database transaction.
  // A provider/network error leaves our payment pending.
  const providerResult = await checkFonepayStatus(
    payment.provider_reference
  );

  // Fonepay says the payment is still pending.
  if (providerResult.paymentStatus === "pending") {
    return {
      success: true,
      paymentStatus: "pending",
      paymentId: payment.id,
      orderId: payment.order_id,
      transactionId: null,
    };
  }

  // Fonepay says failed, but terminality is not confirmed.
  // Keep our database payment pending and verify again later.
  if (providerResult.paymentStatus === "failed") {
    return {
      success: true,
      paymentStatus: "pending",
      paymentId: payment.id,
      orderId: payment.order_id,
      transactionId: null,
      verificationRequired: true,
    };
  }

  const transaction = db.transaction(() => {
    const current = db.prepare(`
      SELECT
        p.status,
        p.amount_paisa,
        p.currency,
        o.total_amount_paisa,
        o.payment_status AS order_payment_status,
        o.status AS order_status
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.id = ? AND o.customer_id = ?
    `).get(payment.id, customerId) as
      | {
          status: string;
          amount_paisa: number;
          currency: string;
          total_amount_paisa: number;
          order_payment_status: string;
          order_status: string;
        }
      | undefined;

    if (!current) {
      return { success: false, code: "PAYMENT_NOT_FOUND" } as const;
    }

    if (current.status !== "pending") {
      return { success: false, code: "PAYMENT_STATE_CONFLICT" } as const;
    }

    if (
      current.amount_paisa !== current.total_amount_paisa ||
      current.currency !== "NPR"
    ) {
      return { success: false, code: "PAYMENT_AMOUNT_INVALID" } as const;
    }

    if (current.order_status === "cancelled") {
      return { success: false, code: "ORDER_CANCELLED" } as const;
    }

    if (current.order_payment_status === "paid") {
      return { success: false, code: "ORDER_ALREADY_PAID" } as const;
    }

    if (!providerResult.transactionId) {
      return { success: false, code: "PAYMENT_STATE_CONFLICT" } as const;
    }

    const paymentUpdate = db.prepare(`
      UPDATE payments
      SET
        status = 'successful',
        provider_transaction_id = ?,
        confirmed_at = CURRENT_TIMESTAMP,
        failure_reason = NULL
      WHERE id = ? AND status = 'pending'
    `).run(providerResult.transactionId, payment.id);

    if (paymentUpdate.changes !== 1) {
      throw new Error("PAYMENT_STATE_CONFLICT");
    }

    const orderUpdate = db.prepare(`
      UPDATE orders
      SET payment_status = 'paid',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payment.order_id);

    if (orderUpdate.changes !== 1) {
      throw new Error("PAYMENT_STATE_CONFLICT");
    }

    return {
      success: true,
      paymentStatus: "successful",
      paymentId: payment.id,
      orderId: payment.order_id,
      transactionId: providerResult.transactionId,
    } as const;
  });

  try {
    return transaction();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PAYMENT_STATE_CONFLICT"
    ) {
      return {
        success: false,
        code: "PAYMENT_STATE_CONFLICT",
      };
    }

    throw error;
  }
}

// Simulate a payment for development purposes only
type SimulationResult =
  | { success: true; payment: object; order_payment_status: string }
  | {
      success: false;
      code:
        | "PAYMENT_NOT_FOUND"
        | "PAYMENT_NOT_PENDING"
        | "NOT_SIMULATOR_PAYMENT"
        | "ORDER_ALREADY_PAID"
        | "ORDER_CANCELLED"
        | "PAYMENT_AMOUNT_MISMATCH";
    };

export function simulatePayment(paymentId: number, customerId: number, outcome: SimulationOutcome): SimulationResult {
  const transaction = db.transaction(() => {
    const payment = db.prepare(`
      SELECT
        p.id,
        p.order_id,
        p.provider,
        p.amount_paisa,
        p.currency,
        p.status,
        o.customer_id,
        o.total_amount_paisa,
        o.payment_status,
        o.status AS order_status
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.id = ? AND o.customer_id = ?
    `).get(paymentId, customerId) as
      | {
          id: number;
          order_id: number;
          provider: string;
          amount_paisa: number;
          currency: string;
          status: string;
          customer_id: number;
          total_amount_paisa: number;
          payment_status: string;
          order_status: string;
        }
      | undefined;

    if (!payment) {
      return { success: false, code: "PAYMENT_NOT_FOUND" } as const;
    }
    if (payment.provider !== "development_simulator") {
      return { success: false, code: "NOT_SIMULATOR_PAYMENT" } as const;
    }
    if (payment.status !== "pending") {
      return { success: false, code: "PAYMENT_NOT_PENDING" } as const;
    }
    if (payment.payment_status === "paid") {
      return { success: false, code: "ORDER_ALREADY_PAID" } as const;
    }
    if (payment.order_status === "cancelled") {
      return { success: false, code: "ORDER_CANCELLED" } as const;
    }
    if (
      payment.currency !== "NPR" ||
      payment.amount_paisa !== payment.total_amount_paisa
    ) {
      return { success: false, code: "PAYMENT_AMOUNT_MISMATCH" } as const;
    }

    const providerTransactionId =
      outcome === "successful"
        ? `SIM-${randomBytes(12).toString("hex").toUpperCase()}`
        : null;

    const failureReason =
      outcome === "failed" ? "Development simulator: test failure" :
      outcome === "expired" ? "Development simulator: test expiry" :
      null;

    const updatePayment = db.prepare(`UPDATE payments SET status = ?, provider_transaction_id = ?,
          confirmed_at = CASE WHEN ? = 'successful'
                              THEN CURRENT_TIMESTAMP ELSE NULL END,
          failure_reason = ?
      WHERE id = ? AND status = 'pending'
    `).run(outcome, providerTransactionId, outcome, failureReason, payment.id);

    if (updatePayment.changes !== 1) {
      return { success: false, code: "PAYMENT_NOT_PENDING" } as const;
    }

    const orderPaymentStatus =
      outcome === "successful" ? "paid" : "unpaid";

    const orderUpdate = db.prepare(`UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(orderPaymentStatus, payment.order_id);

    if (orderUpdate.changes !== 1) {
      throw new Error("PAYMENT_STATE_CONFLICT");
    }

    const updatedPayment = db.prepare(`
      SELECT id, order_id, provider, payment_method, amount_paisa,
             currency, status, provider_reference,
             provider_transaction_id, initiated_at, confirmed_at,
             failure_reason
      FROM payments
      WHERE id = ?
    `).get(payment.id);

    return {
      success: true,
      payment: updatedPayment as object,
      order_payment_status: orderPaymentStatus,
    } as const;
  });

  return transaction();
}

// Get the most recent 100 payments for admin view
export function getAdminPayments() {
  return db.prepare(`
    SELECT
      p.id,
      p.order_id,
      o.order_number,
      c.name AS customer_name,
      p.provider,
      p.payment_method,
      p.amount_paisa,
      p.currency,
      p.status,
      p.provider_reference,
      p.provider_transaction_id,
      p.initiated_at,
      p.confirmed_at,
      p.failure_reason
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN customers c ON c.id = o.customer_id
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT 100
  `).all();
}
