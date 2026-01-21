import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { QrTokenData } from '@/features/home/services/qrApi';
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
  onShare: () => void;
  onReload: () => void;
  onRetry: () => void;
}

export const HomeQRCodeCard: React.FC<HomeQRCodeCardProps> = ({
  qrData,
  qrCodeResponse,
  qrLoading,
  qrError,
  onShare,
  onReload,
  onRetry,
}) => {
  return (
    <View style={styles.qrCard}>
      <View style={styles.qrCardHeader}>
        <View style={styles.qrHeaderLeft}>
          <View style={styles.qrIconBadge}>
            <Ionicons name="qr-code" size={20} color="#8B2F3F" />
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
              size={20}
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
              size={20}
              color={Colors.text.light}
              style={qrLoading && { opacity: 0.5 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.qrContainer}>
        {qrLoading ? (
          <View style={styles.qrLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.text.light} />
            <Text style={styles.qrLoadingText}>Génération du QR Code...</Text>
          </View>
        ) : qrError ? (
          <View style={styles.qrErrorContainer}>
            <Ionicons name="alert-circle" size={32} color={Colors.status.error} />
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
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.token)}&format=png&margin=1`,
                  }}
                  style={styles.qrCodeImage as ImageStyle}
                  resizeMode="contain"
                />
              ) : null}
            </View>
            {qrData.expiresAt && (
              <View style={styles.qrExpiryContainer}>
                <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.xl,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  } as ViewStyle,
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  qrIconBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139, 47, 63, 0.5)',
  } as ViewStyle,
  qrTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  qrSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  qrHeaderActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  qrActionButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  qrReloadButton: {
    width: 40,
    height: 40,
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
    minHeight: 280,
  } as ViewStyle,
  qrLoadingContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  qrLoadingText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.base,
  } as TextStyle,
  qrErrorContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  qrErrorText: {
    color: Colors.status.error,
    fontSize: Typography.sizes.base,
    textAlign: 'center',
  } as TextStyle,
  qrRetryButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  qrRetryText: {
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  qrCodeWrapper: {
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  qrCodeContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.xl,
  } as ViewStyle,
  qrCodeImage: {
    width: 220,
    height: 220,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  qrExpiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  qrExpiryText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.xs,
  } as TextStyle,
});

