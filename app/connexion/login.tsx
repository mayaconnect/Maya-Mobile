import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
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
  ViewStyle,
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
        colors={['#450A1D', '#120A18']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={20} color={Colors.text.light} />
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
            <NeoCard variant="glass" style={styles.card}>
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>Accédez à votre espace d’économies en un instant</Text>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color={Colors.status.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                  <Ionicons
                    name="mail"
                    size={18}
                    color={emailError ? Colors.status.error : Colors.text.muted}
                    style={styles.inputIcon as any}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor={Colors.text.muted}
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
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color={passwordError ? Colors.status.error : Colors.text.muted}
                    style={styles.inputIcon as any}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.text.muted}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                      setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={Colors.text.muted}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
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
            </NeoCard>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    letterSpacing: Typography.letterSpacing.wider,
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
    position: 'relative',
    top: 50,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  socialButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.text.muted,
    fontSize: Typography.sizes.sm,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.wide,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  skipLoginButton: {
    marginBottom: 20,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
  },
  signupLink: {
    color: Colors.accent.rose,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    padding: Spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.status.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  inputError: {
    borderColor: Colors.status.error,
    backgroundColor: 'rgba(255,107,107,0.08)',
  },
  fieldError: {
    color: Colors.status.error,
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs / 2,
    marginLeft: Spacing.xs,
  },
});
