
import { db } from "../../src/database/connection.js";

import {
  getWarehouse,
  createWarehouse,
  addMachineToInventory,
  getInventory,
  getInventorySummary,
  reserveOrderInventory,
  releaseOrderInventory,
} from "../../src/services/inventory.service.js";

let passed = 0;
let failed = 0;

function test(name: string, callback: () => void) {
  try {
    callback();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL: ${name}`);
    console.error(error);
  }
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function expectEqual(actual: unknown, expected: unknown, message: string) {
  assert(
    actual === expected,
    `${message}. Expected ${expected}, received ${actual}`
  );
}

try {
  console.log("\n--- MUNCHMATE INVENTORY INTEGRATION TEST ---\n");

  // Create valid Admin user for movement history.
  db.prepare(`
    INSERT OR IGNORE INTO roles (name, description)
    VALUES ('Admin', 'Administrator')
  `).run();

  const adminRole = db.prepare(`
    SELECT id FROM roles WHERE name = 'Admin'
  `).get() as { id: number };

  const adminInsert = db.prepare(`
    INSERT INTO users (role_id, name, email, password_hash)
    VALUES (?, ?, ?, ?)
  `).run(
    adminRole.id,
    "Inventory Test Admin",
    "inventory-test-admin@example.com",
    "test-only-password-hash"
  );

  const adminId = Number(adminInsert.lastInsertRowid);

  // Create two machine models.
  const categoryInsert = db.prepare(`
    INSERT INTO machine_categories (name, description)
    VALUES (?, ?)
  `).run("Inventory Test Category", "Temporary integration test");

  const categoryId = Number(categoryInsert.lastInsertRowid);

  const modelAInsert = db.prepare(`
    INSERT INTO machine_models (
      category_id, name, model_number, slug, base_price_paisa
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    categoryId,
    "Inventory Test Machine A",
    "TEST-MODEL-A",
    "inventory-test-machine-a",
    100000
  );

  const modelA = Number(modelAInsert.lastInsertRowid);

  const modelBInsert = db.prepare(`
    INSERT INTO machine_models (
      category_id, name, model_number, slug, base_price_paisa
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    categoryId,
    "Inventory Test Machine B",
    "TEST-MODEL-B",
    "inventory-test-machine-b",
    200000
  );

  const modelB = Number(modelBInsert.lastInsertRowid);

  // 1. Warehouse creation.
  const warehouseResult = createWarehouse(
    "MunchMate Test Warehouse",
    "Test Address, Kathmandu"
  );

  assert(warehouseResult.success, "Warehouse should be created");

  test("Create warehouse", () => {
    assert(getWarehouse() !== null, "Warehouse was not found");
  });

  // 2. Reject a second warehouse.
  const secondWarehouse = createWarehouse(
    "Second Warehouse",
    "Another Test Address"
  );

  test("Reject second warehouse", () => {
    expectEqual(secondWarehouse.success, false, "Second warehouse must fail");
  });

  // 3. Register two machines of Model A.
  const machineA1 = addMachineToInventory(
    modelA, "TEST-SERIAL-A001", undefined, adminId
  );

  const machineA2 = addMachineToInventory(
    modelA, "TEST-SERIAL-A002", undefined, adminId
  );

  test("Register two Model A machines", () => {
    assert(machineA1.success && machineA2.success, "Machine registration failed");
  });

  // 4. Reject duplicate serial number.
  let duplicateRejected = false;

  try {
    addMachineToInventory(modelA, "TEST-SERIAL-A001", undefined, adminId);
  } catch {
    duplicateRejected = true;
  }

  test("Reject duplicate serial number", () => {
    assert(duplicateRejected, "Duplicate serial number was accepted");
  });

  // 5. Check received movement history and Admin attribution.
  const receivedMovements = db.prepare(`
    SELECT COUNT(*) AS count
    FROM inventory_movements
    WHERE movement_type = 'received'
      AND created_by = ?
  `).get(adminId) as { count: number };

  test("Record received movements with Admin ID", () => {
    expectEqual(receivedMovements.count, 2, "Received movement count");
  });

  // 6. Create customer, enquiry, quotation and a paid test order.
  const customerInsert = db.prepare(`
    INSERT INTO customers (
      customer_type, name, phone, email
    )
    VALUES ('individual', 'Inventory Test Customer', '9800000000',
            'inventory-test-customer@example.com')
  `).run();

  const customerId = Number(customerInsert.lastInsertRowid);

  const enquiryInsert = db.prepare(`
    INSERT INTO enquiries (customer_id, enquiry_number)
    VALUES (?, ?)
  `).run(customerId, "TEST-INV-ENQUIRY-001");

  const enquiryId = Number(enquiryInsert.lastInsertRowid);

  const quotationInsert = db.prepare(`
    INSERT INTO quotations (
      enquiry_id, quotation_number, version_number,
      subtotal_paisa, discount_paisa, tax_amount_paisa,
      total_amount_paisa, created_by
    )
    VALUES (?, ?, 1, 400000, 0, 0, 400000, ?)
  `).run(enquiryId, "TEST-INV-QUOTATION-001", adminId);

  const quotationId = Number(quotationInsert.lastInsertRowid);

  const quoteItemA = db.prepare(`
    INSERT INTO quotation_items (
      quotation_id, machine_model_id, description,
      quantity, unit_price_paisa, line_total_paisa
    )
    VALUES (?, ?, ?, 2, 100000, 200000)
  `).run(quotationId, modelA, "Test Machine A");

  const quoteItemB = db.prepare(`
    INSERT INTO quotation_items (
      quotation_id, machine_model_id, description,
      quantity, unit_price_paisa, line_total_paisa
    )
    VALUES (?, ?, ?, 1, 200000, 200000)
  `).run(quotationId, modelB, "Test Machine B");

  const orderInsert = db.prepare(`
    INSERT INTO orders (
      customer_id, quotation_id, order_number,
      payment_status, subtotal_paisa, total_amount_paisa
    )
    VALUES (?, ?, ?, 'paid', 400000, 400000)
  `).run(customerId, quotationId, "TEST-INV-ORDER-001");

  const orderId = Number(orderInsert.lastInsertRowid);

  db.prepare(`
    INSERT INTO order_items (
      order_id, quotation_item_id, machine_model_id,
      description, quantity, unit_price_paisa, line_total_paisa
    )
    VALUES (?, ?, ?, ?, 2, 100000, 200000)
  `).run(orderId, quoteItemA.lastInsertRowid, modelA, "Test Machine A");

  db.prepare(`
    INSERT INTO order_items (
      order_id, quotation_item_id, machine_model_id,
      description, quantity, unit_price_paisa, line_total_paisa
    )
    VALUES (?, ?, ?, ?, 1, 200000, 200000)
  `).run(orderId, quoteItemB.lastInsertRowid, modelB, "Test Machine B");

  // 7. Check inventory listing and summary.
  test("Inventory listing contains two machines", () => {
    expectEqual(getInventory().length, 2, "Inventory count");
  });

  const summary = getInventorySummary() as Array<{
    machine_model_id: number;
    total_quantity: number;
    available_quantity: number;
  }>;

  test("Inventory summary reports correct Model A stock", () => {
    const row = summary.find((item) => item.machine_model_id === modelA);

    if (!row) {
    throw new Error("Model A summary missing");
    }

    expectEqual(row.total_quantity, 2, "Model A total");
    expectEqual(row.available_quantity, 2, "Model A available");
  });

  // 8. Insufficient stock must not partially reserve Model A.
  const insufficientResult = reserveOrderInventory(orderId, adminId);

  test("Insufficient stock is detected", () => {
    assert(
      !insufficientResult.success &&
      insufficientResult.code === "INSUFFICIENT_STOCK",
      "Expected INSUFFICIENT_STOCK"
    );
  });

  test("Insufficient stock creates no partial reservations", () => {
    const reservations = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_reservations
      WHERE order_id = ? AND status = 'active'
    `).get(orderId) as { count: number };

    expectEqual(reservations.count, 0, "Active reservation count");

    const available = db.prepare(`
      SELECT COUNT(*) AS count
      FROM machine_inventory
      WHERE machine_model_id = ? AND status = 'available'
    `).get(modelA) as { count: number };

    expectEqual(available.count, 2, "Model A available stock");
  });

  // 9. Add the missing Model B machine.
  const machineB1 = addMachineToInventory(
    modelB, "TEST-SERIAL-B001", undefined, adminId
  );

  test("Register missing Model B machine", () => {
    assert(machineB1.success, "Model B registration failed");
  });

  // 10. Reserve the entire paid order.
  const reservationResult = reserveOrderInventory(orderId, adminId);

  test("Reserve all machines successfully", () => {
    assert(
      reservationResult.success &&
      reservationResult.code === "RESERVED",
      "Expected successful reservation"
    );
  });

  test("Create exactly three active reservations", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_reservations
      WHERE order_id = ? AND status = 'active'
    `).get(orderId) as { count: number };

    expectEqual(result.count, 3, "Active reservation count");
  });

  test("Update order fulfillment status", () => {
    const order = db.prepare(`
      SELECT fulfillment_status FROM orders WHERE id = ?
    `).get(orderId) as { fulfillment_status: string };

    expectEqual(
      order.fulfillment_status,
      "stock_reserved",
      "Order fulfillment status"
    );
  });

  // 11. Repeated reservation must be idempotent.
  const repeatedResult = reserveOrderInventory(orderId, adminId);

  test("Repeated reservation returns ALREADY_RESERVED", () => {
    assert(
      repeatedResult.success &&
      repeatedResult.code === "ALREADY_RESERVED",
      "Expected ALREADY_RESERVED"
    );
  });

  test("Repeated reservation does not duplicate records", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_reservations
      WHERE order_id = ? AND status = 'active'
    `).get(orderId) as { count: number };

    expectEqual(result.count, 3, "Active reservation count");
  });

  // 12. Verify reservation movement history.
  const reservedMovements = db.prepare(`
    SELECT COUNT(*) AS count
    FROM inventory_movements
    WHERE movement_type = 'reserved'
      AND reference_id = ?
      AND created_by = ?
  `).get(orderId, adminId) as { count: number };

  test("Record three reservation movements with Admin ID", () => {
    expectEqual(reservedMovements.count, 3, "Reserved movement count");
  });

  // 13. Order eligibility checks.
  db.prepare(`
    UPDATE orders SET status = 'completed' WHERE id = ?
  `).run(orderId);

  const completedResult = reserveOrderInventory(orderId, adminId);

  test("Completed orders cannot reserve inventory", () => {
    assert(
      !completedResult.success &&
      completedResult.code === "ORDER_NOT_ELIGIBLE",
      "Expected ORDER_NOT_ELIGIBLE"
    );
  });

  db.prepare(`
    UPDATE orders SET status = 'cancelled' WHERE id = ?
  `).run(orderId);

  const cancelledResult = reserveOrderInventory(orderId, adminId);

  test("Cancelled orders cannot reserve inventory", () => {
    assert(
      !cancelledResult.success &&
      cancelledResult.code === "ORDER_CANCELLED",
      "Expected ORDER_CANCELLED"
    );
  });

  // Restore the test order for the following release tests.
  db.prepare(`
    UPDATE orders SET status = 'confirmed' WHERE id = ?
  `).run(orderId);

  // 14. Release all active reservations.
  const releaseResult = releaseOrderInventory(orderId, adminId);

  test("Release all active reservations", () => {
    assert(
      releaseResult.success &&
      releaseResult.code === "RELEASED" &&
      releaseResult.releasedCount === 3,
      "Expected three released reservations"
    );
  });

  test("Released machines become available", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM machine_inventory
      WHERE id IN (
        SELECT machine_inventory_id
        FROM inventory_reservations
        WHERE order_id = ? AND status = 'released'
      )
      AND status = 'available'
    `).get(orderId) as { count: number };

    expectEqual(result.count, 3, "Available released machines");
  });

  test("Released reservations have timestamps", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_reservations
      WHERE order_id = ?
        AND status = 'released'
        AND released_at IS NOT NULL
    `).get(orderId) as { count: number };

    expectEqual(result.count, 3, "Released reservation timestamps");
  });

  test("Release movements record Admin ID", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_movements
      WHERE reference_type = 'order'
        AND reference_id = ?
        AND movement_type = 'released'
        AND created_by = ?
    `).get(orderId, adminId) as { count: number };

    expectEqual(result.count, 3, "Release movement count");
  });

  test("Order returns to awaiting_stock after release", () => {
    const order = db.prepare(`
      SELECT fulfillment_status FROM orders WHERE id = ?
    `).get(orderId) as { fulfillment_status: string };

    expectEqual(
      order.fulfillment_status,
      "awaiting_stock",
      "Order fulfillment status"
    );
  });

  // 16. Reserve again to test dispatch protection.
  const secondReservation = reserveOrderInventory(orderId, adminId);

  test("Released stock can be reserved again", () => {
    assert(
      secondReservation.success &&
      secondReservation.code === "RESERVED",
      "Expected successful second reservation"
    );
  });

  // Simulate one machine being dispatched.
  // This setup represents a dispatch operation; it is not the production dispatch API.
  const dispatchSetup = db.transaction(() => {
    const reservation = db.prepare(`
      SELECT id, machine_inventory_id
      FROM inventory_reservations
      WHERE order_id = ? AND status = 'active'
      ORDER BY id ASC
      LIMIT 1
    `).get(orderId) as {
      id: number;
      machine_inventory_id: number;
    };

    db.prepare(`
      UPDATE inventory_reservations
      SET status = 'fulfilled'
      WHERE id = ?
    `).run(reservation.id);

    db.prepare(`
      UPDATE machine_inventory
      SET status = 'dispatched',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reservation.machine_inventory_id);

    db.prepare(`
      INSERT INTO inventory_movements (
        machine_inventory_id,
        movement_type,
        reference_type,
        reference_id,
        notes,
        created_by
      )
      VALUES (?, 'dispatched', 'order', ?, ?, ?)
    `).run(
      reservation.machine_inventory_id,
      orderId,
      "Test dispatch",
      adminId
    );

    return reservation.machine_inventory_id;
  });

  const dispatchedMachineId = dispatchSetup();

  const partialRelease = releaseOrderInventory(orderId, adminId);

  test("Release remaining reservations without releasing dispatched machine", () => {
    assert(
      partialRelease.success &&
      partialRelease.releasedCount === 2,
      "Expected two remaining reservations to be released"
    );
  });

  test("Dispatched machine remains dispatched", () => {
    const machine = db.prepare(`
      SELECT status FROM machine_inventory WHERE id = ?
    `).get(dispatchedMachineId) as { status: string };

    expectEqual(machine.status, "dispatched", "Dispatched machine status");
  });

  test("Dispatched reservation remains fulfilled", () => {
    const reservation = db.prepare(`
      SELECT status
      FROM inventory_reservations
      WHERE machine_inventory_id = ?
        AND order_id = ?
        AND status = 'fulfilled'
      ORDER BY id DESC
      LIMIT 1
    `).get(dispatchedMachineId, orderId) as { status: string } | undefined;

    if (!reservation) {
      throw new Error("Fulfilled reservation not found");
    }

    expectEqual(
      reservation.status,
      "fulfilled",
      "Dispatched reservation status"
    );
  });

  test("Order reflects partial dispatch after remaining stock is released", () => {
    const order = db.prepare(`
      SELECT fulfillment_status FROM orders WHERE id = ?
    `).get(orderId) as { fulfillment_status: string };

    expectEqual(
      order.fulfillment_status,
      "partially_dispatched",
      "Order fulfillment status"
    );
  });

  // 17. Verify foreign keys.
  const foreignKeyErrors = db.pragma("foreign_key_check") as unknown[];

  test("Database foreign-key integrity", () => {
    expectEqual(foreignKeyErrors.length, 0, "Foreign-key errors");
  });

} catch (error) {
  failed++;
  console.error("\nFATAL TEST ERROR:", error);
} finally {
  console.log("\n--- TEST RESULTS ---");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(failed === 0 ? "ALL TESTS PASSED" : "SOME TESTS FAILED");

  db.close();

  if (failed > 0) {
    process.exitCode = 1;
  }
}
