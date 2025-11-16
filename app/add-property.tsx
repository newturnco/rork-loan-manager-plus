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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { PropertyType, PropertyStatus } from '@/types/rent';
import { useRent } from '@/contexts/RentContext';
import { useResponsive } from '@/utils/responsive';

const PROPERTY_TYPES: { label: string; value: PropertyType }[] = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Land', value: 'land' },
  { label: 'Other', value: 'other' },
];

const PROPERTY_STATUSES: { label: string; value: PropertyStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Unavailable', value: 'unavailable' },
];

export default function AddPropertyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { addProperty } = useRent();

  const [name, setName] = React.useState<string>('');
  const [type, setType] = React.useState<PropertyType>('apartment');
  const [status, setStatus] = React.useState<PropertyStatus>('available');
  const [address, setAddress] = React.useState<string>('');
  const [city, setCity] = React.useState<string>('');
  const [state, setState] = React.useState<string>('');
  const [zipCode, setZipCode] = React.useState<string>('');
  const [area, setArea] = React.useState<string>('');
  const [bedrooms, setBedrooms] = React.useState<string>('');
  const [bathrooms, setBathrooms] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [purchasePrice, setPurchasePrice] = React.useState<string>('');
  const [currentValue, setCurrentValue] = React.useState<string>('');
  const [amenities, setAmenities] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleSubmit = React.useCallback(async () => {
    if (!name.trim() || !address.trim() || !city.trim()) {
      Alert.alert('Missing information', 'Name, address, and city are required.');
      return;
    }

    if (!area.trim() || Number.isNaN(Number(area))) {
      Alert.alert('Invalid area', 'Please enter the property area in square feet.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(
        addProperty({
          name: name.trim(),
          type,
          status,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          area: Number(area),
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          description: description.trim() || undefined,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          currentValue: currentValue ? Number(currentValue) : undefined,
          amenities: amenities
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
          images: [],
        }),
      );
      Alert.alert('Success', 'Property added successfully.', [
        {
          text: 'View Properties',
          onPress: () => router.replace('/(rent-tabs)/properties'),
        },
      ]);
    } catch (error) {
      console.error('[AddProperty] Failed to add property', error);
      Alert.alert('Error', 'Unable to add property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    addProperty,
    address,
    amenities,
    area,
    bathrooms,
    bedrooms,
    city,
    currentValue,
    description,
    name,
    purchasePrice,
    router,
    state,
    status,
    type,
    zipCode,
  ]);

  const renderOptions = React.useCallback(
    <T extends string>(
      options: { label: string; value: T }[],
      selected: T,
      onSelect: (value: T) => void,
      testID: string,
    ) => (
      <View style={styles.optionsRow} testID={testID}>
        {options.map((option) => {
          const isActive = option.value === selected;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionChip, isActive && styles.optionChipActive]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.85}
            >
              <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ),
    [],
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
      testID="add-property-screen"
    >
      <Stack.Screen
        options={{
          title: 'Add Property',
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
          <Text style={styles.sectionLabel}>Property Basics</Text>
          <TextInput
            style={styles.input}
            placeholder="Property Name"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            testID="property-name-input"
          />
          <TextInput
            style={styles.input}
            placeholder="Street Address"
            placeholderTextColor={Colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="words"
            testID="property-address-input"
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="City"
              placeholderTextColor={Colors.textSecondary}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              testID="property-city-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="State"
              placeholderTextColor={Colors.textSecondary}
              value={state}
              onChangeText={setState}
              autoCapitalize="words"
              testID="property-state-input"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Postal Code"
            placeholderTextColor={Colors.textSecondary}
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="number-pad"
            testID="property-zip-input"
          />

          <Text style={styles.controlLabel}>Property Type</Text>
          {renderOptions(PROPERTY_TYPES, type, setType, 'property-type-selector')}

          <Text style={styles.controlLabel}>Status</Text>
          {renderOptions(PROPERTY_STATUSES, status, setStatus, 'property-status-selector')}

          <Text style={styles.sectionLabel}>Property Specs</Text>
          <TextInput
            style={styles.input}
            placeholder="Area (sq.ft)"
            placeholderTextColor={Colors.textSecondary}
            value={area}
            onChangeText={setArea}
            keyboardType="numeric"
            testID="property-area-input"
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Bedrooms"
              placeholderTextColor={Colors.textSecondary}
              value={bedrooms}
              onChangeText={setBedrooms}
              keyboardType="numeric"
              testID="property-bedroom-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Bathrooms"
              placeholderTextColor={Colors.textSecondary}
              value={bathrooms}
              onChangeText={setBathrooms}
              keyboardType="numeric"
              testID="property-bathroom-input"
            />
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Property Description"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            testID="property-description-input"
          />

          <Text style={styles.sectionLabel}>Financials</Text>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Purchase Price"
              placeholderTextColor={Colors.textSecondary}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="numeric"
              testID="property-purchase-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Current Value"
              placeholderTextColor={Colors.textSecondary}
              value={currentValue}
              onChangeText={setCurrentValue}
              keyboardType="numeric"
              testID="property-value-input"
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Amenities (comma separated)"
            placeholderTextColor={Colors.textSecondary}
            value={amenities}
            onChangeText={setAmenities}
            autoCapitalize="sentences"
            testID="property-amenities-input"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            testID="property-submit-button"
            activeOpacity={0.9}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : 'Save Property'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  controlLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
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
    minHeight: 110,
    textAlignVertical: 'top' as const,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: '#FFFFFF',
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
