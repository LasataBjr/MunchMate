
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { db } from "../database/connection.js";

const rl = readline.createInterface({ input, output });

async function createAdmin() {
  try {
    // Ask for admin details
    const name = (await rl.question("Admin name: ")).trim();
    const email = (await rl.question("Admin email: "))
      .trim()
      .toLowerCase();

    const password = await rl.question("Admin password: ");

    if (!name || !email || password.length < 8) {
      throw new Error(
        "Name and email are required. Password must be at least 8 characters."
      );
    }

    // Find or create the Admin role
    db.prepare(`INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)`).run("Admin", "Full system administrator access");

    const adminRole = db.prepare(`SELECT id FROM roles WHERE name = ?`).get("Admin") as { id: number } | undefined;
    
    if (!adminRole) {
        throw new Error("Admin role could not be created or found.");
    }
      
    // Check whether this email already exists
    const existingUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);

    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 8);

    // Create the admin account
    db.prepare(`INSERT INTO users (role_id, name, email, password_hash) VALUES (?, ?, ?, ?)`).run(adminRole.id, name, email, passwordHash); 

    console.log("Admin account created successfully!");
  } catch (error) {
    console.error("Admin creation failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    rl.close();
    db.close();
  }
}

createAdmin();
