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

export default function Onboarding2Screen() {
  const insets = useSafeAreaInsets();

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/connexion/login');
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/onboarding-3');
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
              <Text style={styles.badgeText}>ÉTAPE 1/3</Text>
            </View>

            {/* Icône principale */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="shield-checkmark" size={48} color="white" />
              </LinearGradient>
            </View>

            {/* Titre */}
            <Text style={styles.title}>Paiements Sécurisés</Text>

            {/* Description */}
            <Text style={styles.description}>
              Profitez d'un système de paiement ultra-sécurisé grâce à votre QR code personnel unique.
              Chaque transaction est protégée par un chiffrement de niveau bancaire.
            </Text>

            {/* Liste d'avantages */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconWrapper}>
                  <Ionicons name="lock-closed" size={20} color="#10B981" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Chiffrement de bout en bout</Text>
                  <Text style={styles.featureDescription}>Vos données sont toujours protégées</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrapper}>
                  <Ionicons name="flash" size={20} color="#10B981" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Paiement instantané</Text>
                  <Text style={styles.featureDescription}>Validé en moins de 2 secondes</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconWrapper}>
                  <Ionicons name="time" size={20} color="#10B981" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Historique détaillé</Text>
                  <Text style={styles.featureDescription}>Suivez toutes vos transactions</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Navigation en bas */}
          <View style={styles.navigation}>
            <View style={styles.navTop}>
              <PaginationDots totalPages={4} currentPage={1} />
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipText}>Passer</Text>
              </TouchableOpacity>
            </View>
            <AnimatedButton
              title="Suivant"
              onPress={handleNext}
              icon="arrow-forward"
              style={styles.nextButton}
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  } as ViewStyle,
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
    color: '#10B981',
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
  featuresList: {
    gap: Spacing.md,
  } as ViewStyle,
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: 'white',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  } as ViewStyle,
  featureIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  featureContent: {
    flex: 1,
  } as ViewStyle,
  featureTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  } as TextStyle,
  featureDescription: {
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
  } as ViewStyle,
  navTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  skipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#6B7280',
  } as TextStyle,
  nextButton: {
    width: '100%',
  } as ViewStyle,
});
