import { RecurringPayment } from '../types';

/**
 * Returns true if the recurring payment should be counted for the given year+month.
 * Checks: isActive, excludedMonths, frequency cycle, and lifecycle activeFrom/activeTo.
 */
export function isRecurringActiveForMonth(
  payment: RecurringPayment,
  year: number,
  month: number
): boolean {
  if (!payment.isActive) return false;

  const excludeKey = `${year}-${String(month).padStart(2, '0')}`;
  if (payment.excludedMonths.includes(excludeKey)) return false;

  // Lifecycle: activeFrom "YYYY-MM"
  if (payment.activeFrom) {
    const [fromY, fromM] = payment.activeFrom.split('-').map(Number);
    if (year * 12 + month < fromY * 12 + fromM) return false;
  }

  // Lifecycle: activeTo "YYYY-MM"
  if (payment.activeTo) {
    const [toY, toM] = payment.activeTo.split('-').map(Number);
    if (year * 12 + month > toY * 12 + toM) return false;
  }

  const frequency = payment.frequency || 'monthly';

  if (frequency === 'monthly') return true;

  const cycleStart = payment.startMonth || 1;

  if (frequency === 'yearly') {
    return month === cycleStart;
  }

  if (frequency === 'quarterly') {
    let diff = month - cycleStart;
    if (diff < 0) diff += 12;
    return diff % 3 === 0;
  }

  return false;
}

/**
 * Sum recurring payment amounts for a single month.
 */
export function getRecurringTotalForMonth(
  payments: RecurringPayment[],
  year: number,
  month: number
): number {
  return payments
    .filter((p) => isRecurringActiveForMonth(p, year, month))
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Sum recurring payment amounts across all 12 months of a year.
 */
export function getRecurringTotalForYear(
  payments: RecurringPayment[],
  year: number
): number {
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    total += getRecurringTotalForMonth(payments, year, m);
  }
  return total;
}
