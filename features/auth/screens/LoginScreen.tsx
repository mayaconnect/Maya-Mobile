import { ErrorMessage } from '@/components/common/error-message';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Animated,
  Image,
  ImageStyle,
  Keyboard,
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
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const wasKeyboardVisible = React.useRef(false);

  // Animation pour l'effet d'expansion
  const expandAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Animation seulement si le clavier n'était pas déjà ouvert
        if (!wasKeyboardVisible.current) {
          setIsKeyboardVisible(true);
          Animated.spring(expandAnimation, {
            toValue: 1,
            useNativeDriver: true,
            damping: 18,
            stiffness: 120,
            mass: 1,
          }).start();
        }
        wasKeyboardVisible.current = true;
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        wasKeyboardVisible.current = false;
        // Animation de retour quand le clavier se ferme
        Animated.spring(expandAnimation, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 120,
          mass: 1,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    // Réinitialiser les erreurs
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');

    if (!email || !password) {
      if (!email) {
        setEmailError('Champ requis');
      }
      if (!password) {
        setPasswordError('Champ requis');
      }
      setErrorMessage('Veuillez remplir tous les champs pour continuer');
      return;
    }
    try {
      console.log('🔐 [LoginScreen] Tentative de connexion...');
      const userInfo = await signIn({ email, password, role });
      console.log('✅ [LoginScreen] Connexion réussie, redirection...');
      
      // Vérifier si l'utilisateur est un partenaire ou opérateur pour rediriger directement
      const isPartnerOrOperator = userInfo?.email?.toLowerCase().includes('partner') || 
                                   userInfo?.email?.toLowerCase().includes('partenaire') ||
                                   userInfo?.email?.toLowerCase().includes('operator') ||
                                   userInfo?.email?.toLowerCase().includes('opérateur') ||
                                   (userInfo as any)?.role === 'partner' ||
                                   (userInfo as any)?.role === 'operator' ||
                                   (userInfo as any)?.role === 'opérateur' ||
                                   (userInfo as any)?.role === 'StoreOperator' ||
                                   (userInfo as any)?.isPartner === true ||
                                   (userInfo as any)?.isOperator === true;
      
      // Redirection vers la page appropriée après connexion réussie
      if (isPartnerOrOperator) {
        router.replace('/(tabs)/partner-home');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('❌ [LoginScreen] Erreur lors de la connexion:', error);
      console.log('🔍 [LoginScreen] Reste sur la page de connexion pour afficher l\'erreur');
      if (error instanceof Error) {
        // Gestion des erreurs d'identifiants
        if (error.message === 'INVALID_EMAIL' || error.message.includes('404') || error.message.includes('not found')) {
          setEmailError('Email non trouvé');
          setErrorMessage('Cet email n\'est pas enregistré. Vérifiez votre adresse ou créez un compte.');
        } else if (error.message === 'INVALID_PASSWORD' || error.message === 'INVALID_CREDENTIALS' || error.message.includes('401') || error.message.includes('Unauthorized')) {
          setPasswordError('Mot de passe incorrect');
          setErrorMessage('Le mot de passe ne correspond pas à cet email. Vérifiez votre saisie ou réinitialisez votre mot de passe.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network') || error.message === 'TIMEOUT_ERROR' || error.message.includes('timeout')) {
          setErrorMessage('Problème de connexion au serveur. Vérifiez votre connexion internet et réessayez.');
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          setErrorMessage('Accès refusé. Votre compte pourrait être suspendu. Contactez le support.');
        } else if (error.message.includes('500') || error.message.includes('Server Error')) {
          setErrorMessage('Erreur serveur temporaire. Veuillez réessayer dans quelques instants.');
        } else {
          setErrorMessage(`Une erreur est survenue : ${error.message}. Veuillez réessayer ou contacter le support si le problème persiste.`);
        }
      } else {
        setErrorMessage('Échec de la connexion. Veuillez vérifier vos identifiants et réessayer.');
      }
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
          <Animated.View
            style={[
              styles.whiteCard,
              isKeyboardVisible && styles.whiteCardKeyboard,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
              {
                transform: [
                  {
                    scaleY: expandAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.02], // Agrandit légèrement en hauteur
                    }),
                  },
                  {
                    scaleX: expandAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.01], // Agrandit très légèrement en largeur
                    }),
                  },
                ],
                transformOrigin: 'top center', // Expansion depuis le haut
              },
            ]}
          >
            {/* Indicateur de drag */}
            <View style={styles.dragIndicator} />

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.contentContainer, isKeyboardVisible && styles.contentContainerKeyboard]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
            <Text style={[styles.title, isKeyboardVisible && styles.titleKeyboard]}>Connexion</Text>

            {/* Message d'erreur global - masqué si pas d'erreur pour économiser l'espace */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <ErrorMessage
                  message={errorMessage}
                  type="error"
                  onDismiss={() => {
                    setErrorMessage('');
                    setEmailError('');
                    setPasswordError('');
                  }}
                  icon="alert-circle"
                />
              </View>
            ) : null}

            {/* Champ Email */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={20} color={emailError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
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

            {/* Champ Mot de passe */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color={passwordError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                    setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.fieldError}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Lien mot de passe oublié */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/connexion/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton Se connecter */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Se connecter</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Bouton Google */}
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
                                               (userInfo as any)?.role === 'StoreOperator' ||
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
                    if (error.message.includes('annulée') || error.message.includes('canceled')) {
                      setErrorMessage('Connexion Google annulée. Vous pouvez réessayer à tout moment.');
                    } else if (error.message.includes('Accès bloqué') || error.message.includes('blocked')) {
                      setErrorMessage('Accès bloqué. Vérifiez que l\'application est autorisée dans votre compte Google ou contactez le support.');
                    } else if (error.message.includes('redirect_uri') || error.message.includes('configuration')) {
                      setErrorMessage('Erreur de configuration. Veuillez contacter le support technique.');
                    } else if (error.message.includes('Client ID')) {
                      setErrorMessage('Erreur de configuration Google. Contactez le support pour résoudre ce problème.');
                    } else {
                      setErrorMessage(`Erreur lors de la connexion Google : ${error.message}. Veuillez réessayer.`);
                    }
                  } else {
                    setErrorMessage('Échec de la connexion Google. Veuillez réessayer ou utiliser votre email et mot de passe.');
                  }
                } finally {
                  setGoogleLoading(false);
                }
              }}
              disabled={googleLoading}
            >
              <View style={styles.googleButtonContent}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>
                  {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Lien d'inscription */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Pas encore de compte?</Text>
              <TouchableOpacity onPress={() => router.push('/connexion/signup')}>
                <Text style={styles.signupLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  keyboardView: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 0,
    ...Shadows.xl,
    paddingTop: Spacing.xs,
    overflow: 'hidden',
  } as ViewStyle,
  whiteCardKeyboard: {
    flex: 0.82, // Augmente modérément pour garder le logo visible
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  } as ViewStyle,
  contentContainerKeyboard: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: 24,
    fontWeight: Typography.weights.extrabold as any,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  } as TextStyle,
  titleKeyboard: {
    fontSize: 22,
    marginBottom: Spacing.sm,
  } as TextStyle,
  inputContainer: {
    marginBottom: Spacing.sm,
  } as ViewStyle,
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
  } as ViewStyle,
  inputIcon: {
    marginRight: Spacing.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: Typography.sizes.sm,
    color: '#1F2937',
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
  errorContainer: {
    marginBottom: Spacing.xs,
  } as ViewStyle,
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  forgotPasswordText: {
    color: '#DC2626',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  loginButton: {
    backgroundColor: '#8B2F3F',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  } as ViewStyle,
  loginButtonText: {
    color: 'white',
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
  googleButton: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.sm,
    ...Shadows.sm,
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
    color: '#374151',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  } as ViewStyle,
  signupText: {
    color: '#4B5563',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  signupLink: {
    color: '#DC2626',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
});
