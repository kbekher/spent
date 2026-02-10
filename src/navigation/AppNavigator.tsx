import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { Text, View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchExpenses } from '../store/slices/expensesSlice';
import { fetchRecurringPayments } from '../store/slices/recurringPaymentsSlice';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OverviewScreen from '../screens/OverviewScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import RecurringPaymentsScreen from '../screens/RecurringPaymentsScreen';
import AccountScreen from '../screens/AccountScreen';
import RecentExpensesScreen from '../screens/RecentExpensesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
          title: '💰 Spent',
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color }) => <TabIcon icon="🏷️" color={color} />,
        }}
      />
      <Tab.Screen
        name="Recurring"
        component={RecurringPaymentsScreen}
        options={{
          tabBarLabel: 'Recurring',
          tabBarIcon: ({ color }) => <TabIcon icon="🔄" color={color} />,
          title: 'Recurring Payments',
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 24, color }}>{icon}</Text>;
}

function AppContent() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchCategories(user._id));
      dispatch(fetchExpenses({ userId: user._id }));
      dispatch(fetchRecurringPayments(user._id));
    }
  }, [user?._id, dispatch]);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          title: 'Add Expense',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="RecentExpenses"
        component={RecentExpensesScreen}
        options={{
          title: 'Recent Expenses',
          headerBackTitle: 'Back',
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
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="App" component={AppContent} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
