const nprFormatter = new Intl.NumberFormat('en-NP', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPaisa(amountPaisa: number) {
  return `Rs. ${nprFormatter.format(amountPaisa / 100)}`
}