import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Colors from '@/constants/colors';

interface PremiumGateProps {
  feature: string;
  description?: string;
  compact?: boolean;
}

export function PremiumGate({ feature, description, compact = false }: PremiumGateProps) {
  const router = useRouter();

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactGate}
        onPress={() => router.push('/paywall')}
      >
        <Lock color={Colors.warning} size={16} />
        <Text style={styles.compactText}>Premium</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.gate}>
      <LinearGradient
        colors={[Colors.primary + '20', Colors.secondary + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gateContent}
      >
        <View style={styles.iconContainer}>
          <Crown color={Colors.warning} size={32} />
        </View>
        <Text style={styles.gateTitle}>{feature}</Text>
        {description && <Text style={styles.gateDescription}>{description}</Text>}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push('/paywall')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeButtonGradient}
          >
            <Crown color="#FFFFFF" size={16} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

interface PremiumBadgeProps {
  onPress?: () => void;
}

export function PremiumBadge({ onPress }: PremiumBadgeProps) {
  const router = useRouter();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/paywall');
    }
  };

  return (
    <TouchableOpacity style={styles.badge} onPress={handlePress}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badgeGradient}
      >
        <Crown color="#FFFFFF" size={12} />
        <Text style={styles.badgeText}>PRO</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface FeatureLimitProps {
  current: number;
  max: number;
  item: string;
}

export function FeatureLimit({ current, max, item }: FeatureLimitProps) {
  const router = useRouter();
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <View style={styles.limitContainer}>
      <View style={styles.limitHeader}>
        <Text style={styles.limitText}>
          {current} / {max} {item}
        </Text>
        {isNearLimit && (
          <TouchableOpacity
            style={styles.limitBadge}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.limitBadgeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(percentage, 100)}%` },
            isNearLimit && styles.progressFillWarning,
          ]}
        />
      </View>
      {isNearLimit && (
        <Text style={styles.limitWarning}>
          {`You're running low on ${item}. Upgrade to premium for unlimited access.`}
        </Text>
      )}
    </View>
  );
}

interface WithPremiumGateProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  fallback?: React.ReactNode;
}

export function WithPremiumGate({
  children,
  feature,
  description,
  fallback,
}: WithPremiumGateProps) {
  const { isPremium } = useSubscription();

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <PremiumGate feature={feature} description={description} />;
}

const styles = StyleSheet.create({
  gate: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gateContent: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  gateDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  compactGate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.warning + '20',
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  badge: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  limitContainer: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  limitBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  limitBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressFillWarning: {
    backgroundColor: Colors.warning,
  },
  limitWarning: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
