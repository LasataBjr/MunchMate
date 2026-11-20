
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { db } from "./database/connection.js";


// Create Express application
const app = express();
const result = db.prepare("SELECT 1 AS connection_test").get();
console.log("Database connection test result:", result);

// Middleware
app.use(helmet());// adds security-related HTTP headers to the responses
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
 
// Test route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MunchMate API is running!",
  });
});



const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all();
console.log("Database tables:", tables);

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log("Database path:", env.DB_PATH);
});
