import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, Modal, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PartnerHeaderProps {
  firstName?: string;
  lastName?: string;
  onLogout?: () => void;
  showWelcome?: boolean;
  title?: string;
}

// Fonction helper pour convertir un Uint8Array en base64 (compatible React Native)
function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = i < binary.length ? binary.charCodeAt(i++) : 0;
    const c = i < binary.length ? binary.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
}

export function PartnerHeader({ firstName, lastName, onLogout, showWelcome = true, title }: PartnerHeaderProps) {
  const { user } = useAuth();
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Fonction pour charger l'avatar avec authentification
  const loadAvatarWithAuth = async (avatarUrl: string) => {
    try {
      const token = await AuthService.getAccessToken();
      if (!token) {
        return null;
      }

      const isFullUrl = avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
      
      if (isFullUrl) {
        try {
          const response = await fetch(avatarUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
            },
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            const base64 = arrayBufferToBase64(bytes);
            return base64;
          } else {
            const responseWithoutToken = await fetch(avatarUrl, {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            });

            if (responseWithoutToken.ok) {
              const arrayBuffer = await responseWithoutToken.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const base64 = arrayBufferToBase64(bytes);
              return base64;
            }
          }
        } catch (fetchError) {
          console.error('❌ [PartnerHeader] Erreur lors du chargement depuis URL complète:', fetchError);
        }
      }
    } catch (error) {
      console.error('❌ [PartnerHeader] Erreur lors du chargement avatar avec auth:', error);
    }
    return null;
  };

  // Charger l'avatar au montage du composant
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;

      if (user.avatarBase64) {
        setAvatarBase64(user.avatarBase64);
        return;
      }

      const avatarUrl = (user as any)?.avatarUrl || (user as any)?.avatar;
      if (avatarUrl) {
        const base64 = await loadAvatarWithAuth(avatarUrl);
        if (base64) {
          setAvatarBase64(base64);
        }
      }
    };

    loadAvatar();
  }, [user]);

  const avatarUrl = (user as any)?.avatarUrl || (user as any)?.avatar || '';
  const urlHash = avatarUrl ? avatarUrl.split('/').pop() || '' : '';
  const finalAvatarBase64 = avatarBase64 || user?.avatarBase64;

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          {showWelcome ? (
            <>
              <Text style={styles.welcomeText}>Bonjour </Text>
              <Text style={styles.welcomeName}>
                {firstName || 'Partenaire'} {lastName || ''}
              </Text>
            </>
          ) : (
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>
                {title || `${firstName || 'Partenaire'} ${lastName || ''}`}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.actionsContainer}>
          {onLogout && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.text.light} />
            </TouchableOpacity>
          )}
          <View style={styles.profileButtonContainer}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {
                if (finalAvatarBase64) {
                  setShowAvatarModal(true);
                }
              }}
              onLongPress={() => {
                // Navigation vers profil si disponible
              }}
            >
              {finalAvatarBase64 ? (
                <View style={styles.avatarContainer}>
                  <Image
                    key={`partner-avatar-${urlHash}-${finalAvatarBase64.substring(0, 20)}`}
                    source={{ uri: `data:image/jpeg;base64,${finalAvatarBase64}` }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="rgba(255, 255, 255, 0.9)" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Modal pour afficher l'image en grand */}
        <Modal
          visible={showAvatarModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowAvatarModal(false)}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowAvatarModal(false)}
                >
                  <Ionicons name="close" size={28} color={Colors.text.light} />
                </TouchableOpacity>
                {finalAvatarBase64 && (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${finalAvatarBase64}` }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 80,
  } as ViewStyle,
  headerTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  } as ViewStyle,
  welcomeText: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weights.medium as any,
    marginBottom: 4,
  } as TextStyle,
  welcomeName: {
    fontSize: 32,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    letterSpacing: -0.8,
    marginBottom: 4,
  } as TextStyle,
  welcomeSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  titleContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    justifyContent: 'center',
    minHeight: 64, // Aligner avec la hauteur de l'avatar
  } as ViewStyle,
  headerTitle: {
    fontSize: 28,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    letterSpacing: -0.5,
    lineHeight: 34,
  } as TextStyle,
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 4,
  } as ViewStyle,
  logoutButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  profileButtonContainer: {
    padding: 4,
  } as ViewStyle,
  profileButton: {
    // Pas de style supplémentaire, le contenu définit la taille
  } as ViewStyle,
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  } as ViewStyle,
  avatarImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  modalContainer: {
    flex: 1,
  } as ViewStyle,
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalContent: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  modalCloseButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  } as ViewStyle,
  modalImage: {
    width: '100%',
    maxWidth: 400,
    height: 400,
    borderRadius: BorderRadius.xl,
  } as ImageStyle,
});

