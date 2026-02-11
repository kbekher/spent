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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addExpense,
  optimisticAddExpense,
  optimisticDeleteExpense,
  type Expense,
} from '../store/slices/expensesSlice';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

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

  const handleNumberPress = (num: string) => {
    // Prevent multiple decimal points
    if (num === '.' && amount.includes('.')) return;
    
    // Limit to 2 decimal places
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return;
    
    setAmount(amount + num);
  };

  const handleBackspace = () => {
    setAmount(amount.slice(0, -1));
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleSubmit = async () => {
    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const amountNum = parseFloat(amount);
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Category Selector */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionLabel}>Category</Text>
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



        {/* Description Input */}
        <View style={styles.descriptionSection}>
          <TextInput
            style={styles.descriptionInput}
            value={expenseName}
            onChangeText={setExpenseName}
            placeholder="Add description (optional)"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
          />
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('1')}>
              <Text style={styles.keyText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('2')}>
              <Text style={styles.keyText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('3')}>
              <Text style={styles.keyText}>3</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('4')}>
              <Text style={styles.keyText}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('5')}>
              <Text style={styles.keyText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('6')}>
              <Text style={styles.keyText}>6</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('7')}>
              <Text style={styles.keyText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('8')}>
              <Text style={styles.keyText}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => handleNumberPress('9')}>
              <Text style={styles.keyText}>9</Text>
            </TouchableOpacity>
          </View>

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

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (loading || !categoryId || !amount || parseFloat(amount) <= 0) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || !categoryId || !amount || parseFloat(amount) <= 0}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Add Expense</Text>
          )}
        </TouchableOpacity>
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
    width: '100%',
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
    opacity: 0.8,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  picker: {
    height: 50,
    color: '#ffffff',
  },
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
    position: 'relative',
  },
  currencySymbol: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  doneIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyText: {
    fontSize: 32,
    fontWeight: '600',
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
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
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
