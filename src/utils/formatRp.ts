/**
 * Format an integer rupiah amount as Indonesian currency, e.g. `Rp1.234.567`.
 */
export function formatRp(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}
