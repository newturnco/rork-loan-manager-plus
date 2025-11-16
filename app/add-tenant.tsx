import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';
import { useResponsive } from '@/utils/responsive';

export default function AddTenantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { addTenant } = useRent();

  const [name, setName] = React.useState<string>('');
  const [phone, setPhone] = React.useState<string>('');
  const [alternatePhone, setAlternatePhone] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [address, setAddress] = React.useState<string>('');
  const [occupation, setOccupation] = React.useState<string>('');
  const [company, setCompany] = React.useState<string>('');
  const [idType, setIdType] = React.useState<string>('');
  const [idNumber, setIdNumber] = React.useState<string>('');
  const [emergencyName, setEmergencyName] = React.useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = React.useState<string>('');
  const [emergencyRelation, setEmergencyRelation] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleSubmit = React.useCallback(async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Name, phone, and address are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(
        addTenant({
          name: name.trim(),
          phone: phone.trim(),
          alternatePhone: alternatePhone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim(),
          occupation: occupation.trim() || undefined,
          companyName: company.trim() || undefined,
          identityProof: idType && idNumber ? { type: idType.trim(), number: idNumber.trim() } : undefined,
          emergencyContact:
            emergencyName && emergencyPhone
              ? {
                  name: emergencyName.trim(),
                  phone: emergencyPhone.trim(),
                  relation: emergencyRelation.trim() || 'Primary',
                }
              : undefined,
          photo: undefined,
        }),
      );
      Alert.alert('Tenant added', 'Tenant profile created successfully.', [
        {
          text: 'Create Agreement',
          onPress: () => router.replace('/add-rent-agreement'),
        },
        {
          text: 'Done',
          style: 'cancel',
          onPress: () => router.replace('/(rent-tabs)/rent-tenants'),
        },
      ]);
    } catch (error) {
      console.error('[AddTenant] Failed to add tenant', error);
      Alert.alert('Error', 'Unable to add tenant right now.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    addTenant,
    address,
    alternatePhone,
    company,
    emergencyName,
    emergencyPhone,
    emergencyRelation,
    idNumber,
    idType,
    name,
    occupation,
    phone,
    email,
    router,
  ]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      edges={['bottom']}
      testID="add-tenant-screen"
    >
      <Stack.Screen
        options={{
          title: 'Add Tenant',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              alignSelf: 'center',
              width: '100%',
              maxWidth: contentMaxWidth,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>Primary Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            testID="tenant-name-input"
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Phone Number"
              placeholderTextColor={Colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              testID="tenant-phone-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Alternate Phone"
              placeholderTextColor={Colors.textSecondary}
              value={alternatePhone}
              onChangeText={setAlternatePhone}
              keyboardType="phone-pad"
              testID="tenant-alt-phone-input"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email ID"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="tenant-email-input"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Residential Address"
            placeholderTextColor={Colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
            testID="tenant-address-input"
          />

          <Text style={styles.sectionLabel}>Professional</Text>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Occupation"
              placeholderTextColor={Colors.textSecondary}
              value={occupation}
              onChangeText={setOccupation}
              autoCapitalize="words"
              testID="tenant-occupation-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Company"
              placeholderTextColor={Colors.textSecondary}
              value={company}
              onChangeText={setCompany}
              autoCapitalize="words"
              testID="tenant-company-input"
            />
          </View>

          <Text style={styles.sectionLabel}>Identity Proof</Text>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="ID Type (Passport, PAN, etc.)"
              placeholderTextColor={Colors.textSecondary}
              value={idType}
              onChangeText={setIdType}
              autoCapitalize="characters"
              testID="tenant-id-type-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="ID Number"
              placeholderTextColor={Colors.textSecondary}
              value={idNumber}
              onChangeText={setIdNumber}
              autoCapitalize="characters"
              testID="tenant-id-number-input"
            />
          </View>

          <Text style={styles.sectionLabel}>Emergency Contact</Text>
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            placeholderTextColor={Colors.textSecondary}
            value={emergencyName}
            onChangeText={setEmergencyName}
            autoCapitalize="words"
            testID="tenant-emergency-name-input"
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Contact Number"
              placeholderTextColor={Colors.textSecondary}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              testID="tenant-emergency-phone-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Relation"
              placeholderTextColor={Colors.textSecondary}
              value={emergencyRelation}
              onChangeText={setEmergencyRelation}
              autoCapitalize="words"
              testID="tenant-emergency-relation-input"
            />
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional Notes"
            placeholderTextColor={Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            testID="tenant-notes-input"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            testID="tenant-submit-button"
            activeOpacity={0.9}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : 'Save Tenant'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    gap: 16,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});