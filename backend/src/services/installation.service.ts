import { db } from "../database/connection.js";

import type {
  CreateInstallationInput,
  AssignInstallationItemsInput,
  UpdateInstallationScheduleInput,
} from "../validators/installation.validator.js";

type InstallationResult =
  | {
      success: true;
      installationId: number;
      assignedCount?: number;
    }
  | {
      success: false;
      code:
        | "ORDER_NOT_FOUND"
        | "ORDER_NOT_ELIGIBLE"
        | "DELIVERY_NOT_FOUND"
        | "DELIVERY_ORDER_MISMATCH"
        | "NO_DELIVERED_MACHINES"
        | "INSTALLATION_NOT_FOUND"
        | "INSTALLATION_NOT_ASSIGNABLE"
        | "INVALID_RESERVATIONS"
        | "RESERVATIONS_ALREADY_ASSIGNED"
        | "INSTALLER_NOT_FOUND"
        | "INSTALLATION_NOT_SCHEDULABLE"
        | "INSTALLATION_NOT_STARTABLE"
        | "INSTALLATION_NOT_COMPLETABLE"
        | "INSTALLATION_HAS_NO_ITEMS";
    };

// Create an installation record.
export function createInstallation(
  input: CreateInstallationInput
): InstallationResult {
  const transaction = db.transaction((): InstallationResult => {
    const order = db.prepare(`
      SELECT id, status, payment_status
      FROM orders
      WHERE id = ?
    `).get(input.order_id) as
      | {
          id: number;
          status: string;
          payment_status: string;
        }
      | undefined;

    if (!order) {
      return { success: false, code: "ORDER_NOT_FOUND" };
    }

    if (
      order.payment_status !== "paid" ||
      order.status === "cancelled"
    ) {
      return { success: false, code: "ORDER_NOT_ELIGIBLE" };
    }

    // Validate the optional installer.
    if (input.assigned_to !== undefined) {
      const installer = db.prepare(`
        SELECT id
        FROM users
        WHERE id = ? AND is_active = 1
      `).get(input.assigned_to);

      if (!installer) {
        return { success: false, code: "INSTALLER_NOT_FOUND" };
      }
    }

    // Validate an optional linked delivery.
    if (input.delivery_id !== undefined) {
      const delivery = db.prepare(`
        SELECT id, order_id
        FROM deliveries
        WHERE id = ?
      `).get(input.delivery_id) as
        | { id: number; order_id: number }
        | undefined;

      if (!delivery) {
        return { success: false, code: "DELIVERY_NOT_FOUND" };
      }

      if (delivery.order_id !== input.order_id) {
        return {
          success: false,
          code: "DELIVERY_ORDER_MISMATCH",
        };
      }
    }

    // Installation requires at least one delivered machine.
    let deliveredCount: { total: number };

    if (input.delivery_id !== undefined) {
      deliveredCount = db.prepare(`
        SELECT COUNT(*) AS total
        FROM delivery_items di
        JOIN inventory_reservations ir
          ON ir.id = di.reservation_id
        JOIN order_items oi
          ON oi.id = ir.order_item_id
        JOIN machine_inventory mi
          ON mi.id = ir.machine_inventory_id
        WHERE oi.order_id = ?
          AND di.delivery_id = ?
          AND di.status = 'delivered'
          AND ir.status = 'fulfilled'
          AND mi.status = 'dispatched'
      `).get(
        input.order_id,
        input.delivery_id
      ) as { total: number };
    } else {
      deliveredCount = db.prepare(`
        SELECT COUNT(*) AS total
        FROM delivery_items di
        JOIN inventory_reservations ir
          ON ir.id = di.reservation_id
        JOIN order_items oi
          ON oi.id = ir.order_item_id
        JOIN machine_inventory mi
          ON mi.id = ir.machine_inventory_id
        WHERE oi.order_id = ?
          AND di.status = 'delivered'
          AND ir.status = 'fulfilled'
          AND mi.status = 'dispatched'
      `).get(input.order_id) as { total: number };
    }

    if (deliveredCount.total === 0) {
      return {
        success: false,
        code: "NO_DELIVERED_MACHINES",
      };
    }

    const result = db.prepare(`
      INSERT INTO installations (
        order_id,
        delivery_id,
        address_line,
        city,
        district,
        province,
        country,
        assigned_to,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.order_id,
      input.delivery_id ?? null,
      input.address_line ?? null,
      input.city ?? null,
      input.district ?? null,
      input.province ?? null,
      input.country ?? null,
      input.assigned_to ?? null,
      input.notes ?? null
    );

    return {
      success: true,
      installationId: Number(result.lastInsertRowid),
    };
  });

  return transaction();
}

// Assign delivered machines to an installation.
export function assignInstallationItems(
  installationId: number,
  input: AssignInstallationItemsInput
): InstallationResult {
  const transaction = db.transaction((): InstallationResult => {
    const installation = db.prepare(`
      SELECT
        id,
        order_id,
        delivery_id,
        status
      FROM installations
      WHERE id = ?
    `).get(installationId) as
      | {
          id: number;
          order_id: number;
          delivery_id: number | null;
          status: string;
        }
      | undefined;

    if (!installation) {
      return {
        success: false,
        code: "INSTALLATION_NOT_FOUND",
      };
    }

    if (installation.status !== "pending") {
      return {
        success: false,
        code: "INSTALLATION_NOT_ASSIGNABLE",
      };
    }

    const placeholders = input.reservation_ids
      .map(() => "?")
      .join(", ");

    const reservations = db.prepare(`
      SELECT
        ir.id AS reservation_id,
        oi.order_id,
        ir.status AS reservation_status,
        mi.status AS machine_status,
        di.status AS delivery_item_status,
        di.delivery_id
      FROM inventory_reservations ir
      JOIN order_items oi
        ON oi.id = ir.order_item_id
      JOIN machine_inventory mi
        ON mi.id = ir.machine_inventory_id
      JOIN delivery_items di
        ON di.reservation_id = ir.id
      WHERE ir.id IN (${placeholders})
    `).all(...input.reservation_ids) as {
      reservation_id: number;
      order_id: number;
      reservation_status: string;
      machine_status: string;
      delivery_item_status: string;
      delivery_id: number;
    }[];

    // Every requested reservation must exist and be valid.
    if (reservations.length !== input.reservation_ids.length) {
      return {
        success: false,
        code: "INVALID_RESERVATIONS",
      };
    }

    const invalidReservation = reservations.some((reservation) => {
      return (
        reservation.order_id !== installation.order_id ||
        reservation.reservation_status !== "fulfilled" ||
        reservation.machine_status !== "dispatched" ||
        reservation.delivery_item_status !== "delivered" ||
        (
          installation.delivery_id !== null &&
          reservation.delivery_id !== installation.delivery_id
        )
      );
    });

    if (invalidReservation) {
      return {
        success: false,
        code: "INVALID_RESERVATIONS",
      };
    }

    // A physical machine can only belong to one installation.
    const existingAssignments = db.prepare(`
      SELECT reservation_id
      FROM installation_items
      WHERE reservation_id IN (${placeholders})
    `).all(...input.reservation_ids);

    if (existingAssignments.length > 0) {
      return {
        success: false,
        code: "RESERVATIONS_ALREADY_ASSIGNED",
      };
    }

    const insertItem = db.prepare(`
      INSERT INTO installation_items (
        installation_id,
        reservation_id
      )
      VALUES (?, ?)
    `);

    for (const reservation of reservations) {
      insertItem.run(
        installationId,
        reservation.reservation_id
      );
    }

    return {
      success: true,
      installationId,
      assignedCount: reservations.length,
    };
  });

  return transaction();
}


// Schedule an installation and optionally assign an installer.
export function updateInstallationSchedule(installationId: number, input: UpdateInstallationScheduleInput): InstallationResult {
  const transaction = db.transaction((): InstallationResult => {
    const installation = db.prepare(`
      SELECT id, status FROM installations WHERE id = ?
    `).get(installationId) as
      | { id: number; status: string }
      | undefined;

    if (!installation) {
      return {
        success: false,
        code: "INSTALLATION_NOT_FOUND",
      };
    }

    if (!["pending", "scheduled"].includes(installation.status)) {
      return {
        success: false,
        code: "INSTALLATION_NOT_SCHEDULABLE",
      };
    }

    if (
      input.assigned_to !== undefined &&
      input.assigned_to !== null
    ) {
      const installer = db.prepare(`
        SELECT id
        FROM users
        WHERE id = ? AND is_active = 1
      `).get(input.assigned_to);

      if (!installer) {
        return {
          success: false,
          code: "INSTALLER_NOT_FOUND",
        };
      }
    }

    const result = db.prepare(`
      UPDATE installations
      SET status = 'scheduled',
          scheduled_at = ?,
          assigned_to = CASE
            WHEN ? = 1 THEN ?
            ELSE assigned_to
          END
      WHERE id = ?
        AND status IN ('pending', 'scheduled')
    `).run(
      input.scheduled_at,
      input.assigned_to !== undefined ? 1 : 0,
      input.assigned_to ?? null,
      installationId
    );

    if (result.changes !== 1) {
      return {
        success: false,
        code: "INSTALLATION_NOT_SCHEDULABLE",
      };
    }

    return {
      success: true,
      installationId,
    };
  });

  return transaction();
}

// Start a scheduled installation
export function startInstallation(installationId: number): InstallationResult {
  const transaction = db.transaction((): InstallationResult => {
    const installation = db.prepare(`
      SELECT id, status
      FROM installations
      WHERE id = ?
    `).get(installationId) as
      | { id: number; status: string }
      | undefined;

    if (!installation) {
      return {
        success: false,
        code: "INSTALLATION_NOT_FOUND",
      };
    }

    if (installation.status !== "scheduled") {
      return {
        success: false,
        code: "INSTALLATION_NOT_STARTABLE",
      };
    }

    const itemCount = db.prepare(`
      SELECT COUNT(*) AS total FROM installation_items
      WHERE installation_id = ?
    `).get(installationId) as { total: number };

    if (itemCount.total === 0) {
      return {
        success: false,
        code: "INSTALLATION_HAS_NO_ITEMS",
      };
    }

    const result = db.prepare(`
      UPDATE installations
      SET status = 'in_progress'
      WHERE id = ? AND status = 'scheduled'
    `).run(installationId);

    if (result.changes !== 1) {
      return {
        success: false,
        code: "INSTALLATION_NOT_STARTABLE",
      };
    }

    return {
      success: true,
      installationId,
    };
  });

  return transaction();
}

// Complete an installation.
export function completeInstallation(installationId: number): InstallationResult {
  const transaction = db.transaction((): InstallationResult => {
    const installation = db.prepare(`
      SELECT id, status FROM installations
      WHERE id = ?
    `).get(installationId) as
      | { id: number; status: string }
      | undefined;

    if (!installation) {
      return {
        success: false,
        code: "INSTALLATION_NOT_FOUND",
      };
    }

    if (installation.status !== "in_progress") {
      return {
        success: false,
        code: "INSTALLATION_NOT_COMPLETABLE",
      };
    }

    const itemCount = db.prepare(`
      SELECT COUNT(*) AS total FROM installation_items
      WHERE installation_id = ?
    `).get(installationId) as { total: number };

    if (itemCount.total === 0) {
      return {
        success: false,
        code: "INSTALLATION_HAS_NO_ITEMS",
      };
    }

    const result = db.prepare(`
      UPDATE installations  SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'in_progress'
    `).run(installationId);

    if (result.changes !== 1) {
      return {
        success: false,
        code: "INSTALLATION_NOT_COMPLETABLE",
      };
    }

    return {
      success: true,
      installationId,
    };
  });

  return transaction();
}

// List installations.
export function getInstallations() {
  return db.prepare(`
    SELECT
      i.*,
      o.order_number,
      d.delivery_number,
      u.name AS assigned_to_name,
      COUNT(ii.id) AS total_items
    FROM installations i
    JOIN orders o ON o.id = i.order_id
    LEFT JOIN deliveries d ON d.id = i.delivery_id
    LEFT JOIN users u ON u.id = i.assigned_to
    LEFT JOIN installation_items ii
      ON ii.installation_id = i.id
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `).all();
}

// Get one installation and its assigned machines.
export function getInstallationById(installationId: number) {
  const installation = db.prepare(`
    SELECT
      i.*,
      o.order_number,
      d.delivery_number,
      u.name AS assigned_to_name
    FROM installations i
    JOIN orders o ON o.id = i.order_id
    LEFT JOIN deliveries d ON d.id = i.delivery_id
    LEFT JOIN users u ON u.id = i.assigned_to
    WHERE i.id = ?
  `).get(installationId);

  if (!installation) {
    return null;
  }

  const items = db.prepare(`
    SELECT
      ii.id,
      ii.reservation_id,
      ir.machine_inventory_id,
      mi.serial_number,
      mi.machine_model_id,
      di.delivery_id,
      di.delivered_at
    FROM installation_items ii
    JOIN inventory_reservations ir
      ON ir.id = ii.reservation_id
    JOIN machine_inventory mi
      ON mi.id = ir.machine_inventory_id
    JOIN delivery_items di
      ON di.reservation_id = ir.id
    WHERE ii.installation_id = ?
    ORDER BY ii.id
  `).all(installationId);

  return {
    ...installation,
    items,
  };
}