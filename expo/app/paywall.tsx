import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Crown, 
  Check, 
  X, 
  FileText, 
  Users, 
  Wallet,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react-native';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/contexts/SubscriptionContext';
import Colors from '@/constants/colors';
import { useResponsive } from '@/utils/responsive';

export default function PaywallScreen() {
  const router = useRouter();
  const { upgrade, isUpgrading, restorePurchases, isRestoring, isPremium } = useSubscription();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const [selectedPlan, setSelectedPlan] = useState('premium_lifetime');

  const handlePurchase = async () => {
    try {
      await upgrade(selectedPlan);
      Alert.alert(
        'Success! 🎉',
        'You are now a Premium member. Enjoy all features!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('[Paywall] Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      console.error('[Paywall] Restore error:', error);
      Alert.alert('Info', 'No previous purchases found');
    }
  };

  const features = [
    {
      icon: <Users color="#FFFFFF" size={24} />,
      title: 'Unlimited Customers',
      description: 'Add as many customers as you need',
      free: '10 customers',
      premium: 'Unlimited',
    },
    {
      icon: <Wallet color="#FFFFFF" size={24} />,
      title: 'Unlimited Loans',
      description: 'Manage unlimited loan accounts',
      free: '20 loans',
      premium: 'Unlimited',
    },
    {
      icon: <FileText color="#FFFFFF" size={24} />,
      title: 'Advanced Reports',
      description: 'Export PDF & Excel reports',
      free: false,
      premium: true,
    },
    {
      icon: <TrendingUp color="#FFFFFF" size={24} />,
      title: 'Auto Backup',
      description: 'Automatic data backups',
      free: false,
      premium: true,
    },
    {
      icon: <Shield color="#FFFFFF" size={24} />,
      title: 'Priority Support',
      description: 'Get help when you need it',
      free: false,
      premium: true,
    },
    {
      icon: <Zap color="#FFFFFF" size={24} />,
      title: 'No Ads',
      description: 'Clean, distraction-free experience',
      free: false,
      premium: true,
    },
  ];

  if (isPremium) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Premium',
            headerStyle: {
              backgroundColor: Colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.alreadyPremiumContainer}>
          <Crown color={Colors.warning} size={80} />
          <Text style={styles.alreadyPremiumTitle}>You're Premium!</Text>
          <Text style={styles.alreadyPremiumText}>
            You already have access to all premium features.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Upgrade to Premium',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth },
        ]}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Crown color="#FFFFFF" size={60} />
          <Text style={styles.headerTitle}>Unlock Premium</Text>
          <Text style={styles.headerSubtitle}>
            Get unlimited access to all features
          </Text>
        </LinearGradient>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureIcon}
                >
                  {feature.icon}
                </LinearGradient>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <View style={styles.featureComparison}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Free:</Text>
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check color={Colors.success} size={16} />
                      ) : (
                        <X color={Colors.error} size={16} />
                      )
                    ) : (
                      <Text style={styles.comparisonValue}>{feature.free}</Text>
                    )}
                  </View>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Premium:</Text>
                    {typeof feature.premium === 'boolean' ? (
                      feature.premium ? (
                        <Check color={Colors.success} size={16} />
                      ) : (
                        <X color={Colors.error} size={16} />
                      )
                    ) : (
                      <Text style={[styles.comparisonValue, styles.premiumValue]}>
                        {feature.premium}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === plan.id && <View style={styles.planRadioSelected} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  {plan.savings && (
                    <Text style={styles.planSavings}>{plan.savings}</Text>
                  )}
                </View>
                <Text style={styles.planPrice}>{plan.priceString}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, isUpgrading && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isUpgrading}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.purchaseButtonGradient}
          >
            {isUpgrading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Crown color="#FFFFFF" size={20} />
                <Text style={styles.purchaseButtonText}>Upgrade to Premium</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Payment will be charged to your App Store account. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Lifetime purchase is a one-time payment with no recurring charges.
        </Text>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconContainer: {
    marginRight: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  featureComparison: {
    flexDirection: 'row',
    gap: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  comparisonValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  premiumValue: {
    color: Colors.primary,
  },
  plansSection: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative' as const,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  planCardPopular: {
    borderColor: Colors.warning,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -10,
    left: 20,
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  planSavings: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  alreadyPremiumContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  alreadyPremiumTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  alreadyPremiumText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
