/**
 * Maya Connect V2 — Sign Up Screen
 *
 * Enhanced registration with:
 *  • Mandatory avatar picker (profile photo)
 *  • FirstName, LastName, Email, Phone, Password, Confirm
 *  • Zod validation + react-hook-form
 *  • Auto-login after registration
 *  • Redirect to subscription page
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api/auth.api';
import { registerSchema, type RegisterFormData } from '../../src/utils/validation';
import { colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { MButton, MInput, MHeader } from '../../src/components/ui';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  /* ── Avatar picker ── */
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarError(null);
    }
  };

  /* ── Submit ── */
  const onSubmit = async (data: RegisterFormData) => {
    console.log('[SignUp] onSubmit called', { email: data.email, firstName: data.firstName, lastName: data.lastName, hasAvatar: !!avatarUri });

    // Validate avatar is selected
    if (!avatarUri) {
      setAvatarError('Veuillez ajouter une photo de profil');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      console.log('[SignUp] Blocked: no avatar selected');
      return;
    }

    try {
      setLoading(true);

      // Convert avatar to base64 for registration
      let avatarBase64: string | undefined;
      let avatarFileName: string | undefined;
      if (avatarUri) {
        console.log('[SignUp] Reading avatar as base64, uri:', avatarUri);
        const base64 = await readAsStringAsync(avatarUri, {
          encoding: 'base64',
        });
        avatarBase64 = base64;
        avatarFileName = 'avatar.jpg';
        console.log('[SignUp] Avatar base64 length:', base64.length);
      }

      // 1. Register
      console.log('[SignUp] Calling authApi.register...');
      const registerRes = await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
        role: 'Client',
        address: { street: '', city: '', country: '' },
        avatarBase64,
        avatarFileName,
      });
      console.log('[SignUp] Register response status:', registerRes.status, 'data:', JSON.stringify(registerRes.data));

      // 2. Auto-login with the same credentials
      console.log('[SignUp] Calling authApi.login...');
      const { data: loginData } = await authApi.login({
        email: data.email,
        password: data.password,
      });
      console.log('[SignUp] Login success, accessToken length:', loginData.accessToken?.length, 'expiresIn:', loginData.expiresIn);
      const { accessToken, refreshToken, expiresIn } = loginData;

      // 3. Set token for /me call
      useAuthStore.setState({ accessToken });

      // 4. Fetch full profile
      console.log('[SignUp] Fetching profile...');
      const { data: user } = await authApi.getProfile();
      console.log('[SignUp] Profile fetched:', { id: user.id, email: user.email, role: user.role });

      // 5. Persist session
      await setSession(
        {
          accessToken,
          refreshToken,
          expiresAt: Date.now() + (expiresIn ?? 3600) * 1000,
        },
        user,
      );
      console.log('[SignUp] Session persisted');

      // Mark onboarding done after successful signup
      await completeOnboarding();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 6. Redirect new clients to subscription page
      const role = useAuthStore.getState().role;
      console.log('[SignUp] Role detected:', role, '→ redirecting...');
      if (role === 'partner' || role === 'storeOperator') {
        router.replace('/(partner)/dashboard');
      } else {
        router.replace('/(client)/subscription');
      }
    } catch (err: any) {
      useAuthStore.setState({ accessToken: null });
      console.log('[SignUp] ERROR caught:', {
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        message: err?.message,
      });
      const msg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        "Impossible de créer votre compte. Veuillez réessayer.";
      Alert.alert('Erreur', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={isIOS ? 'padding' : undefined}
    >
      <MHeader title="Créer un compte" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text style={styles.heading}>Rejoignez Maya Connect</Text>
        <Text style={styles.sub}>
          Créez votre compte gratuit et profitez de réductions exclusives dès
          aujourd'hui.
        </Text>

        {/* Avatar picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarPicker}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={wp(32)}
                  color={colors.neutral[400]}
                />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="add" size={wp(16)} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Photo de profil *</Text>
          {avatarError && <Text style={styles.avatarErrorText}>{avatarError}</Text>}
        </View>

        {/* Form */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <MInput
                  label="Prénom"
                  icon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                  autoCapitalize="words"
                  required
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <MInput
                  label="Nom"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                  autoCapitalize="words"
                  required
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <MInput
              label="Adresse e-mail"
              icon="mail-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />
          )}
        />

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <MInput
              label="Téléphone (optionnel)"
              icon="call-outline"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phoneNumber?.message}
              keyboardType="phone-pad"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <MInput
              label="Mot de passe"
              icon="lock-closed-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
              required
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <MInput
              label="Confirmer le mot de passe"
              icon="shield-checkmark-outline"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              secureTextEntry
              required
            />
          )}
        />

        <MButton
          title="Créer mon compte"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={{ marginTop: spacing[4] }}
        />

        {/* Already have account */}
        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  heading: {
    ...textStyles.h2,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  sub: {
    ...textStyles.body,
    color: colors.neutral[500],
    marginBottom: spacing[6],
  },
  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  avatarPicker: {
    position: 'relative',
  },
  avatarImage: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
  },
  avatarPlaceholder: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  avatarErrorText: {
    ...textStyles.micro,
    color: colors.error?.[500] ?? '#EF4444',
    marginTop: spacing[1],
  },
  /* Form */
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfField: {
    flex: 1,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[6],
  },
  loginLabel: {
    ...textStyles.body,
    color: colors.neutral[500],
  },
  loginLink: {
    ...textStyles.body,
    color: colors.orange[500],
    fontFamily: fontFamily.semiBold,
  },
});
