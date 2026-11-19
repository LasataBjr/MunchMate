
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../config/env.js";

// Get the current directory of this file
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

// Resolve the database path from the backend folder
const databasePath = path.resolve(
  currentDirectory,
  "../../",
  env.DB_PATH
);

// Create the database directory if it doesn't exist
import fs from "node:fs";
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

// Create or open the SQLite database
export const db = new Database(databasePath);

// Enable foreign key relationships
db.pragma("foreign_keys = ON");

// Improve database reliability
db.pragma("journal_mode = WAL");

// Confirm connection
console.log("SQLite database connected:", databasePath);
