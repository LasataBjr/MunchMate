
import { db } from "../database/connection.js";

// WAREHOUSE: The client currently has only one warehouse
export function getWarehouse() {
  return db.prepare(`SELECT * FROM warehouses ORDER BY id ASC LIMIT 1`).get() ?? null;
}

export function createWarehouse(name: string, address: string) {
  const transaction = db.transaction(() => {
    const existing = db.prepare(`
      SELECT id FROM warehouses LIMIT 1
    `).get();

    if (existing) {
      return { success: false, code: "WAREHOUSE_ALREADY_EXISTS" } as const;
    }

    const result = db.prepare(`
      INSERT INTO warehouses (name, address)
      VALUES (?, ?)
    `).run(name.trim(), address.trim());

    return {
      success: true,
      warehouse: db.prepare(`SELECT * FROM warehouses WHERE id = ?`).get(result.lastInsertRowid),
    } as const;
  });

  return transaction();
}

// REGISTER PHYSICAL MACHINES
export function addMachineToInventory(
  machineModelId: number,
  serialNumber: string,
  purchaseDate?: string,
  createdBy: number | null = null
) {
  const transaction = db.transaction(() => {
    const warehouse = db.prepare(`
      SELECT id FROM warehouses
      WHERE is_active = 1
      ORDER BY id ASC
      LIMIT 1
    `).get() as { id: number } | undefined;

    if (!warehouse) {
      return { success: false, code: "WAREHOUSE_NOT_FOUND" } as const;
    }

    const model = db.prepare(`
      SELECT id FROM machine_models WHERE id = ?
    `).get(machineModelId);

    if (!model) {
      return { success: false, code: "MACHINE_MODEL_NOT_FOUND" } as const;
    }

    const result = db.prepare(`
      INSERT INTO machine_inventory (
        machine_model_id,
        warehouse_id,
        serial_number,
        purchase_date
      )
      VALUES (?, ?, ?, ?)
    `).run(
      machineModelId,
      warehouse.id,
      serialNumber.trim(),
      purchaseDate ?? null
    );

    const machineId = Number(result.lastInsertRowid);

    // Record that this machine was received into inventory.
    db.prepare(`
      INSERT INTO inventory_movements (
        machine_inventory_id,
        movement_type,
        reference_type,
        reference_id,
        notes,
        created_by
      )
      VALUES (?, 'received', 'machine_inventory', ?, ?, ?)
    `).run(
      machineId,
      machineId,
      "Machine received into warehouse",
      createdBy
    );

    const machine = db.prepare(`
      SELECT * FROM machine_inventory WHERE id = ?
    `).get(machineId);

    return { success: true, machine } as const;
  });

  return transaction();
}

// INVENTORY READ OPERATIONS

export function getInventory() {
  return db.prepare(`
    SELECT
      mi.id,
      mi.machine_model_id,
      mm.name AS machine_model_name,
      mi.warehouse_id,
      w.name AS warehouse_name,
      mi.serial_number,
      mi.status,
      mi.purchase_date,
      mi.created_at,
      mi.updated_at
    FROM machine_inventory mi
    JOIN machine_models mm ON mm.id = mi.machine_model_id
    JOIN warehouses w ON w.id = mi.warehouse_id
    ORDER BY mi.created_at DESC, mi.id DESC
  `).all();
}

// Function to get a summary of the inventory, grouped by machine model
export function getInventorySummary() {
  return db.prepare(`
    SELECT
      mm.id AS machine_model_id,
      mm.name AS machine_model_name,
      COUNT(mi.id) AS total_quantity,
      SUM(CASE WHEN mi.status = 'available' THEN 1 ELSE 0 END)
        AS available_quantity,
      SUM(CASE WHEN mi.status = 'reserved' THEN 1 ELSE 0 END)
        AS reserved_quantity,
      SUM(CASE WHEN mi.status = 'dispatched' THEN 1 ELSE 0 END)
        AS dispatched_quantity,
      SUM(CASE WHEN mi.status = 'maintenance' THEN 1 ELSE 0 END)
        AS maintenance_quantity,
      SUM(CASE WHEN mi.status = 'returned' THEN 1 ELSE 0 END)
        AS returned_quantity
    FROM machine_models mm
    LEFT JOIN machine_inventory mi ON mi.machine_model_id = mm.id
    GROUP BY mm.id, mm.name
    ORDER BY mm.name ASC
  `).all();
}

// STOCK RESERVATION: This function DOES NOT start a transaction.
// The caller must already be inside one
type ReservationResult = | { success: true; code: "RESERVED" | "ALREADY_RESERVED" }
  | {
      success: false;
      code:
        | "ORDER_NOT_FOUND"
        | "ORDER_NOT_PAID"
        | "ORDER_CANCELLED"
        | "ORDER_ITEMS_NOT_FOUND"
        | "INSUFFICIENT_STOCK"
        | "RESERVATION_CONFLICT"
        |"ORDER_NOT_ELIGIBLE";
      shortages?: Array<{
        orderItemId: number;
        machineModelId: number;
        required: number;
        available: number;
      }>;
    };

export function reserveOrderInventoryInTransaction(orderId: number,
  createdBy: number | null = null
): ReservationResult {
  const order = db.prepare(`
    SELECT id, payment_status, status
    FROM orders
    WHERE id = ?
  `).get(orderId) as
    | { id: number; payment_status: string; status: string }
    | undefined;

  if (!order) {
    return { success: false, code: "ORDER_NOT_FOUND" };
  }

  if (order.payment_status !== "paid") {
    return { success: false, code: "ORDER_NOT_PAID" };
  }

  if (order.status === "cancelled") {
    return { success: false, code: "ORDER_CANCELLED" };
  }

  if (order.status !== "confirmed" && order.status !== "processing") {
    return { success: false, code: "ORDER_NOT_ELIGIBLE" };
  }

  const items = db.prepare(`
    SELECT id, machine_model_id, quantity
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `).all(orderId) as Array<{
    id: number;
    machine_model_id: number;
    quantity: number;
  }>;

  if (items.length === 0) {
    return { success: false, code: "ORDER_ITEMS_NOT_FOUND" };
  }

  // Prevent duplicate reservations.
  const existingReservations = db.prepare(`
    SELECT order_item_id, COUNT(*) AS quantity
    FROM inventory_reservations
    WHERE order_id = ? AND status = 'active'
    GROUP BY order_item_id
  `).all(orderId) as Array<{
    order_item_id: number | null;
    quantity: number;
  }>;

  if (existingReservations.length > 0) {
    const existingMap = new Map(
      existingReservations.map((row) => [
        row.order_item_id,
        row.quantity,
      ])
    );

    const matches = items.every(
      (item) => existingMap.get(item.id) === item.quantity
    );

    const totalReserved = existingReservations.reduce(
      (sum, row) => sum + row.quantity,
      0
    );

    const totalRequired = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    if (matches && totalReserved === totalRequired) {
      return { success: true, code: "ALREADY_RESERVED" };
    }

    return { success: false, code: "RESERVATION_CONFLICT" };
  }

  // Check every item before reserving anything.
  const selections: Array<{
    orderItemId: number;
    machineModelId: number;
    machineIds: number[];
  }> = [];

  const shortages: NonNullable<
    Extract<ReservationResult, { success: false }>["shortages"]
  > = [];

  const findAvailableMachines = db.prepare(`
    SELECT id FROM machine_inventory
    WHERE machine_model_id = ? AND status = 'available'
    ORDER BY id ASC
    LIMIT ?
  `);

  for (const item of items) {
    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return { success: false, code: "RESERVATION_CONFLICT" };
    }

    const machines = findAvailableMachines.all(
      item.machine_model_id,
      item.quantity
    ) as Array<{ id: number }>;

    if (machines.length < item.quantity) {
      shortages.push({
        orderItemId: item.id,
        machineModelId: item.machine_model_id,
        required: item.quantity,
        available: machines.length,
      });
    } else {
      selections.push({
        orderItemId: item.id,
        machineModelId: item.machine_model_id,
        machineIds: machines.map((machine) => machine.id),
      });
    }
  }

  if (shortages.length > 0) {
    return {
      success: false,
      code: "INSUFFICIENT_STOCK",
      shortages,
    };
  }

  // All stock is available. Now reserve every machine.
  const updateMachine = db.prepare(`
    UPDATE machine_inventory SET status = 'reserved',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'available'
  `);

  const insertReservation = db.prepare(`
    INSERT INTO inventory_reservations (
      order_id,
      order_item_id,
      machine_inventory_id,
      status,
      notes
    )
    VALUES (?, ?, ?, 'active', ?)
  `);

  const insertMovement = db.prepare(`
    INSERT INTO inventory_movements (
      machine_inventory_id,
      movement_type,
      reference_type,
      reference_id,
      notes,
      created_by
    )
    VALUES (?, 'reserved', 'order', ?, ?, ?)
  `);

  for (const selection of selections) {
    for (const machineId of selection.machineIds) {
      const update = updateMachine.run(machineId);

      if (update.changes !== 1) {
        throw new Error("INVENTORY_RESERVATION_CONFLICT");
      }

      insertReservation.run(
        orderId,
        selection.orderItemId,
        machineId,
        "Reserved after full payment"
      );

      insertMovement.run(
        machineId,
        orderId,
        "Reserved for paid order",
        createdBy
      );
    }
  }

  const orderUpdate = db.prepare(`UPDATE orders SET fulfillment_status = 'stock_reserved',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND payment_status = 'paid'
  `).run(orderId);

  if (orderUpdate.changes !== 1) {
    throw new Error("INVENTORY_ORDER_UPDATE_FAILED");
  }

  return { success: true, code: "RESERVED" };
}

// ADMIN RETRY: This wrapper creates its own transaction
export function reserveOrderInventory(orderId: number, createdBy: number | null = null) {
  const transaction = db.transaction(() =>
    reserveOrderInventoryInTransaction(orderId, createdBy)
  );

  return transaction();
}

type ReleaseReservationResult =
  | { success: true; code: "RELEASED"; releasedCount: number }
  | {
      success: false;
      code: "ORDER_NOT_FOUND" | "NO_ACTIVE_RESERVATIONS";
    };

// ADMIN: Release all active reservations for an order
// The caller must not wrap this function in another transaction.
export function releaseOrderInventory(orderId: number, createdBy: number | null = null): ReleaseReservationResult {
  const transaction = db.transaction(() => {
    const order = db.prepare(`SELECT id FROM orders WHERE id = ?`).get(orderId);

    if (!order) {
      return { success: false, code: "ORDER_NOT_FOUND" } as const;
    }

    const reservations = db.prepare(`
      SELECT
        ir.id AS reservation_id,
        ir.machine_inventory_id,
        mi.status AS machine_status
      FROM inventory_reservations ir
      JOIN machine_inventory mi
        ON mi.id = ir.machine_inventory_id
      WHERE ir.order_id = ?
        AND ir.status = 'active'
      ORDER BY ir.id ASC
    `).all(orderId) as Array<{
      reservation_id: number;
      machine_inventory_id: number;
      machine_status: string;
    }>;

    if (reservations.length === 0) {
      return {
        success: false,
        code: "NO_ACTIVE_RESERVATIONS",
      } as const;
    }

    const releaseReservation = db.prepare(`
      UPDATE inventory_reservations
      SET status = 'released',
          released_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'active'
    `);

    const releaseMachine = db.prepare(`
      UPDATE machine_inventory
      SET status = 'available',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'reserved'
    `);

    const insertMovement = db.prepare(`
      INSERT INTO inventory_movements (
        machine_inventory_id,
        movement_type,
        reference_type,
        reference_id,
        notes,
        created_by
      )
      VALUES (?, 'released', 'order', ?, ?, ?)
    `);

    for (const reservation of reservations) {
      if (reservation.machine_status !== "reserved") {
        throw new Error("INVENTORY_RELEASE_CONFLICT");
      }

      const reservationUpdate = releaseReservation.run(
        reservation.reservation_id
      );

      const machineUpdate = releaseMachine.run(
        reservation.machine_inventory_id
      );

      if (
        reservationUpdate.changes !== 1 ||
        machineUpdate.changes !== 1
      ) {
        throw new Error("INVENTORY_RELEASE_CONFLICT");
      }

      insertMovement.run(
        reservation.machine_inventory_id,
        orderId,
        "Reservation released by administrator",
        createdBy
      );
    }

    const fulfilledReservations = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_reservations
      WHERE order_id = ? AND status = 'fulfilled'
    `).get(orderId) as { count: number };

    db.prepare(`
      UPDATE orders
      SET fulfillment_status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fulfilledReservations.count > 0
        ? "partially_dispatched"
        : "awaiting_stock",
      orderId
    );

    return {
      success: true,
      code: "RELEASED",
      releasedCount: reservations.length,
    } as const;
  });

  return transaction();
}