import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchExpenses } from '../store/slices/expensesSlice';
import { formatCurrency } from '../utils/currency';
import SkeletonBox from '../components/SkeletonBox';
import ErrorState from '../components/ErrorState';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: expenses, loading: expensesLoading, error: expensesError } = useAppSelector((state) => state.expenses);
  const { items: categories } = useAppSelector((state) => state.categories);
  const { items: recurringPayments } = useAppSelector((state) => state.recurringPayments);

  const currency = user?.currency || 'EUR';

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    const next = new Date(selectedYear, selectedMonth, 1);
    if (next > now) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  // Filter expenses for selected month
  const monthExpenses = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    return expenses.filter((exp) => {
      const d = new Date(exp.date);
      return d >= start && d <= end;
    });
  }, [expenses, selectedYear, selectedMonth]);

  // Recurring total for month
  const recurringTotal = useMemo(() => {
    const excludeKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    return recurringPayments
      .filter((p) => {
        if (!p.isActive || p.excludedMonths.includes(excludeKey)) return false;
        const freq = p.frequency || 'monthly';
        if (freq === 'monthly') return true;
        const sm = p.startMonth || 1;
        if (freq === 'yearly') return selectedMonth === sm;
        if (freq === 'quarterly') {
          let diff = selectedMonth - sm;
          if (diff < 0) diff += 12;
          return diff % 3 === 0;
        }
        return false;
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }, [recurringPayments, selectedYear, selectedMonth]);

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

  // Last 6 months trend
  const trendData = useMemo(() => {
    const result: { x: string; y: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const start = new Date(yr, mo - 1, 1);
      const end = new Date(yr, mo, 0, 23, 59, 59);
      const total = expenses
        .filter((exp) => {
          const ed = new Date(exp.date);
          return ed >= start && ed <= end;
        })
        .reduce((s, e) => s + e.amount, 0);
      result.push({ x: MONTH_SHORT[mo - 1], y: parseFloat(total.toFixed(2)) });
    }
    return result;
  }, [expenses, selectedYear, selectedMonth]);

  if (expensesError && expenses.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ErrorState
          message={expensesError}
          onRetry={() => user?._id && dispatch(fetchExpenses({ userId: user._id }))}
        />
      </SafeAreaView>
    );
  }

  if (expensesLoading && expenses.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <SkeletonBox height={44} borderRadius={22} style={{ marginBottom: 16 }} />
          <SkeletonBox height={90} borderRadius={24} style={{ marginBottom: 8 }} />
          <SkeletonBox height={180} borderRadius={24} style={{ marginBottom: 8 }} />
          <SkeletonBox height={200} borderRadius={24} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={prevMonth}>
            <Text style={styles.arrowText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.periodLabel}>
            {MONTH_SHORT[selectedMonth - 1]} {selectedYear}
          </Text>
          <TouchableOpacity
            style={[styles.arrowBtn, isCurrentMonth && styles.arrowBtnDisabled]}
            onPress={nextMonth}
            disabled={isCurrentMonth}
          >
            <Text style={[styles.arrowText, isCurrentMonth && styles.arrowTextDisabled]}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>{formatCurrency(expenseTotal, currency)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Recurring</Text>
            <Text style={styles.summaryValue}>{formatCurrency(recurringTotal, currency)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={[styles.summaryValue, styles.summaryTotal]}>
              {formatCurrency(expenseTotal + recurringTotal, currency)}
            </Text>
          </View>
        </View>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
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
        )}

        {/* 6-month trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>6-Month Trend</Text>
          {trendData.every((d) => d.y === 0) ? (
            <Text style={styles.noDataText}>No expense data in this period.</Text>
          ) : (
            <View style={styles.trendChart}>
              {(() => {
                const maxVal = Math.max(...trendData.map((d) => d.y), 1);
                return trendData.map((d, i) => (
                  <View key={i} style={styles.trendBar}>
                    <Text style={styles.trendValue}>
                      {d.y >= 1000 ? `${(d.y / 1000).toFixed(1)}k` : `${d.y}`}
                    </Text>
                    <View style={styles.trendBarTrack}>
                      <View
                        style={[
                          styles.trendBarFill,
                          { height: `${(d.y / maxVal) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendLabel}>{d.x}</Text>
                  </View>
                ));
              })()}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 24,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 14,
    color: '#ffffff',
  },
  arrowTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  periodLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    minWidth: 100,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryTotal: {
    color: '#bffd00',
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
  noDataText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 20,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    gap: 8,
    paddingTop: 20,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  trendValue: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  trendBarTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 6,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
});
