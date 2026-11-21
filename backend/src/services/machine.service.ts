
import { db } from "../database/connection.js";
import type { CreateMachineInput, UpdateMachineInput, } from "../validators/machine.validator.js";

// 
export interface MachineCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export function getMachineCategories(): MachineCategory[] {
  return db.prepare(`
    SELECT
      id,
      name,
      description,
      created_at
    FROM machine_categories
    ORDER BY name ASC
  `).all() as MachineCategory[];
}


export interface Machine {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  model_number: string;
  slug: string;
  description: string | null;
  specifications: string | null;
  price_npr: number;
  currency: string;
  primary_image: string | null;
}

// INNER JOIN: Every machine must have a valid category.
// LEFT JOIN: A machine can exist without a primary image.
export function getActiveMachines(): Machine[] {
  return db.prepare(`
    SELECT
      m.id,
      m.category_id,
      c.name AS category_name,
      m.name,
      m.model_number,
      m.slug,
      m.description,
      m.specifications,
      m.base_price_paisa / 100.0 AS price_npr,
      m.currency,
      mi.image_path AS primary_image
    FROM machine_models AS m
    INNER JOIN machine_categories AS c
      ON c.id = m.category_id
    LEFT JOIN machine_images AS mi
      ON mi.machine_model_id = m.id
      AND mi.is_primary = 1
    WHERE m.is_active = 1
    ORDER BY m.created_at DESC
  `).all() as Machine[];
}

// Provides details of a specific machine by its ID, including its associated category information.
export function getMachineById(id: number): Machine | undefined {
  return db.prepare(`
    SELECT
      m.id,
      m.category_id,
      c.name AS category_name,
      m.name,
      m.model_number,
      m.slug,
      m.description,
      m.specifications,
      m.base_price_paisa / 100.0 AS price_npr,
      m.currency,
      mi.image_path AS primary_image
    FROM machine_models AS m
    INNER JOIN machine_categories AS c
      ON c.id = m.category_id
    LEFT JOIN machine_images AS mi
      ON mi.machine_model_id = m.id
      AND mi.is_primary = 1
    WHERE m.id = ?
      AND m.is_active = 1
  `).get(id) as Machine | undefined;
}

// Creates a new machine entry in the database and returns the newly created machine's details
export function createMachine(input: CreateMachineInput) {
  // Check that the selected category exists
  const category = db.prepare(`
    SELECT id FROM machine_categories WHERE id = ?
  `).get(input.category_id);

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  // Insert the machine
  const result = db.prepare(`
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
  `).run(
    input.category_id,
    input.name,
    input.model_number,
    input.slug,
    input.description ?? null,
    input.specifications ?? null,
    input.base_price_paisa
  );

  // Return the newly created machine
  return db.prepare(`
    SELECT
      m.id,
      m.category_id,
      c.name AS category_name,
      m.name,
      m.model_number,
      m.slug,
      m.description,
      m.specifications,
      m.base_price_paisa / 100.0 AS price_npr,
      m.currency,
      m.is_active,
      m.created_at
    FROM machine_models AS m
    INNER JOIN machine_categories AS c
      ON c.id = m.category_id
    WHERE m.id = ?
  `).get(Number(result.lastInsertRowid));
}

// Updates an existing machine and returns its latest details.
export function updateMachine(id: number, input: UpdateMachineInput) {
  // Check that the machine exists, including inactive machines.
  const existingMachine = db.prepare(`
    SELECT id
    FROM machine_models
    WHERE id = ?
  `).get(id);

  if (!existingMachine) {
    throw new Error("MACHINE_NOT_FOUND");
  }

  // Check that the selected category exists.
  const category = db.prepare(`
    SELECT id
    FROM machine_categories
    WHERE id = ?
  `).get(input.category_id);

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  // Update the machine details.
  db.prepare(`
    UPDATE machine_models
    SET
      category_id = ?,
      name = ?,
      model_number = ?,
      slug = ?,
      description = ?,
      specifications = ?,
      base_price_paisa = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    input.category_id,
    input.name,
    input.model_number,
    input.slug,
    input.description ?? null,
    input.specifications ?? null,
    input.base_price_paisa,
    id
  );

  // Return the updated machine.
  return db.prepare(`
    SELECT
      m.id,
      m.category_id,
      c.name AS category_name,
      m.name,
      m.model_number,
      m.slug,
      m.description,
      m.specifications,
      m.base_price_paisa / 100.0 AS price_npr,
      m.currency,
      m.is_active,
      m.created_at,
      m.updated_at
    FROM machine_models AS m
    INNER JOIN machine_categories AS c
      ON c.id = m.category_id
    WHERE m.id = ?
  `).get(id);
}

// Activates or deactivates an existing machine.
export function updateMachineStatus(id: number, isActive: boolean) {
  // Check whether the machine exists.
  const existingMachine = db.prepare(`SELECT id FROM machine_models WHERE id = ?`).get(id);
  if (!existingMachine) {
    throw new Error("MACHINE_NOT_FOUND");
  }

  // Update machine status.
  db.prepare(`UPDATE machine_models SET
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(isActive ? 1 : 0, id);

  // Return updated machine details
  return db.prepare(`
    SELECT
      m.id,
      m.category_id,
      c.name AS category_name,
      m.name,
      m.model_number,
      m.slug,
      m.description,
      m.specifications,
      m.base_price_paisa / 100.0 AS price_npr,
      m.currency,
      m.is_active,
      m.created_at,
      m.updated_at
    FROM machine_models AS m
    INNER JOIN machine_categories AS c
      ON m.category_id = c.id
    WHERE m.id = ?
  `).get(id);
}
