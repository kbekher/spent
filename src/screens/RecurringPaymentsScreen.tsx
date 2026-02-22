import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addRecurringPayment,
  editRecurringPayment,
  removeRecurringPayment,
  fetchRecurringPayments,
} from '../store/slices/recurringPaymentsSlice';
import SkeletonBox from '../components/SkeletonBox';
import ErrorState from '../components/ErrorState';
import { RecurringPayment } from '../types';
import { formatCurrency } from '../utils/currency';
import CategoryChipSelector from '../components/CategoryChipSelector';
import { Ionicons } from '@expo/vector-icons';
import { getRandomCategoryColor } from '../utils/categoryColors';
import { addCategory, optimisticAddCategory, optimisticDeleteCategory } from '../store/slices/categoriesSlice';

interface RecurringPaymentsScreenProps {
  navigation: any;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function RecurringPaymentsScreen({
  navigation,
}: RecurringPaymentsScreenProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: categories } = useAppSelector((state) => state.categories);
  const { items: recurringPayments, loading: recurringLoading } = useAppSelector(
    (state) => state.recurringPayments
  );
  const currency = user?.currency || 'EUR';

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Multi-step form state
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startMonth, setStartMonth] = useState('1');
  const [startDay, setStartDay] = useState('1');
  const [paymentName, setPaymentName] = useState('');
  const [loading, setLoading] = useState(false);


  // Set default category
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId]);

  const resetForm = () => {
    setStep(1);
    setEditingId(null);
    setAmount('');
    setCategoryId('');
    setFrequency('monthly');
    setStartMonth('1');
    setPaymentName('');
    setStartDay('1');
  };

  // Reset form when switching views
  useEffect(() => {
    if (view === 'list') {
      resetForm();
    }
  }, [view]);

  // Set up navigation params to allow header button to toggle view
  useFocusEffect(
    useCallback(() => {
      navigation.setParams({
        toggleView: () => {
          if (view === 'list') {
            setView('form');
            setStep(1);
          } else {
            // Cancel form and go back to list
            resetForm();
            setView('list');
          }
        },
      });
    }, [view, navigation])
  );

  const handleNumberPress = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return;
    setAmount(amount + num);
  };

  const handleBackspace = () => setAmount(amount.slice(0, -1));

  const handleCreateCategory = async (name: string) => {
    if (!user?._id) return;
    const color = getRandomCategoryColor();
    const tempId = `temp-${Date.now()}`;
    dispatch(
      optimisticAddCategory({
        _id: tempId,
        userId: user._id,
        name,
        color,
        createdAt: new Date().toISOString(),
      })
    );
    try {
      const result = await dispatch(
        addCategory({ userId: user._id, name, color })
      ).unwrap();
      setCategoryId(result._id);
    } catch {
      dispatch(optimisticDeleteCategory(tempId));
      Alert.alert('Error', 'Failed to create category.');
    }
  };

  const handleSubmit = async () => {
    // Validate name (required, non-empty)
    if (!paymentName || !paymentName.trim()) {
      Alert.alert('Error', 'Please enter a payment name');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const dayNum = parseInt(startDay);
    if (!dayNum || dayNum < 1 || dayNum > 31) {
      Alert.alert('Error', 'Please enter a valid day of month (1-31)');
      return;
    }

    // Note: We save the user's selected day as-is (e.g., 31)
    // Day normalization happens when materializing expenses for specific months
    // (e.g., day 31 in February will become Feb 28/29 when materializing)

    if (loading) return;
    setLoading(true);

    try {
      if (editingId) {
        const payment = recurringPayments.find((p) => p._id === editingId);
        if (!payment) return;

        await dispatch(
          editRecurringPayment({
            id: editingId,
            name: paymentName.trim(),
            amount: amountNum,
            categoryId,
            frequency,
            startDay: dayNum,
            startMonth: (frequency === 'quarterly' || frequency === 'yearly') ? parseInt(startMonth) : undefined,
            excludedMonths: payment.excludedMonths || [],
            isActive: payment.isActive,
          })
        ).unwrap();
      } else {
        await dispatch(
          addRecurringPayment({
            userId: user?._id || '',
            name: paymentName.trim(),
            amount: amountNum,
            categoryId,
            frequency,
            startDay: dayNum,
            startMonth: (frequency === 'quarterly' || frequency === 'yearly') ? parseInt(startMonth) : undefined,
          })
        ).unwrap();
      }

      resetForm();
      setView('list');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save recurring payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this recurring payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeRecurringPayment(id)).unwrap();
            } catch {
              Alert.alert('Error', 'Failed to delete recurring payment.');
            }
          },
        },
      ]
    );
  };

  const startEdit = (payment: any) => {
    setEditingId(payment._id);
    setAmount(payment.amount.toString());
    setCategoryId(
      typeof payment.categoryId === 'object'
        ? payment.categoryId._id
        : payment.categoryId
    );
    setFrequency(payment.frequency || 'monthly');
    setStartMonth(payment.startMonth?.toString());
    setPaymentName(payment.name);
    setStartDay(payment.startDay.toString());
    setStep(1);
    setView('form');
  };

  const getFrequencyLabel = (freq: string, startMonth?: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (freq) {
      case 'monthly':
        return 'Once a month';
      case 'quarterly':
        return startMonth ? `Quarterly (${monthNames[startMonth - 1]})` : 'Once per 3 months';
      case 'yearly':
        return startMonth ? `Yearly (${monthNames[startMonth - 1]})` : 'Once a year';
      default:
        return 'Once a month';
    }
  };

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const canNext1 = paymentName.trim().length > 0; // Step 1: Name required
  const canNext2 = parseFloat(amount) > 0; // Step 2: Amount required
  const canNext3 = !!categoryId; // Step 3: Category required
  const canNext4 = true; // Step 4: Frequency always has a default
  const canSubmit = parseInt(startDay) >= 1 && parseInt(startDay) <= 31 && paymentName.trim().length > 0; // Step 5: Overview - validate all

  // if (recurringError && recurringPayments.length === 0) {
  //   console.log('recurringError', recurringError);
  //   return (
  //     <SafeAreaView style={styles.container} edges={['bottom']}>
  //       <ErrorState
  //         message={recurringError}
  //         onRetry={() => user?._id && dispatch(fetchRecurringPayments(user._id))}
  //       />
  //     </SafeAreaView>
  //   );
  // }

  // if (recurringLoading && recurringPayments.length === 0) {
  //   return (
  //     <SafeAreaView style={styles.container} edges={['bottom']}>
  //       <View style={{ padding: 16, gap: 10 }}>
  //         <SkeletonBox height={80} borderRadius={12} />
  //         <SkeletonBox height={80} borderRadius={12} />
  //         <SkeletonBox height={80} borderRadius={12} />
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // if (recurringPayments.length === 0) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.emptyState}>
  //         <Text style={styles.emptyStateText}>
  //           No Reccuring payments found
  //         </Text>
  //       </View>
  //     </View>
  //   );
  // }

  // Form View - Multi-step
  if (view === 'form') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={[styles.stepDot, s === step && styles.stepDotActive]} />
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 — Name */}
          {step === 1 && (
            <>
              <Text style={styles.stepLabel}>Payment Name</Text>
              <TextInput
                style={styles.textInput}
                value={paymentName}
                onChangeText={setPaymentName}
                placeholder="e.g., Rent, Netflix, Gym"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.nextBtn, !canNext1 && styles.nextBtnDisabled]}
                onPress={() => setStep(2)}
                disabled={!canNext1}
              >
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 2 — Amount */}
          {step === 2 && (
            <>
              <View style={styles.amountDisplay}>
                <Text style={styles.currencySymbol}>{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'UAH' ? '₴' : currency === 'GBP' ? '£' : '$'}</Text>
                <Text style={styles.amountText}>{amount || '0'}</Text>
              </View>
              <View style={styles.keypad}>
                {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, ri) => (
                  <View key={ri} style={styles.keypadRow}>
                    {row.map((n) => (
                      <TouchableOpacity key={n} style={styles.key} onPress={() => handleNumberPress(n)}>
                        <Text style={styles.keyText}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <View style={styles.keypadRow}>
                  <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('.')}>
                    <Text style={styles.keyText}>.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('0')}>
                    <Text style={styles.keyText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.key} onPress={handleBackspace}>
                    <Ionicons name="backspace-outline" size={28} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, !canNext2 && styles.nextBtnDisabled, { flex: 1 }]}
                  onPress={() => setStep(3)}
                  disabled={!canNext2}
                >
                  <Text style={styles.nextBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 3 — Category */}
          {step === 3 && (
            <>
              <Text style={styles.stepLabel}>Select Category</Text>
              <CategoryChipSelector
                categories={categories}
                selectedId={categoryId}
                onSelect={(id) => setCategoryId(id)}
                onCreateNew={handleCreateCategory}
              />
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, !canNext3 && styles.nextBtnDisabled, { flex: 1 }]}
                  onPress={() => setStep(4)}
                  disabled={!canNext3}
                >
                  <Text style={styles.nextBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 4 — Frequency */}
          {step === 4 && (
            <>
              <Text style={styles.stepLabel}>Frequency</Text>
              <View style={styles.frequencyRow}>
                {(['monthly', 'quarterly', 'yearly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.freqChip,
                      frequency === freq && styles.freqChipActive,
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.freqChipText,
                        frequency === freq && styles.freqChipTextActive,
                      ]}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Day of Month</Text>
                <View style={styles.daySelector}>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        startDay === day && styles.dayChipActive,
                      ]}
                      onPress={() => setStartDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          startDay === day && styles.dayChipTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(frequency === 'quarterly' || frequency === 'yearly') && (
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Start Month</Text>
                  <View style={styles.monthSelector}>
                    {MONTH_NAMES.map((month, index) => (
                      <TouchableOpacity
                        key={index + 1}
                        style={[
                          styles.monthChip,
                          startMonth === (index + 1).toString() && styles.monthChipActive,
                        ]}
                        onPress={() => setStartMonth((index + 1).toString())}
                      >
                        <Text
                          style={[
                            styles.monthChipText,
                            startMonth === (index + 1).toString() && styles.monthChipTextActive,
                          ]}
                        >
                          {month.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, !canNext4 && styles.nextBtnDisabled, { flex: 1 }]}
                  onPress={() => setStep(5)}
                  disabled={!canNext4}
                >
                  <Text style={styles.nextBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 5 — Overview */}
          {step === 5 && (
            <>
              <Text style={styles.stepLabel}>Overview</Text>

              {selectedCategory && (
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryDot, { backgroundColor: selectedCategory.color }]} />
                  <Text style={[styles.summaryText, { color: selectedCategory.color }]}>
                    {selectedCategory.name}
                  </Text>
                  <Text style={styles.summaryAmount}>{formatCurrency(parseFloat(amount) || 0, currency)}</Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.fieldLabel}>Name:</Text>
                <Text style={styles.summaryText}>{paymentName || 'Not set'}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.fieldLabel}>Frequency:</Text>
                <Text style={styles.summaryText}>
                  {frequency === 'monthly' ? 'Monthly' : frequency === 'quarterly' ? 'Quarterly' : 'Yearly'}
                  {frequency === 'monthly' && ` • Day ${startDay}`}
                  {(frequency === 'quarterly' || frequency === 'yearly') && startMonth && ` • ${MONTH_NAMES[parseInt(startMonth) - 1]}`}
                </Text>
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(4)}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled, { flex: 1 }]}
                  onPress={handleSubmit}
                  disabled={loading || !canSubmit}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {editingId ? 'Update' : 'Save'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // List View
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {recurringPayments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No recurring payments yet. Set up your monthly expenses!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {recurringPayments.map((payment: any) => {
            const categoryObj =
              typeof payment.categoryId === 'object'
                ? payment.categoryId
                : categories.find((c) => c._id === payment.categoryId) || null;
            return (
              <View key={payment._id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentHeader}>
                    <View
                      style={[
                        styles.paymentDot,
                        { backgroundColor: categoryObj?.color || '#666' },
                      ]}
                    />
                    <Text style={styles.paymentName}>{payment.name}</Text>
                  </View>
                  <Text style={styles.paymentDetails}>
                    {getFrequencyLabel(payment.frequency || 'monthly', payment.startMonth)} {payment.frequency === 'monthly' ? `• Day ${payment.startDay}` : ''}
                  </Text>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amount, currency)}
                  </Text>
                </View>
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEdit(payment)}
                  >
                    <Ionicons name="create-outline" size={18} color="#8b5cf6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(payment._id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepDotActive: {
    backgroundColor: '#8b5cf6',
    width: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
    width: '100%',
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
  },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  keypad: {
    gap: 12,
    marginBottom: 24,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    flex: 1,
    aspectRatio: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keyText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  nextBtnDisabled: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  freqChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
  },
  freqChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  freqChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  freqChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dayChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  dayChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  fieldHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  monthChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  monthChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#ffffff',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  paymentItem: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentInfo: {
    flex: 1,
    gap: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flexShrink: 1,
  },
  paymentDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  },
});
