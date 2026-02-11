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
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <ScrollView
      style={styles.scrollView}
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
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
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
  },
  readOnlyField: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  readOnlyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.5)',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
