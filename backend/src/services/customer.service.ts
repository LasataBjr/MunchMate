import { db } from "../database/connection.js";

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