import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'partners' | 'client'>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    // Réinitialiser les erreurs
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');

    if (!email || !password) {
      setErrorMessage('⚠️ Veuillez remplir tous les champs');
      return;
    }
    try {
      const userInfo = await signIn({ email, password, role });
      
      // Vérifier si l'utilisateur est un partenaire ou opérateur pour rediriger directement
      const isPartnerOrOperator = userInfo?.email?.toLowerCase().includes('partner') || 
                                   userInfo?.email?.toLowerCase().includes('partenaire') ||
                                   userInfo?.email?.toLowerCase().includes('operator') ||
                                   userInfo?.email?.toLowerCase().includes('opérateur') ||
                                   (userInfo as any)?.role === 'partner' ||
                                   (userInfo as any)?.role === 'operator' ||
                                   (userInfo as any)?.role === 'opérateur' ||
                                   (userInfo as any)?.isPartner === true ||
                                   (userInfo as any)?.isOperator === true;
      
      // Redirection vers la page appropriée après connexion réussie
      if (isPartnerOrOperator) {
        router.replace('/(tabs)/partner-home');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      if (error instanceof Error) {
        if (error.message === 'INVALID_EMAIL') {
          setEmailError('❌ Cet email n\'est pas enregistré');
          setErrorMessage('Email non trouvé dans notre base de données');
        } else if (error.message === 'INVALID_PASSWORD') {
          setPasswordError('❌ Mot de passe incorrect');
          setErrorMessage('Le mot de passe ne correspond pas à cet email');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network') || error.message === 'TIMEOUT_ERROR') {
          setErrorMessage('❌ Serveur backend non disponible. Vérifiez que le serveur est démarré.');
        } else {
          setErrorMessage(`❌ Erreur: ${error.message}`);
        }
      } else {
        setErrorMessage('❌ Échec de la connexion. Veuillez réessayer.');
      }
    }
  };


  return (
    <NavigationTransition direction="right" children={<></>}>
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
            </View>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>Accédez à votre espace d&apos;économies en un instant</Text>

              {/* Message d'erreur global */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Bouton de connexion Google */}
              <TouchableOpacity
                style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]}
                onPress={async () => {
                  setGoogleLoading(true);
                  setErrorMessage('');
                  try {
                    const userInfo = await signInWithGoogle();
                    
                    // Vérifier si l'utilisateur est un partenaire ou opérateur
                    const isPartnerOrOperator = userInfo?.email?.toLowerCase().includes('partner') || 
                                                 userInfo?.email?.toLowerCase().includes('partenaire') ||
                                                 userInfo?.email?.toLowerCase().includes('operator') ||
                                                 userInfo?.email?.toLowerCase().includes('opérateur') ||
                                                 (userInfo as any)?.role === 'partner' ||
                                                 (userInfo as any)?.role === 'operator' ||
                                                 (userInfo as any)?.role === 'opérateur' ||
                                                 (userInfo as any)?.isPartner === true ||
                                                 (userInfo as any)?.isOperator === true;
                    
                    // Redirection vers la page appropriée
                    if (isPartnerOrOperator) {
                      router.replace('/(tabs)/partner-home');
                    } else {
                      router.replace('/(tabs)/home');
                    }
                  } catch (error) {
                    console.error('Erreur lors de la connexion Google:', error);
                    if (error instanceof Error) {
                      if (error.message.includes('annulée')) {
                        setErrorMessage('Connexion Google annulée');
                      } else if (error.message.includes('Accès bloqué')) {
                        setErrorMessage('❌ Accès bloqué. Vérifiez que l\'application est autorisée dans votre compte Google ou contactez le support.');
                      } else if (error.message.includes('redirect_uri')) {
                        setErrorMessage('❌ Erreur de configuration. Veuillez contacter le support technique.');
                      } else {
                        setErrorMessage(`❌ ${error.message}`);
                      }
                    } else {
                      setErrorMessage('❌ Échec de la connexion Google. Veuillez réessayer.');
                    }
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                disabled={googleLoading}
              >
                <View style={styles.googleButtonContent}>
                  {googleLoading ? (
                    <Text style={styles.googleButtonText}>Connexion...</Text>
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={20} color="#4285F4" />
                      <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OU</Text>
                <View style={styles.dividerLine} />
              </View>

             
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                  <Ionicons name="mail" size={20} color={emailError ? "#EF4444" : "rgba(255, 255, 255, 0.8)"} style={styles.inputIcon as any} />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError('');
                      setErrorMessage('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {emailError ? (
                  <Text style={styles.fieldError}>{emailError}</Text>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                  <Ionicons name="lock-closed" size={20} color={passwordError ? "#EF4444" : "rgba(255, 255, 255, 0.8)"} style={styles.inputIcon as any} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                      setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255, 255, 255, 0.8)" />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.fieldError}>{passwordError}</Text>
                ) : null}
              </View>

              <AnimatedButton
                title="Se connecter"
                onPress={handleLogin}
                icon="log-in"
                style={styles.loginButton}
                variant="solid"
              />

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/connexion/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

             

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Pas encore de compte ? </Text>
                <TouchableOpacity onPress={() => router.push('/connexion/signup')}>
                  <Text style={styles.signupLink}>S&apos;inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </NavigationTransition>
  );
}

type LoginStyles = {
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
  scrollContainer: ViewStyle;
  scrollContent: ViewStyle;
  card: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  socialButtons: ViewStyle;
  socialButton: ViewStyle;
  socialIconButton: ViewStyle;
  socialButtonText: TextStyle;
  googleButton: ViewStyle;
  googleButtonDisabled: ViewStyle;
  googleButtonContent: ViewStyle;
  googleButtonText: TextStyle;
  divider: ViewStyle;
  dividerLine: ViewStyle;
  dividerText: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  inputWrapper: ViewStyle;
  inputIcon: ViewStyle;
  input: TextStyle;
  loginButton: ViewStyle;
  skipLoginButton: ViewStyle;
  forgotPassword: ViewStyle;
  forgotPasswordText: TextStyle;
  signupContainer: ViewStyle;
  signupText: TextStyle;
  signupLink: TextStyle;
  errorBanner: ViewStyle;
  errorBannerText: TextStyle;
  inputError: ViewStyle;
  fieldError: TextStyle;
  roleSelector: ViewStyle;
  roleButton: ViewStyle;
  roleButtonActive: ViewStyle;
  roleButtonText: TextStyle;
  roleButtonTextActive: TextStyle;
};

const styles = StyleSheet.create<LoginStyles>({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    top: 20,
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
    marginBottom: 0,
    width: 100,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 40,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(20px)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 26,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: Typography.weights.medium as any,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  socialButton: {
    flex: 1,
  },
  socialIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  socialButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 11,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Shadows.md,
  } as ViewStyle,
  googleButtonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  googleButtonText: {
    color: Colors.text.dark,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    letterSpacing: 0.2,
  } as TextStyle,
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.sm,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  },
  loginButton: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  skipLoginButton: {
    marginBottom: 20,
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    textDecorationLine: 'underline',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  signupLink: {
    color: Colors.text.light,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold as any,
    marginLeft: Spacing.xs,
    textDecorationLine: 'underline',
    letterSpacing: -0.2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    color: '#991B1B',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  fieldError: {
    color: '#EF4444',
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleButtonActive: {
    backgroundColor: '#8B2F3F',
    borderColor: 'rgba(139, 47, 63, 0.8)',
    ...Shadows.md,
  },
  roleButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: Typography.weights.bold as any,
  },
});
