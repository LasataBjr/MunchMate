
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { db } from "./connection.js";

// Find this file's directory.
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// Locate the initial SQL migration.
const migrationFile = "001_initial_schema.sql";
const migrationPath = path.join(
  currentDirectory,
  "migrations",
  migrationFile
);

// Create the migration tracking table if it doesn't exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  // Check that the migration file exists.
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  // Check whether this migration has already been applied.
  const existingMigration = db
    .prepare(
      "SELECT migration_name FROM schema_migrations WHERE migration_name = ?"
    )
    .get(migrationFile);

  if (existingMigration) {
    console.log(`Migration already applied: ${migrationFile}`);
  } else {
    // Read the SQL file.
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Apply the SQL and record it in one transaction.
    // If anything fails, both operations are rolled back.
    const applyMigration = db.transaction(() => {
      db.exec(migrationSQL);

      db.prepare(
        "INSERT INTO schema_migrations (migration_name) VALUES (?)"
      ).run(migrationFile);
    });

    applyMigration();

    console.log(`Migration applied successfully: ${migrationFile}`);
  }
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  db.close();
}
