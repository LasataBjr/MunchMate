import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { changePasswordSchema } from "../validators/change-password.validator.js";
import { changeUserPassword } from "../services/auth.service.js";

export async function changePasswordController(
  req: Request,
  res: Response
) {
  const userId = res.locals.authUser.id as number;

  const validation = changePasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid password details",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { current_password, new_password } = validation.data;

  try {
    const result = await changeUserPassword(
      userId,
      current_password,
      new_password
    );

    if (!result.success) {
      if (result.reason === "INVALID_CURRENT_PASSWORD") {
        return res.status(400).json({
          success: false,
          message: "Your current password is incorrect",
        });
      }

      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    res.clearCookie("token", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return res.json({
        success: true,
        message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Password change failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
}