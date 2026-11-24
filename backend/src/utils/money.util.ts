
export function paisaToRupees(amountPaisa: number): string {
  if (!Number.isSafeInteger(amountPaisa) || amountPaisa <= 0) {
    throw new Error("Invalid payment amount");
  }

  const rupees = Math.floor(amountPaisa / 100);
  const paisa = amountPaisa % 100;

  return paisa === 0
    ? String(rupees)
    : `${rupees}.${String(paisa).padStart(2, "0")}`;
}
