import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

interface SubscriptionSectionProps {
  subscription: any | null;
  hasSubscription: boolean;
  loading: boolean;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  subscription,
  hasSubscription,
  loading,
}) => {
  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={Colors.primary[600]} />
          <Text style={styles.loadingSectionText}>Vérification de l'abonnement...</Text>
        </View>
      </View>
    );
  }

  if (hasSubscription && subscription) {
    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Abonnement</Text>
          <TouchableOpacity style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.planRow}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>
              {subscription.planCode || subscription.plan?.name || 'Plan actif'}
            </Text>
            <Text style={styles.planDetails}>
              {subscription.price > 0 ? `${subscription.price}€ / mois` : 'Gratuit'}
              {subscription.isActive && subscription.personsAllowed 
                ? ` • ${subscription.personsAllowed} ${subscription.personsAllowed > 1 ? 'personnes' : 'personne'}`
                : ''}
            </Text>
            {subscription.startedAt && (
              <Text style={styles.planDetails}>
                Actif depuis le {new Date(subscription.startedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            )}
            {subscription.expiresAt && subscription.expiresAt !== null ? (
              <Text style={styles.planDetails}>
                Expire le {new Date(subscription.expiresAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            ) : subscription.isActive && (
              <Text style={styles.planDetails}>
                Renouvelé automatiquement
              </Text>
            )}
          </View>
          <View style={styles.statusChipActive}>
            <Text style={styles.statusChipText}>
              {subscription.isActive ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>
        
        {subscription.isActive && (
          <TouchableOpacity onPress={() => router.push('/subscription')}>
            <Text style={styles.cancelLink}>Gérer l&apos;abonnement</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Abonnement</Text>
      </View>
      <View style={styles.noSubscriptionContainer}>
        <Ionicons name="card-outline" size={32} color={Colors.text.secondary} />
        <Text style={styles.noSubscriptionText}>Aucun abonnement actif</Text>
        <TouchableOpacity 
          style={styles.subscribeButton}
          onPress={() => router.push('/subscription')}
        >
          <Text style={styles.subscribeButtonText}>S&apos;abonner</Text>
        </TouchableOpacity> 
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
        borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
    maxWidth: '100%',
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  ghostButton: {
        borderWidth: 1,
    borderColor: Colors.primary[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  ghostButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
  } as TextStyle,
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  planInfo: {
    flex: 1,
  } as ViewStyle,
  planName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  } as TextStyle,
  planDetails: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  statusChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  statusChipText: {
    color: Colors.status.success,
    fontWeight: '600',
  } as TextStyle,
  cancelLink: {
    color: '#ef4444',
    fontWeight: '600',
    marginTop: Spacing.sm,
  } as TextStyle,
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  loadingSectionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  noSubscriptionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  } as ViewStyle,
  noSubscriptionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  subscribeButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  } as ViewStyle,
  subscribeButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
});

