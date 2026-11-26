import { db } from "../database/connection.js";

// Get all orders for Admin.
export function getOrders() {
  return db.prepare(`
    SELECT
      o.*,
      c.name AS customer_name,
      c.company_name,
      c.email AS customer_email,
      c.phone AS customer_phone
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC, o.id DESC
  `).all();
}

// Get one order for Admin.
export function getOrderById(id: number) {
  const order = db.prepare(`
    SELECT
      o.*,
      c.name AS customer_name,
      c.company_name,
      c.email AS customer_email,
      c.phone AS customer_phone
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(id);

  if (!order) {
    return null;
  }

  const items = db.prepare(`
    SELECT *
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `).all(id);

  return { ...order as object, items };
}

// Get orders belonging only to the logged-in customer.
export function getMyOrders(customerId: number) {
  return db.prepare(`
    SELECT *
    FROM orders
    WHERE customer_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(customerId);
}

// Get one order belonging only to the logged-in customer.
export function getMyOrderById(id: number, customerId: number) {
  const order = db.prepare(`
    SELECT *
    FROM orders
    WHERE id = ? AND customer_id = ?
  `).get(id, customerId);

  if (!order) {
    return null;
  }

  const items = db.prepare(`
    SELECT *
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `).all(id);

  return { ...order as object, items };
}

export function updateOrderStatus(
  id: number,
  status: "confirmed" | "processing" | "completed" | "cancelled"
) {
  const transaction = db.transaction(() => {
    const order = db.prepare(`SELECT id, status, payment_status, fulfillment_status FROM orders
      WHERE id = ?
    `).get(id) as {
      id: number;
      status: string;
      payment_status: string;
      fulfillment_status: string;
    } | undefined;

    if (!order) {
      return "NOT_FOUND" as const;
    }

    const allowedTransitions: Record<string, string[]> = {
      confirmed: ["processing", "cancelled"],
      processing: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      return "INVALID_TRANSITION" as const;
    }

    // Do not cancel orders with pending or completed payment activity
    // A separate cancellation/refund workflow is needed for those orders
    if (status === "cancelled" && order.payment_status !== "unpaid") {
      return "INVALID_TRANSITION" as const;
    }

    // An order cannot be completed until all ordered machines are delivered
    if (
      status === "completed" &&
      order.fulfillment_status !== "delivered"
    ) {
      return "INVALID_TRANSITION" as const;
    }

    // Never cancel an order that still has actively reserved machines
    if (status === "cancelled") {
      const activeReservations = db.prepare(`
        SELECT COUNT(*) AS count
        FROM inventory_reservations
        WHERE order_id = ? AND status = 'active'
      `).get(id) as { count: number };

      if (activeReservations.count > 0) {
        return "INVALID_TRANSITION" as const;
      }
    }

    db.prepare(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);

    return "UPDATED" as const;
  });

  const result = transaction();

  if (result !== "UPDATED") {
    return result;
  }

  return getOrderById(id);
}