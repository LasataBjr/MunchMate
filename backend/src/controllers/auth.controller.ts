
import type { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs"; 
import { db } from "../database/connection.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Define the expected login request data
const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function login(req: Request, res: Response) {
    try {
        // Validate incoming request body without throwing an exception
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
            success: false,
            message: "Invalid login details",
            errors: result.error.flatten().fieldErrors,
            });
        }

        const { email, password } = result.data;

            // Find user and role in SQLite
            const user = db.prepare(`
            SELECT
                users.id,
                users.name,
                users.email,
                users.password_hash,
                users.is_active,
                users.token_version,
                roles.name AS role
            FROM users
            JOIN roles ON users.role_id = roles.id
            WHERE users.email = ?
            `).get(email.toLowerCase()) as
            | {
                id: number;
                name: string;
                email: string;
                password_hash: string;
                is_active: number;
                token_version: number;
                role: string;
                }
            | undefined;

            // Reject missing or inactive accounts
            if (!user || user.is_active !== 1) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            }

            // Compare submitted password with stored hash
            const passwordMatches = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }
            
            // Create JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                    tokenVersion: user.token_version,
                },
                env.JWT_SECRET,
                {
                    expiresIn: "1h",
                }
            );

            // Store token in a secure HttpOnly cookie
            // HttpOnly cookie cannot be read by normal frontend JavaScript
            res.cookie("token", token, {
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 1000,
                path: "/",
            });
        
            // Temporary success response
            return res.json({
                success: true,
                message: "Login successful",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during login",
        });
    }
}