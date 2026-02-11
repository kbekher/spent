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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addRecurringPayment,
  editRecurringPayment,
  removeRecurringPayment,
  fetchRecurringPayments,
} from '../store/slices/recurringPaymentsSlice';
import { RecurringPayment } from '../types';
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
  const { items: categories } = useAppSelector((state) => state.categories) as { items: Array<{ _id: string; name: string; color: string }> };
  const currency = user?.currency || 'EUR';

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paymentName, setPaymentName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startMonth, setStartMonth] = useState('1');

  // Set up navigation params to allow header button to toggle view
  useFocusEffect(
    React.useCallback(() => {
      navigation.setParams({
        toggleView: () => {
          if (view === 'list') {
            setView('form');
          } else {
            // Cancel form and go back to list
            setView('list');
            setEditingId(null);
            setPaymentName('');
            setAmount('');
            setCategoryId(categories[0]?._id || '');
            setDayOfMonth('1');
            setFrequency('monthly');
            setStartMonth('1');
          }
        },
      });
    }, [view, navigation, categories])
  );

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
      
      setPaymentName('');
      setAmount('');
      setCategoryId(categories[0]?._id || '');
      setDayOfMonth('1');
      setFrequency('monthly');
      setStartMonth('1');
      setView('list');
    } catch {
      Alert.alert('Error', 'Failed to create recurring payment.');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!paymentName.trim() || !amount || !categoryId) return;

    const payment = payments.find((p) => p._id === id);
    if (!payment) return;

    const normalizedAmount = amount.replace(',', '.');
    const amountNum = parseFloat(normalizedAmount);

    try {
      await dispatch(
        editRecurringPayment({
          id,
          name: paymentName.trim(),
          amount: amountNum,
          categoryId,
          dayOfMonth: parseInt(dayOfMonth),
          frequency,
          startMonth: (frequency === 'quarterly' || frequency === 'yearly') ? parseInt(startMonth) : undefined,
          excludedMonths: payment.excludedMonths || [],
          isActive: payment.isActive,
        })
      ).unwrap();
      
      setPaymentName('');
      setAmount('');
      setCategoryId(categories[0]?._id || '');
      setDayOfMonth('1');
      setFrequency('monthly');
      setStartMonth('1');
      setEditingId(null);
      setView('list');
    } catch {
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
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
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
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
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
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
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
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
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
      </SafeAreaView>
    );
  }

  // List View
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {payments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No recurring payments yet. Set up your monthly expenses!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {payments.map((payment: any) => {
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    width: '100%',
  },
  formCard: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 16,
    width: '100%',
    maxWidth: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  picker: {
    height: 50,
    color: '#ffffff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
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
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
