import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { User, Phone, Mail, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';

export default function EditTenantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tenants, updateTenant } = useRent();
  
  const tenant = tenants.find((t) => t.id === id);
  
  const [name, setName] = useState(tenant?.name || '');
  const [phone, setPhone] = useState(tenant?.phone || '');
  const [email, setEmail] = useState(tenant?.email || '');
  const [emergencyName, setEmergencyName] = useState(tenant?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(tenant?.emergencyContact?.phone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(tenant?.emergencyContact?.relation || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!tenant) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Tenant Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Tenant not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      updateTenant(id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        emergencyContact:
          emergencyName.trim() && emergencyPhone.trim() && emergencyRelation.trim()
            ? {
                name: emergencyName.trim(),
                phone: emergencyPhone.trim(),
                relation: emergencyRelation.trim(),
              }
            : undefined,
      });

      Alert.alert('Success', 'Tenant updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating tenant:', error);
      Alert.alert('Error', 'Failed to update tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Tenant',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tenant Information</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputContainer}>
              <User color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                placeholder="Enter tenant name"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Phone color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                placeholderTextColor={Colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                placeholder="tenant@example.com"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <View style={styles.inputContainer}>
              <User color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                placeholder="Contact name"
                placeholderTextColor={Colors.textSecondary}
                value={emergencyName}
                onChangeText={setEmergencyName}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Emergency Contact Phone</Text>
            <View style={styles.inputContainer}>
              <Phone color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                placeholderTextColor={Colors.textSecondary}
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Relationship</Text>
            <View style={styles.inputContainer}>
              <AlertCircle color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Spouse, Parent"
                placeholderTextColor={Colors.textSecondary}
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    fontWeight: '600' as const,
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
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
