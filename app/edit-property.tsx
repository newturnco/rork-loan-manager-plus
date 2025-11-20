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
import { Home, MapPin, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';
import { PropertyStatus } from '@/types/rent';

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { properties, updateProperty } = useRent();
  
  const property = properties.find((p) => p.id === id);
  
  const [name, setName] = useState(property?.name || '');
  const [address, setAddress] = useState(property?.address || '');
  const [description, setDescription] = useState(property?.description || '');
  const [bedrooms, setBedrooms] = useState(property?.bedrooms?.toString() || '');
  const [bathrooms, setBathrooms] = useState(property?.bathrooms?.toString() || '');
  const [area, setArea] = useState(property?.area?.toString() || '');
  const [status, setStatus] = useState<PropertyStatus>(property?.status || 'available');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!property) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Property Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Property not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSave = () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      updateProperty(id, {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : undefined,
        area: area ? parseInt(area, 10) : property.area,
        status,
      });

      Alert.alert('Success', 'Property updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating property:', error);
      Alert.alert('Error', 'Failed to update property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: PropertyStatus; label: string; color: string }[] = [
    { value: 'available', label: 'Available', color: Colors.info },
    { value: 'occupied', label: 'Occupied', color: Colors.success },
    { value: 'maintenance', label: 'Maintenance', color: Colors.warning },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Property',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Property Name *</Text>
          <View style={styles.inputContainer}>
            <Home color={Colors.textSecondary} size={20} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Downtown Apartment"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Address *</Text>
          <View style={styles.inputContainer}>
            <MapPin color={Colors.textSecondary} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Full address"
              placeholderTextColor={Colors.textSecondary}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <Info color={Colors.textSecondary} size={20} style={styles.textAreaIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Property description"
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Bedrooms</Text>
            <TextInput
              style={styles.inputSimple}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={bedrooms}
              onChangeText={setBedrooms}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              style={styles.inputSimple}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={bathrooms}
              onChangeText={setBathrooms}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Area (sq ft)</Text>
          <TextInput
            style={styles.inputSimple}
            placeholder="0"
            placeholderTextColor={Colors.textSecondary}
            value={area}
            onChangeText={setArea}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusButton,
                  status === option.value && { backgroundColor: option.color + '25', borderColor: option.color },
                ]}
                onPress={() => setStatus(option.value)}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    status === option.value && { color: option.color, fontWeight: '700' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
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
    marginBottom: 20,
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
  inputSimple: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
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
