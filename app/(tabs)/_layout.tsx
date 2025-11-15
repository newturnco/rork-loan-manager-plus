import React from "react";
import { Tabs, useRouter } from "expo-router";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Settings,
  Users,
  Calculator,
  Receipt,
  Plus,
} from "lucide-react-native";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import Colors from "../../constants/colors";
import NotificationBell from "../../components/NotificationBell";

function LoanDashboardHeaderRight() {
  const router = useRouter();

  return (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={() => {
          console.log('Quick add loan from dashboard header');
          router.push('/add-loan');
        }}
        style={styles.addButton}
        testID="tabs-add-loan-button"
      >
        <Plus color="#FFFFFF" size={22} />
      </TouchableOpacity>
      <NotificationBell />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
        },
        headerRight: () => <NotificationBell />,
      }}
    >
      <Tabs.Screen
        name="loan-dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          headerRight: () => <LoanDashboardHeaderRight />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: "Loans",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: "Calculator",
          tabBarIcon: ({ color, size }) => <Calculator color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButton: {
    padding: 8,
    marginRight: 4,
  },
});
