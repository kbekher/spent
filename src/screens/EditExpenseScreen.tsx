import React, { useState } from 'react';
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
  updateExpense,
  optimisticUpdateExpense,
} from '../store/slices/expensesSlice';
import { Ionicons } from '@expo/vector-icons';
import CategoryChipSelector from '../components/CategoryChipSelector';

interface EditExpenseScreenProps {
  route: {
    params: {
      expenseId: string;
    };
  };
  navigation: any;
}

export default function EditExpenseScreen({ route, navigation }: EditExpenseScreenProps) {
  const { expenseId } = route.params;
  const dispatch = useAppDispatch();
  const { items: categories } = useAppSelector((state) => state.categories);
  const expense = useAppSelector((state) =>
    state.expenses.items.find((e) => e._id === expenseId)
  );

  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(
    typeof expense?.categoryId === 'object'
      ? (expense.categoryId as any)._id
      : expense?.categoryId || ''
  );
  const [description, setDescription] = useState(expense?.description || '');
  const [date, setDate] = useState(
    expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);

  if (!expense) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Expense not found.</Text>
      </View>
    );
  }

  const handleNumberPress = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return;
    setAmount(amount + num);
  };

  const handleBackspace = () => setAmount(amount.slice(0, -1));

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);

    dispatch(
      optimisticUpdateExpense({
        _id: expenseId,
        amount: amountNum,
        categoryId,
        description: description || undefined,
        date: new Date(date).toISOString(),
      })
    );

    try {
      await dispatch(
        updateExpense({
          id: expenseId,
          amount: amountNum,
          categoryId,
          description: description || undefined,
          date: new Date(date),
        })
      ).unwrap();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update expense.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const canNext1 = parseFloat(amount) > 0;
  const canNext2 = !!categoryId;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.stepDot, s === step && styles.stepDotActive]} />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Amount */}
        {step === 1 && (
          <>
            <View style={styles.amountDisplay}>
              <Text style={styles.currencySymbol}>$</Text>
              <Text style={styles.amountText}>{amount || '0'}</Text>
            </View>
            <View style={styles.keypad}>
              {[['1','2','3'],['4','5','6'],['7','8','9']].map((row, ri) => (
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
            <TouchableOpacity
              style={[styles.nextBtn, !canNext1 && styles.nextBtnDisabled]}
              onPress={() => setStep(2)}
              disabled={!canNext1}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 2 — Category */}
        {step === 2 && (
          <>
            <Text style={styles.stepLabel}>Select Category</Text>
            <CategoryChipSelector
              categories={categories}
              selectedId={categoryId}
              onSelect={(id) => setCategoryId(id)}
            />
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

        {/* Step 3 — Details */}
        {step === 3 && (
          <>
            <Text style={styles.stepLabel}>Edit Details</Text>

            {selectedCategory && (
              <View style={styles.summaryRow}>
                <View style={[styles.summaryDot, { backgroundColor: selectedCategory.color }]} />
                <Text style={[styles.summaryText, { color: selectedCategory.color }]}>
                  {selectedCategory.name}
                </Text>
                <Text style={styles.summaryAmount}>${amount}</Text>
              </View>
            )}

            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled, { flex: 1 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  errorText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 40 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepDotActive: { backgroundColor: '#8b5cf6', width: 20 },
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 100 },
  stepLabel: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 20 },
  amountDisplay: { alignItems: 'center', paddingVertical: 32, marginBottom: 16 },
  currencySymbol: { fontSize: 20, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: '600' },
  amountText: { fontSize: 56, fontWeight: '700', color: '#ffffff', letterSpacing: 1 },
  keypad: { gap: 12, marginBottom: 24 },
  keypadRow: { flexDirection: 'row', gap: 12 },
  key: {
    flex: 1, aspectRatio: 1.5, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  keyText: { fontSize: 32, fontWeight: '600', color: '#ffffff' },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 14, marginBottom: 16, gap: 10,
  },
  summaryDot: { width: 10, height: 10, borderRadius: 5 },
  summaryText: { fontSize: 16, fontWeight: '600', flex: 1 },
  summaryAmount: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  fieldLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 8, marginTop: 12 },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#ffffff', marginBottom: 8,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  backBtn: {
    paddingVertical: 18, paddingHorizontal: 20, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600' },
  nextBtn: {
    backgroundColor: '#8b5cf6', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 4,
  },
  nextBtnDisabled: { backgroundColor: 'rgba(139,92,246,0.3)', shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#8b5cf6', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: 'rgba(139,92,246,0.3)', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
});
