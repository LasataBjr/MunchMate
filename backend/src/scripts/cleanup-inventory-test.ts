import { db } from "../database/connection.js";

const cleanup = db.transaction(() => {
  // Safety checks: confirm that the expected test records exist.
  const testOrder = db.prepare(`
    SELECT id FROM orders
    WHERE order_number = 'TEST-INV-ORDER-001'
  `).get() as { id: number } | undefined;

  const testMachines = db.prepare(`
    SELECT id FROM machine_inventory
    WHERE serial_number LIKE 'TEST-SERIAL-%'
  `).all() as { id: number }[];

  const testWarehouse = db.prepare(`
    SELECT id FROM warehouses
    WHERE name = 'MunchMate Test Warehouse'
  `).get();

  if (!testOrder || testMachines.length !== 3 || !testWarehouse) {
    throw new Error(
      "Safety check failed. No records were deleted."
    );
  }

  const orderId = testOrder.id;

  // 1. Remove reservations and movement history.
  db.prepare(`
    DELETE FROM inventory_reservations
    WHERE order_id = ?
  `).run(orderId);

  db.prepare(`
    DELETE FROM inventory_movements
    WHERE machine_inventory_id IN (
      SELECT id FROM machine_inventory
      WHERE serial_number LIKE 'TEST-SERIAL-%'
    )
  `).run();

  // 2. Remove inventory machines.
  db.prepare(`
    DELETE FROM machine_inventory
    WHERE serial_number LIKE 'TEST-SERIAL-%'
  `).run();

  // 3. Remove order and its items.
  db.prepare(`
    DELETE FROM order_items WHERE order_id = ?
  `).run(orderId);

  db.prepare(`
    DELETE FROM orders WHERE id = ?
  `).run(orderId);

  // 4. Remove quotation and enquiry records.
  db.prepare(`
    DELETE FROM quotation_items
    WHERE quotation_id IN (
      SELECT id FROM quotations
      WHERE quotation_number = 'TEST-INV-QUOTATION-001'
    )
  `).run();

  db.prepare(`
    DELETE FROM quotations
    WHERE quotation_number = 'TEST-INV-QUOTATION-001'
  `).run();

  db.prepare(`
    DELETE FROM enquiries
    WHERE enquiry_number = 'TEST-INV-ENQUIRY-001'
  `).run();

  // 5. Remove test customer.
  db.prepare(`
    DELETE FROM customers
    WHERE email = 'inventory-test-customer@example.com'
  `).run();

  // 6. Remove test machine models and category.
  db.prepare(`
    DELETE FROM machine_models
    WHERE model_number IN ('TEST-MODEL-A', 'TEST-MODEL-B')
  `).run();

  db.prepare(`
    DELETE FROM machine_categories
    WHERE name = 'Inventory Test Category'
  `).run();

  // 7. Remove test Admin user.
  db.prepare(`
    DELETE FROM users
    WHERE email = 'inventory-test-admin@example.com'
  `).run();

  // 8. Remove test warehouse.
  db.prepare(`
    DELETE FROM warehouses
    WHERE name = 'MunchMate Test Warehouse'
  `).run();

  // Final integrity check.
  const foreignKeyErrors = db.pragma(
    "foreign_key_check"
  ) as unknown[];

  if (foreignKeyErrors.length > 0) {
    throw new Error("Foreign-key integrity check failed.");
  }
});

try {
  cleanup();

  console.log("Inventory test cleanup completed successfully.");
  console.log("Foreign-key integrity: PASS");
} catch (error) {
  console.error("Cleanup failed. Transaction was rolled back.");
  console.error(error);
  process.exitCode = 1;
} finally {
  db.close();
}