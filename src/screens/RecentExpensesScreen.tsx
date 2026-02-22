import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  removeExpense,
  createExpenseFromRecurring,
  fetchExpenses,
} from '../store/slices/expensesSlice';
import { formatCurrency } from '../utils/currency';
import { isRecurringActiveForMonth } from '../utils/recurringUtils';
import * as api from '../services/api';

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
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: expenses } = useAppSelector((state) => state.expenses);
  const { items: categories } = useAppSelector((state) => state.categories);
  const { items: recurringPayments } = useAppSelector(
    (state) => state.recurringPayments
  );
  const currency = user?.currency || 'EUR';

  const [filter, setFilter] = useState<'all' | 'expenses' | 'recurring'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [materializing, setMaterializing] = useState(false);

  // Track processed months to prevent re-materialization
  const processedMonthRef = useRef<string | null>(null);
  const isMaterializingRef = useRef(false);
  // Store latest expenses in ref to avoid stale closure
  const expensesRef = useRef(expenses);
  
  // Update ref whenever expenses change
  React.useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);
  
  // Reset processed month when month/year changes
  React.useEffect(() => {
    processedMonthRef.current = null;
  }, [selectedYear, selectedMonth]);

  // Filter expenses based on selected date
  const startDate =
    viewMode === 'month'
      ? new Date(selectedYear, selectedMonth - 1, 1)
      : new Date(selectedYear, 0, 1);
  const endDate =
    viewMode === 'month'
      ? new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      : new Date(selectedYear, 11, 31, 23, 59, 59);

  // Materialize recurring payments as expenses for the selected month
  useFocusEffect(
    useCallback(() => {
      if (viewMode !== 'month' || !user?._id) {
        processedMonthRef.current = null;
        return;
      }

      const monthKey = `${selectedYear}-${selectedMonth}`;
      
      // Skip if already processed this month or currently materializing
      if (processedMonthRef.current === monthKey || isMaterializingRef.current) {
        return;
      }

      const materializeRecurringPayments = async () => {
        // Prevent concurrent materialization
        if (isMaterializingRef.current) return;
        
        isMaterializingRef.current = true;
        setMaterializing(true);
        
        try {
          // Get current expenses from ref (always latest value, avoids stale closure)
          const currentExpenses = expensesRef.current;
          
          // Get active recurring payments for this month
          const activeRecurring = recurringPayments.filter((p) =>
            isRecurringActiveForMonth(p, selectedYear, selectedMonth)
          );

          // Check which ones don't have expenses yet
          const expensesForMonth = currentExpenses.filter((exp) => {
            const expDate = new Date(exp.date);
            return (
              expDate >= startDate &&
              expDate <= endDate &&
              exp.recurringTemplateId
            );
          });

          const existingTemplateIds = new Set(
            expensesForMonth.map((exp) => exp.recurringTemplateId).filter(Boolean)
          );

          // Materialize missing recurring payments
          const materializePromises = activeRecurring
            .filter((p) => !existingTemplateIds.has(p._id))
            .map((p) =>
              dispatch(
                createExpenseFromRecurring({
                  recurringPayment: {
                    _id: p._id,
                    userId: p.userId,
                    amount: p.amount,
                    categoryId: p.categoryId,
                    name: p.name,
                    startDay: p.startDay,
                  },
                  year: selectedYear,
                  month: selectedMonth,
                })
              )
            );

          await Promise.all(materializePromises);

          // Refresh expenses list only if we created new expenses
          if (materializePromises.length > 0) {
            await dispatch(fetchExpenses({ userId: user._id })).unwrap();
          }
          
          // Mark this month as processed
          processedMonthRef.current = monthKey;
        } catch (error) {
          console.error('Failed to materialize recurring payments:', error);
          // Reset on error so it can retry
          processedMonthRef.current = null;
        } finally {
          isMaterializingRef.current = false;
          setMaterializing(false);
        }
      };

      materializeRecurringPayments();
    }, [
      viewMode,
      selectedYear,
      selectedMonth,
      recurringPayments,
      user?._id,
      dispatch,
      startDate,
      endDate,
      // Note: expenses is intentionally NOT in dependencies to prevent infinite loop
      // We read it directly inside the callback when needed
    ])
  );

  // Get expenses for the selected period (including materialized recurring instances)
  const allItems: DisplayItem[] = useMemo(
    () => {
      let filteredExpenses = expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= endDate;
      });

      // Apply category filter if selected
      if (selectedCategoryId) {
        filteredExpenses = filteredExpenses.filter((exp) => {
          const catId = typeof exp.categoryId === 'object' 
            ? (exp.categoryId as any)?._id 
            : exp.categoryId;
          return catId === selectedCategoryId;
        });
      }

      // Map expenses to DisplayItem format
      return filteredExpenses.map((exp): DisplayItem => ({
        _id: exp._id,
        userId: exp.userId,
        amount: exp.amount,
        categoryId: exp.categoryId,
        description: exp.description,
        date: exp.date,
        createdAt: exp.createdAt,
        isRecurring: !!exp.recurringTemplateId,
      }));
    },
    [expenses, startDate, endDate, selectedCategoryId]
  );

  // Apply type filter (all/expenses/recurring)
  const filteredItems = allItems
    .filter((item) => {
      if (filter === 'expenses') return !item.isRecurring;
      if (filter === 'recurring') return item.isRecurring;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = async (id: string, isRecurring: boolean) => {
    if (id.startsWith('temp-')) {
      Alert.alert(
        'Please Wait',
        "This expense hasn't been saved yet. Please wait a moment and try again."
      );
      return;
    }

    const expense = expenses.find((e) => e._id === id);
    if (!expense) return;

    if (isRecurring && expense.recurringTemplateId) {
      // For recurring instances: exclude the period and delete the expense
      const periodKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long' });
      const templateId = expense.recurringTemplateId;
      
      Alert.alert(
        'Skip Recurring Payment',
        `Skip this recurring payment for ${monthName} ${selectedYear}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Skip',
            style: 'destructive',
            onPress: async () => {
              try {
                // Exclude the period
                await api.excludeRecurringPeriod(templateId, periodKey);
                // Delete the expense instance
                await dispatch(removeExpense(id)).unwrap();
                // Refresh expenses
                if (user?._id) {
                  await dispatch(fetchExpenses({ userId: user._id })).unwrap();
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to skip recurring payment.');
              }
            },
          },
        ]
      );
      return;
    }

    // For regular expenses: normal delete
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
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

      {/* Category Filter */}
      {categories.length > 0 && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterChip,
                !selectedCategoryId && styles.categoryFilterChipActive,
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text
                style={[
                  styles.categoryFilterChipText,
                  !selectedCategoryId && styles.categoryFilterChipTextActive,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                style={[
                  styles.categoryFilterChip,
                  selectedCategoryId === cat._id && styles.categoryFilterChipActive,
                  selectedCategoryId === cat._id && { backgroundColor: cat.color },
                ]}
                onPress={() => setSelectedCategoryId(cat._id)}
              >
                <View style={[styles.categoryFilterDot, { backgroundColor: cat.color }]} />
                <Text
                  style={[
                    styles.categoryFilterChipText,
                    selectedCategoryId === cat._id && styles.categoryFilterChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
            {selectedCategoryId
              ? 'No expenses for this category in this period.'
              : 'No items recorded for this period.'}
          </Text>
          {selectedCategoryId && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text style={styles.clearFilterButtonText}>Clear filter</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredItems.map((item) => {
            // Resolve category - check if it's an object or needs lookup
            let category = typeof item.categoryId === 'object' ? item.categoryId : null;
            if (!category && typeof item.categoryId === 'string') {
              category = categories.find((c) => c._id === item.categoryId) || null;
            }
            
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

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => (navigation as any).navigate('EditExpense', { expenseId: item._id })}
                  >
                    <Ionicons name="create-outline" size={18} color="#8b5cf6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item._id, !!item.isRecurring)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
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
  categoryFilterContainer: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryFilterScroll: {
    gap: 8,
    paddingRight: 16,
  },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  categoryFilterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  categoryFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryFilterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  categoryFilterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
    alignItems: 'center',
  },
  expenseLeft: {
    flex: 1,
    gap: 4,
    marginRight: 12,
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
    minWidth: 80,
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
    marginRight: 12,
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
    marginBottom: 12,
  },
  clearFilterButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
  clearFilterButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
