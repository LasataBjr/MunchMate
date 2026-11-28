import bcrypt from "bcryptjs";
import { db } from "../database/connection.js";

export async function changeUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const user = db
    .prepare(`
      SELECT password_hash
      FROM users
      WHERE id = ? AND is_active = 1
    `)
    .get(userId) as { password_hash: string } | undefined;

  if (!user) {
    return { success: false, reason: "USER_NOT_FOUND" as const };
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password_hash
  );

  if (!passwordMatches) {
    return { success: false, reason: "INVALID_CURRENT_PASSWORD" as const };
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  const result = db.prepare(`
    UPDATE users SET
        password_hash = ?,
        token_version = token_version + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_active = 1
    `).run(newPasswordHash, userId);

  if (result.changes !== 1) {
    return { success: false, reason: "USER_NOT_FOUND" as const };
  }

  return { success: true as const };
}