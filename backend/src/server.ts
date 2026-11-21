
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { db } from "./database/connection.js";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import machineRoutes from "./routes/machine.routes.js";
import enquiryRoutes from "./routes/enquiry.routes.js";

// Create Express application
const app = express();
const result = db.prepare("SELECT 1 AS connection_test").get();
console.log("Database connection test result:", result);

// Middleware
app.use(helmet());// adds security-related HTTP headers to the responses 
app.use(cors({ origin: "http://localhost:5173" , credentials: true, })); 
app.use(express.json()); // Parse JSON bodies from incoming requests
app.use(cookieParser()); // Parse cookies from incoming requests

app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/enquiries", enquiryRoutes);

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
