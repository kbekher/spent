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

  // Never show recurring payment before it was created
  if (payment.createdAt) {
    const created = new Date(payment.createdAt);
    const createdYear = created.getFullYear();
    const createdMonth = created.getMonth() + 1;
    if (year * 12 + month < createdYear * 12 + createdMonth) return false;
  }

  // Never show recurring payment in the future
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  if (year * 12 + month > nowYear * 12 + nowMonth) return false;

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

/**
 * Calculate recurring total for a period with past-only constraint.
 * Only includes recurring payments for months that have occurred (not future months).
 * 
 * @param payments - Array of recurring payments
 * @param year - Selected year
 * @param month - Selected month (only used when viewMode is 'month')
 * @param viewMode - 'month' or 'year'
 * @param currentDate - Current date (defaults to new Date())
 * @returns Total amount of recurring payments for the period
 */
export function getRecurringTotalForPeriod(
  payments: RecurringPayment[],
  year: number,
  month: number,
  viewMode: 'month' | 'year',
  currentDate: Date = new Date()
): number {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  if (viewMode === 'month') {
    // For month view: only include if the month has occurred
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return 0; // Future month, no recurring payments
    }
    return getRecurringTotalForMonth(payments, year, month);
  } else {
    // For year view: sum only months that have occurred
    if (year > currentYear) {
      return 0; // Future year, no recurring payments
    }

    const endMonth = year === currentYear ? currentMonth : 12;
    let total = 0;
    for (let m = 1; m <= endMonth; m++) {
      total += getRecurringTotalForMonth(payments, year, m);
    }
    return total;
  }
}
