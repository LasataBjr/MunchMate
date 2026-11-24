
import type { Request, Response } from "express";
import { checkFonepayPaymentStatus, getAdminPayments, initiatePayment, initiateFonepayPayment, simulatePayment, } from "../services/payment.service.js";
import { initiatePaymentSchema, simulatePaymentSchema, }  from "../validators/payment.validator.js";

export function initiatePaymentController(req: Request, res: Response) {
  const parsed = initiatePaymentSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment details",
      errors: parsed.error.flatten(),
    });
  }

  const customerId = res.locals.authUser.customer_id;
  const orderId = Number(req.params.orderId);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const result = initiatePayment(orderId, customerId, parsed.data.payment_method);

  if (!result.success) {
    const statusCode =
      result.code === "ORDER_NOT_FOUND" ? 404 :
      result.code === "ORDER_ALREADY_PAID" ? 409 :
      result.code === "ORDER_CANCELLED" ? 409 :
      result.code === "PAYMENT_PROVIDER_CONFLICT" ? 409 :
      400;

    return res.status(statusCode).json({
      success: false,
      message: result.code,
    });
  }

  return res.status(result.reused ? 200 : 201).json({
    success: true,
    message: result.reused
      ? "Existing pending payment returned"
      : "Payment attempt created successfully",
    payment: result.payment,
  });
}

// Initiate a Fonepay payment returns the payment details and QR code if successful
export async function initiateFonepayPaymentController(req: Request, res: Response) {
  const customerId = res.locals.authUser.customer_id;
  const orderId = Number(req.params.orderId);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const result = await initiateFonepayPayment(orderId, customerId);

  if (!result.success) {
    const statusCode =
      result.code === "ORDER_NOT_FOUND" ? 404 :
      result.code === "PAYMENT_AMOUNT_INVALID" ? 400 :
      409;

    return res.status(statusCode).json({
      success: false,
      message: result.code,
    });
  }

  if (!result.qrMessage) {
    return res.status(409).json({
      success: false,
      message: "Payment is being processed. Please check its status before retrying.",
      payment_id: result.payment.id,
      provider_reference: result.payment.provider_reference,
    });
  }

  return res.status(result.reused ? 200 : 201).json({
    success: true,
    message: result.reused
      ? "Existing Fonepay QR returned"
      : "Fonepay QR generated successfully",
    payment: {
      id: result.payment.id,
      order_id: result.payment.order_id,
      amount_paisa: result.payment.amount_paisa,
      currency: result.payment.currency,
      status: result.payment.status,
      provider_reference: result.payment.provider_reference,
      qr_message: result.qrMessage,
    },
  });
}

// Check the status of a Fonepay payment
export async function checkFonepayPaymentStatusController(req: Request, res: Response) {
  const customerId = res.locals.authUser.customer_id;
  const paymentId = Number(req.params.paymentId);

  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment ID",
    });
  }

  try {
    const result = await checkFonepayPaymentStatus(paymentId, customerId);

    if (!result.success) {
      const statusCode =
        result.code === "PAYMENT_NOT_FOUND" ? 404 :
        result.code === "PAYMENT_AMOUNT_INVALID" ? 400 :
        409;

      return res.status(statusCode).json({
        success: false,
        message: result.code,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Payment status: ${result.paymentStatus}`,
      payment_id: result.paymentId,
      order_id: result.orderId,
      payment_status: result.paymentStatus,
      transaction_id: result.transactionId,
      already_processed: result.alreadyProcessed ?? false,
      verification_required: result.verificationRequired ?? false,
    });
  } catch {
    // Do not expose provider errors or credentials to customers.
    return res.status(502).json({
      success: false,
      message: "Unable to verify payment with Fonepay. Please try again later.",
    });
  }
}

// Development-only simulator for testing payment outcomes
export function simulatePaymentController(req: Request, res: Response) {
  // Defense in depth: simulator must never operate outside development.
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({
      success: false,
      message: "Not found",
    });
  }

  const parsed = simulatePaymentSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid simulator outcome",
      errors: parsed.error.flatten(),
    });
  }

  const customerId = res.locals.authUser.customer_id;
  const paymentId = Number(req.params.paymentId);

  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment ID",
    });
  }

  const result = simulatePayment(paymentId, customerId, parsed.data.outcome);

  if (!result.success) {
    const statusCode =
      result.code === "PAYMENT_NOT_FOUND" ? 404 : 409;

    return res.status(statusCode).json({
      success: false,
      message: result.code,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Development payment simulation completed",
    payment: result.payment,
    order_payment_status: result.order_payment_status,
  });
}

// Admin-only endpoint to retrieve the most recent 100 payments
export function getAdminPaymentsController(_req: Request, res: Response) {
  const payments = getAdminPayments();

  return res.status(200).json({
    success: true,
    count: payments.length,
    payments,
  });
}
