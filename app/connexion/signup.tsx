import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { RegisterRequest } from '@/services/auth.service';
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

// Fonction pour formater automatiquement la date de naissance
const formatBirthDate = (input: string): string => {
  // Supprimer tous les caractères non numériques
  const numbers = input.replace(/\D/g, '');
  
  // Si on a 8 chiffres, formater en YYYY-MM-DD
  if (numbers.length === 8) {
    const year = numbers.substring(0, 4);
    const month = numbers.substring(4, 6);
    const day = numbers.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  // Si on a déjà le format YYYY-MM-DD, le garder
  if (numbers.length <= 8 && input.includes('-')) {
    return input;
  }
  
  // Sinon, retourner les chiffres tels quels
  return numbers;
};

type SignupStep = 'personal' | 'security' | 'address';

export default function SignupScreen() {
  // Données personnelles
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  // Adresse
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  
  // Avatar (optionnel)
  const [avatarBase64, setAvatarBase64] = useState<string | undefined>();
  
  // États UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [step, setStep] = useState<SignupStep>('personal');
  
  const { signUp } = useAuth();
  const steps: SignupStep[] = ['personal', 'security', 'address'];
  const currentStepIndex = steps.indexOf(step);
  const isLastStep = step === 'address';

  const resetFieldErrors = () => {
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setFirstNameError('');
    setLastNameError('');
    setBirthDateError('');
    setAddressError('');
  };

  const validatePersonalStep = (): boolean => {
    let isValid = true;

    if (!firstName) {
      setFirstNameError('❌ Prénom requis');
      isValid = false;
    }

    if (!lastName) {
      setLastNameError('❌ Nom requis');
      isValid = false;
    }

    if (!email) {
      setEmailError('❌ Email requis');
      isValid = false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthDate) {
      setBirthDateError('❌ Date de naissance requise');
      isValid = false;
    } else if (!dateRegex.test(birthDate)) {
      setBirthDateError('❌ Format requis: YYYY-MM-DD');
      isValid = false;
    } else {
      const birthDateObj = new Date(birthDate);
      if (isNaN(birthDateObj.getTime())) {
        setBirthDateError('❌ Date de naissance invalide');
        isValid = false;
      }
    }

    if (!isValid) {
      setErrorMessage('⚠️ Complétez vos informations personnelles');
    }

    return isValid;
  };

  const validateSecurityStep = (): boolean => {
    let isValid = true;

    if (!password) {
      setPasswordError('❌ Mot de passe requis');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmError('❌ Confirmation requise');
      isValid = false;
    }

    if (password && password.length < 8) {
      setPasswordError('❌ Minimum 8 caractères requis');
      isValid = false;
    }

    if (password && !/\d/.test(password)) {
      setPasswordError('❌ Au moins un chiffre requis (0-9)');
      isValid = false;
    }

    if (password && !/[A-Z]/.test(password)) {
      setPasswordError('❌ Au moins une majuscule requise (A-Z)');
      isValid = false;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmError('❌ Les mots de passe ne correspondent pas');
      isValid = false;
    }

    if (!isValid) {
      setErrorMessage('⚠️ Vérifiez votre mot de passe');
    }

    return isValid;
  };

  const validateAddressStep = (): boolean => {
    const requiredFields = [street, city, state, postalCode, country];
    const isValid = requiredFields.every((field) => field.trim().length > 0);

    if (!isValid) {
      setAddressError('❌ Veuillez remplir tous les champs d\'adresse');
      setErrorMessage('⚠️ Adresse complète requise');
    }

    return isValid;
  };

  const goToPreviousStep = () => {
    resetFieldErrors();
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const goToNextStep = () => {
    resetFieldErrors();
    let isValidStep = false;

    if (step === 'personal') {
      isValidStep = validatePersonalStep();
    } else if (step === 'security') {
      isValidStep = validateSecurityStep();
    }

    if (isValidStep && currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const handleSignup = async () => {
    resetFieldErrors();

    const personalValid = validatePersonalStep();
    const securityValid = validateSecurityStep();
    const addressValid = validateAddressStep();

    if (!personalValid) {
      setStep('personal');
      return;
    }

    if (!securityValid) {
      setStep('security');
      return;
    }

    if (!addressValid) {
      setStep('address');
      return;
    }

    try {
      const birthDateObj = new Date(birthDate);
      const registerData: RegisterRequest = {
        email,
        password,
        firstName,
        lastName,
        birthDate: birthDateObj.toISOString(), // Format ISO complet avec heure
        address: {
          street,
          city,
          state,
          postalCode,
          country,
        },
        avatarBase64,
      };

      console.log('Données envoyées à l\'API:', JSON.stringify(registerData, null, 2));

      await signUp(registerData);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      if (error instanceof Error) {
        if (error.message === 'EMAIL_ALREADY_EXISTS') {
          setEmailError('❌ Cet email est déjà utilisé');
          setErrorMessage('Un compte existe déjà avec cet email');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          setErrorMessage('❌ Erreur de connexion. Vérifiez que le serveur backend est démarré.');
        } else {
          setErrorMessage(`❌ Erreur: ${error.message}`);
        }
      } else {
        setErrorMessage('❌ Échec de l\'inscription. Veuillez réessayer.');
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
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={styles.card}>
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>Inscrivez-vous pour commencer à économiser</Text>

                {/* Message d'erreur global */}
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.stepProgress}>
                  <View style={styles.progressBar}>
                    {steps.map((stepKey, index) => (
                      <View
                        key={stepKey}
                        style={[
                          styles.progressSegment,
                          index <= currentStepIndex && styles.progressSegmentActive,
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.stepLabelsRow}>
                    <Text style={[styles.stepLabel, currentStepIndex === 0 && styles.stepLabelActive]}>
                      Profil
                    </Text>
                    <Text style={[styles.stepLabel, currentStepIndex === 1 && styles.stepLabelActive]}>
                      Sécurité
                    </Text>
                    <Text style={[styles.stepLabel, currentStepIndex === 2 && styles.stepLabelActive]}>
                      Adresse
                    </Text>
                  </View>
                </View>

                {step === 'personal' && (
                  <>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>

                    <View style={styles.row}>
                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Prénom *</Text>
                        <View style={[styles.inputWrapper, firstNameError ? styles.inputError : null]}>
                          <Ionicons name="person" size={20} color={firstNameError ? "#DC2626" : "#9CA3AF"} style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Jean"
                            value={firstName}
                            onChangeText={(text) => {
                              setFirstName(text);
                              setFirstNameError('');
                              setErrorMessage('');
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                        {firstNameError ? (
                          <Text style={styles.fieldError}>{firstNameError}</Text>
                        ) : null}
                      </View>

                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Nom *</Text>
                        <View style={[styles.inputWrapper, lastNameError ? styles.inputError : null]}>
                          <Ionicons name="person" size={20} color={lastNameError ? "#DC2626" : "#9CA3AF"} style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Dupont"
                            value={lastName}
                            onChangeText={(text) => {
                              setLastName(text);
                              setLastNameError('');
                              setErrorMessage('');
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                        {lastNameError ? (
                          <Text style={styles.fieldError}>{lastNameError}</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email *</Text>
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
                      <Text style={styles.inputLabel}>Date de naissance *</Text>
                      <View style={[styles.inputWrapper, birthDateError ? styles.inputError : null]}>
                        <Ionicons name="calendar" size={20} color={birthDateError ? "#DC2626" : "#9CA3AF"} style={styles.inputIcon as any} />
                        <TextInput
                          style={styles.input}
                          placeholder="1990-01-15 ou 19900115"
                          value={birthDate}
                          onChangeText={(text) => {
                            const formattedDate = formatBirthDate(text);
                            setBirthDate(formattedDate);
                            setBirthDateError('');
                            setErrorMessage('');
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      {birthDateError ? (
                        <Text style={styles.fieldError}>{birthDateError}</Text>
                      ) : null}
                    </View>
                  </>
                )}

                {step === 'security' && (
                  <>
                    <Text style={styles.sectionTitle}>Sécurité</Text>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Mot de passe *</Text>
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

                      <View style={styles.passwordCriteria}>
                        <Text style={styles.criteriaTitle}>Critères requis :</Text>
                        <View style={styles.criteriaItem}>
                          <Ionicons
                            name={password.length >= 8 ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={password.length >= 8 ? "#10B981" : "#DC2626"}
                          />
                          <Text style={[styles.criteriaText, password.length >= 8 ? styles.criteriaMet : styles.criteriaNotMet]}>
                            Au moins 8 caractères
                          </Text>
                        </View>
                        <View style={styles.criteriaItem}>
                          <Ionicons
                            name={/\d/.test(password) ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={/\d/.test(password) ? "#10B981" : "#DC2626"}
                          />
                          <Text style={[styles.criteriaText, /\d/.test(password) ? styles.criteriaMet : styles.criteriaNotMet]}>
                            Au moins un chiffre (0-9)
                          </Text>
                        </View>
                        <View style={styles.criteriaItem}>
                          <Ionicons
                            name={/[A-Z]/.test(password) ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={/[A-Z]/.test(password) ? "#10B981" : "#DC2626"}
                          />
                          <Text style={[styles.criteriaText, /[A-Z]/.test(password) ? styles.criteriaMet : styles.criteriaNotMet]}>
                            Au moins une majuscule (A-Z)
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Confirmer le mot de passe *</Text>
                      <View style={[styles.inputWrapper, confirmError ? styles.inputError : null]}>
                        <Ionicons name="lock-closed" size={20} color={confirmError ? "#DC2626" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                        />
                        <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                          <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                      {confirmError ? (
                        <Text style={styles.fieldError}>{confirmError}</Text>
                      ) : null}
                    </View>
                  </>
                )}

                {step === 'address' && (
                  <>
                    <Text style={styles.sectionTitle}>Adresse</Text>
                    {addressError ? (
                      <Text style={styles.fieldError}>{addressError}</Text>
                    ) : null}

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Rue *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="location" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
                        <TextInput
                          style={styles.input}
                          placeholder="123 Rue de la Paix"
                          value={street}
                          onChangeText={(text) => {
                            setStreet(text);
                            setAddressError('');
                            setErrorMessage('');
                          }}
                        />
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Ville *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="business" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Paris"
                            value={city}
                            onChangeText={(text) => {
                              setCity(text);
                              setAddressError('');
                              setErrorMessage('');
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                      </View>

                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Code postal *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="75001"
                            value={postalCode}
                            onChangeText={(text) => {
                              setPostalCode(text);
                              setAddressError('');
                              setErrorMessage('');
                            }}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Région/État *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="map" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Île-de-France"
                            value={state}
                            onChangeText={(text) => {
                              setState(text);
                              setAddressError('');
                              setErrorMessage('');
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                      </View>

                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Pays *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="flag" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="France"
                            value={country}
                            onChangeText={(text) => {
                              setCountry(text);
                              setAddressError('');
                              setErrorMessage('');
                            }}
                            autoCapitalize="words"
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.navigationButtons}>
                  {step !== 'personal' && (
                    <TouchableOpacity style={styles.backNavButton} onPress={goToPreviousStep}>
                      <Ionicons name="arrow-back" size={18} color={Colors.primary[600]} />
                      <Text style={styles.backNavButtonText}>Retour</Text>
                    </TouchableOpacity>
                  )}
                  <AnimatedButton
                    title={isLastStep ? "Créer mon compte" : "Continuer"}
                    onPress={isLastStep ? handleSignup : goToNextStep}
                    icon={isLastStep ? "checkmark" : "arrow-forward"}
                    style={[styles.submitButton, styles.primaryNavButton]}
                    variant="solid"
                  />
                </View>

                <View style={styles.switchAuthRow}>
                  <Text style={styles.switchAuthText}>Déjà un compte ? </Text>
                  <TouchableOpacity onPress={() => router.replace('/connexion/login')}>
                    <Text style={styles.switchAuthLink}>Se connecter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </NavigationTransition>
  );
}

type SignupStyles = {
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
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  card: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  stepProgress: ViewStyle;
  progressBar: ViewStyle;
  progressSegment: ViewStyle;
  progressSegmentActive: ViewStyle;
  stepLabelsRow: ViewStyle;
  stepLabel: TextStyle;
  stepLabelActive: TextStyle;
  sectionTitle: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  inputWrapper: ViewStyle;
  inputIcon: ViewStyle;
  input: TextStyle;
  submitButton: ViewStyle;
  primaryNavButton: ViewStyle;
  switchAuthRow: ViewStyle;
  switchAuthText: TextStyle;
  switchAuthLink: TextStyle;
  errorBanner: ViewStyle;
  errorBannerText: TextStyle;
  inputError: ViewStyle;
  fieldError: TextStyle;
  row: ViewStyle;
  halfWidth: ViewStyle;
  passwordCriteria: ViewStyle;
  criteriaTitle: TextStyle;
  criteriaItem: ViewStyle;
  criteriaText: TextStyle;
  criteriaMet: TextStyle;
  criteriaNotMet: TextStyle;
  navigationButtons: ViewStyle;
  backNavButton: ViewStyle;
  backNavButtonText: TextStyle;
};

const styles = StyleSheet.create<SignupStyles>({
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
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
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
  stepProgress: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E5E7EB',
  },
  progressSegmentActive: {
    backgroundColor: Colors.primary[600],
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  stepLabelActive: {
    color: Colors.primary[600],
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
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
  primaryNavButton: {
    flex: 1,
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchAuthText: {
    color: '#6B7280',
    fontSize: 14,
  },
  switchAuthLink: {
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  passwordCriteria: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  criteriaText: {
    fontSize: 13,
    marginLeft: 8,
  },
  criteriaMet: {
    color: '#10B981',
    fontWeight: '500',
  },
  criteriaNotMet: {
    color: '#6B7280',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    backgroundColor: Colors.primary[50],
    gap: Spacing.xs,
  },
  backNavButtonText: {
    color: Colors.primary[600],
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
});


