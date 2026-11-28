// 
const formatter = new Intl.NumberFormat('en-NP', { maximumFractionDigits: 2 })

export function formatNpr(amount: number): string {
  return `NPR ${formatter.format(amount)}`
}