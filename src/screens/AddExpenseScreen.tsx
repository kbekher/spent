import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addExpense,
  optimisticAddExpense,
  optimisticDeleteExpense,
  type Expense,
} from '../store/slices/expensesSlice';
import { Picker } from '@react-native-picker/picker';

interface AddExpenseScreenProps {
  navigation: any;
}

export default function AddExpenseScreen({ navigation }: AddExpenseScreenProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: categories } = useAppSelector((state) => state.categories);

  const [categoryId, setCategoryId] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDone, setShowDone] = useState(false);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId]);

  const handleAmountChange = (value: string) => {
    // Allow only numbers and one decimal separator (period or comma)
    if (value === '' || /^\d*[.,]?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    // Convert comma to period for parsing
    const normalizedAmount = amount.replace(',', '.');
    const amountNum = parseFloat(normalizedAmount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Prevent double submission
    if (submitting || loading) {
      return;
    }

    setSubmitting(true);
    setLoading(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticExpense: Expense = {
      _id: tempId,
      userId: user?._id || '',
      amount: amountNum,
      categoryId: categories.find((c) => c._id === categoryId) || categoryId,
      description: expenseName || undefined,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    dispatch(optimisticAddExpense(optimisticExpense));

    // Show done indicator
    setShowDone(true);
    setTimeout(() => setShowDone(false), 2000);

    // Sync with backend
    try {
      await dispatch(
        addExpense({
          userId: user?._id || '',
          amount: amountNum,
          categoryId,
          description: expenseName || undefined,
          date: new Date(),
        })
      ).unwrap();

      // Clear form
      setExpenseName('');
      setAmount('');

      // Navigate back after successful creation
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      // On error, remove optimistic update
      dispatch(optimisticDeleteExpense(tempId));
      const errorMsg =
        error?.message || 'Failed to add expense. Please try again.';
      Alert.alert('Error', errorMsg);
      setShowDone(false);
    } finally {
      setLoading(false);
      setSubmitting(false);
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

  const selectedCategory = categories.find((c) => c._id === categoryId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Add Expense</Text>
          {showDone && (
            <View style={styles.doneIndicator}>
              <Text style={styles.doneText}>Done ✓</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          {/* Category Picker */}
          <View style={styles.formField}>
            <Text style={styles.label}>Category</Text>
            <View
              style={[
                styles.pickerContainer,
                selectedCategory && { borderColor: selectedCategory.color },
              ]}
            >
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
            {selectedCategory && (
              <View style={styles.categoryPreview}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: selectedCategory.color },
                  ]}
                />
                <Text
                  style={[styles.categoryName, { color: selectedCategory.color }]}
                >
                  {selectedCategory.name}
                </Text>
              </View>
            )}
          </View>

          {/* Expense Name */}
          <View style={styles.formField}>
            <Text style={styles.label}>Expense Name (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={expenseName}
              onChangeText={setExpenseName}
              placeholder="e.g., Groceries, Coffee"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Amount */}
          <View style={styles.formField}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.textInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (loading || !categoryId || !amount) && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={loading || !categoryId || !amount}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitBtnText}>Add Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
    flex: 1,
  },
  doneIndicator: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
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
  submitBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
});
