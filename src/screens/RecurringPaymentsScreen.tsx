import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
  fetchRecurringPayments,
  optimisticAddRecurringPayment,
  optimisticUpdateRecurringPayment,
  optimisticDeleteRecurringPayment,
  type RecurringPayment,
} from '../store/slices/recurringPaymentsSlice';
import { Picker } from '@react-native-picker/picker';
import { formatCurrency } from '../utils/currency';

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
  const { items: payments } = useAppSelector((state) => state.recurringPayments);
  const { items: categories } = useAppSelector((state) => state.categories);
  const currency = user?.currency || 'EUR';

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paymentName, setPaymentName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startMonth, setStartMonth] = useState('1');

  // Set default category
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId]);

  // Reset form
  useEffect(() => {
    if (view === 'list') {
      setEditingId(null);
      setPaymentName('');
      setAmount('');
      setCategoryId(categories[0]?._id || '');
      setDayOfMonth('1');
      setFrequency('monthly');
      setStartMonth('1');
    }
  }, [view, categories]);

  const handleCreate = async () => {
    if (!paymentName.trim() || !amount || !categoryId) return;

    const normalizedAmount = amount.replace(',', '.');
    const amountNum = parseFloat(normalizedAmount);

    const tempId = `temp-${Date.now()}`;
    dispatch(
      optimisticAddRecurringPayment({
        _id: tempId,
        userId: user?._id || '',
        name: paymentName.trim(),
        amount: amountNum,
        categoryId: categories.find((c) => c._id === categoryId) || categoryId,
        dayOfMonth: parseInt(dayOfMonth),
        frequency,
        startMonth: (frequency === 'quarterly' || frequency === 'yearly') ? parseInt(startMonth) : undefined,
        excludedMonths: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      })
    );

    setView('list');

    try {
      await dispatch(
        addRecurringPayment({
          userId: user?._id || '',
          name: paymentName.trim(),
          amount: amountNum,
          categoryId,
          dayOfMonth: parseInt(dayOfMonth),
          frequency,
          startMonth: (frequency === 'quarterly' || frequency === 'yearly') ? parseInt(startMonth) : undefined,
        })
      ).unwrap();
    } catch {
      dispatch(optimisticDeleteRecurringPayment(tempId));
      Alert.alert('Error', 'Failed to create recurring payment.');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!paymentName.trim() || !amount || !categoryId) return;

    const payment = payments.find((p) => p._id === id);
    if (!payment) return;

    const normalizedAmount = amount.replace(',', '.');
    const amountNum = parseFloat(normalizedAmount);

    dispatch(
      optimisticUpdateRecurringPayment({
        ...payment,
        name: paymentName.trim(),
        amount: amountNum,
        categoryId: categories.find((c) => c._id === categoryId) || categoryId,
        dayOfMonth: parseInt(dayOfMonth),
        frequency,
        startMonth: (frequency === 'quarterly' || frequency === 'yearly') ? parseInt(startMonth) : undefined,
      })
    );

    setView('list');

    try {
      await dispatch(
        updateRecurringPayment({
          id,
          name: paymentName.trim(),
          amount: amountNum,
          categoryId,
          dayOfMonth: parseInt(dayOfMonth),
          frequency,
          startMonth: (frequency === 'quarterly' || frequency === 'yearly') ? parseInt(startMonth) : undefined,
          excludedMonths: payment.excludedMonths,
          isActive: payment.isActive,
        })
      ).unwrap();
    } catch {
      dispatch(fetchRecurringPayments(user?._id || ''));
      Alert.alert('Error', 'Failed to update recurring payment.');
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
            dispatch(optimisticDeleteRecurringPayment(id));
            try {
              await dispatch(deleteRecurringPayment(id)).unwrap();
            } catch {
              dispatch(fetchRecurringPayments(user?._id || ''));
              Alert.alert('Error', 'Failed to delete recurring payment.');
            }
          },
        },
      ]
    );
  };

  const startEdit = (payment: RecurringPayment) => {
    setEditingId(payment._id);
    setPaymentName(payment.name);
    setAmount(payment.amount.toString());
    setCategoryId(
      typeof payment.categoryId === 'object'
        ? payment.categoryId._id
        : payment.categoryId
    );
    setDayOfMonth(payment.dayOfMonth.toString());
    setFrequency(payment.frequency || 'monthly');
    setStartMonth(payment.startMonth?.toString() || '1');
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

  if (categories.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            ⚠️ No categories found. Please create a category first.
          </Text>
        </View>
      </View>
    );
  }

  // Form View
  if (view === 'form') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>
              {editingId ? 'Edit Payment' : 'Add Payment'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formField}>
              <Text style={styles.label}>Payment Name</Text>
              <TextInput
                style={styles.textInput}
                value={paymentName}
                onChangeText={setPaymentName}
                placeholder="e.g., Rent, Netflix, Gym"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Amount ({currency})</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={(value) => {
                  if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
                    setAmount(value);
                  }
                }}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={categoryId}
                  onValueChange={(value) => setCategoryId(value)}
                  style={styles.picker}
                >
                  {categories.map((cat) => (
                    <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={frequency}
                  onValueChange={(value: any) => setFrequency(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Once a month" value="monthly" />
                  <Picker.Item label="Once per 3 months" value="quarterly" />
                  <Picker.Item label="Once a year" value="yearly" />
                </Picker>
              </View>
            </View>

            {(frequency === 'quarterly' || frequency === 'yearly') && (
              <View style={styles.formField}>
                <Text style={styles.label}>Start Month</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={startMonth}
                    onValueChange={(value) => setStartMonth(value)}
                    style={styles.picker}
                  >
                    {MONTH_NAMES.map((month, index) => (
                      <Picker.Item key={index + 1} label={month} value={(index + 1).toString()} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.label}>Day of Month</Text>
              <TextInput
                style={styles.textInput}
                value={dayOfMonth}
                onChangeText={setDayOfMonth}
                placeholder="1-31"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setView('list')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={() => {
              if (editingId) {
                handleUpdate(editingId);
              } else {
                handleCreate();
              }
            }}
          >
            <Text style={styles.submitButtonText}>
              {editingId ? 'Update' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // List View
  return (
    <View style={styles.container}>
      {payments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No recurring payments yet. Set up your monthly expenses!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {payments.map((payment) => {
            const category =
              typeof payment.categoryId === 'object' ? payment.categoryId : null;

            return (
              <View key={payment._id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentHeader}>
                    <View
                      style={[
                        styles.paymentDot,
                        { backgroundColor: category?.color || '#666' },
                      ]}
                    />
                    <Text style={styles.paymentName}>{payment.name}</Text>
                  </View>
                  <Text style={styles.paymentDetails}>
                    {getFrequencyLabel(payment.frequency || 'monthly', payment.startMonth)} • Day {payment.dayOfMonth}
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
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(payment._id)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => setView('form')}>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  form: {
    gap: 20,
  },
  formField: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  paymentItem: {
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
  },
  paymentDetails: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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
