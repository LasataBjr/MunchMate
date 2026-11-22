//Handles database operations and business rules
import { randomBytes } from "node:crypto";
import { db } from "../database/connection.js";
import type { CreateEnquiryInput } from "../validators/enquiry.validator.js";
import type { UpdateEnquiryStatusInput } from "../validators/enquiry-status.validator.js";

// Generates a unique enquiry reference.
function generateEnquiryNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = randomBytes(4).toString("hex").toUpperCase();

  return `ENQ-${date}-${random}`;
}

// Creates a customer, enquiry and all enquiry items in one transaction.
export function createEnquiry(input: CreateEnquiryInput, customerId: number) {
  const createEnquiryTransaction = db.transaction(
    (data: CreateEnquiryInput) => {
      // Check that every requested machine exists and is active.
      const findMachine = db.prepare(`SELECT id FROM machine_models WHERE id = ? AND is_active = 1`);

      for (const item of data.items) {
        const machine = findMachine.get(item.machine_model_id);

        if (!machine) {
          throw new Error("MACHINE_NOT_AVAILABLE");
        }
      }

      // Generate the enquiry number.
      const enquiryNumber = generateEnquiryNumber();

      // Create the main enquiry record.
      const enquiryResult = db.prepare(`INSERT INTO enquiries (customer_id, enquiry_number, message) VALUES (?, ?, ?)`).run(
        customerId,
        enquiryNumber,
        data.message ?? null
      );

      const enquiryId = Number(enquiryResult.lastInsertRowid);

      // Save all requested machine items
      const insertItem = db.prepare(`
        INSERT INTO enquiry_items (
          enquiry_id,
          machine_model_id,
          quantity,
          notes
        )
        VALUES (?, ?, ?, ?)
      `);

      for (const item of data.items) {
        insertItem.run(
          enquiryId,
          item.machine_model_id,
          item.quantity,
          item.notes ?? null
        );
      }

      // Return the completed enquiry
      const enquiry = db.prepare(`
        SELECT
          e.id,
          e.enquiry_number,
          e.status,
          e.message,
          e.created_at,
          c.id AS customer_id,
          c.customer_type,
          c.name AS customer_name,
          c.company_name,
          c.email,
          c.phone
        FROM enquiries AS e
        INNER JOIN customers AS c
          ON c.id = e.customer_id
        WHERE e.id = ?
      `).get(enquiryId) as Record<string, unknown>;

      const items = db.prepare(`
        SELECT
          ei.id,
          ei.machine_model_id,
          mm.name AS machine_name,
          mm.model_number,
          ei.quantity,
          ei.notes
        FROM enquiry_items AS ei
        INNER JOIN machine_models AS mm
          ON mm.id = ei.machine_model_id
        WHERE ei.enquiry_id = ?
        ORDER BY ei.id ASC
      `).all(enquiryId);

      return { ...enquiry, items,};
    }
  );

  // If any operation fails, SQLite rolls back the entire transaction.
  return createEnquiryTransaction(input);
}

// Returns the latest enquiries with customer details and item counts.
export function getEnquiries() {
  return db.prepare(`
    SELECT
      e.id,
      e.enquiry_number,
      e.status,
      e.message,
      e.created_at,
      c.name AS customer_name,
      c.company_name,
      c.email,
      c.phone,
      COUNT(ei.id) AS total_items
    FROM enquiries AS e
    INNER JOIN customers AS c
      ON c.id = e.customer_id
    LEFT JOIN enquiry_items AS ei
      ON ei.enquiry_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC, e.id DESC
    LIMIT 50
  `).all();
}

// Returns one enquiry with its customer and requested machines.
export function getEnquiryById(id: number) {
  // Get the enquiry and customer details.
  const enquiry = db.prepare(`
    SELECT
      e.id,
      e.enquiry_number,
      e.status,
      e.message,
      e.created_at,
      e.updated_at,
      c.id AS customer_id,
      c.customer_type,
      c.name AS customer_name,
      c.company_name,
      c.email,
      c.phone
    FROM enquiries AS e
    INNER JOIN customers AS c
      ON c.id = e.customer_id
    WHERE e.id = ?
  `).get(id);

  // Return null if the enquiry does not exist.
  if (!enquiry) {
    return null;
  }

  // Get all requested machines.
  const items = db.prepare(`
    SELECT
      ei.id,
      ei.machine_model_id,
      mm.name AS machine_name,
      mm.model_number,
      ei.quantity,
      ei.notes
    FROM enquiry_items AS ei
    INNER JOIN machine_models AS mm
      ON mm.id = ei.machine_model_id
    WHERE ei.enquiry_id = ?
    ORDER BY ei.id ASC
  `).all(id);

  return {
    ...enquiry,
    items,
  };
}


// Returns one enquiry only if it belongs to the specified customer.
export function getMyEnquiryById(id: number, customerId: number) {
  const enquiry = db.prepare(`
    SELECT
      e.id,
      e.enquiry_number,
      e.status,
      e.message,
      e.created_at,
      e.updated_at
    FROM enquiries AS e
    WHERE e.id = ? AND e.customer_id = ?
  `).get(id, customerId);

  if (!enquiry) {
    return null;
  }

  const items = db.prepare(`
    SELECT
      ei.id,
      ei.machine_model_id,
      mm.name AS machine_name,
      mm.model_number,
      ei.quantity,
      ei.notes
    FROM enquiry_items AS ei
    INNER JOIN machine_models AS mm
      ON mm.id = ei.machine_model_id
    WHERE ei.enquiry_id = ?
    ORDER BY ei.id ASC
  `).all(id);

  return {
    ...enquiry,
    items,
  };
}


// Updates the status of an existing enquiry.
export function updateEnquiryStatus(id: number, input: UpdateEnquiryStatusInput) {
  // Check whether the enquiry exists.
  const existingEnquiry = db.prepare(`SELECT id FROM enquiries WHERE id = ?`).get(id);

  if (!existingEnquiry) {
    return null;
  }

  // Update the enquiry status.
  db.prepare(`UPDATE enquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(input.status, id);

  // Return the updated enquiry.
  return db.prepare(`
    SELECT
      id,
      enquiry_number,
      status,
      message,
      created_at,
      updated_at
    FROM enquiries
    WHERE id = ?
  `).get(id);
}


// Returns enquiries belonging only to the specified customer
export function getMyEnquiries(customerId: number) {
  return db.prepare(`
    SELECT
      e.id,
      e.enquiry_number,
      e.status,
      e.message,
      e.created_at,
      COUNT(ei.id) AS total_items
    FROM enquiries AS e
    LEFT JOIN enquiry_items AS ei
      ON ei.enquiry_id = e.id
    WHERE e.customer_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC, e.id DESC
    LIMIT 50
  `).all(customerId);
}
