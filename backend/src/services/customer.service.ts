import { db } from "../database/connection.js";
import type { UpdateCustomerProfileInput } from "../validators/customer.validator.js";

export function getCustomerProfile(customerId: number) {
  return db.prepare(`
    SELECT
      id,
      customer_type,
      name,
      company_name,
      email,
      phone,
      created_at,
      updated_at
    FROM customers
    WHERE id = ?
  `).get(customerId);
}

export function updateCustomerProfile(
  customerId: number,
  userId: number,
  data: UpdateCustomerProfileInput
) {
  const updateProfile = db.transaction(() => {
    const customerResult = db.prepare(`
      UPDATE customers
      SET
        name = ?,
        email = ?,
        phone = ?,
        company_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name,
      data.email,
      data.phone,
      data.company_name,
      customerId
    );

    if (customerResult.changes !== 1) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }

    const userResult = db.prepare(`
      UPDATE users
      SET
        name = ?,
        email = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND customer_id = ?
    `).run(
      data.name,
      data.email,
      userId,
      customerId
    );

    if (userResult.changes !== 1) {
      throw new Error("USER_NOT_LINKED");
    }
  });

  updateProfile();
}