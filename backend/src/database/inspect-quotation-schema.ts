
import { db } from "./connection.js";

// Inspect quotation table definitions.
const tables = db.prepare(`
  SELECT name, sql
  FROM sqlite_master
  WHERE type = 'table'
    AND name IN ('quotations', 'quotation_items')
  ORDER BY name
`).all();

console.log("QUOTATION DATABASE SCHEMA:");
console.log(JSON.stringify(tables, null, 2));

// Inspect indexes and unique constraints.
const indexes = db.prepare(`
  SELECT name, tbl_name, sql
  FROM sqlite_master
  WHERE type = 'index'
    AND tbl_name IN ('quotations', 'quotation_items')
`).all();

console.log("QUOTATION INDEXES:");
console.log(JSON.stringify(indexes, null, 2));

db.close();
