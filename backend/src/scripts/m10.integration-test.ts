
import { db } from "../database/connection.js";

import {
  createWarehouse,
  addMachineToInventory,
  reserveOrderInventory,
  releaseOrderInventory,
} from "../services/inventory.service.js";

import {
  createDelivery,
  assignDeliveryItems,
  updateDeliverySchedule,
  dispatchDelivery,
  markDeliveryItemDelivered,
  getDeliveries,
  getDeliveryById,
} from "../services/delivery.service.js";

import {
  createInstallation,
  assignInstallationItems,
  updateInstallationSchedule,
  startInstallation,
  completeInstallation,
  getInstallations,
  getInstallationById,
} from "../services/installation.service.js";

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function expectEqual(actual: unknown, expected: unknown, message: string) {
  assert(
    actual === expected,
    `${message}. Expected ${expected}, received ${actual}`,
  );
}

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

function expectFailure(result: any, code: string, message: string) {
  assert(result.success === false, `${message}: expected failure`);
  expectEqual(result.code, code, message);
}

try {
  console.log("\n--- MUNCHMATE M10 DELIVERY + INSTALLATION TEST ---\n");

  // --------------------------------------------------
  // 1. TEST FIXTURES
  // --------------------------------------------------

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
    "M10 Test Admin",
    "m10-test-admin@example.com",
    "test-only-password-hash",
  );

  const adminId = Number(adminInsert.lastInsertRowid);

  const categoryInsert = db.prepare(`
    INSERT INTO machine_categories (name, description)
    VALUES (?, ?)
  `).run("M10 Test Category", "M10 integration test");

  const categoryId = Number(categoryInsert.lastInsertRowid);

  const modelInsert = db.prepare(`
    INSERT INTO machine_models (
      category_id, name, model_number, slug, base_price_paisa
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    categoryId,
    "M10 Test Machine",
    "M10-TEST-MODEL",
    "m10-test-machine",
    100000,
  );

  const modelId = Number(modelInsert.lastInsertRowid);

  const warehouseResult = createWarehouse(
    "M10 Test Warehouse",
    "M10 Test Address, Kathmandu",
  );

  assert(warehouseResult.success, "M10 warehouse creation failed");

  const customerInsert = db.prepare(`
    INSERT INTO customers (
      customer_type, name, phone, email
    )
    VALUES ('individual', ?, ?, ?)
  `).run(
    "M10 Test Customer",
    "9800000000",
    "m10-test-customer@example.com",
  );

  const customerId = Number(customerInsert.lastInsertRowid);

  const enquiryInsert = db.prepare(`
    INSERT INTO enquiries (customer_id, enquiry_number)
    VALUES (?, ?)
  `).run(customerId, "M10-TEST-ENQUIRY-001");

  const enquiryId = Number(enquiryInsert.lastInsertRowid);

  const quotationInsert = db.prepare(`
    INSERT INTO quotations (
      enquiry_id,
      quotation_number,
      version_number,
      subtotal_paisa,
      discount_paisa,
      tax_amount_paisa,
      total_amount_paisa,
      created_by
    )
    VALUES (?, ?, 1, 300000, 0, 0, 300000, ?)
  `).run(enquiryId, "M10-TEST-QUOTATION-001", adminId);

  const quotationId = Number(quotationInsert.lastInsertRowid);

  const quoteItemInsert = db.prepare(`
    INSERT INTO quotation_items (
      quotation_id,
      machine_model_id,
      description,
      quantity,
      unit_price_paisa,
      line_total_paisa
    )
    VALUES (?, ?, ?, 3, 100000, 300000)
  `).run(quotationId, modelId, "M10 Test Machine");

  const orderInsert = db.prepare(`
    INSERT INTO orders (
      customer_id,
      quotation_id,
      order_number,
      payment_status,
      subtotal_paisa,
      total_amount_paisa
    )
    VALUES (?, ?, ?, 'paid', 300000, 300000)
  `).run(customerId, quotationId, "M10-TEST-ORDER-001");

  const orderId = Number(orderInsert.lastInsertRowid);

  db.prepare(`
    INSERT INTO order_items (
      order_id,
      quotation_item_id,
      machine_model_id,
      description,
      quantity,
      unit_price_paisa,
      line_total_paisa
    )
    VALUES (?, ?, ?, ?, 3, 100000, 300000)
  `).run(
    orderId,
    quoteItemInsert.lastInsertRowid,
    modelId,
    "M10 Test Machine",
  );

  // Register three physical machines.
  for (let i = 1; i <= 3; i++) {
    const result = addMachineToInventory(
      modelId,
      `M10-TEST-SERIAL-${i}`,
      undefined,
      adminId,
    );

    assert(result.success, `Machine ${i} registration failed`);
  }

  // Reserve all three machines for the paid order.
  const reservationResult = reserveOrderInventory(orderId, adminId);

  assert(
    reservationResult.success &&
      reservationResult.code === "RESERVED",
    "Could not reserve all three test machines",
  );

  const reservations = db.prepare(`
    SELECT id
    FROM inventory_reservations
    WHERE order_id = ? AND status = 'active'
    ORDER BY id ASC
  `).all(orderId) as Array<{ id: number }>;

  expectEqual(reservations.length, 3, "Initial reservation count");

  const reservationIds = reservations.map((item) => item.id);

  const futureSchedule = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ).toISOString();

  console.log("Test fixtures created successfully.\n");

  // --------------------------------------------------
  // 2. DELIVERY CREATION
  // --------------------------------------------------

  const delivery1 = createDelivery({
    order_id: orderId,
    address_line: "Test Street 1",
    city: "Kathmandu",
    country: "Nepal",
    notes: "First test shipment",
  });

  assert(delivery1.success, "First delivery creation failed");
  
  if (!delivery1.success) {
    throw new Error(`Delivery 1 creation failed: ${delivery1.code}`);
  }

  const delivery1Id = delivery1.deliveryId;

  test("Create first delivery", () => {
    assert(delivery1.success, "First delivery should be created");
  });

  const delivery1Items = assignDeliveryItems(delivery1Id, {
    reservation_ids: reservationIds.slice(0, 2),
  });

  test("Assign two machines to first delivery", () => {
    assert(delivery1Items.success, "First delivery assignment failed");
  });

  const delivery2 = createDelivery({
    order_id: orderId,
    address_line: "Test Street 2",
    city: "Lalitpur",
    country: "Nepal",
    notes: "Second test shipment",
  });

  assert(delivery2.success, "Second delivery creation failed");

  if (!delivery2.success) {
    throw new Error(`Delivery 2 creation failed: ${delivery2.code}`);
  }
  
  const delivery2Id = delivery2.deliveryId;

  test("Create second delivery for the same order", () => {
    assert(delivery2.success, "Second delivery should be created");
  });

  const delivery2Items = assignDeliveryItems(delivery2Id, {
    reservation_ids: [reservationIds[2]],
  });

  test("Assign remaining machine to second delivery", () => {
    assert(delivery2Items.success, "Second delivery assignment failed");
  });

  test("Reject assigning an already assigned reservation", () => {
    const result = assignDeliveryItems(delivery2Id, {
      reservation_ids: [reservationIds[0]],
    });

    expectFailure(
      result,
      "RESERVATIONS_ALREADY_ASSIGNED",
      "Already assigned reservation",
    );
  });

  test("Reject an invalid reservation ID", () => {
    const result = assignDeliveryItems(delivery1Id, {
      reservation_ids: [999999],
    });

    expectFailure(result, "INVALID_RESERVATIONS", "Invalid reservation");
  });

  test("Reject duplicate reservation IDs in one request", () => {
    const result = assignDeliveryItems(delivery1Id, {
      reservation_ids: [reservationIds[0], reservationIds[0]],
    });

    expectFailure(
      result,
      "INVALID_RESERVATIONS",
      "Duplicate reservation IDs",
    );
  });

  test("Reject releasing inventory already assigned to deliveries", () => {
    const result = releaseOrderInventory(orderId, adminId);

    expectFailure(
      result,
      "RESERVATIONS_ASSIGNED_TO_DELIVERY",
      "Release assigned inventory",
    );
  });

  // --------------------------------------------------
  // 3. DELIVERY SCHEDULING
  // --------------------------------------------------

  const scheduleResult = updateDeliverySchedule(delivery1Id, {
    scheduled_at: futureSchedule,
    tracking_reference: "M10-TRACK-001",
  });

  test("Schedule first delivery", () => {
    assert(scheduleResult.success, "Delivery scheduling failed");
  });

  // --------------------------------------------------
  // 4. DISPATCH PROTECTION
  // --------------------------------------------------

  test("Reject dispatching a delivery with no items", () => {
    // A third delivery cannot be created because all reservations
    // are assigned. Test the empty-items guard using an empty test
    // delivery record with the same order.
    const emptyDeliveryInsert = db.prepare(`
      INSERT INTO deliveries (
        order_id, delivery_number, address_line, city, country
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      orderId,
      "M10-EMPTY-DELIVERY",
      "Empty Test Address",
      "Kathmandu",
      "Nepal",
    );

    const result = dispatchDelivery(
      Number(emptyDeliveryInsert.lastInsertRowid),
      adminId,
    );

    expectFailure(
      result,
      "DELIVERY_HAS_NO_ITEMS",
      "Empty delivery dispatch",
    );
  });

  test("Reject dispatch when the order is cancelled", () => {
    db.prepare(`
      UPDATE orders SET status = 'cancelled' WHERE id = ?
    `).run(orderId);

    const result = dispatchDelivery(delivery1Id, adminId);

    db.prepare(`
      UPDATE orders SET status = 'confirmed' WHERE id = ?
    `).run(orderId);

    expectFailure(
      result,
      "ORDER_NOT_ELIGIBLE",
      "Cancelled order dispatch",
    );
  });

  // --------------------------------------------------
  // 5. FIRST DELIVERY DISPATCH
  // --------------------------------------------------

  const dispatch1 = dispatchDelivery(delivery1Id, adminId);

  test("Dispatch first delivery", () => {
    assert(dispatch1.success, "First delivery dispatch failed");
  });

  test("First two reservations become fulfilled", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_reservations
      WHERE id IN (?, ?)
        AND status = 'fulfilled'
    `).get(
      reservationIds[0],
      reservationIds[1],
    ) as { count: number };

    expectEqual(result.count, 2, "Fulfilled reservations");
  });

  test("First two machines become dispatched", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM machine_inventory
      WHERE id IN (
        SELECT machine_inventory_id
        FROM inventory_reservations
        WHERE id IN (?, ?)
      )
      AND status = 'dispatched'
    `).get(
      reservationIds[0],
      reservationIds[1],
    ) as { count: number };

    expectEqual(result.count, 2, "Dispatched machines");
  });

  test("Dispatch creates movement history with Admin ID", () => {
    const result = db.prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_movements
      WHERE movement_type = 'dispatched'
        AND reference_type = 'delivery'
        AND reference_id = ?
        AND created_by = ?
    `).get(delivery1Id, adminId) as { count: number };

    expectEqual(result.count, 2, "Dispatch movement count");
  });

  test("Order becomes partially_dispatched", () => {
    const order = db.prepare(`
      SELECT fulfillment_status
      FROM orders
      WHERE id = ?
    `).get(orderId) as { fulfillment_status: string };

    expectEqual(
      order.fulfillment_status,
      "partially_dispatched",
      "Order fulfillment status",
    );
  });

  // --------------------------------------------------
  // 6. PARTIAL DELIVERY
  // --------------------------------------------------

  const firstDeliveryItems = db.prepare(`
    SELECT id
    FROM delivery_items
    WHERE delivery_id = ?
    ORDER BY id ASC
  `).all(delivery1Id) as Array<{ id: number }>;

  expectEqual(firstDeliveryItems.length, 2, "First delivery item count");

  const firstDelivered = markDeliveryItemDelivered(
    firstDeliveryItems[0].id,
  );

  test("Mark first machine delivered", () => {
    assert(firstDelivered.success, "First item delivery failed");
  });

  test("First delivery becomes partially_delivered", () => {
    const delivery = db.prepare(`
      SELECT status FROM deliveries WHERE id = ?
    `).get(delivery1Id) as { status: string };

    expectEqual(
      delivery.status,
      "partially_delivered",
      "First delivery status",
    );
  });

  test("Order becomes partially_delivered", () => {
    const order = db.prepare(`
      SELECT fulfillment_status FROM orders WHERE id = ?
    `).get(orderId) as { fulfillment_status: string };

    expectEqual(
      order.fulfillment_status,
      "partially_delivered",
      "Order fulfillment status",
    );
  });

  // --------------------------------------------------
  // 7. SECOND DELIVERY DISPATCH
  // --------------------------------------------------

  const dispatch2 = dispatchDelivery(delivery2Id, adminId);

  test("Dispatch second delivery", () => {
    assert(dispatch2.success, "Second delivery dispatch failed");
  });

  test("Dispatching second delivery does not regress order status", () => {
    const order = db.prepare(`
      SELECT fulfillment_status FROM orders WHERE id = ?
    `).get(orderId) as { fulfillment_status: string };

    expectEqual(
      order.fulfillment_status,
      "partially_delivered",
      "Order must remain partially_delivered",
    );
  });

  // --------------------------------------------------
  // 8. COMPLETE BOTH DELIVERIES
  // --------------------------------------------------

  const secondFirstDelivery = markDeliveryItemDelivered(
    firstDeliveryItems[1].id,
  );

  test("Deliver remaining machine in first delivery", () => {
    assert(secondFirstDelivery.success, "Second item delivery failed");
  });

  test("First delivery becomes delivered", () => {
    const delivery = db.prepare(`
      SELECT status, delivered_at
      FROM deliveries
      WHERE id = ?
    `).get(delivery1Id) as {
      status: string;
      delivered_at: string | null;
    };

    expectEqual(delivery.status, "delivered", "First delivery status");
    assert(delivery.delivered_at !== null, "Delivery timestamp missing");
  });

  const secondDeliveryItem = db.prepare(`
    SELECT id
    FROM delivery_items
    WHERE delivery_id = ?
  `).get(delivery2Id) as { id: number };

  const finalDelivered = markDeliveryItemDelivered(
    secondDeliveryItem.id,
  );

  test("Deliver machine in second delivery", () => {
    assert(finalDelivered.success, "Final item delivery failed");
  });

  test("Second delivery becomes delivered", () => {
    const delivery = db.prepare(`
      SELECT status, delivered_at
      FROM deliveries
      WHERE id = ?
    `).get(delivery2Id) as {
      status: string;
      delivered_at: string | null;
    };

    expectEqual(delivery.status, "delivered", "Second delivery status");
    assert(delivery.delivered_at !== null, "Delivery timestamp missing");
  });

  test("Order becomes fully delivered", () => {
    const order = db.prepare(`
      SELECT fulfillment_status
      FROM orders
      WHERE id = ?
    `).get(orderId) as { fulfillment_status: string };

    expectEqual(
      order.fulfillment_status,
      "delivered",
      "Order fulfillment status",
    );
  });

  // --------------------------------------------------
  // 9. DELIVERY READ OPERATIONS
  // --------------------------------------------------

  test("List deliveries", () => {
    const result = getDeliveries();
    assert(Array.isArray(result), "Delivery list should be an array");
    assert(
      result.some((item: any) => item.id === delivery1Id),
      "First delivery missing from list",
    );
    assert(
      result.some((item: any) => item.id === delivery2Id),
      "Second delivery missing from list",
    );
  });

  test("Get delivery details", () => {
    const result = getDeliveryById(delivery1Id);
    assert(result !== null && result !== undefined, "Delivery details missing");
  });

  // --------------------------------------------------
  // 10. INSTALLATION
  // --------------------------------------------------

  // Create the installation after the first delivery is complete.
  // The second delivery has also now been completed.
  const installation = createInstallation({
    order_id: orderId,
    assigned_to: adminId,
    notes: "M10 test installation",
  });

  assert(installation.success, "Installation creation failed");

  if (!installation.success) {
    throw new Error(`Installation creation failed: ${installation.code}`);
  }
  
  const installationId = installation.installationId;

  test("Create installation for delivered order", () => {
    assert(installation.success, "Installation should be created");
  });

  test("Reject invalid installation reservation", () => {
    const result = assignInstallationItems(installationId, {
      reservation_ids: [999999],
    });

    expectFailure(
      result,
      "INVALID_RESERVATIONS",
      "Invalid installation reservation",
    );
  });

  const installationAssignment = assignInstallationItems(
    installationId,
    {
      reservation_ids: reservationIds,
    },
  );

  test("Assign all three delivered machines to installation", () => {
    assert(
      installationAssignment.success,
      "Installation item assignment failed",
    );
    
    if (!installationAssignment.success) {
        throw new Error(
            `Installation item assignment failed: ${installationAssignment.code}`,
        );
    }

    expectEqual(
      installationAssignment.assignedCount,
      3,
      "Installation assigned count",
    );
  });

  test("Reject assigning the same installation items twice", () => {
    const result = assignInstallationItems(installationId, {
      reservation_ids: reservationIds,
    });

    expectFailure(
      result,
      "RESERVATIONS_ALREADY_ASSIGNED",
      "Duplicate installation assignment",
    );
  });

  // --------------------------------------------------
  // 11. INSTALLATION SCHEDULING AND STATUS
  // --------------------------------------------------

  const installationSchedule = updateInstallationSchedule(
    installationId,
    {
      scheduled_at: futureSchedule,
      assigned_to: adminId,
    },
  );

  test("Schedule installation", () => {
    assert(
      installationSchedule.success,
      "Installation scheduling failed",
    );
  });

  const startResult = startInstallation(installationId);

  test("Start installation", () => {
    assert(startResult.success, "Installation start failed");
  });

  test("Installation status becomes in_progress", () => {
    const result = db.prepare(`
      SELECT status FROM installations WHERE id = ?
    `).get(installationId) as { status: string };

    expectEqual(result.status, "in_progress", "Installation status");
  });

  const completeResult = completeInstallation(installationId);

  test("Complete installation", () => {
    assert(completeResult.success, "Installation completion failed");
  });

  test("Installation status becomes completed", () => {
    const result = db.prepare(`
      SELECT status, completed_at
      FROM installations
      WHERE id = ?
    `).get(installationId) as {
      status: string;
      completed_at: string | null;
    };

    expectEqual(result.status, "completed", "Installation status");
    assert(result.completed_at !== null, "Completion timestamp missing");
  });

  // --------------------------------------------------
  // 12. INSTALLATION READ OPERATIONS
  // --------------------------------------------------

  test("List installations", () => {
    const result = getInstallations();

    assert(Array.isArray(result), "Installation list should be an array");
    assert(
      result.some((item: any) => item.id === installationId),
      "Installation missing from list",
    );
  });

  test("Get installation details", () => {
    const result = getInstallationById(installationId);

    assert(
      result !== null && result !== undefined,
      "Installation details missing",
    );
  });

  // --------------------------------------------------
  // 13. FOREIGN KEY INTEGRITY
  // --------------------------------------------------

  test("Database foreign-key integrity", () => {
    const errors = db.pragma("foreign_key_check") as unknown[];

    expectEqual(errors.length, 0, "Foreign-key errors");
  });

} catch (error) {
  failed++;
  console.error("\nFATAL TEST ERROR:", error);
} finally {
  console.log("\n--- M10 TEST RESULTS ---");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(failed === 0 ? "ALL TESTS PASSED" : "SOME TESTS FAILED");

  db.close();

  if (failed > 0) {
    process.exitCode = 1;
  }
}
