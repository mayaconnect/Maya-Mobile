import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { PaginationDots } from '@/components/pagination-dots';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, ImageStyle, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Onboarding4Screen() {
  const insets = useSafeAreaInsets();

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/connexion/login');
  };

  const handleNext = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/connexion/login');
  };

  return (
    <NavigationTransition direction="right">
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Section supérieure avec logo */}
        <View style={styles.topSection}>
          <SafeAreaView edges={['top']} style={styles.topSafeArea}>
            {/* Bouton retour */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </TouchableOpacity>

            {/* Logo et nom */}
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

        {/* Carte blanche avec contenu */}
        <View style={[styles.whiteCard, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          {/* Indicateur de drag */}
          <View style={styles.dragIndicator} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Badge de page */}
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>ÉTAPE 3/3</Text>
            </View>

            {/* Icône principale */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="rocket" size={48} color="white" />
              </LinearGradient>
            </View>

            {/* Titre */}
            <Text style={styles.title}>Prêt à Commencer ?</Text>

            {/* Description */}
            <Text style={styles.description}>
              Rejoignez des milliers d'utilisateurs qui profitent déjà des avantages Maya.
              Commencez votre expérience dès maintenant et découvrez tous les partenaires près de
              chez vous.
            </Text>

            {/* Compteur d'utilisateurs */}
            <View style={styles.counterBox}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.counterGradient}
              >
                <Text style={styles.counterNumber}>10,000+</Text>
                <Text style={styles.counterLabel}>Utilisateurs actifs</Text>
              </LinearGradient>
            </View>

            {/* Avantages principaux */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Vos avantages</Text>

              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#FBBF24" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Gratuit et sans engagement</Text>
                  <Text style={styles.benefitText}>Aucun frais caché, aucun abonnement</Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#FBBF24" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Inscription en 2 minutes</Text>
                  <Text style={styles.benefitText}>Créez votre compte rapidement</Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#FBBF24" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Économies immédiates</Text>
                  <Text style={styles.benefitText}>Jusqu'à 30% de réduction dès le premier achat</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Navigation en bas */}
          <View style={styles.navigation}>
            <PaginationDots totalPages={4} currentPage={3} />
            <AnimatedButton
              title="Commencer maintenant"
              onPress={handleNext}
              icon="arrow-forward-circle"
              style={styles.nextButton}
              variant="solid"
            />
          </View>
        </View>
      </LinearGradient>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    ...Shadows.xl,
    paddingTop: Spacing.xs,
    overflow: 'hidden',
  } as ViewStyle,
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FBBF24',
  } as ViewStyle,
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 1,
  } as TextStyle,
  iconContainer: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  } as TextStyle,
  description: {
    fontSize: Typography.sizes.base,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  } as TextStyle,
  counterBox: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  } as ViewStyle,
  counterGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  counterNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    marginBottom: Spacing.xs,
  } as TextStyle,
  counterLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: 'white',
  } as TextStyle,
  benefitsContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  } as ViewStyle,
  benefitsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: Spacing.md,
  } as TextStyle,
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  benefitIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  benefitContent: {
    flex: 1,
  } as ViewStyle,
  benefitTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  } as TextStyle,
  benefitText: {
    fontSize: Typography.sizes.xs,
    color: '#6B7280',
    lineHeight: 18,
  } as TextStyle,
  navigation: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  nextButton: {
    width: '100%',
  } as ViewStyle,
});
