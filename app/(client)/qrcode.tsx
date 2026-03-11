/**
 * Maya Connect V2 — QR Code Screen (Client)
 *
 * Shows the user's unique QR code for partner scanning.
 * Auto-refreshes token periodically.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../src/stores/auth.store';
import { qrApi } from '../../src/api/qr.api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatName } from '../../src/utils/format';
import { MCard, MBadge, MAvatar, MButton, ErrorState } from '../../src/components/ui';
import { QR_CONFIG } from '../../src/constants/config';

export default function QrCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const qrQuery = useQuery({
    queryKey: ['qrToken'],
    queryFn: () => qrApi.getCurrent(),
    select: (res) => res.data,
    refetchInterval: QR_CONFIG.refreshInterval,
    retry: 3,
  });

  const qrToken = qrQuery.data?.token;
  const hasError = qrQuery.isError;

  return (
    <LinearGradient
      colors={['#FF7A18', '#FFB347']}
      style={[styles.container, { paddingTop: insets.top + spacing[4] }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Title */}
      <Text style={styles.title}>Mon QR Code</Text>
      <Text style={styles.subtitle}>
        Présentez ce code au commerçant pour bénéficier de votre réduction
      </Text>

      {/* QR Card */}
      <MCard style={styles.qrCard} elevation="xl">
        {/* User info */}
        <View style={styles.userRow}>
          <MAvatar
            uri={user?.avatarUrl}
            name={formatName(user?.firstName, user?.lastName)}
            size="sm"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {formatName(user?.firstName, user?.lastName)}
            </Text>
            <MBadge label="Client Maya" variant="orange" size="sm" />
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrWrapper}>
          {qrQuery.isLoading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color={colors.orange[500]} />
              <Text style={styles.loadingText}>Génération du QR code…</Text>
            </View>
          ) : qrToken ? (
            <QRCode
              value={qrToken}
              size={wp(220)}
              color={colors.neutral[900]}
              backgroundColor="#FFFFFF"
            />
          ) : hasError ? (
            <View style={styles.qrPlaceholder}>
              <ErrorState
                title="Erreur"
                description="Impossible de générer le QR code. Vérifiez votre connexion."
                onRetry={() => qrQuery.refetch()}
                icon="qr-code-outline"
              />
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.errorText}>
                Impossible de générer le QR code.{'\n'}
                Vérifiez votre abonnement.
              </Text>
              <MButton
                title="Voir les abonnements"
                onPress={() => router.push('/(client)/subscription')}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing[3] }}
              />
            </View>
          )}
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Ce code est unique et se rafraîchit automatiquement.{'\n'}
          Il est valable pour une transaction à la fois.
        </Text>
      </MCard>

      {/* Tips */}
      <View style={styles.tips}>
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipEmoji}>💡</Text>
          </View>
          <Text style={styles.tipText}>
            Augmentez la luminosité de l'écran pour faciliter le scan
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  title: {
    ...textStyles.h2,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  qrCard: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    backgroundColor: '#1E293B',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing[5],
  },
  userInfo: {
    marginLeft: spacing[3],
  },
  userName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  qrWrapper: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    backgroundColor: '#FFFFFF',
    ...shadows.md,
    marginBottom: spacing[4],
  },
  qrPlaceholder: {
    width: wp(220),
    height: wp(220),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...textStyles.caption,
    color: colors.neutral[400],
    marginTop: spacing[3],
  },
  errorText: {
    ...textStyles.body,
    color: colors.error[500],
    textAlign: 'center',
  },
  instructions: {
    ...textStyles.caption,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: wp(18),
  },
  tips: {
    marginTop: spacing[6],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  tipIcon: {
    marginRight: spacing[3],
  },
  tipEmoji: {
    fontSize: wp(20),
  },
  tipText: {
    ...textStyles.caption,
    color: '#FFFFFF',
    flex: 1,
  },
});
