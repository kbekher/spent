import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAppSelector } from '../store/hooks';
import { formatCurrency } from '../utils/currency';

interface OverviewScreenProps {
  navigation: any;
}

export default function OverviewScreen({ navigation }: OverviewScreenProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { items: expenses, loading: expensesLoading } = useAppSelector(
    (state) => state.expenses
  );
  const { items: recurringPayments } = useAppSelector(
    (state) => state.recurringPayments
  );

  const displayName = user?.displayName || user?.username || '';
  const currency = user?.currency || 'EUR';

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Compute stats from Redux store data
  const stats = useMemo(() => {
    const startDate =
      viewMode === 'month'
        ? new Date(selectedYear, selectedMonth - 1, 1)
        : new Date(selectedYear, 0, 1);
    const endDate =
      viewMode === 'month'
        ? new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
        : new Date(selectedYear, 11, 31, 23, 59, 59);

    // Filter expenses by date range
    const filteredExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= startDate && expDate <= endDate;
    });

    // Group by category
    const categoryTotals: Record<
      string,
      { name: string; color: string; total: number }
    > = {};
    let total = 0;

    filteredExpenses.forEach((expense) => {
      const category =
        typeof expense.categoryId === 'object'
          ? expense.categoryId
          : { name: 'Unknown', color: '#666', _id: '' };

      if (category) {
        const categoryName = category.name;
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = {
            name: categoryName,
            color: category.color,
            total: 0,
          };
        }
        categoryTotals[categoryName].total += expense.amount;
        total += expense.amount;
      }
    });

    return {
      total,
      byCategory: Object.values(categoryTotals),
      expenses: filteredExpenses.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    };
  }, [expenses, selectedYear, selectedMonth, viewMode]);

  const getRecurringTotal = (year: number, month: number) => {
    const excludeMonthKey = `${year}-${String(month).padStart(2, '0')}`;

    return recurringPayments
      .filter((p) => {
        if (!p.isActive || p.excludedMonths.includes(excludeMonthKey)) {
          return false;
        }

        const frequency = p.frequency || 'monthly';

        if (frequency === 'monthly') {
          return true;
        }

        const startMonth = p.startMonth || 1;

        if (frequency === 'yearly') {
          return month === startMonth;
        }

        if (frequency === 'quarterly') {
          let monthsSinceStart = month - startMonth;
          if (monthsSinceStart < 0) {
            monthsSinceStart += 12;
          }
          return monthsSinceStart % 3 === 0;
        }

        return false;
      })
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getRecurringCount = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const excludeMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    return recurringPayments.filter((p) => {
      if (!p.isActive || p.excludedMonths.includes(excludeMonthKey)) {
        return false;
      }

      const frequency = p.frequency || 'monthly';

      if (frequency === 'monthly') {
        return true;
      }

      const startMonth = p.startMonth || 1;

      if (frequency === 'yearly') {
        return currentMonth === startMonth;
      }

      if (frequency === 'quarterly') {
        let monthsSinceStart = currentMonth - startMonth;
        if (monthsSinceStart < 0) {
          monthsSinceStart += 12;
        }
        return monthsSinceStart % 3 === 0;
      }

      return false;
    }).length;
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  const recurringTotal = getRecurringTotal(selectedYear, selectedMonth);

  if (expensesLoading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.titleSection}>
          <View style={styles.dot} />
          <Text style={styles.title}>Overview</Text>
        </View>

        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greeting}>Hello {displayName}!</Text>
            <Text style={styles.recurringCount}>
              {getRecurringCount()} recurring payment
              {getRecurringCount() !== 1 ? 's' : ''} this month
            </Text>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'month' && styles.toggleBtnActive]}
              onPress={() => setViewMode('month')}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  viewMode === 'month' && styles.toggleBtnTextActive,
                ]}
              >
                M
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'year' && styles.toggleBtnActive]}
              onPress={() => setViewMode('year')}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  viewMode === 'year' && styles.toggleBtnTextActive,
                ]}
              >
                Y
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selectors - Simplified for now */}
        <View style={styles.dateSelectorRow}>
          {viewMode === 'month' ? (
            <>
              <TouchableOpacity style={styles.dateBtn}>
                <Text style={styles.dateBtnText}>{getMonthName(selectedMonth)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateBtn}>
                <Text style={styles.dateBtnText}>{selectedYear}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.dateBtn, { flex: 1 }]}>
              <Text style={styles.dateBtnText}>{selectedYear}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={styles.statDot} />
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(stats.total, currency)}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={styles.statDot} />
            <Text style={styles.statLabel}>Recurring</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(recurringTotal, currency)}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <View style={styles.statDot} />
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(stats.total + recurringTotal, currency)}
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      {stats.byCategory.length > 0 && (
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() =>
            navigation.navigate('RecentExpenses', {
              year: selectedYear,
              month: selectedMonth,
              viewMode,
            })
          }
        >
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>By Category</Text>
            <Text style={styles.categoryCount}>{stats.byCategory.length} Categories</Text>
          </View>

          <View style={styles.categoryList}>
            {stats.byCategory.map((cat, index) => {
              const percentage = stats.total > 0 ? (cat.total / stats.total) * 100 : 0;
              return (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[styles.categoryDot, { backgroundColor: cat.color }]}
                      />
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(cat.total, currency)}
                    </Text>
                  </View>

                  <View style={styles.categoryBarContainer}>
                    <View style={styles.categoryBarBg}>
                      <View
                        style={[
                          styles.categoryBarFill,
                          { width: `${percentage}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      )}

      {stats.expenses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No expenses recorded for this period.
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  recurringCount: {
    fontSize: 14,
    color: '#64748b',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#1e293b',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginRight: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  categoryCount: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryList: {
    gap: 16,
  },
  categoryItem: {
    gap: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    marginHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 80,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
  },
});
