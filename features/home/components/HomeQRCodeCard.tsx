import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { QrTokenData } from '@/features/home/services/qrApi';
import { responsiveIconSize, responsiveSpacing, scaleFont, scaleHeight, scaleSize, widthPercentage } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    ImageStyle,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface HomeQRCodeCardProps {
  qrData: QrTokenData | null;
  qrCodeResponse: any | null;
  qrLoading: boolean;
  qrError: string | null;
  hasActiveSubscription: boolean | null;
  subscriptionLoading: boolean;
  hasProfilePhoto: boolean;
  onShare: () => void;
  onReload: () => void;
  onRetry: () => void;
  onSubscribe: () => void;
  onAddPhoto: () => void;
}

export const HomeQRCodeCard: React.FC<HomeQRCodeCardProps> = ({
  qrData,
  qrCodeResponse,
  qrLoading,
  qrError,
  hasActiveSubscription,
  subscriptionLoading,
  hasProfilePhoto,
  onShare,
  onReload,
  onRetry,
  onSubscribe,
  onAddPhoto,
}) => {
  return (
    <View style={styles.qrCard}>
      <View style={styles.qrCardHeader}>
        <View style={styles.qrHeaderLeft}>
          <View style={styles.qrIconBadge}>
            <Ionicons name="qr-code" size={responsiveIconSize(20)} color="#8B2F3F" />
          </View>
          <View>
            <Text style={styles.qrTitle}>Mon QR Code</Text>
            <Text style={styles.qrSubtitle}>À présenter en caisse</Text>
          </View>
        </View>
        <View style={styles.qrHeaderActions}>
          <TouchableOpacity
            style={styles.qrActionButton}
            onPress={onShare}
            disabled={qrLoading || !qrData}
          >
            <Ionicons
              name="share-outline"
              size={responsiveIconSize(20)}
              color={Colors.text.light}
              style={(qrLoading || !qrData) && { opacity: 0.5 }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.qrReloadButton}
            onPress={onReload}
            disabled={qrLoading}
          >
            <Ionicons
              name="refresh"
              size={responsiveIconSize(20)}
              color={Colors.text.light}
              style={qrLoading && { opacity: 0.5 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.qrContainer}>
        {subscriptionLoading ? (
          <View style={styles.qrLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.text.light} />
            <Text style={styles.qrLoadingText}>Vérification de l'abonnement...</Text>
          </View>
        ) : hasActiveSubscription === false ? (
          <View style={styles.qrNoSubscriptionContainer}>
            <Ionicons name="lock-closed" size={responsiveIconSize(48)} color={Colors.text.secondary} />
            <Text style={styles.qrNoSubscriptionTitle}>QR Code non disponible</Text>
            <Text style={styles.qrNoSubscriptionText}>
              Un abonnement actif est requis pour accéder à votre QR Code.
            </Text>
            <TouchableOpacity style={styles.qrSubscribeButton} onPress={onSubscribe}>
              <Ionicons name="card" size={responsiveIconSize(20)} color={Colors.text.light} />
              <Text style={styles.qrSubscribeButtonText}>S'abonner maintenant</Text>
            </TouchableOpacity>
          </View>
        ) : !hasProfilePhoto ? (
          <View style={styles.qrNoSubscriptionContainer}>
            <Ionicons name="camera-outline" size={responsiveIconSize(48)} color={Colors.text.secondary} />
            <Text style={styles.qrNoSubscriptionTitle}>Photo de profil requise</Text>
            <Text style={styles.qrNoSubscriptionText}>
              Pour accéder à votre QR Code, vous devez ajouter une photo de profil. Un abonnement actif est également requis.
            </Text>
            <TouchableOpacity style={styles.qrSubscribeButton} onPress={onAddPhoto}>
              <Ionicons name="camera" size={responsiveIconSize(20)} color={Colors.text.light} />
              <Text style={styles.qrSubscribeButtonText}>Ajouter une photo</Text>
            </TouchableOpacity>
          </View>
        ) : qrLoading ? (
          <View style={styles.qrLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.text.light} />
            <Text style={styles.qrLoadingText}>Génération du QR Code...</Text>
          </View>
        ) : qrError ? (
          <View style={styles.qrErrorContainer}>
            <Ionicons name="alert-circle" size={responsiveIconSize(32)} color={Colors.status.error} />
            <Text style={styles.qrErrorText}>{qrError}</Text>
            <TouchableOpacity style={styles.qrRetryButton} onPress={onRetry}>
              <Text style={styles.qrRetryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : qrData?.token ? (
          <View style={styles.qrCodeWrapper}>
            <View style={styles.qrCodeContainer}>
              {qrCodeResponse?.imageBase64 ? (
                <Image
                  source={{
                    uri: qrCodeResponse.imageBase64.startsWith('data:')
                      ? qrCodeResponse.imageBase64
                      : `data:image/png;base64,${qrCodeResponse.imageBase64}`,
                  }}
                  style={styles.qrCodeImage as ImageStyle}
                  resizeMode="contain"
                />
              ) : qrCodeResponse?.qrCodeUrl ? (
                <Image
                  source={{ uri: qrCodeResponse.qrCodeUrl }}
                  style={styles.qrCodeImage as ImageStyle}
                  resizeMode="contain"
                />
              ) : qrData?.token ? (
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=${Math.round(scaleSize(300))}x${Math.round(scaleSize(300))}&data=${encodeURIComponent(qrData.token)}&format=png&margin=1`,
                  }}
                  style={styles.qrCodeImage as ImageStyle}
                  resizeMode="contain"
                />
              ) : null}
            </View>
            {qrData.expiresAt && (
              <View style={styles.qrExpiryContainer}>
                <Ionicons name="time-outline" size={responsiveIconSize(14)} color={Colors.text.secondary} />
                <Text style={styles.qrExpiryText}>
                  Expire le{' '}
                  {new Date(qrData.expiresAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  qrCard: {
        borderRadius: scaleSize(BorderRadius['2xl']),
    padding: responsiveSpacing(Spacing.xl),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.xl,
    marginBottom: responsiveSpacing(Spacing.lg),
  } as ViewStyle,
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSpacing(Spacing.xl),
  } as ViewStyle,
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing(Spacing.md),
  } as ViewStyle,
  qrIconBadge: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139, 47, 63, 0.5)',
  } as ViewStyle,
  qrTitle: {
    fontSize: scaleFont(Typography.sizes.xl),
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  qrSubtitle: {
    fontSize: scaleFont(Typography.sizes.sm),
    color: Colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  qrHeaderActions: {
    flexDirection: 'row',
    gap: responsiveSpacing(Spacing.sm),
  } as ViewStyle,
  qrActionButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  qrReloadButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleHeight(280),
  } as ViewStyle,
  qrLoadingContainer: {
    alignItems: 'center',
    gap: responsiveSpacing(Spacing.md),
  } as ViewStyle,
  qrLoadingText: {
    color: Colors.text.light,
    fontSize: scaleFont(Typography.sizes.base),
  } as TextStyle,
  qrErrorContainer: {
    alignItems: 'center',
    gap: responsiveSpacing(Spacing.md),
  } as ViewStyle,
  qrErrorText: {
    color: Colors.status.error,
    fontSize: scaleFont(Typography.sizes.base),
    textAlign: 'center',
  } as TextStyle,
  qrRetryButton: {
    marginTop: responsiveSpacing(Spacing.sm),
    paddingHorizontal: responsiveSpacing(Spacing.lg),
    paddingVertical: responsiveSpacing(Spacing.md),
    backgroundColor: Colors.status.error,
    borderRadius: scaleSize(BorderRadius.lg),
  } as ViewStyle,
  qrRetryText: {
    color: Colors.text.light,
    fontWeight: '600',
    fontSize: scaleFont(Typography.sizes.base),
  } as TextStyle,
  qrCodeWrapper: {
    alignItems: 'center',
    gap: responsiveSpacing(Spacing.md),
  } as ViewStyle,
  qrCodeContainer: {
    backgroundColor: 'white',
    borderRadius: scaleSize(BorderRadius.xl),
    padding: responsiveSpacing(Spacing.lg),
    ...Shadows.xl,
  } as ViewStyle,
  qrCodeImage: {
    width: widthPercentage(56), // ~220px sur base 390px = 56%
    height: widthPercentage(56),
    maxWidth: scaleSize(300),
    maxHeight: scaleSize(300),
    borderRadius: scaleSize(BorderRadius.lg),
  } as ViewStyle,
  qrExpiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing(Spacing.xs),
    paddingHorizontal: responsiveSpacing(Spacing.md),
    paddingVertical: responsiveSpacing(Spacing.sm),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  qrExpiryText: {
    color: Colors.text.secondary,
    fontSize: scaleFont(Typography.sizes.xs),
  } as TextStyle,
  qrNoSubscriptionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSpacing(Spacing.md),
    paddingVertical: responsiveSpacing(Spacing.xl),
  } as ViewStyle,
  qrNoSubscriptionTitle: {
    fontSize: scaleFont(Typography.sizes.xl),
    fontWeight: '700',
    color: Colors.text.light,
    textAlign: 'center',
  } as TextStyle,
  qrNoSubscriptionText: {
    fontSize: scaleFont(Typography.sizes.base),
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: responsiveSpacing(Spacing.lg),
    lineHeight: scaleFont(22),
  } as TextStyle,
  qrSubscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing(Spacing.sm),
    marginTop: responsiveSpacing(Spacing.md),
    paddingHorizontal: responsiveSpacing(Spacing.xl),
    paddingVertical: responsiveSpacing(Spacing.md),
    backgroundColor: Colors.primary[600],
    borderRadius: scaleSize(BorderRadius.lg),
    ...Shadows.md,
  } as ViewStyle,
  qrSubscribeButtonText: {
    color: Colors.text.light,
    fontSize: scaleFont(Typography.sizes.base),
    fontWeight: '700',
  } as TextStyle,
});

