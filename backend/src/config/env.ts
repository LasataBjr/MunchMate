// Loads .env and validates variables using Zod
import dotenv from "dotenv";
import { z } from "zod"; 

// Load variables from .env
dotenv.config();

// Define the expected environment variables
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DB_PATH: z.string().min(1, "Database path is required"),
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"), //JWT is not the password but a proof that the backend previously authenticated the user
});

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

// Export validated configuration
export const env = parsedEnv.data;
