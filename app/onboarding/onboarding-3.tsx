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

export default function Onboarding3Screen() {
  const insets = useSafeAreaInsets();

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/connexion/login');
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/onboarding-4');
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
              <Text style={styles.badgeText}>ÉTAPE 2/3</Text>
            </View>

            {/* Icône principale */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#F43F5E', '#E11D48', '#BE123C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="gift" size={48} color="white" />
              </LinearGradient>
            </View>

            {/* Titre */}
            <Text style={styles.title}>Offres Exclusives</Text>

            {/* Description */}
            <Text style={styles.description}>
              Accédez à des promotions exceptionnelles et des réductions instantanées chez tous nos
              partenaires. Plus vous utilisez Maya, plus vous économisez.
            </Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <LinearGradient
                  colors={['#F43F5E', '#E11D48']}
                  style={styles.statGradient}
                >
                  <Ionicons name="ticket" size={24} color="white" />
                </LinearGradient>
                <Text style={styles.statValue}>500+</Text>
                <Text style={styles.statLabel}>Offres actives</Text>
              </View>

              <View style={styles.statBox}>
                <LinearGradient
                  colors={['#F43F5E', '#E11D48']}
                  style={styles.statGradient}
                >
                  <Ionicons name="storefront" size={24} color="white" />
                </LinearGradient>
                <Text style={styles.statValue}>200+</Text>
                <Text style={styles.statLabel}>Partenaires</Text>
              </View>

              <View style={styles.statBox}>
                <LinearGradient
                  colors={['#F43F5E', '#E11D48']}
                  style={styles.statGradient}
                >
                  <Ionicons name="pricetag" size={24} color="white" />
                </LinearGradient>
                <Text style={styles.statValue}>-30%</Text>
                <Text style={styles.statLabel}>Réduction max</Text>
              </View>
            </View>

            {/* Catégories */}
            <View style={styles.categoriesContainer}>
              <Text style={styles.categoriesTitle}>Catégories disponibles</Text>
              <View style={styles.categoriesGrid}>
                <View style={styles.categoryTag}>
                  <Ionicons name="restaurant" size={16} color="#F43F5E" />
                  <Text style={styles.categoryText}>Restaurant</Text>
                </View>
                <View style={styles.categoryTag}>
                  <Ionicons name="cart" size={16} color="#F43F5E" />
                  <Text style={styles.categoryText}>Shopping</Text>
                </View>
                <View style={styles.categoryTag}>
                  <Ionicons name="cafe" size={16} color="#F43F5E" />
                  <Text style={styles.categoryText}>Café</Text>
                </View>
                <View style={styles.categoryTag}>
                  <Ionicons name="fitness" size={16} color="#F43F5E" />
                  <Text style={styles.categoryText}>Sport</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Navigation en bas */}
          <View style={styles.navigation}>
            <View style={styles.navTop}>
              <PaginationDots totalPages={4} currentPage={2} />
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
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F43F5E',
  } as ViewStyle,
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
    color: '#F43F5E',
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
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  } as ViewStyle,
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  } as ViewStyle,
  statGradient: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: '#1F2937',
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: '#6B7280',
    textAlign: 'center',
  } as TextStyle,
  categoriesContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  } as ViewStyle,
  categoriesTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: Spacing.md,
  } as TextStyle,
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  } as ViewStyle,
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  categoryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: '#F43F5E',
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
