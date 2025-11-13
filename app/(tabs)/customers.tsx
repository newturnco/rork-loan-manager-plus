import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Plus, User, Phone, Mail } from 'lucide-react-native';
import { useCustomers } from '@/contexts/CustomerContext';
import { useLoans } from '@/contexts/LoanContext';
import Colors from '@/constants/colors';

export default function CustomersScreen() {
  const router = useRouter();
  const { customers } = useCustomers();
  const { loans } = useLoans();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const getCustomerLoansCount = (customerId: string) => {
    return loans.filter((loan) => loan.customerId === customerId).length;
  };

  const getCustomerActiveLoansCount = (customerId: string) => {
    return loans.filter((loan) => loan.customerId === customerId && loan.status === 'active').length;
  };

  const CustomerCard = ({ customer }: { customer: typeof customers[0] }) => {
    const loansCount = getCustomerLoansCount(customer.id);
    const activeLoansCount = getCustomerActiveLoansCount(customer.id);

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() =>
          router.push({
            pathname: '/edit-customer',
            params: { customerId: customer.id },
          })
        }
      >
        <View style={styles.avatarContainer}>
          <User color={Colors.primary} size={28} />
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Phone color={Colors.textSecondary} size={14} />
              <Text style={styles.contactText}>{customer.phone}</Text>
            </View>
            {customer.email && (
              <View style={styles.contactItem}>
                <Mail color={Colors.textSecondary} size={14} />
                <Text style={styles.contactText}>{customer.email}</Text>
              </View>
            )}
          </View>

          {loansCount > 0 && (
            <View style={styles.loansInfo}>
              <Text style={styles.loansText}>
                {loansCount} {loansCount === 1 ? 'loan' : 'loans'}
              </Text>
              {activeLoansCount > 0 && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>
                    {activeLoansCount} active
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Customers',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/add-customer')} style={styles.headerButton}>
              <Plus color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={Colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <User color={Colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Customers' : 'No Customers Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first customer to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/add-customer')}
              >
                <Plus color="#FFFFFF" size={20} />
                <Text style={styles.emptyButtonText}>Add Customer</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.statsBar}>
              <Text style={styles.statsText}>
                {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
              </Text>
            </View>
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsBar: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  customerCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  contactInfo: {
    gap: 6,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loansInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loansText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  activeBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
