
import fs from "node:fs"; 
import path from "node:path"; 
import { fileURLToPath } from "node:url"; 

import { db } from "./connection.js"; 

const currentFile = fileURLToPath(import.meta.url); 
const currentDirectory = path.dirname(currentFile); 

// Path to the SQL schema file
const schemaPath = path.join( currentDirectory, "schema", "customers.sql" );

// Read SQL file
const customerSchema = fs.readFileSync(schemaPath, "utf-8");

export function initializeDatabase() {
  db.exec(customerSchema);
  console.log("Customers table created successfully!");
}