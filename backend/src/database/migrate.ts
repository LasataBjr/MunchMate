
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { db } from "./connection.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.join(currentDirectory, "migrations");

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  // Automatically discover and sort migration files.
  const migrationFiles = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();

  for (const migrationFile of migrationFiles) {
    const existingMigration = db
      .prepare(
        "SELECT migration_name FROM schema_migrations WHERE migration_name = ?"
      )
      .get(migrationFile);

    if (existingMigration) {
      console.log(`Migration already applied: ${migrationFile}`);
      continue;
    }

    const migrationPath = path.join(
      migrationsDirectory,
      migrationFile
    );

    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Apply migration and record it atomically.
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
