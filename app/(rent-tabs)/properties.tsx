import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Home, Plus, MapPin, Bed, Bath } from 'lucide-react-native';
import { useRent } from '@/contexts/RentContext';
import Colors from '@/constants/colors';
import { Property } from '@/types/rent';

export default function PropertiesScreen() {
  const router = useRouter();
  const { properties } = useRent();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return Colors.success;
      case 'available':
        return Colors.info;
      case 'maintenance':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity style={styles.propertyCard} onPress={() => {}}>
      <View style={styles.propertyHeader}>
        <View style={styles.propertyIcon}>
          <Home color={Colors.primary} size={24} />
        </View>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <View style={styles.addressRow}>
            <MapPin color={Colors.textSecondary} size={14} />
            <Text style={styles.propertyAddress}>{item.address}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      {(item.bedrooms || item.bathrooms) && (
        <View style={styles.propertyDetails}>
          {item.bedrooms && (
            <View style={styles.detailItem}>
              <Bed color={Colors.textSecondary} size={16} />
              <Text style={styles.detailText}>{item.bedrooms} Bed</Text>
            </View>
          )}
          {item.bathrooms && (
            <View style={styles.detailItem}>
              <Bath color={Colors.textSecondary} size={16} />
              <Text style={styles.detailText}>{item.bathrooms} Bath</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/add-property')} style={styles.addButton}>
              <Plus color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      {properties.length === 0 ? (
        <View style={styles.emptyState}>
          <Home color={Colors.textSecondary} size={64} />
          <Text style={styles.emptyTitle}>No Properties</Text>
          <Text style={styles.emptyText}>Add your first property to get started</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/add-property')}>
            <Plus color="#FFFFFF" size={20} />
            <Text style={styles.emptyButtonText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  propertyDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
