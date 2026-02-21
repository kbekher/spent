import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  removeExpense,
} from '../store/slices/expensesSlice';
import { formatCurrency } from '../utils/currency';

interface RecentExpensesScreenProps {
  route: {
    params: {
      year: number;
      month: number;
      viewMode: 'month' | 'year';
    };
  };
}

interface DisplayItem {
  _id: string;
  userId: string;
  amount: number;
  categoryId: string | { _id: string; name: string; color: string };
  description?: string;
  date: string;
  createdAt: string;
  isRecurring?: boolean;
}

export default function RecentExpensesScreen({ route }: RecentExpensesScreenProps) {
  const { year: selectedYear, month: selectedMonth, viewMode } = route.params;
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: expenses } = useAppSelector((state) => state.expenses);
  const { items: recurringPayments } = useAppSelector(
    (state) => state.recurringPayments
  );
  const currency = user?.currency || 'EUR';

  const [filter, setFilter] = useState<'all' | 'expenses' | 'recurring'>('all');

  // Filter expenses based on selected date
  const startDate =
    viewMode === 'month'
      ? new Date(selectedYear, selectedMonth - 1, 1)
      : new Date(selectedYear, 0, 1);
  const endDate =
    viewMode === 'month'
      ? new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      : new Date(selectedYear, 11, 31, 23, 59, 59);

  // Get recurring payments for the selected period
  const getRecurringPaymentsForPeriod = () => {
    const selectedMonthIndex = selectedMonth - 1;
    const selectedMonthStr = String(selectedMonth).padStart(2, '0');
    const fullMonthStr = `${selectedYear}-${selectedMonthStr}`;

    return recurringPayments
      .filter((p) => {
        if (!p.isActive || p.excludedMonths.includes(fullMonthStr)) {
          return false;
        }

        const frequency = p.frequency || 'monthly';
        const startMonth = p.startMonth || 1;

        if (frequency === 'monthly') {
          return true;
        }

        if (frequency === 'yearly') {
          return selectedMonth === startMonth;
        }

        if (frequency === 'quarterly') {
          const monthsSinceStart =
            (selectedMonthIndex - (startMonth - 1) + 12) % 12;
          return monthsSinceStart % 3 === 0;
        }

        return false;
      })
      .map((p): DisplayItem => ({
        _id: p._id,
        userId: p.userId,
        amount: p.amount,
        categoryId: p.categoryId,
        description: p.name,
        date: new Date(selectedYear, selectedMonth - 1, p.dayOfMonth).toISOString(),
        createdAt: p.createdAt,
        isRecurring: true,
      }));
  };

  // Combine expenses and recurring payments
  const allItems: DisplayItem[] = useMemo(
    () => [
      ...expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= endDate;
      }),
      ...(viewMode === 'month' ? getRecurringPaymentsForPeriod() : []),
    ],
    [expenses, recurringPayments, selectedYear, selectedMonth, viewMode]
  );

  // Apply filter
  const filteredItems = allItems
    .filter((item) => {
      if (filter === 'expenses') return !item.isRecurring;
      if (filter === 'recurring') return item.isRecurring;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = async (id: string, isRecurring: boolean) => {
    if (isRecurring) {
      Alert.alert(
        'Cannot Delete',
        "Recurring payments can't be deleted from here. Please go to the Recurring Payments page."
      );
      return;
    }

    if (id.startsWith('temp-')) {
      Alert.alert(
        'Please Wait',
        "This expense hasn't been saved yet. Please wait a moment and try again."
      );
      return;
    }

    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Optimistic delete removed - using direct delete

          try {
            await dispatch(removeExpense(id)).unwrap();
          } catch (error: any) {
            if (error.code === 'ERR_BAD_REQUEST' && error.message?.includes('404')) {
              return;
            }
            Alert.alert('Error', error.message || 'Failed to delete expense.');
          }
        },
      },
    ]);
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with period info */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {viewMode === 'month'
            ? `${getMonthName(selectedMonth)} ${selectedYear}`
            : `${selectedYear}`}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'expenses' && styles.filterTabActive]}
          onPress={() => setFilter('expenses')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'expenses' && styles.filterTabTextActive,
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'recurring' && styles.filterTabActive]}
          onPress={() => setFilter('recurring')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'recurring' && styles.filterTabTextActive,
            ]}
          >
            Recurring
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No items recorded for this period.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredItems.map((item) => {
            const category =
              typeof item.categoryId === 'object' ? item.categoryId : null;
            const date = new Date(item.date);

            return (
              <View key={item._id} style={styles.expenseItem}>
                <View style={styles.expenseMain}>
                  <View style={styles.expenseLeft}>
                    <View style={styles.expenseTop}>
                      <View
                        style={[
                          styles.expenseDot,
                          { backgroundColor: category?.color || '#666' },
                        ]}
                      />
                      <Text style={styles.categoryName}>
                        {category?.name || 'Unknown'}
                      </Text>
                      {item.isRecurring && (
                        <View style={styles.recurringBadge}>
                          <Text style={styles.recurringBadgeText}>R</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.expenseDescription}>
                      {item.description || 'No description'}
                    </Text>
                  </View>

                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseDate}>
                      {date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.expenseAmount}>
                      {formatCurrency(item.amount, currency)}
                    </Text>
                  </View>
                </View>

                {!item.isRecurring && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => navigation.navigate('EditExpense', { expenseId: item._id })}
                    >
                      <Text style={styles.actionButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item._id, !!item.isRecurring)}
                    >
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(38, 37, 44, 1)',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  expenseItem: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseLeft: {
    flex: 1,
    gap: 4,
  },
  expenseTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  recurringBadge: {
    marginLeft: 6,
    backgroundColor: '#3b82f6',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  expenseDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
