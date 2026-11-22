
import { randomBytes } from "node:crypto";
import { db } from "../database/connection.js";
import type { CreateQuotationInput, UpdateQuotationInput, } from "../validators/quotation.validator.js";
import type { UpdateQuotationStatusInput } from "../validators/quotation-status.validator.js";

export class QuotationServiceError extends Error {
  constructor(
    public code:
      | "ENQUIRY_NOT_FOUND"
      | "MACHINE_UNAVAILABLE"
      | "INVALID_DISCOUNT"
      | "INVALID_AMOUNT"
      | "QUOTATION_NOT_FOUND"
      | "QUOTATION_NOT_EDITABLE"
      | "INVALID_STATUS_TRANSITION",
    message: string
  ) {
    super(message);
    this.name = "QuotationServiceError";
  }
}

// Generate a unique quotation reference.
function generateQuotationNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const suffix = randomBytes(4).toString("hex").toUpperCase();

  return `QUO-${date}-${suffix}`;
}

// Create a quotation and all its items atomically.
export function createQuotation(
  input: CreateQuotationInput,
  createdBy: number
) {
  const createTransaction = db.transaction(() => {
    // Verify the enquiry exists.
    const enquiry = db.prepare(`
      SELECT id
      FROM enquiries
      WHERE id = ?
    `).get(input.enquiry_id);

    if (!enquiry) {
      throw new QuotationServiceError(
        "ENQUIRY_NOT_FOUND",
        "The selected enquiry does not exist"
      );
    }

    // Calculate all quotation line totals and subtotal.
    let subtotalPaisa = 0;

    const preparedItems = input.items.map((item) => {
      const machine = db.prepare(`SELECT id, name, model_number, is_active FROM machine_models
        WHERE id = ?`).get(item.machine_model_id) as
        | {
            id: number;
            name: string;
            model_number: string;
            is_active: number;
          }
        | undefined;

      if (!machine || machine.is_active !== 1) {
        throw new QuotationServiceError(
          "MACHINE_UNAVAILABLE",
          `Machine model ${item.machine_model_id} does not exist or is inactive`
        );
      }

      const lineTotalPaisa = item.quantity * item.unit_price_paisa;

      if (!Number.isSafeInteger(lineTotalPaisa)) {
        throw new QuotationServiceError(
          "INVALID_AMOUNT",
          "A quotation item total is too large"
        );
      }

      subtotalPaisa += lineTotalPaisa;

      if (!Number.isSafeInteger(subtotalPaisa)) {
        throw new QuotationServiceError(
          "INVALID_AMOUNT",
          "The quotation subtotal is too large"
        );
      }

      return {
        machine_model_id: machine.id,
        description:
          item.description ?? `${machine.name} (${machine.model_number})`,
        quantity: item.quantity,
        unit_price_paisa: item.unit_price_paisa,
        line_total_paisa: lineTotalPaisa,
      };
    });

    // Calculate the quotation's final amount.
    const discountPaisa = input.discount_paisa;
    const taxAmountPaisa = input.tax_amount_paisa;

    if (discountPaisa > subtotalPaisa) {
      throw new QuotationServiceError(
        "INVALID_DISCOUNT",
        "Discount cannot exceed the quotation subtotal"
      );
    }

    const totalAmountPaisa =
      subtotalPaisa - discountPaisa + taxAmountPaisa;

    if (!Number.isSafeInteger(totalAmountPaisa)) {
      throw new QuotationServiceError(
        "INVALID_AMOUNT",
        "The quotation total is too large"
      );
    }

    // Generate the next version number
    const versionResult = db.prepare(`SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM quotations
                          WHERE enquiry_id = ?`).get(input.enquiry_id) as { next_version: number };

    const versionNumber = versionResult.next_version;

    // Generate a quotation number
    const quotationNumber = generateQuotationNumber();

    // Insert the quotation.
    const quotationResult = db.prepare(`
      INSERT INTO quotations (
        enquiry_id,
        quotation_number,
        version_number,
        status,
        subtotal_paisa,
        discount_paisa,
        tax_amount_paisa,
        total_amount_paisa,
        valid_until,
        terms,
        created_by
      )
      VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.enquiry_id,
      quotationNumber,
      versionNumber,
      subtotalPaisa,
      discountPaisa,
      taxAmountPaisa,
      totalAmountPaisa,
      input.valid_until ?? null,
      input.terms ?? null,
      createdBy
    );

    const quotationId = Number(quotationResult.lastInsertRowid);

    // Insert every quotation item
    const insertItem = db.prepare(`
      INSERT INTO quotation_items (
        quotation_id,
        machine_model_id,
        description,
        quantity,
        unit_price_paisa,
        line_total_paisa
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of preparedItems) {
      insertItem.run(
        quotationId,
        item.machine_model_id,
        item.description,
        item.quantity,
        item.unit_price_paisa,
        item.line_total_paisa
      );
    }

    // Return the saved quotation and its items
    const quotation = db.prepare(`SELECT * FROM quotations WHERE id = ?`).get(quotationId);

    const items = db.prepare(`
      SELECT *
      FROM quotation_items
      WHERE quotation_id = ?
      ORDER BY id ASC
    `).all(quotationId);

    return {
      ...quotation as object,
      items,
    };
  });

  // better-sqlite3 automatically rolls back if anything fails.
  return createTransaction();
}



// Get the latest quotations for the Admin listing.
export function getQuotations() {
  const quotations = db.prepare(`
    SELECT
      q.*,
      e.enquiry_number,
      e.status AS enquiry_status,
      c.id AS customer_id,
      c.customer_type,
      c.name AS customer_name,
      c.company_name,
      c.email AS customer_email,
      c.phone AS customer_phone,
      u.name AS created_by_name,

      (
        SELECT COUNT(*)
        FROM quotation_items qi
        WHERE qi.quotation_id = q.id
      ) AS item_count

    FROM quotations q

    JOIN enquiries e ON e.id = q.enquiry_id
    JOIN customers c ON c.id = e.customer_id
    JOIN users u ON u.id = q.created_by

    ORDER BY q.created_at DESC, q.id DESC
    LIMIT 50
  `).all();

  const result = db.prepare(`SELECT COUNT(*) AS total FROM quotations`).get() as { total: number };

  return {
    quotations,
    total: result.total,
  };
}

// Get one quotation with customer, enquiry and item details
//each quotation contain description & current_machine_name bcz 
// If the catalogue name changes later, the historical quotation description must not change
export function getQuotationById(id: number) {
  const quotation = db.prepare(`
    SELECT
      q.*,
      e.enquiry_number,
      e.status AS enquiry_status,
      c.id AS customer_id,
      c.customer_type,
      c.name AS customer_name,
      c.company_name,
      c.email AS customer_email,
      c.phone AS customer_phone,
      u.name AS created_by_name

    FROM quotations q

    JOIN enquiries e ON e.id = q.enquiry_id
    JOIN customers c ON c.id = e.customer_id
    JOIN users u ON u.id = q.created_by

    WHERE q.id = ?
  `).get(id);

  if (!quotation) {
    return null;
  }

  const items = db.prepare(`
    SELECT
      qi.*,
      mm.name AS current_machine_name,
      mm.model_number
    FROM quotation_items qi
    JOIN machine_models mm
      ON mm.id = qi.machine_model_id
    WHERE qi.quotation_id = ?
    ORDER BY qi.id ASC
  `).all(id);

  return {
    ...quotation as object,
    items,
  };
}


export function updateQuotation(id: number, input: UpdateQuotationInput) {
  const updateTransaction = db.transaction(() => {
    // 1. Find the quotation and check its current status.
    const quotation = db.prepare(`
      SELECT id, status
      FROM quotations
      WHERE id = ?
    `).get(id) as
      | { id: number; status: string }
      | undefined;

    if (!quotation) {
      throw new QuotationServiceError(
        "QUOTATION_NOT_FOUND",
        "Quotation not found"
      );
    }

    if (quotation.status !== "draft") {
      throw new QuotationServiceError(
        "QUOTATION_NOT_EDITABLE",
        "Only draft quotations can be edited"
      );
    }

    // Prepare machine lookup.
      const getMachine = db.prepare(`SELECT id, name, model_number, is_active
      FROM machine_models WHERE id = ?`);

    // Calculate quotation item totals
    const preparedItems = input.items.map((item) => {
      const machine = getMachine.get(item.machine_model_id) as
        | {
            id: number;
            name: string;
            model_number: string;
            is_active: number;
          }
        | undefined;

      if (!machine || machine.is_active !== 1) {
        throw new QuotationServiceError(
          "MACHINE_UNAVAILABLE",
          `Machine model ${item.machine_model_id} does not exist or is inactive`
        );
      }

      const lineTotal =
        item.quantity * item.unit_price_paisa;

      if (!Number.isSafeInteger(lineTotal)) {
        throw new QuotationServiceError(
          "INVALID_AMOUNT",
          "Quotation item amount is too large"
        );
      }

      return {
        machine_model_id: machine.id,
        description:
          item.description ??
          `${machine.name} (${machine.model_number})`,
        quantity: item.quantity,
        unit_price_paisa: item.unit_price_paisa,
        line_total_paisa: lineTotal,
      };
    });

    // Calculate quotation totals
    const subtotal = preparedItems.reduce(
      (total, item) => total + item.line_total_paisa,
      0
    );

    if (!Number.isSafeInteger(subtotal)) {
      throw new QuotationServiceError(
        "INVALID_AMOUNT",
        "Quotation subtotal is too large"
      );
    }

    if (input.discount_paisa > subtotal) {
      throw new QuotationServiceError(
        "INVALID_DISCOUNT",
        "Discount cannot exceed the quotation subtotal"
      );
    }

    const totalAmount =
      subtotal -
      input.discount_paisa +
      input.tax_amount_paisa;

    if (!Number.isSafeInteger(totalAmount)) {
      throw new QuotationServiceError(
        "INVALID_AMOUNT",
        "Quotation total is too large"
      );
    }

    // Update the existing quotation
    db.prepare(`
      UPDATE quotations
      SET
        subtotal_paisa = ?,
        discount_paisa = ?,
        tax_amount_paisa = ?,
        total_amount_paisa = ?,
        valid_until = ?,
        terms = ?
      WHERE id = ? AND status = 'draft'
    `).run(
      subtotal,
      input.discount_paisa,
      input.tax_amount_paisa,
      totalAmount,
      input.valid_until ?? null,
      input.terms ?? null,
      id
    );

    // Replace the old quotation items
    db.prepare(`DELETE FROM quotation_items WHERE quotation_id = ?`).run(id);

    const insertItem = db.prepare(`
      INSERT INTO quotation_items (
        quotation_id,
        machine_model_id,
        description,
        quantity,
        unit_price_paisa,
        line_total_paisa
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of preparedItems) {
      insertItem.run(
        id,
        item.machine_model_id,
        item.description,
        item.quantity,
        item.unit_price_paisa,
        item.line_total_paisa
      );
    }
  });

  // If any operation fails, SQLite rolls back the entire transaction.
  updateTransaction();

  // Return the updated quotation with its items.
  return getQuotationById(id);
}


export function updateQuotationStatus(id: number, input: UpdateQuotationStatusInput) {
  const updateTransaction = db.transaction(() => {
    const quotation = db.prepare(`SELECT id, status FROM quotations WHERE id = ?`).get(id) as
      | { id: number; status: string }
      | undefined;

    if (!quotation) {
      throw new QuotationServiceError(
        "QUOTATION_NOT_FOUND",
        "Quotation not found"
      );
    }

    // Only draft quotations can be marked as sent.
    if (quotation.status !== "draft" || input.status !== "sent") {
      throw new QuotationServiceError(
        "INVALID_STATUS_TRANSITION",
        `Cannot change quotation status from ${quotation.status} to ${input.status}`
      );
    }

    db.prepare(`UPDATE quotations SET status = ? WHERE id = ? AND status = 'draft'`).run(input.status, id);
  });

  updateTransaction();

  return getQuotationById(id);
}
