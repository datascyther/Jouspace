import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Check, Star, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { features } from '@/core/config/features';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Star,
    color: '#22D3EE',
    features: [
      'Basic mood tracking',
      'Limited AI chat (10/day)',
      'Join up to 3 groups',
      'Standard exercises',
    ],
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    icon: Sparkles,
    color: '#8B5CF6',
    popular: true,
    features: [
      'Unlimited mood tracking',
      'Unlimited AI chat',
      'Unlimited group access',
      'All exercises & tools',
      'Advanced analytics',
      'Priority support',
    ],
  },
  {
    name: 'Lifetime',
    price: '$49.99',
    period: 'one-time',
    icon: Crown,
    color: '#F59E0B',
    features: [
      'Everything in Premium',
      'All future features',
      'Early access to new tools',
    ],
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const handleSubscribe = useCallback((planName: string) => {
    if (planName === 'Free') {
      Alert.alert('Current Plan', 'You are already on the Free plan.');
      return;
    }
    Alert.alert('Subscribe', `Initiating checkout for the ${planName} plan...`);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Subscription</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Choose the plan that fits your wellness journey
        </Text>

        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isFree = plan.name === 'Free';
            return (
              <View
                key={plan.name}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surface.secondary,
                    borderColor: plan.popular ? colors.brand.primary : colors.border.default,
                    borderWidth: plan.popular ? 2 : 1,
                  }
                ]}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.brand.primary }]}>
                    <Text style={[styles.popularBadgeText, { color: colors.brand.contrastText }]}>Popular</Text>
                  </View>
                )}

                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrapper, { backgroundColor: plan.color + '15' }]}>
                    <Icon size={20} color={plan.color} />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={[styles.planName, { color: colors.text.primary }]}>{plan.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.price, { color: colors.text.primary }]}>{plan.price}</Text>
                      <Text style={[styles.period, { color: colors.text.secondary }]}>{plan.period}</Text>
                    </View>
                  </View>
                </View>

                {/* Features list */}
                <View style={styles.featuresList}>
                  {plan.features.map((feat) => (
                    <View key={feat} style={styles.featureRow}>
                      <Check size={14} color={plan.color} style={styles.checkIcon} />
                      <Text style={[styles.featureText, { color: colors.text.primary }]}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Button */}
                <TouchableOpacity
                  onPress={() => handleSubscribe(plan.name)}
                  activeOpacity={0.8}
                  style={[
                    styles.ctaButton,
                    {
                      backgroundColor: isFree
                        ? 'transparent'
                        : plan.popular
                        ? colors.brand.primary
                        : colors.surface.primary,
                      borderColor: isFree
                        ? colors.border.default
                        : plan.popular
                        ? colors.brand.primary
                        : colors.border.default,
                      borderWidth: 1,
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.ctaText,
                      {
                        color: isFree
                          ? colors.text.secondary
                          : plan.popular
                          ? colors.brand.contrastText
                          : colors.brand.primary,
                      }
                    ]}
                  >
                    {isFree ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {!features.subscriptions && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface.secondary, borderColor: colors.border.default }]}>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Subscription management is currently in development. Payment processing will be available soon with RevenueCat or Stripe integration. You are on the Free plan by default.
            </Text>
          </View>
        )}

        <Text style={[styles.footerText, { color: colors.text.secondary }]}>
          Cancel anytime. Your data is always yours.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
  },
  period: {
    fontSize: 13,
    marginLeft: 4,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
