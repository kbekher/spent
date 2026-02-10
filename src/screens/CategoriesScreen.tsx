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
      <ScrollView
        style={styles.container}
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
                placeholderTextColor="#94a3b8"
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
    );
  }

  // List View
  return (
    <View style={styles.container}>
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

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setView('form')}
        >
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
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
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
    borderColor: '#1e293b',
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
  categoryItem: {
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
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryActions: {
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
