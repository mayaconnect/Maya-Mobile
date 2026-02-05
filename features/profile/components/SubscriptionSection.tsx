import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { SubscriptionApi } from '@/features/subscription/services/subscriptionApi';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  onSubscriptionUpdate?: () => void;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  subscription,
  hasSubscription,
  loading,
  onSubscriptionUpdate,
}) => {
  const [cancelling, setCancelling] = useState(false);

  const handleCancelSubscription = () => {
    Alert.alert(
      'Annuler l\'abonnement',
      'Êtes-vous sûr de vouloir annuler votre abonnement ? Vous perdrez l\'accès à tous les avantages MayaConnect.',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const result = await SubscriptionApi.cancelSubscription();
              if (result.success) {
                Alert.alert('Succès', result.message || 'Votre abonnement a été annulé avec succès');
                // Rafraîchir les données de l'abonnement
                if (onSubscriptionUpdate) {
                  onSubscriptionUpdate();
                }
              } else {
                Alert.alert('Erreur', result.message || 'Impossible d\'annuler l\'abonnement');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de l\'annulation de l\'abonnement');
              console.error('Erreur lors de l\'annulation:', error);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };
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
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              onPress={() => router.push('/subscription')}
              style={styles.manageButton}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={18} color={Colors.primary[400]} />
              <Text style={styles.manageButtonText}>Gérer l&apos;abonnement</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleCancelSubscription}
              disabled={cancelling}
              style={styles.cancelButton}
              activeOpacity={0.7}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                  <Text style={styles.cancelButtonText}>Annuler l&apos;abonnement</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  actionsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.sm,
  } as ViewStyle,
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  } as ViewStyle,
  manageButtonText: {
    color: Colors.primary[400],
    fontWeight: '700',
    fontSize: Typography.sizes.base,
  } as TextStyle,
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  } as ViewStyle,
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: Typography.sizes.base,
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

