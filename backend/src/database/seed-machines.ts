// A seed script inserts development/test records into your database
import { db } from "./connection.js";

const seedMachines = db.transaction(() => {
  // 1. Create a sample category
  const categoryResult = db.prepare(`
    INSERT INTO machine_categories (name, description)
    VALUES (?, ?)
  `).run(
    "Beverage Vending Machines",
    "Sample category for development testing"
  );

  const categoryId = Number(categoryResult.lastInsertRowid);

  // 2. Create two sample machine models
  const insertMachine = db.prepare(`
    INSERT INTO machine_models (
      category_id,
      name,
      model_number,
      slug,
      description,
      specifications,
      base_price_paisa,
      currency,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'NPR', 1)
  `);

  const machine1 = insertMachine.run(
    categoryId,
    "Sample Beverage Machine A",
    "TEST-BEV-001",
    "sample-beverage-machine-a",
    "Development sample machine. Not a real product.",
    JSON.stringify({
      capacity: "300 items",
      type: "Beverage",
      power: "220V",
    }),
    25000000
  );

  const machine2 = insertMachine.run(
    categoryId,
    "Sample Beverage Machine B",
    "TEST-BEV-002",
    "sample-beverage-machine-b",
    "Development sample machine. Not a real product.",
    JSON.stringify({
      capacity: "400 items",
      type: "Beverage",
      power: "220V",
    }),
    35000000
  );

  // 3. Add placeholder primary images
  const insertImage = db.prepare(`
    INSERT INTO machine_images (
      machine_model_id,
      image_path,
      is_primary,
      display_order
    )
    VALUES (?, ?, 1, 0)
  `);

  insertImage.run(
    Number(machine1.lastInsertRowid),
    "/uploads/machines/sample-beverage-machine-a.jpg"
  );

  insertImage.run(
    Number(machine2.lastInsertRowid),
    "/uploads/machines/sample-beverage-machine-b.jpg"
  );
});

try {
  seedMachines();

  console.log("Sample machine data inserted successfully.");
} catch (error) {
  console.error("Failed to insert sample machine data:", error);
  process.exitCode = 1;
} finally {
  db.close();
}
