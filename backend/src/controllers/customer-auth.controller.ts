import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../database/connection.js";
import { env } from "../config/env.js";
import { customerRegistrationSchema } from "../validators/customer-auth.validator.js";

export async function registerCustomer(req: Request, res: Response) {
  const validation = customerRegistrationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration details",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const data = validation.data;
  const email = data.email.toLowerCase();
  const companyName =
    data.customer_type === "company" ? data.company_name?.trim() : null;

  try {
    // Check whether this login email is already registered.
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash the password before starting the database transaction.
    const passwordHash = await bcrypt.hash(data.password, 12);

    const customerRole = db
      .prepare("SELECT id FROM roles WHERE name = ?")
      .get("Customer") as { id: number } | undefined;

    if (!customerRole) {
      return res.status(500).json({
        success: false,
        message: "Customer registration is currently unavailable",
      });
    }

    // Create the customer and login account together.
    const createAccount = db.transaction(() => {
      const customerResult = db
        .prepare(`
          INSERT INTO customers (
            customer_type,
            name,
            company_name,
            email,
            phone
          )
          VALUES (?, ?, ?, ?, ?)
        `)
        .run(
          data.customer_type,
          data.name,
          companyName ?? null,
          email,
          data.phone
        );

      const customerId = Number(customerResult.lastInsertRowid);

      const userResult = db
        .prepare(`
          INSERT INTO users (
            role_id,
            name,
            email,
            password_hash,
            customer_id
          )
          VALUES (?, ?, ?, ?, ?)
        `)
        .run(
          customerRole.id,
          data.name,
          email,
          passwordHash,
          customerId
        );

      return {
        userId: Number(userResult.lastInsertRowid),
        customerId,
      };
    });

    const account = createAccount();

    const token = jwt.sign(
      {
        userId: account.userId,
        role: "Customer",
        tokenVersion: 0,
      },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      user: {
        id: account.userId,
        name: data.name,
        email,
        role: "Customer",
      },
      customer: {
        id: account.customerId,
        customer_type: data.customer_type,
        company_name: companyName ?? null,
        phone: data.phone,
      },
    });
  } catch (error) {
    // Handle a duplicate email even if another request registered it
    // after our initial check.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Customer registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create customer account",
    });
  }
}