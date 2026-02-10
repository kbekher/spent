import React, { useState, useEffect } from 'react';
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
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';
import { Picker } from '@react-native-picker/picker';
import * as api from '../services/api';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [currency, setCurrency] = useState(user?.currency || 'EUR');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || user?.username || '');
    setCurrency(user?.currency || 'EUR');
  }, [user?.displayName, user?.currency, user?.username]);

  const handleSave = async () => {
    if (!user?._id) return;

    setLoading(true);
    setSaved(false);

    try {
      await api.updateUserSettings(user._id, {
        displayName: displayName.trim(),
        currency,
      });

      setSaved(true);
      Alert.alert('Success', 'Settings saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logoutUser());
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Account Settings</Text>
          {saved && (
            <View style={styles.savedIndicator}>
              <Text style={styles.savedText}>Saved ✓</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <View style={styles.formField}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={currency}
                onValueChange={(value) => setCurrency(value)}
                style={styles.picker}
              >
                {CURRENCIES.map((curr) => (
                  <Picker.Item
                    key={curr.code}
                    label={`${curr.name} (${curr.symbol})`}
                    value={curr.code}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
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
  savedIndicator: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savedText: {
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  readOnlyField: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
