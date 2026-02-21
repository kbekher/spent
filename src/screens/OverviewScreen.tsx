import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../store/hooks';
import { formatCurrency } from '../utils/currency';

interface OverviewScreenProps {
  navigation: any;
}

export default function OverviewScreen({ navigation }: OverviewScreenProps) {
  const { user } = useAppSelector(state => state.auth);
  const { items: expenses, loading: expensesLoading, error: expensesError } = useAppSelector((state) => state.expenses);
  const { items: categories } = useAppSelector((state) => state.categories);
  const { items: recurringPayments } = useAppSelector(state => state.recurringPayments);

  const displayName = user?.displayName || user?.username || '';
  const currency = user?.currency || 'EUR';

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // // Compute stats from Redux store data
  // const stats = useMemo(() => {
  //   const startDate =
  //     viewMode === 'month'
  //       ? new Date(selectedYear, selectedMonth - 1, 1)
  //       : new Date(selectedYear, 0, 1);
  //   const endDate =
  //     viewMode === 'month'
  //       ? new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
  //       : new Date(selectedYear, 11, 31, 23, 59, 59);

  // Filter expenses for selected month
  const monthExpenses = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    return expenses.filter((exp) => {
      const d = new Date(exp.date);
      return d >= start && d <= end;
    });
  }, [expenses, selectedYear, selectedMonth]);

  const expenseTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses]
  );

  // Category breakdown
  const byCategory = useMemo(() => {
    const map: Record<string, { name: string; color: string; total: number }> = {};
    monthExpenses.forEach((exp) => {
      const cat =
        typeof exp.categoryId === 'object'
          ? (exp.categoryId as any)
          : categories.find((c) => c._id === exp.categoryId) || { name: 'Unknown', color: '#888' };
      const key = cat.name;
      if (!map[key]) map[key] = { name: cat.name, color: cat.color, total: 0 };
      map[key].total += exp.amount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [monthExpenses, categories]);

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
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.titleSection}>
            <View style={styles.dot} />
            <Text style={styles.title}>Overview</Text>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Hello {displayName}!</Text>
          </View>

          <View style={styles.recurringSection}>
            <Text style={styles.recurringCount}>
              {getRecurringCount()} recurring payment
              {getRecurringCount() !== 1 ? 's' : ''} this month
            </Text>

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
            <Text style={styles.statValue}>{formatCurrency(expenseTotal, currency)}</Text>
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
              {formatCurrency(expenseTotal + recurringTotal, currency)}
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        {byCategory.length > 0 && (

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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>By Category</Text>
              {byCategory.map((cat, i) => {
                const pct = expenseTotal > 0 ? (cat.total / expenseTotal) * 100 : 0;
                return (
                  <View key={i} style={styles.catRow}>
                    <View style={styles.catInfo}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catAmount}>{formatCurrency(cat.total, currency)}</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${pct}%` as any, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
        )}

        {byCategory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No expenses recorded for this period.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 0,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    paddingTop: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    width: '100%',
    maxWidth: '100%',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.5,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 34,
  },
  recurringSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    width: '100%',
    maxWidth: '100%',
  },
  recurringCount: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 24,
    width: 86,
    flexShrink: 0,
  },
  toggleBtn: {
    width: 43,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#000000',
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    width: '100%',
  },
  dateBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 48,
    alignItems: 'center',
  },
  dateBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'column',
    paddingHorizontal: 8,
    gap: 6,
    marginBottom: 8,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 30,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    alignSelf: 'stretch',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    opacity: 0.9,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    flexShrink: 1,
  },
  card: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  catRow: {
    marginBottom: 14,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  catName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  catPct: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 3,
    textAlign: 'right',
  },
  categoryCard: {
    marginHorizontal: 8,
    marginBottom: 6,
    alignSelf: 'stretch',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  categoryCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  categoryList: {
    gap: 16,
  },
  categoryItem: {
    gap: 8,
    marginBottom: 12,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flexShrink: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flexShrink: 0,
  },
  categoryBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  categoryBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    minWidth: 0,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
    flexShrink: 0,
  },
  emptyState: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 24,
    padding: 40,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
