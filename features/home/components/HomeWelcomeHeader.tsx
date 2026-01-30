import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HomeWelcomeHeaderProps {
  firstName?: string;
  lastName?: string;
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const HomeWelcomeHeader: React.FC<HomeWelcomeHeaderProps> = ({ firstName, lastName }) => {
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

      // Si c'est une URL complète (http:// ou https://)
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
            // Essayer sans token si l'URL contient déjà un SAS token
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
          console.error('❌ [HomeHeader] Erreur lors du chargement depuis URL complète:', fetchError);
        }
      }
    } catch (error) {
      console.error('❌ [HomeHeader] Erreur lors du chargement avatar avec auth:', error);
    }
    return null;
  };

  // Charger l'avatar au montage du composant
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;

      // Si on a déjà le base64, l'utiliser
      if (user.avatarBase64) {
        setAvatarBase64(user.avatarBase64);
        return;
      }

      // Sinon, charger depuis l'URL
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

  // Récupérer l'URL de l'avatar pour créer une clé unique
  const avatarUrl = (user as any)?.avatarUrl || (user as any)?.avatar || '';
  const urlHash = avatarUrl ? avatarUrl.split('/').pop() || '' : '';
  const finalAvatarBase64 = avatarBase64 || user?.avatarBase64;

  return (
    <View style={styles.welcomeHeader}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Bonjour 👋</Text>
          <Text style={styles.welcomeName}>
            {firstName || 'Client'} {lastName || ''}
          </Text>
          <Text style={styles.welcomeSubtitle}>Profitez de vos avantages MayaConnect</Text>
        </View>
        <View style={styles.profileButtonContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              if (finalAvatarBase64) {
                setShowAvatarModal(true);
              } else {
                router.push('/(tabs)/profile');
              }
            }}
            onLongPress={() => router.push('/(tabs)/profile')}
          >
            {finalAvatarBase64 ? (
              <View style={styles.avatarContainer}>
                <Image
                  key={`home-avatar-${urlHash}-${finalAvatarBase64.substring(0, 20)}`}
                  source={{ uri: `data:image/jpeg;base64,${finalAvatarBase64}` }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color="rgba(255, 255, 255, 0.9)" />
              </View>
            )}
          </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.modalProfileButton}
                  onPress={() => {
                    setShowAvatarModal(false);
                    router.push('/(tabs)/profile');
                  }}
                >
                  <Ionicons name="person-circle" size={20} color={Colors.text.light} />
                  <Text style={styles.modalProfileButtonText}>Voir le profil</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeHeader: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  welcomeTextContainer: {
    flex: 1,
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
  profileButtonContainer: {
    padding: 4,
  } as ViewStyle,
  profileButton: {
    // Pas de style supplémentaire, le contenu définit la taille
  } as ViewStyle,
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  } as ViewStyle,
  avatarImage: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    width: SCREEN_WIDTH * 0.9,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  } as ViewStyle,
  modalImage: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    height: SCREEN_WIDTH * 0.9,
    maxHeight: 400,
    borderRadius: BorderRadius.xl,
  } as ViewStyle,
  modalProfileButton: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(139, 47, 63, 0.8)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  modalProfileButtonText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
});

