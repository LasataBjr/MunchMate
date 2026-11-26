
import { randomBytes } from "node:crypto";

import { db } from "../database/connection.js";
import type {
  CreateDeliveryInput,
  AssignDeliveryItemsInput,
  UpdateDeliveryScheduleInput,
} from "../validators/delivery.validator.js";

type DeliveryResult =
  | { success: true; deliveryId: number; deliveryNumber: string }
  | {
      success: false;
      code:
        | "ORDER_NOT_FOUND"
        | "ORDER_NOT_ELIGIBLE"
        | "NO_RESERVED_MACHINES"
        | "DELIVERY_NOT_FOUND"
        | "INVALID_RESERVATIONS"
        | "RESERVATIONS_ALREADY_ASSIGNED"
        | "DELIVERY_NOT_DISPATCHABLE"
        | "DELIVERY_HAS_NO_ITEMS"
        | "INVALID_DELIVERY_ITEMS"
        | "DELIVERY_ITEM_NOT_FOUND"
        | "DELIVERY_ITEM_NOT_DISPATCHED"
        | "DELIVERY_NOT_SCHEDULABLE",
    };

// Create a delivery for a paid order
export function createDelivery(input: CreateDeliveryInput): DeliveryResult {
  const transaction = db.transaction((): DeliveryResult => {
    const order = db
      .prepare(
        `SELECT id, payment_status, status
         FROM orders
         WHERE id = ?`
      )
      .get(input.order_id) as
      | { id: number; payment_status: string; status: string }
      | undefined;

    if (!order) {
      return { success: false, code: "ORDER_NOT_FOUND" };
    }

    if (
      order.payment_status !== "paid" ||
      !["confirmed", "processing"].includes(order.status)
    ) {
      return { success: false, code: "ORDER_NOT_ELIGIBLE" };
    }

    const reservationCount = db.prepare(
        `SELECT COUNT(*) AS count
        FROM inventory_reservations ir
        WHERE ir.order_id = ?
        AND ir.status = 'active'
        AND NOT EXISTS (
            SELECT 1
            FROM delivery_items di
            WHERE di.reservation_id = ir.id
        )`
    )
    .get(input.order_id) as { count: number };

    if (reservationCount.count === 0) {
      return { success: false, code: "NO_RESERVED_MACHINES" };
    }

    const deliveryNumber =
      `DEL-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const result = db
      .prepare(
        `INSERT INTO deliveries (
          order_id,
          delivery_number,
          address_line,
          city,
          district,
          province,
          country,
          tracking_reference,
          scheduled_at,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.order_id,
        deliveryNumber,
        input.address_line,
        input.city,
        input.district ?? null,
        input.province ?? null,
        input.country,
        input.tracking_reference ?? null,
        input.scheduled_at ?? null,
        input.notes ?? null
      );

    return {
      success: true,
      deliveryId: Number(result.lastInsertRowid),
      deliveryNumber,
    };
  });

  return transaction();
}

// Assign reserved physical machines to a delivery
export function assignDeliveryItems(
  deliveryId: number,
  input: AssignDeliveryItemsInput
): DeliveryResult {
  const transaction = db.transaction((): DeliveryResult => {
    const delivery = db.prepare(`SELECT id, order_id,  delivery_number, status FROM deliveries
         WHERE id = ?`
      )
      .get(deliveryId) as
      | { id: number; order_id: number; delivery_number: string;  status: string }
      | undefined;

    if (!delivery) {
      return { success: false, code: "DELIVERY_NOT_FOUND" };
    }

    if (delivery.status !== "pending" && delivery.status !== "scheduled") {
      return { success: false, code: "ORDER_NOT_ELIGIBLE" };
    }

    const ids = input.reservation_ids;
    const placeholders = ids.map(() => "?").join(", ");

    const reservations = db
      .prepare(
        `SELECT
           ir.id,
           ir.order_id,
           ir.status AS reservation_status,
           mi.status AS machine_status
         FROM inventory_reservations ir
         JOIN machine_inventory mi
           ON mi.id = ir.machine_inventory_id
         WHERE ir.id IN (${placeholders})`
      )
      .all(...ids) as {
        id: number;
        order_id: number;
        reservation_status: string;
        machine_status: string;
      }[];

    if (
      reservations.length !== ids.length ||
      reservations.some(
        (reservation) =>
          reservation.order_id !== delivery.order_id ||
          reservation.reservation_status !== "active" ||
          reservation.machine_status !== "reserved"
      )
    ) {
      return { success: false, code: "INVALID_RESERVATIONS" };
    }

    const alreadyAssigned = db
      .prepare(
        `SELECT reservation_id
         FROM delivery_items
         WHERE reservation_id IN (${placeholders})`
      )
      .all(...ids);

    if (alreadyAssigned.length > 0) {
      return {
        success: false,
        code: "RESERVATIONS_ALREADY_ASSIGNED",
      };
    }

    const insertItem = db.prepare(
      `INSERT INTO delivery_items (delivery_id, reservation_id)
       VALUES (?, ?)`
    );

    for (const reservationId of ids) {
      insertItem.run(deliveryId, reservationId);
    }

    return {
      success: true,
      deliveryId,
      deliveryNumber: delivery.delivery_number,
    };
  });

  return transaction();
}


//
export function dispatchDelivery(deliveryId: number, createdBy: number): DeliveryResult {
  const transaction = db.transaction((): DeliveryResult => {
    const delivery = db
      .prepare(
        `SELECT id, order_id, delivery_number, status
         FROM deliveries
         WHERE id = ?`
      )
      .get(deliveryId) as
      | {
          id: number;
          order_id: number;
          delivery_number: string;
          status: string;
        }
      | undefined;

    if (!delivery) {
      return { success: false, code: "DELIVERY_NOT_FOUND" };
    }

    // Recheck order eligibility before dispatching
    const order = db.prepare(`SELECT payment_status, status FROM orders WHERE id = ?`)
      .get(delivery.order_id) as
      | { payment_status: string; status: string }
      | undefined;

    if (!order ||order.payment_status !== "paid" ||
      !["confirmed", "processing"].includes(order.status)
    ) {
      return {
        success: false,
        code: "ORDER_NOT_ELIGIBLE",
      };
    }

    if (delivery.status !== "pending" && delivery.status !== "scheduled" ) {
      return {
        success: false,
        code: "DELIVERY_NOT_DISPATCHABLE",
      };
    }

    const items = db
      .prepare(
        `SELECT
            di.id AS delivery_item_id,
            ir.id AS reservation_id,
            ir.order_id,
            ir.machine_inventory_id,
            ir.status AS reservation_status,
            mi.status AS machine_status
         FROM delivery_items di
         JOIN inventory_reservations ir
           ON ir.id = di.reservation_id
         JOIN machine_inventory mi
           ON mi.id = ir.machine_inventory_id
         WHERE di.delivery_id = ?`
      )
      .all(deliveryId) as {
        delivery_item_id: number;
        reservation_id: number;
        order_id: number;
        machine_inventory_id: number;
        reservation_status: string;
        machine_status: string;
      }[];

    if (items.length === 0) {
      return {
        success: false,
        code: "DELIVERY_HAS_NO_ITEMS",
      };
    }

    if (
        items.some(
            (item) =>
            item.order_id !== delivery.order_id ||
            item.reservation_status !== "active" ||
            item.machine_status !== "reserved"
        )
    ) {
      return {
        success: false,
        code: "INVALID_DELIVERY_ITEMS",
      };
    }

    const updateReservation = db.prepare(
      `UPDATE inventory_reservations
       SET status = 'fulfilled'
       WHERE id = ? AND status = 'active'`
    );

    const updateMachine = db.prepare(
      `UPDATE machine_inventory SET status = 'dispatched',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'reserved'`
    );

    const updateDeliveryItem = db.prepare(
      `UPDATE delivery_items SET status = 'dispatched',
           dispatched_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`
    );

    const insertMovement = db.prepare(
      `INSERT INTO inventory_movements (
         machine_inventory_id,
         movement_type,
         reference_type,
         reference_id,
         notes,
         created_by
       ) VALUES (?, 'dispatched', 'delivery', ?, ?, ?)`
    );

    for (const item of items) {
      const reservationResult = updateReservation.run(
        item.reservation_id
      );

      const machineResult = updateMachine.run(
        item.machine_inventory_id
      );

      const deliveryItemResult = updateDeliveryItem.run(
        item.delivery_item_id
      );

      if (
        reservationResult.changes !== 1 ||
        machineResult.changes !== 1 ||
        deliveryItemResult.changes !== 1
      ) {
        throw new Error("Delivery dispatch update failed");
      }

      insertMovement.run(
        item.machine_inventory_id,
        deliveryId,
        `Dispatched through ${delivery.delivery_number}`,
        createdBy
      );
    }

    db.prepare(`UPDATE deliveries SET status = 'dispatched' WHERE id = ?`).run(deliveryId);

    const orderCounts = db.prepare(`
      SELECT
        (
          SELECT COALESCE(SUM(quantity), 0)
          FROM order_items
          WHERE order_id = ?
        ) AS total_ordered,

        (
          SELECT COUNT(*)
          FROM inventory_reservations ir
          JOIN order_items oi ON oi.id = ir.order_item_id
          WHERE oi.order_id = ?
            AND ir.status = 'active'
        ) AS active_reservations,

        (
          SELECT COUNT(*)
          FROM delivery_items di
          JOIN inventory_reservations ir ON ir.id = di.reservation_id
          JOIN order_items oi ON oi.id = ir.order_item_id
          WHERE oi.order_id = ?
            AND di.status IN ('dispatched', 'delivered')
        ) AS total_dispatched,

        (
          SELECT COUNT(*)
          FROM delivery_items di
          JOIN inventory_reservations ir ON ir.id = di.reservation_id
          JOIN order_items oi ON oi.id = ir.order_item_id
          WHERE oi.order_id = ?
            AND di.status = 'delivered'
        ) AS total_delivered
    `).get(
      delivery.order_id,
      delivery.order_id,
      delivery.order_id,
      delivery.order_id
    ) as {
      total_ordered: number;
      active_reservations: number;
      total_dispatched: number;
      total_delivered: number;
    };

    let fulfillmentStatus:
      | "awaiting_stock"
      | "stock_reserved"
      | "partially_dispatched"
      | "partially_delivered"
      | "delivered";

    if (
      orderCounts.total_ordered > 0 &&
      orderCounts.total_delivered >= orderCounts.total_ordered
    ) {
      fulfillmentStatus = "delivered";
    } else if (orderCounts.total_delivered > 0) {
      fulfillmentStatus = "partially_delivered";
    } else if (orderCounts.total_dispatched > 0) {
      fulfillmentStatus = "partially_dispatched";
    } else if (orderCounts.active_reservations >= orderCounts.total_ordered) {
      fulfillmentStatus = "stock_reserved";
    } else {
      fulfillmentStatus = "awaiting_stock";
    }

    db.prepare(`UPDATE orders SET fulfillment_status = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(fulfillmentStatus, delivery.order_id);


    return {
      success: true,
      deliveryId,
      deliveryNumber: delivery.delivery_number,
    };
  });

  return transaction();
}


// Delivery Confirmation
export function markDeliveryItemDelivered(deliveryItemId: number): DeliveryResult {
  const transaction = db.transaction((): DeliveryResult => {
    const item = db
      .prepare(
        `SELECT
           di.id,
           di.status AS item_status,
           d.id AS delivery_id,
           d.delivery_number,
           d.order_id,
           d.status AS delivery_status
         FROM delivery_items di
         JOIN deliveries d ON d.id = di.delivery_id
         WHERE di.id = ?`
      )
      .get(deliveryItemId) as
      | {
          id: number;
          item_status: string;
          delivery_id: number;
          delivery_number: string;
          order_id: number;
          delivery_status: string;
        }
      | undefined;

    if (!item) {
      return { success: false, code: "DELIVERY_ITEM_NOT_FOUND" };
    }

    if (item.item_status !== "dispatched") {
      return {
        success: false,
        code: "DELIVERY_ITEM_NOT_DISPATCHED",
      };
    }
    
    if (
    item.delivery_status !== "dispatched" &&
    item.delivery_status !== "partially_delivered"
    ) {
        return {
            success: false,
            code: "DELIVERY_ITEM_NOT_DISPATCHED",
        };
    }

    const updateResult = db
      .prepare(
        `UPDATE delivery_items
         SET status = 'delivered',
             delivered_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'dispatched'`
      )
      .run(deliveryItemId);

    if (updateResult.changes !== 1) {
      throw new Error("Could not confirm delivery item");
    }

    // Calculate the status of this individual delivery
    const deliveryCounts = db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)
             AS delivered
         FROM delivery_items
         WHERE delivery_id = ?`
      )
      .get(item.delivery_id) as {
        total: number;
        delivered: number;
      };

    let deliveryStatus: string;

    if (deliveryCounts.delivered === deliveryCounts.total) {
      deliveryStatus = "delivered";
    } else {
      deliveryStatus = "partially_delivered";
    }

    db.prepare(
      `UPDATE deliveries SET status = ?,
           delivered_at = CASE
             WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP
             ELSE NULL
           END
       WHERE id = ?`
    ).run(deliveryStatus, deliveryStatus, item.delivery_id);

    // Calculate overall order fulfilment
    const orderCounts = db.prepare(`
      SELECT
        (
          SELECT COALESCE(SUM(quantity), 0)
          FROM order_items
          WHERE order_id = ?
        ) AS total_ordered,

        (
          SELECT COUNT(*)
          FROM inventory_reservations ir
          JOIN order_items oi ON oi.id = ir.order_item_id
          WHERE oi.order_id = ?
            AND ir.status = 'active'
        ) AS active_reservations,

        (
          SELECT COUNT(*)
          FROM delivery_items di
          JOIN inventory_reservations ir
            ON ir.id = di.reservation_id
          JOIN order_items oi ON oi.id = ir.order_item_id
          WHERE oi.order_id = ?
            AND di.status IN ('dispatched', 'delivered')
        ) AS total_dispatched,

        (
          SELECT COUNT(*)
          FROM delivery_items di
          JOIN inventory_reservations ir
            ON ir.id = di.reservation_id
          JOIN order_items oi ON oi.id = ir.order_item_id
          WHERE oi.order_id = ?
            AND di.status = 'delivered'
        ) AS total_delivered
    `).get(
      item.order_id,
      item.order_id,
      item.order_id,
      item.order_id
    ) as {
      total_ordered: number;
      active_reservations: number;
      total_dispatched: number;
      total_delivered: number;
    };

    let fulfillmentStatus:
      | "awaiting_stock"
      | "stock_reserved"
      | "partially_dispatched"
      | "partially_delivered"
      | "delivered";

    if (
      orderCounts.total_ordered > 0 &&
      orderCounts.total_delivered >= orderCounts.total_ordered
    ) {
      fulfillmentStatus = "delivered";
    } else if (orderCounts.total_delivered > 0) {
      fulfillmentStatus = "partially_delivered";
    } else if (orderCounts.total_dispatched > 0) {
      fulfillmentStatus = "partially_dispatched";
    } else if (orderCounts.active_reservations >= orderCounts.total_ordered) {
      fulfillmentStatus = "stock_reserved";
    } else {
      fulfillmentStatus = "awaiting_stock";
    }

    db.prepare(`UPDATE orders SET fulfillment_status = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(fulfillmentStatus, item.order_id);

    return {
      success: true,
      deliveryId: item.delivery_id,
      deliveryNumber: item.delivery_number,
    };
  });

  return transaction();
}

// Get all deliveries with their item counts.
export function getDeliveries() {
  return db.prepare(`
    SELECT
      d.*,
      o.order_number,
      COUNT(di.id) AS total_items,
      COALESCE(
        SUM(CASE WHEN di.status = 'delivered' THEN 1 ELSE 0 END),
        0
      ) AS delivered_items
    FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    LEFT JOIN delivery_items di ON di.delivery_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `).all();
}

// Get one delivery with its assigned machines.
export function getDeliveryById(deliveryId: number) {
  const delivery = db.prepare(`
    SELECT
      d.*,
      o.order_number
    FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    WHERE d.id = ?
  `).get(deliveryId);

  if (!delivery) {
    return null;
  }

  const items = db.prepare(`
    SELECT
      di.id,
      di.reservation_id,
      di.status,
      di.dispatched_at,
      di.delivered_at,
      mi.serial_number,
      mi.machine_model_id
    FROM delivery_items di
    JOIN inventory_reservations ir
      ON ir.id = di.reservation_id
    JOIN machine_inventory mi
      ON mi.id = ir.machine_inventory_id
    WHERE di.delivery_id = ?
    ORDER BY di.id
  `).all(deliveryId);

  return {
    ...delivery as object,
    items,
  };
}

// Update a delivery schedule.
export function updateDeliverySchedule(
  deliveryId: number,
  input: UpdateDeliveryScheduleInput
): DeliveryResult {
  const transaction = db.transaction((): DeliveryResult => {
    const delivery = db.prepare(`
      SELECT id, delivery_number, status
      FROM deliveries
      WHERE id = ?
    `).get(deliveryId) as
      | {
          id: number;
          delivery_number: string;
          status: string;
        }
      | undefined;

    if (!delivery) {
      return { success: false, code: "DELIVERY_NOT_FOUND" };
    }

    if (!["pending", "scheduled"].includes(delivery.status)) {
      return {
        success: false,
        code: "DELIVERY_NOT_SCHEDULABLE",
      };
    }

    const result = db.prepare(`
      UPDATE deliveries
      SET status = 'scheduled',
          scheduled_at = ?,
          tracking_reference = COALESCE(?, tracking_reference),
          notes = COALESCE(?, notes)
      WHERE id = ?
        AND status IN ('pending', 'scheduled')
    `).run(
      input.scheduled_at,
      input.tracking_reference ?? null,
      input.notes ?? null,
      deliveryId
    );

    if (result.changes !== 1) {
      return {
        success: false,
        code: "DELIVERY_NOT_SCHEDULABLE",
      };
    }

    return {
      success: true,
      deliveryId: delivery.id,
      deliveryNumber: delivery.delivery_number,
    };
  });

  return transaction();
}