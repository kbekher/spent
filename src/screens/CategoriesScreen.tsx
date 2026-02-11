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
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  optimisticAddCategory,
  optimisticUpdateCategory,
  optimisticDeleteCategory,
} from '../store/slices/categoriesSlice';
import { syncCategoryUpdate as syncExpenseCategory } from '../store/slices/expensesSlice';
import { syncCategoryUpdate as syncRecurringCategory } from '../store/slices/recurringPaymentsSlice';
import { CATEGORY_COLORS } from '../utils/categoryColors';

interface CategoriesScreenProps {
  navigation: any;
}

export default function CategoriesScreen({ navigation }: CategoriesScreenProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: categories } = useAppSelector((state) => state.categories);

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);

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
            setCategoryName('');
            setSelectedColor(CATEGORY_COLORS[0]);
          }
        },
      });
    }, [view, navigation])
  );
  const [showDone, setShowDone] = useState(false);

  // Reset form when view changes
  useEffect(() => {
    if (view === 'list') {
      setEditingId(null);
      setCategoryName('');
      setSelectedColor(CATEGORY_COLORS[0]);
    }
  }, [view]);

  const handleCreate = async () => {
    if (!categoryName.trim()) return;

    const name = categoryName.trim();
    const color = selectedColor;

    const tempId = `temp-${Date.now()}`;
    dispatch(
      optimisticAddCategory({
        _id: tempId,
        userId: user?._id || '',
        name,
        color,
        createdAt: new Date().toISOString(),
      })
    );

    setShowDone(true);
    setCategoryName('');
    setSelectedColor(CATEGORY_COLORS[0]);

    try {
      await dispatch(
        addCategory({
          userId: user?._id || '',
          name,
          color,
        })
      ).unwrap();

      setTimeout(() => {
        setShowDone(false);
        setView('list');
      }, 1500);
    } catch {
      dispatch(optimisticDeleteCategory(tempId));
      setShowDone(false);
      Alert.alert('Error', 'Failed to create category. It might already exist.');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!categoryName.trim()) return;

    const category = categories.find((c) => c._id === id);
    if (!category) return;

    const name = categoryName.trim();
    const color = selectedColor;

    dispatch(
      optimisticUpdateCategory({
        ...category,
        name,
        color,
      })
    );
    dispatch(
      syncExpenseCategory({
        _id: id,
        name,
        color,
      })
    );
    dispatch(
      syncRecurringCategory({
        _id: id,
        name,
        color,
      })
    );

    setShowDone(true);
    setCategoryName('');
    setSelectedColor(CATEGORY_COLORS[0]);
    setEditingId(null);

    try {
      await dispatch(
        updateCategory({
          id,
          name,
          color,
        })
      ).unwrap();

      setTimeout(() => {
        setShowDone(false);
        setView('list');
      }, 1500);
    } catch {
      dispatch(fetchCategories(user?._id || ''));
      setShowDone(false);
      Alert.alert('Error', 'Failed to update category.');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            dispatch(optimisticDeleteCategory(id));

            try {
              await dispatch(deleteCategory(id)).unwrap();
            } catch {
              dispatch(fetchCategories(user?._id || ''));
              Alert.alert('Error', 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setCategoryName(name);
    setSelectedColor(color);
    setView('form');
  };

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
              {editingId ? 'Edit Category' : 'Add Category'}
            </Text>
            {showDone && (
              <View style={styles.doneIndicator}>
                <Text style={styles.doneText}>Done ✓</Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.formField}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.textInput}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="e.g., Food, Transport"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoFocus
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorPicker}>
                {CATEGORY_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
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
              {editingId ? 'Update' : 'Add'} Category
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
      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No categories yet. Create your first category!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <View key={category._id} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <View
                  style={[styles.categoryDot, { backgroundColor: category.color }]}
                />
                <Text style={[styles.categoryName, { color: category.color }]}>
                  {category.name}
                </Text>
              </View>

              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => startEdit(category._id, category.name, category.color)}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(category._id)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
    marginBottom: 24,
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
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#ffffff',
    borderWidth: 3,
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
    shadowRadius: 16,
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
  categoryItem: {
    backgroundColor: 'rgba(38, 37, 44, 1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    maxWidth: '100%',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 32,
    height: 32,
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flexShrink: 1,
  },
  categoryActions: {
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
