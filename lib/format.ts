export function formatINR(value: number | null | undefined): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-IN').format(Number(value ?? 0));
}

export function phoneToAuthEmail(phone: string): string {
  return `${phone.trim()}@kasonghar.local`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Indian FY label e.g. 2025-26 for a date in Apr 2025–Mar 2026 */
export function indianFYLabel(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  const start = month >= 3 ? year : year - 1;
  const end = String(start + 1).slice(-2);
  return `${start}-${end}`;
}
