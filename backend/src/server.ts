
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { db } from "./database/connection.js";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import machineRoutes from "./routes/machine.routes.js";
import enquiryRoutes from "./routes/enquiry.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import installationRoutes from "./routes/installation.routes.js";

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
app.use("/api/customers", customerRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/installations", installationRoutes);

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
