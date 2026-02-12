import { AnimatedButton } from '@/components/common/animated-button';
import { ErrorMessage } from '@/components/common/error-message';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { AuthService } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const ForgotPasswordScreen: React.FC = () => {
  type Step = 'email' | 'phone' | 'code' | 'reset';
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('email');

  // Réinitialiser loading quand on passe à l'étape reset pour permettre la saisie
  useEffect(() => {
    if (step === 'reset') {
      setLoading(false);
      setPasswordError('');
      setConfirmError('');
    }
  }, [step]);
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
  const [resetToken, setResetToken] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Note: Ne pas réinitialiser loading automatiquement car cela peut interférer avec les requêtes en cours

  const handleSendCode = async (channel: 'email' | 'sms' = 'email') => {
    resetMessages();
    setEmailError('');
    setPhoneError('');

    if (!email) {
      setEmailError('Email requis');
      setErrorMessage('Veuillez entrer votre adresse email pour continuer');
      return;
    }

    if (channel === 'sms' && !phoneNumber) {
      setPhoneError('Numéro requis');
      setErrorMessage('Veuillez entrer votre numéro de téléphone pour recevoir le code de réinitialisation');
      return;
    }

    setLoading(true);
    try {
      // Utiliser directement la route request-password-reset-code
      await AuthService.requestPasswordResetCode(
        email, 
        channel === 'sms' ? phoneNumber : undefined, 
        channel
      );
      setSuccessMessage(`✅ Code envoyé par ${channel === 'email' ? 'email' : 'SMS'} !`);
      setStep('code');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error);
      if (channel === 'email') {
        setEmailError('Email invalide');
        setErrorMessage('Impossible d\'envoyer le code. Vérifiez que l\'email est correct et réessayez.');
      } else {
        setPhoneError('Numéro invalide');
        setErrorMessage('Impossible d\'envoyer le code. Vérifiez que le numéro est correct et réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    resetMessages();
    setCodeError('');

    if (!code || code.length < 4) {
      setCodeError('Code invalide');
      setErrorMessage('Veuillez saisir le code à 4 chiffres reçu par SMS');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 [Forgot Password] Vérification du code...');
      const token = await AuthService.verifyPasswordResetCode(email, code);
      
      if (token) {
        console.log('✅ [Forgot Password] Token de réinitialisation reçu');
        setResetToken(token);
      } else {
        console.log('✅ [Forgot Password] Code vérifié, utilisation du code comme token');
        // Si l'API ne retourne pas de token, utiliser le code comme token
        setResetToken(code);
      }
      
      setSuccessMessage('✅ Code vérifié ! Créez votre nouveau mot de passe');
      setStep('reset');
    } catch (error) {
      console.error('❌ [Forgot Password] Erreur lors de la vérification du code:', error);
      setCodeError('Code incorrect');
      setErrorMessage('Le code de vérification est incorrect. Vérifiez votre SMS et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    console.log('🚀 [Forgot Password] handleResetPassword appelé');
    console.log('📊 [Forgot Password] État actuel:', {
      step,
      loading,
      hasNewPassword: !!newPassword,
      hasConfirmPassword: !!confirmPassword,
      hasResetToken: !!resetToken,
      hasCode: !!code,
      newPasswordLength: newPassword.length,
      confirmPasswordLength: confirmPassword.length,
    });

    resetMessages();
    setPasswordError('');
    setConfirmError('');

    if (!newPassword || !confirmPassword) {
      console.log('❌ [Forgot Password] Champs manquants');
      if (!newPassword) {
        setPasswordError('Mot de passe requis');
      }
      if (!confirmPassword) {
        setConfirmError('Confirmation requise');
      }
      setErrorMessage('Veuillez remplir tous les champs pour créer votre nouveau mot de passe');
      return;
    }

    if (newPassword.length < 8) {
      console.log('❌ [Forgot Password] Mot de passe trop court');
      setPasswordError('Minimum 8 caractères requis');
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères pour plus de sécurité');
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('❌ [Forgot Password] Mots de passe différents');
      setConfirmError('Les mots de passe ne correspondent pas');
      setErrorMessage('Les deux mots de passe doivent être identiques. Vérifiez votre saisie.');
      return;
    }

    console.log('✅ [Forgot Password] Validation passée, début de la réinitialisation');
    setLoading(true);
    try {
      // Utiliser le token de réinitialisation (obtenu lors de la vérification du code)
      // Si pas de token, utiliser le code comme fallback
      const token = resetToken || code;

      console.log('🔐 [Forgot Password] Réinitialisation du mot de passe...');
      console.log('📋 [Forgot Password] Paramètres:', {
        hasResetToken: !!resetToken,
        hasCode: !!code,
        tokenLength: token.length,
        passwordLength: newPassword.length,
        email,
      });

      console.log('📡 [Forgot Password] Appel API resetPassword...');
      await AuthService.resetPassword(token, newPassword);
      console.log('✅ [Forgot Password] Réinitialisation réussie !');
      setSuccessMessage('✅ Mot de passe réinitialisé avec succès !');
      setTimeout(() => router.replace('/connexion/login'), 2000);
    } catch (error) {
      console.error('❌ [Forgot Password] Erreur lors de la réinitialisation:', error);
      if (error instanceof Error) {
        console.error('❌ [Forgot Password] Message d\'erreur:', error.message);
        console.error('❌ [Forgot Password] Stack:', error.stack);
        if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('token')) {
          setErrorMessage('Le code de réinitialisation a expiré. Veuillez recommencer le processus.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          setErrorMessage('Problème de connexion au serveur. Vérifiez votre connexion internet et réessayez.');
        } else {
          setErrorMessage(`Erreur lors de la réinitialisation : ${error.message}. Veuillez réessayer.`);
        }
      } else {
        console.error('❌ [Forgot Password] Erreur inconnue:', error);
        setErrorMessage('Échec de la réinitialisation. Veuillez réessayer ou contacter le support.');
      }
    } finally {
      console.log('🏁 [Forgot Password] Fin de handleResetPassword, loading = false');
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
        return 'Choisissez comment recevoir votre code de réinitialisation';
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
                  name="mail-outline"
                  size={20}
                  color={emailError ? '#EF4444' : '#9CA3AF'}
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
              title={loading ? 'Envoi...' : 'Envoyer le code par email'}
              onPress={() => handleSendCode('email')}
              icon="mail"
              style={styles.submitButton}
              variant="solid"
              disabled={loading}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.switchChannelButton}
              onPress={() => setStep('phone')}
            >
              <Text style={styles.switchChannelText}>Recevoir le code par SMS</Text>
            </TouchableOpacity>
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
              title={loading ? 'Envoi...' : 'Envoyer le code par SMS'}
              onPress={() => handleSendCode('sms')}
              icon="send"
              style={styles.submitButton}
              variant="solid"
              disabled={loading}
            />

            <TouchableOpacity
              style={styles.backToEmailButton}
              onPress={() => {
                setStep('email');
                setPhoneNumber('');
                resetMessages();
              }}
            >
              <Text style={styles.backToEmailText}>← Recevoir par email</Text>
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
              disabled={loading}
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
              <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]} pointerEvents="box-none">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordError ? '#EF4444' : '#9CA3AF'}
                  style={styles.inputIcon as any}
                />
                <TextInput
                  key="new-password-input"
                  style={styles.input}
                  placeholder="Entrez votre nouveau mot de passe"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  onChangeText={(text) => {
                    console.log('🔑 Nouveau mot de passe onChangeText:', text);
                    setNewPassword(text);
                    setPasswordError('');
                    resetMessages();
                  }}
                  secureTextEntry={!showPassword}
                  editable={true}
                  onFocus={() => {
                    console.log('🔑 Nouveau mot de passe onFocus');
                    setLoading(false);
                  }}
                  onBlur={() => console.log('🔑 Nouveau mot de passe onBlur')}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword((value) => !value)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={[styles.inputWrapper, confirmError ? styles.inputError : null]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={confirmError ? '#EF4444' : '#9CA3AF'}
                  style={styles.inputIcon as any}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmez votre mot de passe"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmError('');
                  }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowConfirm((value) => !value)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
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
              disabled={loading}
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
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Section supérieure avec fond sombre */}
          <View style={styles.topSection}>
            <SafeAreaView edges={['top']} style={styles.topSafeArea}>
              {/* Bouton retour */}
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#6B7280" />
              </TouchableOpacity>

              {/* Logo et nom de l'app */}
              <View style={styles.logoContainer}>
                <Image 
                  source={require('@/assets/images/logo2.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>MayaConnect</Text>
                <Text style={styles.slogan}>Votre partenaire économies</Text>
              </View>
            </SafeAreaView>
          </View>

          {/* Carte blanche en bas */}
          <View style={[styles.whiteCard, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            {/* Indicateur de drag */}
            <View style={styles.dragIndicator} />

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardDismissMode="none"
              nestedScrollEnabled={true}
              scrollEnabled={true}
              removeClippedSubviews={false}
            >
              <Text style={styles.title}>{renderTitle()}</Text>
              <Text style={styles.subtitle}>{renderSubtitle()}</Text>

              {/* Message d'erreur global */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <ErrorMessage
                    message={errorMessage}
                    type="error"
                    onDismiss={() => resetMessages()}
                    icon="alert-circle"
                  />
                </View>
              ) : null}

              {/* Message de succès */}
              {successMessage ? (
                <View style={styles.errorContainer}>
                  <ErrorMessage
                    message={successMessage}
                    type="success"
                    onDismiss={() => setSuccessMessage('')}
                    icon="checkmark-circle"
                  />
                </View>
              ) : null}

              {renderStepContent()}

              {step === 'email' ? null : (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity onPress={() => router.push('/connexion/login')}>
                    <Text style={styles.backToLogin}>Retour à la connexion</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </NavigationTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  keyboardView: {
    flex: 1,
  } as ViewStyle,
  topSection: {
    flex: 0.3,
    minHeight: 180,
  } as ViewStyle,
  topSafeArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  } as ViewStyle,
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: Spacing.xs,
  } as ImageStyle,
  appName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    marginBottom: 2,
    letterSpacing: -1,
  } as TextStyle,
  slogan: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  whiteCard: {
    flex: 0.7,
    backgroundColor: 'white',
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    ...Shadows.xl,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontWeight: Typography.weights.extrabold as any,
    color: '#111827',
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: Spacing.md,
  } as TextStyle,
  errorContainer: {
    marginBottom: Spacing.xs,
  } as ViewStyle,
  inputContainer: {
    marginBottom: Spacing.sm,
  } as ViewStyle,
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
    color: '#111827',
    marginBottom: Spacing.xs,
  } as TextStyle,
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'white',
    minHeight: 50,
  } as ViewStyle,
  inputIcon: {
    marginRight: Spacing.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 44,
    fontSize: Typography.sizes.base,
    color: '#111827',
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  } as TextStyle,
  submitButton: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  backToEmailButton: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  } as ViewStyle,
  backToEmailText: {
    color: '#8B2F3F',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  switchChannelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F3F4F6',
  } as ViewStyle,
  switchChannelText: {
    color: '#8B2F3F',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  } as ViewStyle,
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  } as ViewStyle,
  dividerText: {
    marginHorizontal: Spacing.md,
    color: '#6B7280',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  backToLogin: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  } as ViewStyle,
  fieldError: {
    color: '#EF4444',
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    marginLeft: Spacing.sm,
  } as TextStyle,
});

export default ForgotPasswordScreen;
