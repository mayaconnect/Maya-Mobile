import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { AuthService } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async () => {
    setErrorMessage('');
    setEmailError('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('⚠️ Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      // Vérifier si l'email existe
      const userExists = await AuthService.checkEmailExists(email);
      if (!userExists) {
        setEmailError('❌ Cet email n\'est pas enregistré');
        setErrorMessage('Aucun compte trouvé avec cet email');
      } else {
        setSuccessMessage('✅ Email vérifié ! Créez votre nouveau mot de passe');
        setStep('reset');
      }
    } catch {
      setErrorMessage('❌ Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    setPasswordError('');
    setConfirmError('');
    setSuccessMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('⚠️ Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('❌ Les mots de passe ne correspondent pas');
      setErrorMessage('Les deux mots de passe doivent être identiques');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('❌ Minimum 6 caractères requis');
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(email, newPassword);
      setSuccessMessage('✅ Mot de passe réinitialisé avec succès !');
      
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.replace('/connexion/login');
      }, 2000);
    } catch {
      setErrorMessage('❌ Échec de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <NavigationTransition direction="right">
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={20} color="white" />
                <Text style={styles.headerText}>Retour</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>Maya</Text>
              <View style={styles.logoUnderline} />
            </View>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              {/* Icône */}
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={64} color="#8B5CF6" />
              </View>

              <Text style={styles.title}>
                {step === 'email' ? 'Mot de passe oublié ?' : 'Nouveau mot de passe'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'email' 
                  ? 'Entrez votre email pour réinitialiser votre mot de passe'
                  : 'Créez un nouveau mot de passe sécurisé'}
              </Text>

              {/* Message de succès */}
              {successMessage ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* Message d'erreur global */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {step === 'email' ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                      <Ionicons 
                        name="mail" 
                        size={20} 
                        color={emailError ? "#DC2626" : "#9CA3AF"} 
                        style={styles.inputIcon as any} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="votre@email.com"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          setEmailError('');
                          setErrorMessage('');
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>
                    {emailError ? (
                      <Text style={styles.fieldError}>{emailError}</Text>
                    ) : null}
                  </View>

                  <AnimatedButton
                    title={loading ? "Vérification..." : "Vérifier l'email"}
                    onPress={handleVerifyEmail}
                    icon="arrow-forward"
                    style={styles.submitButton}
                    variant="solid"
                  />
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                    <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                      <Ionicons 
                        name="lock-closed" 
                        size={20} 
                        color={passwordError ? "#DC2626" : "#9CA3AF"} 
                        style={styles.inputIcon as any} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          setPasswordError('');
                          setErrorMessage('');
                        }}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? (
                      <Text style={styles.fieldError}>{passwordError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                    <View style={[styles.inputWrapper, confirmError ? styles.inputError : null]}>
                      <Ionicons 
                        name="lock-closed" 
                        size={20} 
                        color={confirmError ? "#DC2626" : "#9CA3AF"} 
                        style={styles.inputIcon as any} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          setConfirmError('');
                          setErrorMessage('');
                        }}
                        secureTextEntry={!showConfirm}
                        editable={!loading}
                      />
                      <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                        <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    {confirmError ? (
                      <Text style={styles.fieldError}>{confirmError}</Text>
                    ) : null}
                  </View>

                  <AnimatedButton
                    title={loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                    onPress={handleResetPassword}
                    icon="checkmark"
                    style={styles.submitButton}
                    variant="solid"
                  />

                  <TouchableOpacity 
                    style={styles.backToEmailButton}
                    onPress={() => setStep('email')}
                  >
                    <Text style={styles.backToEmailText}>← Changer d&apos;email</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity onPress={() => router.push('/connexion/login')}>
                <Text style={styles.backToLogin}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </NavigationTransition>
  );
}

type ForgotPasswordStyles = {
  container: ViewStyle;
  safeArea: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  backButtonInner: ViewStyle;
  headerText: TextStyle;
  logoContainer: ViewStyle;
  appName: TextStyle;
  logoUnderline: ViewStyle;
  placeholder: ViewStyle;
  content: ViewStyle;
  card: ViewStyle;
  iconContainer: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  inputWrapper: ViewStyle;
  inputIcon: ViewStyle;
  input: TextStyle;
  submitButton: ViewStyle;
  backToEmailButton: ViewStyle;
  backToEmailText: TextStyle;
  divider: ViewStyle;
  dividerLine: ViewStyle;
  dividerText: TextStyle;
  backToLogin: TextStyle;
  errorBanner: ViewStyle;
  errorBannerText: TextStyle;
  successBanner: ViewStyle;
  successBannerText: TextStyle;
  inputError: ViewStyle;
  fieldError: TextStyle;
};

const styles = StyleSheet.create<ForgotPasswordStyles>({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  backButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.xs,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.light,
    letterSpacing: Typography.letterSpacing.wide,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoUnderline: {
    width: 50,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  placeholder: {
    width: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    marginVertical: Spacing.lg,
    ...Shadows.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: 'black',
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  backToEmailButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backToEmailText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  backToLogin: {
    textAlign: 'center',
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  successBannerText: {
    flex: 1,
    color: '#065F46',
    fontSize: 14,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

