import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { AuthService } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ForgotPasswordScreen: React.FC = () => {
  type Step = 'email' | 'phone' | 'code' | 'reset';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleVerifyEmail = async () => {
    resetMessages();
    setEmailError('');

    if (!email) {
      setEmailError('Email requis');
      setErrorMessage('⚠️ Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      await AuthService.requestPasswordReset(email);
      setSuccessMessage('✅ Email trouvé ! Entrez votre numéro de téléphone');
      setStep('phone');
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      setEmailError('❌ Cet email n\'est pas enregistré');
      setErrorMessage('Aucun compte trouvé avec cet email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    resetMessages();
    setPhoneError('');

    if (!phoneNumber) {
      setPhoneError('Numéro requis');
      setErrorMessage('⚠️ Veuillez entrer votre numéro de téléphone');
      return;
    }

    setLoading(true);
    try {
      await AuthService.requestPasswordResetCode(email, phoneNumber, 'sms');
      setSuccessMessage('✅ Code envoyé par SMS !');
      setStep('code');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error);
      setPhoneError('Impossible d\'envoyer le code');
      setErrorMessage('❌ Vérifiez le numéro saisi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    resetMessages();
    setCodeError('');

    if (!code || code.length < 4) {
      setCodeError('Code invalide');
      setErrorMessage('⚠️ Veuillez saisir le code reçu');
      return;
    }

    setLoading(true);
    try {
      await AuthService.verifyPasswordResetCode(email, code);
      setSuccessMessage('✅ Code vérifié ! Créez votre nouveau mot de passe');
      setStep('reset');
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      setCodeError('Code incorrect');
      setErrorMessage('❌ Code de vérification incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    resetMessages();
    setPasswordError('');
    setConfirmError('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('⚠️ Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Minimum 6 caractères requis');
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Les mots de passe ne correspondent pas');
      setErrorMessage('Les deux mots de passe doivent être identiques');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(code, newPassword, email);
      setSuccessMessage('✅ Mot de passe réinitialisé avec succès !');
      setTimeout(() => router.replace('/connexion/login'), 2000);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      setErrorMessage('❌ Échec de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const renderTitle = () => {
    switch (step) {
      case 'email':
        return 'Mot de passe oublié ?';
      case 'phone':
        return 'Numéro de téléphone';
      case 'code':
        return 'Entrez le code';
      case 'reset':
      default:
        return 'Nouveau mot de passe';
    }
  };

  const renderSubtitle = () => {
    switch (step) {
      case 'email':
        return 'Saisissez votre email pour vérifier votre compte';
      case 'phone':
        return 'Nous allons vous envoyer un code de vérification par SMS';
      case 'code':
        return 'Entrez le code reçu pour confirmer votre identité';
      case 'reset':
      default:
        return 'Créez un nouveau mot de passe sécurisé';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                <Ionicons
                  name="mail"
                  size={20}
                  color={emailError ? '#DC2626' : '#9CA3AF'}
                  style={styles.inputIcon as any}
                />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                    resetMessages();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            <AnimatedButton
              title={loading ? 'Vérification...' : 'Continuer'}
              onPress={handleVerifyEmail}
              icon="arrow-forward"
              style={styles.submitButton}
              variant="solid"
            />
          </>
        );
      case 'phone':
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <View style={[styles.inputWrapper, phoneError ? styles.inputError : null]}>
                <Ionicons
                  name="call"
                  size={20}
                  color={phoneError ? '#DC2626' : '#9CA3AF'}
                  style={styles.inputIcon as any}
                />
                <TextInput
                  style={styles.input}
                  placeholder="+33 6 12 34 56 78"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setPhoneError('');
                    resetMessages();
                  }}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
              {phoneError ? <Text style={styles.fieldError}>{phoneError}</Text> : null}
            </View>

            <AnimatedButton
              title={loading ? 'Envoi...' : 'Envoyer le code'}
              onPress={handleSendCode}
              icon="send"
              style={styles.submitButton}
              variant="solid"
            />

            <TouchableOpacity
              style={styles.backToEmailButton}
              onPress={() => {
                setStep('email');
                setPhoneNumber('');
                resetMessages();
              }}
            >
              <Text style={styles.backToEmailText}>← Changer d&apos;email</Text>
            </TouchableOpacity>
          </>
        );
      case 'code':
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Code de vérification</Text>
              <View style={[styles.inputWrapper, codeError ? styles.inputError : null]}>
                <Ionicons
                  name="keypad"
                  size={20}
                  color={codeError ? '#DC2626' : '#9CA3AF'}
                  style={styles.inputIcon as any}
                />
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    setCodeError('');
                    resetMessages();
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>
              {codeError ? <Text style={styles.fieldError}>{codeError}</Text> : null}
            </View>

            <AnimatedButton
              title={loading ? 'Vérification...' : 'Vérifier le code'}
              onPress={handleVerifyCode}
              icon="checkmark"
              style={styles.submitButton}
              variant="solid"
            />

            <TouchableOpacity
              style={styles.backToEmailButton}
              onPress={() => {
                setStep('phone');
                setCode('');
                resetMessages();
              }}
            >
              <Text style={styles.backToEmailText}>← Renvoyer un code</Text>
            </TouchableOpacity>
          </>
        );
      case 'reset':
      default:
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
              <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={passwordError ? '#DC2626' : '#9CA3AF'}
                  style={styles.inputIcon as any}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setPasswordError('');
                    resetMessages();
                  }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={[styles.inputWrapper, confirmError ? styles.inputError : null]}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={confirmError ? '#DC2626' : '#9CA3AF'}
                  style={styles.inputIcon as any}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmError('');
                    resetMessages();
                  }}
                  secureTextEntry={!showConfirm}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirm((value) => !value)}>
                  <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
            </View>

            <AnimatedButton
              title={loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              onPress={handleResetPassword}
              icon="checkmark"
              style={styles.submitButton}
              variant="solid"
            />

            <TouchableOpacity
              style={styles.backToEmailButton}
              onPress={() => {
                setStep('code');
                setNewPassword('');
                setConfirmPassword('');
                resetMessages();
              }}
            >
              <Text style={styles.backToEmailText}>← Revenir au code</Text>
            </TouchableOpacity>
          </>
        );
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
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={64} color="#8B5CF6" />
              </View>

              <Text style={styles.title}>{renderTitle()}</Text>
              <Text style={styles.subtitle}>{renderSubtitle()}</Text>

              {successMessage ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
              ) : null}

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {renderStepContent()}

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
};

const styles = StyleSheet.create({
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
    paddingHorizontal: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: 'black',
  },
  submitButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backToEmailButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  backToEmailText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
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
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
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
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
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
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

export default ForgotPasswordScreen;