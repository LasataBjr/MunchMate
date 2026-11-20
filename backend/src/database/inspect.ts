
import { db } from "./connection.js";

try {
  console.log("\n========== DATABASE INSPECTION ==========\n");

  // 1. List all application tables.
  const tables = db
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    .all() as { name: string }[];

  console.log(`Total tables found: ${tables.length}\n`);

  console.log("TABLES:");
  for (const table of tables) {
    console.log(`- ${table.name}`);
  }

  // 2. Show columns for every table.
  console.log("\nTABLE COLUMNS:");

  for (const table of tables) {
    const columns = db
      .prepare(`PRAGMA table_info("${table.name}")`)
      .all() as { name: string; type: string; notnull: number; pk: number }[];

    console.log(`\n${table.name}:`);

    for (const column of columns) {
      const primaryKey = column.pk ? " PRIMARY KEY" : "";
      const required = column.notnull ? " NOT NULL" : "";

      console.log(
        `  ${column.name} (${column.type})${primaryKey}${required}`
      );
    }
  }

  // 3. Check foreign key relationships.
  const foreignKeyErrors = db
    .prepare("PRAGMA foreign_key_check")
    .all();

  console.log("\nFOREIGN KEY CHECK:");

  if (foreignKeyErrors.length === 0) {
    console.log("PASS - No foreign key violations.");
  } else {
    console.error("FAIL - Foreign key violations found:");
    console.error(foreignKeyErrors);
  }

  // 4. Check database integrity.
  const integrityResult = db
    .prepare("PRAGMA integrity_check")
    .all() as { integrity_check: string }[];

  console.log("\nDATABASE INTEGRITY:");

  for (const result of integrityResult) {
    console.log(result.integrity_check);
  }

  // 5. Show applied migrations.
  const migrations = db
    .prepare(`
      SELECT migration_name, applied_at
      FROM schema_migrations
      ORDER BY id
    `)
    .all();

  console.log("\nAPPLIED MIGRATIONS:");
  console.table(migrations);

  // 6. Check expected table count.
  console.log("\nEXPECTED TABLE COUNT:");
  console.log("Expected: 23 (22 business tables + schema_migrations)");
  console.log(`Actual: ${tables.length}`);

  if (tables.length === 23) {
    console.log("PASS - Expected table count found.");
  } else {
    console.error("WARNING - Table count does not match.");
  }

  console.log("\n========== INSPECTION COMPLETE ==========\n");

  if (
    foreignKeyErrors.length > 0 ||
    integrityResult.some((result) => result.integrity_check !== "ok") ||
    tables.length !== 23
  ) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error("Database inspection failed:", error);
  process.exitCode = 1;
} finally {
  db.close();
}
