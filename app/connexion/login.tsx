import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn } = useAuth();

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
      await signIn({ email, password });
      // Redirection vers la page home après connexion réussie
      router.replace('/(tabs)/home');
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
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>Connectez-vous pour accéder à vos économies</Text>

              {/* Message d'erreur global */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Connexion sociale désactivée temporairement */}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                  <Ionicons name="mail" size={20} color={emailError ? "#DC2626" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                  />
                </View>
                {emailError ? (
                  <Text style={styles.fieldError}>{emailError}</Text>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                  <Ionicons name="lock-closed" size={20} color={passwordError ? "#DC2626" : "#9CA3AF"} style={styles.inputIcon as any} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                      setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
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
                  <Text style={styles.signupLink}>S’inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  content: ViewStyle;
  card: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  socialButtons: ViewStyle;
  socialButton: ViewStyle;
  socialIconButton: ViewStyle;
  socialButtonText: TextStyle;
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
};

const styles = StyleSheet.create<LoginStyles>({
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
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    marginVertical: Spacing.lg,
    ...Shadows.xl,
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
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialButtonText: {
    color: '#6B7280',
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
  loginButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  skipLoginButton: {
    marginBottom: 20,
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
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
