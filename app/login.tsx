import { AnimatedButton } from '@/components/animated-button';
import { NavigationTransition } from '@/components/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    try {
      await signIn({ email, password });
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert('Erreur', "Échec de la connexion");
    }
  };

  const handleSkipLogin = () => {
    // Passer sans connexion - aller directement à l'accueil
    router.push('/(tabs)/home');
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Connexion', `Connexion avec ${provider}`);
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

              <View style={styles.socialButtons}>
                <AnimatedButton
                  title="Google"
                  onPress={() => handleSocialLogin('Google')}
                  icon="logo-google"
                  variant="outline"
                  style={styles.socialButton}
                />

                <AnimatedButton
                  title="Facebook"
                  onPress={() => handleSocialLogin('Facebook')}
                  icon="logo-facebook"
                  variant="outline"
                  style={styles.socialButton}
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <AnimatedButton
                title="Se connecter"
                onPress={handleLogin}
                icon="log-in"
                style={styles.loginButton}
              />

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <AnimatedButton
                title="Continuer sans compte"
                onPress={handleSkipLogin}
                icon="arrow-forward"
                variant="outline"
                style={styles.skipLoginButton}
              />

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Pas encore de compte ? </Text>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>S'inscrire</Text>
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
    padding: Spacing['2xl'],
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
});
