import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Save, User, Trash2 } from 'lucide-react-native';
import NotificationBell from '@/components/NotificationBell';
import { useCustomers } from '@/contexts/CustomerContext';
import { useLoans } from '@/contexts/LoanContext';
import Colors from '@/constants/colors';

export default function EditCustomerScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { getCustomerById, updateCustomer, deleteCustomer } = useCustomers();
  const { updateLoansByCustomer } = useLoans();

  const customer = getCustomerById(customerId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    }
  }, [customer]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter customer phone number');
      return;
    }

    try {
      const updatedCustomer = {
        ...customer!,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[iOS] Updating customer:', customerId);
      updateCustomer(customerId, updatedCustomer);
      updateLoansByCustomer(updatedCustomer);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[iOS] Customer updated, navigating back');
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/customers');
      }

      requestAnimationFrame(() => {
        Alert.alert('Success', 'Customer updated successfully');
      });
    } catch (error) {
      console.error('[iOS] Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer? This will not delete any associated loans.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[iOS] Deleting customer:', customerId);
              await deleteCustomer(customerId);
              
              await new Promise(resolve => setTimeout(resolve, 150));
              
              console.log('[iOS] Customer deleted, navigating back');
              
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/customers');
              }

              requestAnimationFrame(() => {
                Alert.alert('Success', 'Customer deleted successfully');
              });
            } catch (error) {
              console.error('[iOS] Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (!customer) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Customer Not Found' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Customer not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Customer',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <NotificationBell />
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Trash2 color="#FF3B30" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Save color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWithIcon}>
              <User color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.inputWithIconText}
                placeholder="Enter customer name"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={Colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter address"
              placeholderTextColor={Colors.textSecondary}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter any additional notes"
              placeholderTextColor={Colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={handleSave}>
          <Text style={styles.updateButtonText}>Update Customer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithIconText: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
});
