/**
 * StoreImageManager — Manage store image (Manager only).
 *
 * Features:
 *  • Display current store image with fallback
 *  • Pick new image from gallery
 *  • Upload via API
 *  • Delete current image
 *
 * Usage:
 *   <StoreImageManager
 *     storeId="..."
 *     imageUrl={store.imageUrl}
 *     partnerImageUrl={store.partnerImageUrl}
 *     onImageUpdated={(newUrl) => {}}
 *   />
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { storesApi } from '../../api/stores.api';
import { operatorColors as colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MButton } from '../ui';

const DEFAULT_IMAGE = require('../../../assets/images/centered_logo_gradient.png');

interface StoreImageManagerProps {
  storeId: string;
  imageUrl?: string | null;
  partnerImageUrl?: string | null;
  onImageUpdated?: (newUrl: string | null) => void;
}

export default function StoreImageManager({
  storeId,
  imageUrl,
  partnerImageUrl,
  onImageUpdated,
}: StoreImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentImage, setCurrentImage] = useState(imageUrl);

  // Sync from parent when imageUrl prop changes (e.g. after query invalidation)
  React.useEffect(() => {
    setCurrentImage(imageUrl ?? null);
  }, [imageUrl]);

  const imgSource = currentImage
    ? { uri: currentImage }
    : partnerImageUrl
    ? { uri: partnerImageUrl }
    : DEFAULT_IMAGE;

  const hasOwnImage = !!currentImage;

  /* ── Pick & Upload ── */
  const handlePickImage = () => {
    Alert.alert(
      'Image du magasin',
      '',
      [
        {
          text: 'Prendre une photo',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permission requise', "L'accès à la caméra est nécessaire.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.85,
            });
            if (!result.canceled && result.assets[0]) {
              await doUpload(result.assets[0]);
            }
          },
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: async () => {
            const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permResult.granted) {
              Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour ajouter une image.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.85,
            });
            if (!result.canceled && result.assets[0]) {
              await doUpload(result.assets[0]);
            }
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  const doUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: 'store-image.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as any);
      const res = await storesApi.uploadImage(storeId, form);
      // API returns { url, message } — cache-bust with timestamp to bypass CDN/RN cache
      const rawUrl = res.data.url;
      const newUrl = rawUrl ? `${rawUrl}?v=${Date.now()}` : rawUrl;
      setCurrentImage(newUrl);
      onImageUpdated?.(newUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const msg =
        err?.response?.status === 404
          ? "L'endpoint d'upload d'image n'est pas encore disponible sur le serveur."
          : "Impossible de mettre à jour l'image du magasin.";
      Alert.alert('Erreur', msg);
    } finally {
      setUploading(false);
    }
  };

  /* ── Delete ── */
  const handleDeleteImage = () => {
    Alert.alert(
      "Supprimer l'image",
      "Êtes-vous sûr de vouloir supprimer l'image du magasin ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await storesApi.deleteImage(storeId);
              setCurrentImage(null);
              onImageUpdated?.(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              const msg =
                err?.response?.status === 404
                  ? "L'endpoint de suppression d'image n'est pas encore disponible sur le serveur."
                  : "Impossible de supprimer l'image du magasin.";
              Alert.alert('Erreur', msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Image preview */}
      <View style={styles.imageWrap}>
        <Image source={imgSource} style={styles.image} />
        {(uploading || deleting) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}
        {!hasOwnImage && !uploading && (
          <View style={styles.placeholderBadge}>
            <Ionicons name="image-outline" size={wp(14)} color={colors.neutral[400]} />
            <Text style={styles.placeholderText}>Image partenaire</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <MButton
          title={hasOwnImage ? 'Changer l\'image' : 'Ajouter une image'}
          variant="outline"
          size="sm"
          onPress={handlePickImage}
          loading={uploading}
          disabled={deleting}
          icon={<Ionicons name="camera-outline" size={wp(16)} color={colors.violet[500]} />}
          style={{ flex: 1 }}
        />
        {hasOwnImage && (
          <MButton
            title="Supprimer"
            variant="ghost"
            size="sm"
            onPress={handleDeleteImage}
            loading={deleting}
            disabled={uploading}
            icon={<Ionicons name="trash-outline" size={wp(16)} color={colors.error[500]} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  imageWrap: {
    width: '100%',
    height: wp(180),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderBadge: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  placeholderText: {
    ...textStyles.caption,
    color: colors.neutral[400],
    fontFamily: fontFamily.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
  },
});
