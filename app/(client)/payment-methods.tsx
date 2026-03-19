/**
 * Maya Connect V2 — Payment Methods Screen
 * 
 * Allows users to:
 * - View saved payment methods
 * - Add new payment method (Stripe)
 * - Remove payment methods
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { MHeader, MCard, MButton, LoadingSpinner, ErrorState, EmptyState } from '../../src/components/ui';

/* ─────────────────────────────────────────────────────────────── */
/*  Types                                                            */
/* ─────────────────────────────────────────────────────────────── */
interface PaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                        */
/* ─────────────────────────────────────────────────────────────── */
export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { alert, confirm, AlertModal } = useAppAlert();

  // TODO: Replace with actual API call
  const paymentMethodsQ = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      // Placeholder - replace with actual API
      return [] as PaymentMethod[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (methodId: string) => {
      // TODO: Implement actual delete API
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert('Succès', 'Moyen de paiement supprimé.', 'success');
    },
    onError: () => {
      alert('Erreur', 'Impossible de supprimer ce moyen de paiement.');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (methodId: string) => {
      // TODO: Implement actual set default API
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      alert('Erreur', 'Impossible de définir ce moyen de paiement par défaut.');
    },
  });

  const handleDelete = (method: PaymentMethod) => {
    confirm(
      'Supprimer le moyen de paiement',
      `Êtes-vous sûr de vouloir supprimer la carte se terminant par ${method.last4} ?`,
      () => deleteMutation.mutate(method.id),
    );
  };

  const handleAddCard = () => {
    // TODO: Implement Stripe payment sheet or webview integration
    alert('Ajouter une carte', 'L\'intégration Stripe est en cours de développement.', 'info');
  };

  const getCardIcon = (brand: string): React.ComponentProps<typeof Ionicons>['name'] => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      case 'discover': return 'card';
      default: return 'card';
    }
  };

  const getCardColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return colors.info[500];
      case 'mastercard': return colors.orange[500];
      case 'amex': return colors.violet[500];
      case 'discover': return colors.success[500];
      default: return colors.neutral[500];
    }
  };

  if (paymentMethodsQ.isLoading) {
    return (
      <View style={styles.container}>
        <MHeader
          title="Moyens de paiement"
          showBack
          onBack={() => router.back()}
        />
        <LoadingSpinner fullScreen message="Chargement des cartes..." />
      </View>
    );
  }

  if (paymentMethodsQ.isError) {
    return (
      <View style={styles.container}>
        <MHeader
          title="Moyens de paiement"
          showBack
          onBack={() => router.back()}
        />
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger vos moyens de paiement."
          onRetry={() => paymentMethodsQ.refetch()}
          icon="card-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MHeader
        title="Moyens de paiement"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + wp(100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={wp(24)} color={colors.success[500]} />
          <Text style={styles.infoText}>
            Vos informations de paiement sont sécurisées par Stripe et ne sont jamais stockées sur nos serveurs.
          </Text>
        </View>

        {/* Cards List */}
        {(paymentMethodsQ.data ?? []).length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="Aucune carte enregistrée"
            description="Ajoutez une carte pour faciliter vos paiements futurs."
          />
        ) : (
          <View style={styles.cardsSection}>
            {(paymentMethodsQ.data ?? []).map((method) => (
              <MCard key={method.id} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <View
                      style={[
                        styles.cardIconWrap,
                        { backgroundColor: `${getCardColor(method.brand)}15` },
                      ]}
                    >
                      <Ionicons
                        name={getCardIcon(method.brand)}
                        size={wp(24)}
                        color={getCardColor(method.brand)}
                      />
                    </View>
                    <View>
                      <Text style={styles.cardBrand}>{method.brand.toUpperCase()}</Text>
                      <Text style={styles.cardNumber}>•••• {method.last4}</Text>
                      <Text style={styles.cardExpiry}>
                        Expire {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(method)}
                    disabled={deleteMutation.isPending}
                  >
                    <Ionicons name="trash-outline" size={wp(20)} color={colors.error[500]} />
                  </TouchableOpacity>
                </View>

                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Par défaut</Text>
                  </View>
                )}

                {!method.isDefault && (
                  <TouchableOpacity
                    style={styles.setDefaultBtn}
                    onPress={() => setDefaultMutation.mutate(method.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    <Text style={styles.setDefaultText}>Définir par défaut</Text>
                  </TouchableOpacity>
                )}
              </MCard>
            ))}
          </View>
        )}

        {/* Add Card Button */}
        <View style={styles.addSection}>
          <MButton
            title="Ajouter une carte"
            onPress={handleAddCard}
            icon={<Ionicons name="add-circle-outline" size={wp(20)} color="#FFF" />}
          />
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityTitle}>À propos de la sécurité</Text>
          <Text style={styles.securityText}>
            • Toutes les transactions sont cryptées{'\n'}
            • Vos données bancaires ne sont jamais stockées{'\n'}
            • Intégration certifiée PCI-DSS avec Stripe{'\n'}
            • Vous pouvez supprimer vos cartes à tout moment
          </Text>
        </View>
      </ScrollView>

      <AlertModal />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Styles                                                           */
/* ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scroll: {
    paddingHorizontal: spacing[6],
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.success[50],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: spacing[4],
    gap: spacing[3],
  },
  infoText: {
    ...textStyles.caption,
    color: colors.success[700],
    flex: 1,
    lineHeight: wp(18),
  },
  cardsSection: {
    marginTop: spacing[6],
    gap: spacing[3],
  },
  cardItem: {
    padding: spacing[4],
    backgroundColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  cardIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBrand: {
    ...textStyles.caption,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },
  cardNumber: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[700],
    marginTop: spacing[1],
  },
  cardExpiry: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  defaultBadge: {
    marginTop: spacing[3],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  defaultText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: colors.success[700],
  },
  setDefaultBtn: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
  },
  setDefaultText: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.orange[500],
  },
  addSection: {
    marginTop: spacing[6],
  },
  securityNotice: {
    marginTop: spacing[8],
    padding: spacing[4],
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.lg,
  },
  securityTitle: {
    ...textStyles.h5,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  securityText: {
    ...textStyles.caption,
    color: colors.neutral[600],
    lineHeight: wp(20),
  },
});
