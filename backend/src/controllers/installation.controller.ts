import type { Request, Response } from "express";

import {
  createInstallation,
  assignInstallationItems,
  updateInstallationSchedule,
  startInstallation,
  completeInstallation,
  getInstallations,
  getInstallationById,
} from "../services/installation.service.js";

import {
  createInstallationSchema,
  assignInstallationItemsSchema,
  updateInstallationScheduleSchema,
} from "../validators/installation.validator.js";

// Safely parse IDs from Express route parameters.
function parseId(
  value: string | string[] | undefined
): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// Convert installation service errors into HTTP responses.
function sendInstallationError(
  res: Response,
  code: string
) {
  const notFoundCodes = [
    "ORDER_NOT_FOUND",
    "DELIVERY_NOT_FOUND",
    "INSTALLATION_NOT_FOUND",
    "INSTALLER_NOT_FOUND",
  ];

  const badRequestCodes = [
    "INVALID_RESERVATIONS",
  ];

  const status = notFoundCodes.includes(code)
    ? 404
    : badRequestCodes.includes(code)
      ? 400
      : 409;

  return res.status(status).json({
    success: false,
    code,
  });
}

// Create an installation.
export function createInstallationController(
  req: Request,
  res: Response
) {
  const parsed = createInstallationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation information",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = createInstallation(parsed.data);

    if (!result.success) {
      return sendInstallationError(res, result.code);
    }

    return res.status(201).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to create installation",
    });
  }
}

// Assign delivered machines to an installation.
export function assignInstallationItemsController(
  req: Request,
  res: Response
) {
  const installationId = parseId(req.params.id);

  if (!installationId) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation ID",
    });
  }

  const parsed = assignInstallationItemsSchema.safeParse(
    req.body
  );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation items",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = assignInstallationItems(
      installationId,
      parsed.data
    );

    if (!result.success) {
      return sendInstallationError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to assign installation items",
    });
  }
}

// Update installation schedule and installer.
export function updateInstallationScheduleController(
  req: Request,
  res: Response
) {
  const installationId = parseId(req.params.id);

  if (!installationId) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation ID",
    });
  }

  const parsed = updateInstallationScheduleSchema.safeParse(
    req.body
  );

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation schedule",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = updateInstallationSchedule(
      installationId,
      parsed.data
    );

    if (!result.success) {
      return sendInstallationError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to update installation schedule",
    });
  }
}

// Start an installation.
export function startInstallationController(
  req: Request,
  res: Response
) {
  const installationId = parseId(req.params.id);

  if (!installationId) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation ID",
    });
  }

  try {
    const result = startInstallation(installationId);

    if (!result.success) {
      return sendInstallationError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to start installation",
    });
  }
}

// Complete an installation.
export function completeInstallationController(
  req: Request,
  res: Response
) {
  const installationId = parseId(req.params.id);

  if (!installationId) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation ID",
    });
  }

  try {
    const result = completeInstallation(installationId);

    if (!result.success) {
      return sendInstallationError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to complete installation",
    });
  }
}

// List installations.
export function getInstallationsController(
  req: Request,
  res: Response
) {
  try {
    const installations = getInstallations();

    return res.status(200).json({
      success: true,
      data: installations,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve installations",
    });
  }
}

// Get one installation with its assigned machines.
export function getInstallationByIdController(
  req: Request,
  res: Response
) {
  const installationId = parseId(req.params.id);

  if (!installationId) {
    return res.status(400).json({
      success: false,
      message: "Invalid installation ID",
    });
  }

  try {
    const installation = getInstallationById(installationId);

    if (!installation) {
      return res.status(404).json({
        success: false,
        code: "INSTALLATION_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      data: installation,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve installation",
    });
  }
}