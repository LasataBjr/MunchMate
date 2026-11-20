
import { db } from "../database/connection.js";

try {
  const admin = db.prepare(`
    SELECT
      users.id,
      users.name,
      users.email,
      users.is_active,
      roles.name AS role
    FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.email = ?
  `).get("adminmunch@gmail.com");

  console.log("Admin account:", admin);
} finally {
  db.close();
}
