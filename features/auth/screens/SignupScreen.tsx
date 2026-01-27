import { AnimatedButton } from '@/components/common/animated-button';
import { ErrorMessage } from '@/components/common/error-message';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { RegisterRequest } from '@/services/auth.service';
import { responsiveSpacing, scaleFont } from '@/utils/responsive';
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
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const wasKeyboardVisible = React.useRef(false);

  // Données personnelles
  const [email, setEmail] = useState('');

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
      setFirstNameError('Prénom requis');
      isValid = false;
    }

    if (!lastName) {
      setLastNameError('Nom requis');
      isValid = false;
    }

    if (!email) {
      setEmailError('Email requis');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Format d\'email invalide');
      isValid = false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthDate) {
      setBirthDateError('Date de naissance requise');
      isValid = false;
    } else if (!dateRegex.test(birthDate)) {
      setBirthDateError('Format requis: YYYY-MM-DD');
      isValid = false;
    } else {
      const birthDateObj = new Date(birthDate);
      if (isNaN(birthDateObj.getTime())) {
        setBirthDateError('Date de naissance invalide');
        isValid = false;
      } else {
        const age = new Date().getFullYear() - birthDateObj.getFullYear();
        if (age < 13) {
          setBirthDateError('Vous devez avoir au moins 13 ans');
          isValid = false;
        }
      }
    }

    if (!isValid) {
      setErrorMessage('Veuillez compléter tous les champs correctement');
    }

    return isValid;
  };

  const validateSecurityStep = (): boolean => {
    let isValid = true;

    if (!password) {
      setPasswordError('Mot de passe requis');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Minimum 8 caractères requis');
      isValid = false;
    } else if (!/\d/.test(password)) {
      setPasswordError('Au moins un chiffre requis');
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError('Au moins une majuscule requise');
      isValid = false;
    } else if (!/[a-z]/.test(password)) {
      setPasswordError('Au moins une minuscule requise');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Confirmation requise');
      isValid = false;
    } else if (password && confirmPassword && password !== confirmPassword) {
      setConfirmError('Les mots de passe ne correspondent pas');
      isValid = false;
    }

    if (!isValid) {
      setErrorMessage('Votre mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    return isValid;
  };

  const validateAddressStep = (): boolean => {
    const requiredFields = [street, city, state, postalCode, country];
    const isValid = requiredFields.every((field) => field.trim().length > 0);

    if (!isValid) {
      setAddressError('Veuillez remplir tous les champs d\'adresse');
      setErrorMessage('Une adresse complète est requise pour finaliser votre inscription');
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
        if (error.message === 'EMAIL_ALREADY_EXISTS' || error.message.includes('already exists') || error.message.includes('409') || error.message.includes('Conflict')) {
          setEmailError('Email déjà utilisé');
          setErrorMessage('Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network') || error.message.includes('TIMEOUT')) {
          setErrorMessage('Problème de connexion au serveur. Vérifiez votre connexion internet et réessayez.');
        } else if (error.message.includes('400') || error.message.includes('Bad Request') || error.message.includes('validation')) {
          setErrorMessage('Données invalides. Vérifiez que tous les champs sont correctement remplis.');
        } else if (error.message.includes('500') || error.message.includes('Server Error')) {
          setErrorMessage('Erreur serveur temporaire. Veuillez réessayer dans quelques instants.');
        } else {
          setErrorMessage(`Une erreur est survenue : ${error.message}. Veuillez réessayer ou contacter le support.`);
        }
      } else {
        setErrorMessage('Échec de l\'inscription. Veuillez vérifier vos informations et réessayer.');
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
          {/* Section supérieure avec fond sombre - réduite quand clavier actif */}
          <View style={[styles.topSection, isKeyboardVisible && styles.topSectionKeyboard]}>
            <SafeAreaView edges={['top']} style={styles.topSafeArea}>
              {/* Bouton retour */}
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#6B7280" />
              </TouchableOpacity>

              {/* Logo et nom de l'app - masqué quand clavier actif */}
              {!isKeyboardVisible && (
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('@/assets/images/logo2.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.appName}>MayaConnect</Text>
                  <Text style={styles.slogan}>Votre partenaire économies</Text>
                </View>
              )}
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
                      outputRange: [1, 1.005], // Expansion très subtile en hauteur
                    }),
                  },
                  {
                    scaleX: expandAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.002], // Expansion très subtile en largeur
                    }),
                  },
                ],
                transformOrigin: 'top center', // Expansion depuis le haut
              },
            ]}
          >
            {/* Indicateur de drag */}
            {!isKeyboardVisible && <View style={styles.dragIndicator} />}

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.contentContainer, isKeyboardVisible && styles.contentContainerKeyboard]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <Text style={[styles.title, isKeyboardVisible && styles.titleKeyboard]}>Créer un compte</Text>

                {/* Message d'erreur global */}
                {errorMessage ? (
                  <ErrorMessage
                    message={errorMessage}
                    type="error"
                    onDismiss={() => resetFieldErrors()}
                    icon="alert-circle"
                  />
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

                   

                    <View style={styles.row}>
                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Prénom *</Text>
                        <View style={[styles.inputWrapper, firstNameError ? styles.inputError : null]}>
                          <Ionicons name="person" size={20} color={firstNameError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                          <View style={styles.fieldErrorContainer}>
                            <Ionicons name="close-circle" size={scaleFont(14)} color="#EF4444" />
                            <Text style={styles.fieldError}>{firstNameError}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Text style={styles.inputLabel}>Nom *</Text>
                        <View style={[styles.inputWrapper, lastNameError ? styles.inputError : null]}>
                          <Ionicons name="person" size={20} color={lastNameError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                        <View style={styles.fieldErrorContainer}>
                          <Ionicons name="close-circle" size={scaleFont(14)} color="#EF4444" />
                          <Text style={styles.fieldError}>{lastNameError}</Text>
                        </View>
                      ) : null}
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email *</Text>
                      <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                        <Ionicons name="mail" size={20} color={emailError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                        <View style={styles.fieldErrorContainer}>
                          <Ionicons name="close-circle" size={scaleFont(14)} color="#EF4444" />
                          <Text style={styles.fieldError}>{emailError}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Date de naissance *</Text>
                      <View style={[styles.inputWrapper, birthDateError ? styles.inputError : null]}>
                        <Ionicons name="calendar" size={20} color={birthDateError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                        <View style={styles.fieldErrorContainer}>
                          <Ionicons name="close-circle" size={scaleFont(14)} color="#EF4444" />
                          <Text style={styles.fieldError}>{birthDateError}</Text>
                        </View>
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
                        <Ionicons name="lock-closed" size={20} color={passwordError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                      {passwordError ? (
                        <View style={styles.fieldErrorContainer}>
                          <Ionicons name="close-circle" size={scaleFont(14)} color="#EF4444" />
                          <Text style={styles.fieldError}>{passwordError}</Text>
                        </View>
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
                        <Ionicons name="lock-closed" size={20} color={confirmError ? "#EF4444" : "#9CA3AF"} style={styles.inputIcon as any} />
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
                          <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                      {confirmError ? (
                        <View style={styles.fieldErrorContainer}>
                          <Ionicons name="close-circle" size={scaleFont(14)} color="#EF4444" />
                          <Text style={styles.fieldError}>{confirmError}</Text>
                        </View>
                      ) : null}
                    </View>
                  </>
                )}

                {step === 'address' && (
                  <>
                    <Text style={styles.sectionTitle}>Adresse</Text>
                    {addressError ? (
                      <View style={styles.fieldErrorContainer}>
                        <Ionicons name="close-circle" size={scaleFont(14)} color="#EF4444" />
                        <Text style={styles.fieldError}>{addressError}</Text>
                      </View>
                    ) : null}

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Rue *</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="location" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
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
                          <Ionicons name="business" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
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
                          <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
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
                          <Ionicons name="map" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
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
                          <Ionicons name="flag" size={20} color="#9CA3AF" style={styles.inputIcon as any} />
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

               
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </NavigationTransition>
  );
}

type SignupStyles = {
  container: ViewStyle;
  keyboardView: ViewStyle;
  topSection: ViewStyle;
  topSectionKeyboard: ViewStyle;
  topSafeArea: ViewStyle;
  backButton: ViewStyle;
  logoContainer: ViewStyle;
  logoImage: ImageStyle;
  appName: TextStyle;
  slogan: TextStyle;
  whiteCard: ViewStyle;
  whiteCardKeyboard: ViewStyle;
  dragIndicator: ViewStyle;
  scrollView: ViewStyle;
  contentContainer: ViewStyle;
  contentContainerKeyboard: ViewStyle;
  title: TextStyle;
  titleKeyboard: TextStyle;
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
  } as ViewStyle,
  keyboardView: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,
  topSection: {
    flex: 0.3,
    minHeight: 100,
  } as ViewStyle,
  topSectionKeyboard: {
    flex: 0.15,
    minHeight: 85,
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
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: 0,
    letterSpacing: -0.5,
  } as TextStyle,
  slogan: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  whiteCard: {
    flex: 0.8,
    backgroundColor: '#FAF8F5',
    position: 'relative',
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    ...Shadows.xl,
    paddingTop: Spacing.xs,
    overflow: 'hidden',
  } as ViewStyle,
  whiteCardKeyboard: {
    flex: 1, // Augmente modérément pour garder le logo visible
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
    paddingTop: 0,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  contentContainerKeyboard: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.sm,
  } as ViewStyle,
  title: {
    fontSize: 24,
    fontWeight: Typography.weights.extrabold as any,
    color: '#111827',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  } as TextStyle,
  titleKeyboard: {
    fontSize: 22,
    marginBottom: Spacing.sm,
  } as TextStyle,
  stepProgress: {
    marginBottom: Spacing.md,
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
    color: '#8B2F3F',
    fontWeight: Typography.weights.bold as any,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    color: '#1F2937',
    marginTop: Spacing.sm,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  inputContainer: {
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    color: '#4B5563',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FFFFFF',
    height: 50,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
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
    color: '#6B7280',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
  switchAuthLink: {
    color: '#EF4444',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold as any,
    marginLeft: Spacing.xs,
    textDecorationLine: 'underline',
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
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsiveSpacing(Spacing.xs),
    marginLeft: responsiveSpacing(Spacing.xs),
    gap: responsiveSpacing(4),
  } as ViewStyle,
  fieldError: {
    color: '#EF4444',
    fontSize: scaleFont(Typography.sizes.xs),
    fontWeight: Typography.weights.medium as any,
    flex: 1,
  } as TextStyle,
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
    marginBottom: Spacing.sm,
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


