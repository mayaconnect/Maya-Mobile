import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { RegisterRequest } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
  const [role, setRole] = useState<'partners' | 'client'>('client');
  
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
  
  const { signUp, user } = useAuth();
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
        role,
      };

      console.log('Données envoyées à l\'API:', JSON.stringify(registerData, null, 2));

      await signUp(registerData);
      
      // Attendre un court délai pour que l'état utilisateur soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Rediriger selon le rôle de l'utilisateur
      if (role === 'partners') {
        router.replace('/(tabs)/partner-home');
      } else {
        router.replace('/(tabs)/home');
      }
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
              <View style={styles.logoUnderline} />
            </View>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.keyboardAvoidingView}>
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.card}>
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>Inscrivez-vous pour commencer à économiser</Text>

                {/* Message d'erreur global */}
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.stepProgress}>
                  <View style={styles.progressBar}>
                    {steps.map((stepKey, index) => (
                      <View
                        {...{ key: `progress-${index}` } as any}
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

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Rôle *</Text>
                      <View style={styles.roleSelector}>
                        <TouchableOpacity
                          style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
                          onPress={() => setRole('client')}
                        >
                          <Ionicons 
                            name="person" 
                            size={18} 
                            color={role === 'client' ? 'white' : '#6B7280'} 
                          />
                          <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>
                            Client
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.roleButton, role === 'partners' && styles.roleButtonActive]}
                          onPress={() => setRole('partners')}
                        >
                          <Ionicons 
                            name="storefront" 
                            size={18} 
                            color={role === 'partners' ? 'white' : '#6B7280'} 
                          />
                          <Text style={[styles.roleButtonText, role === 'partners' && styles.roleButtonTextActive]}>
                            Partenaire
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Prénom *</Text>
                        <View style={[styles.inputWrapper, firstNameError ? styles.inputError : null]}>
                          <Ionicons name="person" size={20} color={firstNameError ? "#EF4444" : "#8B2F3F"} style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Jean"
                            placeholderTextColor="#9CA3AF"
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
                          <Ionicons name="person" size={20} color={lastNameError ? "#EF4444" : "#8B2F3F"} style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Dupont"
                            placeholderTextColor="#9CA3AF"
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
                        <Ionicons name="mail" size={20} color={emailError ? "#EF4444" : "#8B2F3F"} style={styles.inputIcon as any} />
                        <TextInput
                          style={styles.input}
                          placeholder="votre@email.com"
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

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Date de naissance *</Text>
                      <View style={[styles.inputWrapper, birthDateError ? styles.inputError : null]}>
                        <Ionicons name="calendar" size={20} color={birthDateError ? "#EF4444" : "#8B2F3F"} style={styles.inputIcon as any} />
                        <TextInput
                          style={styles.input}
                          placeholder="1990-01-15 ou 19900115"
                          placeholderTextColor="#9CA3AF"
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
                        <Ionicons name="lock-closed" size={20} color={passwordError ? "#EF4444" : "#8B2F3F"} style={styles.inputIcon as any} />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
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
                          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={passwordError ? "#EF4444" : "#8B2F3F"} />
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
                        <Ionicons name="lock-closed" size={20} color={confirmError ? "#EF4444" : "#8B2F3F"} style={styles.inputIcon as any} />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="#9CA3AF"
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            setConfirmError('');
                            setErrorMessage('');
                          }}
                          secureTextEntry={!showConfirm}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                          <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={confirmError ? "#EF4444" : "#8B2F3F"} />
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
                        <Ionicons name="location" size={20} color="#8B2F3F" style={styles.inputIcon as any} />
                        <TextInput
                          style={styles.input}
                          placeholder="123 Rue de la Paix"
                          placeholderTextColor="#9CA3AF"
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
                          <Ionicons name="business" size={20} color="#8B2F3F" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Paris"
                            placeholderTextColor="#9CA3AF"
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
                          <Ionicons name="mail" size={20} color="#8B2F3F" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="75001"
                            placeholderTextColor="#9CA3AF"
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
                          <Ionicons name="map" size={20} color="#8B2F3F" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="Île-de-France"
                            placeholderTextColor="#9CA3AF"
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
                          <Ionicons name="flag" size={20} color="#8B2F3F" style={styles.inputIcon as any} />
                          <TextInput
                            style={styles.input}
                            placeholder="France"
                            placeholderTextColor="#9CA3AF"
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
                    style={[styles.submitButton, styles.primaryNavButton] as any}
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
  keyboardAvoidingView: ViewStyle;
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
  roleSelector: ViewStyle;
  roleButton: ViewStyle;
  roleButtonActive: ViewStyle;
  roleButtonText: TextStyle;
  roleButtonTextActive: TextStyle;
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
    ...Shadows.sm,
  },
  placeholder: {
    width: 100,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(20px)',
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    position: 'relative',
    top: 33,
    maxHeight: '95%',
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: Typography.weights.medium as any,
  },
  stepProgress: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressSegmentActive: {
    backgroundColor: Colors.text.light,
    ...Shadows.sm,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: Typography.weights.medium as any,
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: Colors.text.light,
    fontWeight: Typography.weights.bold as any,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginTop: Spacing.sm,
    marginBottom: 6,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: 'white',
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  inputIcon: {
    marginRight: Spacing.sm,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.base,
    color: '#111827',
    fontWeight: Typography.weights.medium as any,
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
    marginTop: Spacing.sm,
    paddingTop: 6,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  switchAuthText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  switchAuthLink: {
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
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  errorBannerText: {
    flex: 1,
    color: '#991B1B',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    lineHeight: 20,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
    ...Shadows.sm,
  },
  fieldError: {
    color: '#EF4444',
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    fontWeight: Typography.weights.medium as any,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  passwordCriteria: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...Shadows.sm,
  },
  criteriaTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    color: '#374151',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  criteriaText: {
    fontSize: Typography.sizes.xs,
    marginLeft: Spacing.xs,
    fontWeight: Typography.weights.medium as any,
  },
  criteriaMet: {
    color: '#10B981',
    fontWeight: Typography.weights.semibold as any,
  },
  criteriaNotMet: {
    color: '#6B7280',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  backNavButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
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
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
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
    color: Colors.text.light,
    fontWeight: Typography.weights.bold as any,
  },
});


