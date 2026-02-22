import { Expense } from '../types';
import { Category } from '../types';

export interface CategoryBreakdown {
  name: string;
  color: string;
  total: number;
}

/**
 * Filter expenses by date range
 */
export function filterExpensesByDateRange(
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): Expense[] {
  return expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    return expDate >= startDate && expDate <= endDate;
  });
}

/**
 * Calculate total amount from expenses
 */
export function calculateExpenseTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

/**
 * Aggregate expenses by category
 */
export function aggregateByCategory(
  expenses: Expense[],
  categories: Category[]
): CategoryBreakdown[] {
  const map: Record<string, CategoryBreakdown> = {};

  expenses.forEach((exp) => {
    const cat =
      typeof exp.categoryId === 'object'
        ? (exp.categoryId as any)
        : categories.find((c) => c._id === exp.categoryId) || {
            name: 'Unknown',
            color: '#888',
          };
    const key = cat.name;
    if (!map[key]) {
      map[key] = { name: cat.name, color: cat.color, total: 0 };
    }
    map[key].total += exp.amount;
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
}
