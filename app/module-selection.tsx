import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet,
  Home,
  TrendingUp,
  Building2,
  ArrowRight,
  Clock4,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModule, ManagementModule } from '@/contexts/ModuleContext';

export default function ModuleSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectModule, selectedModule } = useModule();

  const moduleDescriptions = useMemo(
    () => ({
      loan: {
        title: 'Loan Management',
        subtitle: 'Track loans, payments & interest',
        gradient: ['#667eea', '#764ba2'],
        icon: Wallet,
        features: [
          'Track loans & borrowers',
          'Automated payment schedules',
          'Interest calculations',
          'Payment reminders & alerts',
          'Detailed reports & analytics',
        ],
      },
      rent: {
        title: 'Rent Management',
        subtitle: 'Manage properties & tenants',
        gradient: ['#f093fb', '#f5576c'],
        icon: Home,
        features: [
          'Property portfolio tracking',
          'Tenant management workflows',
          'Rent collection ledger',
          'Automated rent reminders',
          'Maintenance & service logs',
          'Payment gateway & UPI tracking',
        ],
      },
    }),
    [],
  );

  const handleModuleSelect = async (module: ManagementModule) => {
    console.log('[ModuleSelection] Module chosen', module);
    await selectModule(module);
    if (module === 'loan') {
      router.replace('/(tabs)/loan-dashboard');
      return;
    }
    router.replace('/(rent-tabs)/rent-dashboard');
  };

  const ModuleCard = ({
    title,
    description,
    Icon,
    features,
    gradient,
    onPress,
  }: {
    title: string;
    description: string;
    Icon: React.ComponentType<{ color: string; size: number }>;
    features: string[];
    gradient: string[];
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.moduleCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Icon color="#FFFFFF" size={32} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
            {feature}
          </Text>
            </View>
          ))}
        </View>

        <View style={styles.cardAction}>
          <Text style={styles.actionText}>Get Started</Text>
          <ArrowRight color="#FFFFFF" size={20} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.backgroundGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome to</Text>
          <Text style={styles.appName}>Property & Finance Manager</Text>
          <Text style={styles.headerSubtitle}>
            Choose your management module to begin
          </Text>
        </View>

        {selectedModule ? (
          <TouchableOpacity
            style={styles.quickResume}
            activeOpacity={0.85}
            onPress={() => handleModuleSelect(selectedModule)}
            testID="module-selection-quick-resume"
          >
            <Clock4 color="#FFFFFF" size={20} />
            <Text style={styles.quickResumeText}>
              Continue with {selectedModule === 'loan' ? 'Loan Management' : 'Rent Management'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.modulesContainer}>
          <ModuleCard
            title={moduleDescriptions.loan.title}
            description={moduleDescriptions.loan.subtitle}
            Icon={moduleDescriptions.loan.icon}
            features={moduleDescriptions.loan.features}
            gradient={moduleDescriptions.loan.gradient}
            onPress={() => handleModuleSelect('loan')}
          />

          <ModuleCard
            title={moduleDescriptions.rent.title}
            description={moduleDescriptions.rent.subtitle}
            Icon={moduleDescriptions.rent.icon}
            features={moduleDescriptions.rent.features}
            gradient={moduleDescriptions.rent.gradient}
            onPress={() => handleModuleSelect('rent')}
          />
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <View style={styles.featureHighlight}>
            <TrendingUp color="#4ade80" size={20} />
            <Text style={styles.footerText}>Cloud Sync Enabled</Text>
          </View>
          <View style={styles.featureHighlight}>
            <Building2 color="#60a5fa" size={20} />
            <Text style={styles.footerText}>Multi-Platform Support</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 18,
    color: '#a0a0a0',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
  },
  modulesContainer: {
    flex: 1,
    gap: 20,
  },
  moduleCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  quickResume: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  quickResumeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
