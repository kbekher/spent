import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useEffect } from 'react';
import { fetchCategories, addCategory } from '../store/slices/categoriesSlice';
import { fetchExpenses } from '../store/slices/expensesSlice';
import { fetchRecurringPayments } from '../store/slices/recurringPaymentsSlice';
import { logoutUser } from '../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OverviewScreen from '../screens/OverviewScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import RecurringPaymentsScreen from '../screens/RecurringPaymentsScreen';
import EditExpenseScreen from '../screens/EditExpenseScreen';
import AccountScreen from '../screens/AccountScreen';
import RecentExpensesScreen from '../screens/RecentExpensesScreen';

// Header button component for circular icons
function HeaderIconButton({ icon, onPress, style }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; style?: any }) {
  return (
    <TouchableOpacity
      style={[styles.headerButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={24} color="#000000" />
    </TouchableOpacity>
  );
}

// Navigation types
type AppStackParamList = {
  Main: undefined;
  Account: undefined;
  RecentExpenses: {
    year: number;
    month: number;
    viewMode: 'month' | 'year';
  };
  EditExpense: {
    expenseId: string;
  };
};

type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs({ navigation }: any) {
  const dispatch = useAppDispatch();

  const handleLogoutPress = () => {
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
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: 'rgba(0, 0, 0, 0.4)',
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: 12,
          paddingTop: 12,
          height: 84,
          position: 'absolute',
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: '#000000',
        },
        headerTintColor: '#000000',
      }}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <Ionicons name="home" size={24} color={focused ? '#000000' : '#ffffff'} />
            </View>
          ),
          title: 'Spent',
          headerRight: () => <HeaderIconButton icon="log-out-outline" onPress={handleLogoutPress} style={{ marginRight: 12 }} />,
        }}
      />
      <Tab.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabButton, styles.addButton, focused && styles.tabButtonActive]}>
              <Ionicons name="add" size={28} color={focused ? '#000000' : '#ffffff'} />
            </View>
          ),
          title: 'Add Expense',
        }}
      />
      <Tab.Screen
        name="Recurring"
        component={RecurringPaymentsScreen}
        listeners={({ navigation }) => ({
          focus: () => {
            navigation.setOptions({
              headerRight: () => (
                <HeaderIconButton
                  icon="add-outline"
                  onPress={() => {
                    const currentRoute = navigation.getState().routes[navigation.getState().index];
                    if (currentRoute.params && 'toggleView' in currentRoute.params) {
                      (currentRoute.params as any).toggleView();
                    }
                  }}
                  style={{ marginRight: 12 }}
                />
              ),
            });
          },
        })}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <Ionicons name="repeat" size={24} color={focused ? '#000000' : '#ffffff'} />
            </View>
          ),
          title: 'Recurring Payments',
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <Ionicons name="person-circle-outline" size={24} color={focused ? '#000000' : '#ffffff'} />
            </View>
          ),
          title: 'Account',
        }}
      />
    </Tab.Navigator>
  );
}


function AppContent() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: categories } = useAppSelector((state) => state.categories);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchCategories(user._id));
      dispatch(fetchExpenses({ userId: user._id }));
      dispatch(fetchRecurringPayments(user._id));
    }
  }, [user?._id, dispatch]);

  // Create default categories if none exist
  useEffect(() => {
    const createDefaultCategories = async () => {
      if (user?._id && categories.length === 0) {
        const defaultCategories = [
          { name: 'Groceries', color: 'rgba(76, 175, 80, 1)' },
          { name: 'Transport', color: 'rgba(51, 119, 255, 1)' },
          { name: 'Restaurant', color: 'rgba(247, 75, 0, 1)' },
          { name: 'Entertainment', color: 'rgba(156, 39, 176, 1)' },
          { name: 'Shopping', color: 'rgba(233, 30, 99, 1)' },
          { name: 'Health', color: 'rgba(0, 188, 212, 1)' },
          { name: 'Bills', color: 'rgba(255, 152, 0, 1)' },
          { name: 'Other', color: 'rgba(189, 253, 0, 1)' },
        ];

        for (const category of defaultCategories) {
          await dispatch(addCategory({
            userId: user._id,
            name: category.name,
            color: category.color,
          }));
        }
      }
    };

    createDefaultCategories();
  }, [user?._id, categories.length, dispatch]);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account Settings',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            color: '#000000',
          },
        }}
      />
      <Stack.Screen
        name="RecentExpenses"
        component={RecentExpensesScreen}
        options={{
          title: 'Recent Expenses',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#000000',
          headerTitleStyle: { color: '#000000' },
        }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{
          title: 'Edit Expense',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { color: '#ffffff' },
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Login" component={LoginScreen} />
        ) : (
          <RootStack.Screen name="App" component={AppContent} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  tabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
