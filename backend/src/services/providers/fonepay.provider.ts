
import { createHmac, randomBytes } from "node:crypto";
import { paisaToRupees } from "../../utils/money.util.js";

const QR_PATH =
  "/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload";

const STATUS_PATH =
  "/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus";

type FonepayConfig = {
  baseUrl: string;
  merchantCode: string;
  username: string;
  password: string;
  secretKey: string;
};

type FonepayQrResponse = {
  success?: boolean;
  status?: string;
  statusCode?: number;
  message?: string;
  qrMessage?: string;
  thirdpartyQrWebSocketUrl?: string;
};

type FonepayStatusResponse = {
  prn?: string;
  merchantCode?: string;
  paymentStatus?: string;
  fonepayTraceId?: string | number;
};

function getConfig(): FonepayConfig {
  const {
    FONEPAY_BASE_URL,
    FONEPAY_MERCHANT_CODE,
    FONEPAY_USERNAME,
    FONEPAY_PASSWORD,
    FONEPAY_SECRET_KEY,
  } = process.env;

  if (
    !FONEPAY_BASE_URL ||
    !FONEPAY_MERCHANT_CODE ||
    !FONEPAY_USERNAME ||
    !FONEPAY_PASSWORD ||
    !FONEPAY_SECRET_KEY
  ) {
    throw new Error("Fonepay configuration is incomplete");
  }

  const baseUrl = FONEPAY_BASE_URL.replace(/\/+$/, "");

  if (!baseUrl.startsWith("https://")) {
    throw new Error("Fonepay base URL must use HTTPS");
  }

  return {
    baseUrl,
    merchantCode: FONEPAY_MERCHANT_CODE,
    username: FONEPAY_USERNAME,
    password: FONEPAY_PASSWORD,
    secretKey: FONEPAY_SECRET_KEY,
  };
}

function signMessage(secretKey: string, message: string): string {
  return createHmac("sha512", secretKey)
    .update(message, "utf8")
    .digest("hex");
}

export function createFonepayPrn(): string {
  // Generate a unique 23-character payment reference.
  return `G24${randomBytes(10).toString("hex").toUpperCase()}`;
}

async function postJson<T>(url: string, payload: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    // Do not include the response body: it may contain sensitive provider data.
    throw new Error(`Fonepay request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export type GeneratedFonepayQr = {
  prn: string;
  amount: string;
  qrMessage: string;
  websocketUrl?: string;
};

export async function generateFonepayQr( prn: string, amountPaisa: number, remarks1: string): Promise<GeneratedFonepayQr> {
  const config = getConfig();

  if (!remarks1 || remarks1.length > 25) {
    throw new Error("Fonepay remarks1 must contain 1 to 25 characters");
  }

  if (!prn || prn.length > 25) {
    throw new Error("Invalid Fonepay PRN");
  }

  const amount = paisaToRupees(amountPaisa);
  const remarks2 = "";
  const signatureMessage = [
    amount,
    prn,
    config.merchantCode,
    remarks1,
    remarks2,
  ].join(",");

  const dataValidation = signMessage(
    config.secretKey,
    signatureMessage
  );

  const result = await postJson<FonepayQrResponse>(
    `${config.baseUrl}${QR_PATH}`,
    {
      amount,
      prn,
      merchantCode: config.merchantCode,
      remarks1,
      remarks2,
      dataValidation,
      username: config.username,
      password: config.password,
    }
  );

  if (result.success !== true ||
    result.status !== "CREATED" ||
    result.statusCode !== 201 ||
    typeof result.qrMessage !== "string" ||
    result.qrMessage.trim().length === 0
  ) {
    throw new Error("Fonepay did not return a valid QR code");
  }

  return {
    prn,
    amount,
    qrMessage: result.qrMessage,
    websocketUrl: result.thirdpartyQrWebSocketUrl,
  };
}

export async function checkFonepayStatus(prn: string) {
  const config = getConfig();

  if (!/^G24[A-F0-9]{20}$/.test(prn)) {
    throw new Error("Invalid Fonepay PRN");
  }

  const signatureMessage = `${prn},${config.merchantCode}`;

  const dataValidation = signMessage(
    config.secretKey,
    signatureMessage
  );

  const result = await postJson<FonepayStatusResponse>(
    `${config.baseUrl}${STATUS_PATH}`,
    {
      prn,
      merchantCode: config.merchantCode,
      dataValidation,
      username: config.username,
      password: config.password,
    }
  );

  // Reject a response that refers to a different payment.
  if (
    result.prn !== prn ||
    result.merchantCode !== config.merchantCode
  ) {
    throw new Error("Fonepay returned mismatched transaction details");
  }

  const status = result.paymentStatus?.toLowerCase();

  if (!["success", "failed", "pending"].includes(status ?? "")) {
    throw new Error("Fonepay returned an unknown payment status");
  }

  if (
    status === "success" &&
    (result.fonepayTraceId === undefined ||
      result.fonepayTraceId === null ||
      String(result.fonepayTraceId).trim() === "")
  ) {
    throw new Error("Fonepay success response is missing transaction ID");
  }

  return {
    prn,
    paymentStatus: status as "success" | "failed" | "pending",
    transactionId:
      result.fonepayTraceId == null
        ? null
        : String(result.fonepayTraceId),
  };
}
