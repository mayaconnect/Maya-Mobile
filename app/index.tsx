import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { FeatureIcon } from '@/components/feature-icon';
import { PaginationDots } from '@/components/pagination-dots';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    icon: <FeatureIcon name="flash" size={48} color={Colors.accent.gold} backgroundColor="rgba(251, 191, 36, 0.15)" animated={true} />,
    title: "% de remise immédiate",
    description: "Économisez sur tous vos achats chez nos partenaires avec un simple scan de votre QR code personnel",
    badgeColor: '#FBBF24',
    badgeText: 'ÉTAPE 1/4'
  },
  {
    icon: <FeatureIcon name="shield-checkmark" size={48} color={Colors.accent.emerald} backgroundColor="rgba(16, 185, 129, 0.15)" animated={true} />,
    title: "Sécurisé et simple",
    description: "Votre QR code unique vous garantit des paiements sécurisés et rapides avec chiffrement de bout en bout",
    badgeColor: '#10B981',
    badgeText: 'ÉTAPE 2/4'
  },
  {
    icon: <FeatureIcon name="gift" size={48} color={Colors.accent.rose} backgroundColor="rgba(244, 63, 94, 0.15)" animated={true} />,
    title: "Offres exclusives",
    description: "Accédez à des promotions spéciales et des réductions instantanées réservées aux membres Maya",
    badgeColor: '#F43F5E',
    badgeText: 'ÉTAPE 3/4'
  },
  {
    icon: <FeatureIcon name="star" size={48} color={Colors.accent.gold} backgroundColor="rgba(251, 191, 36, 0.15)" animated={true} />,
    title: "Rejoignez Maya",
    description: "Des milliers de partenaires et d'utilisateurs vous attendent pour maximiser vos économies quotidiennes",
    badgeColor: '#FBBF24',
    badgeText: 'ÉTAPE 4/4'
  }
];

export default function Index() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Si l'utilisateur est connecté, rediriger immédiatement
  if (!loading && user) {
    const isPartnerOrOperator = user?.email?.toLowerCase().includes('partner') ||
                                 user?.email?.toLowerCase().includes('partenaire') ||
                                 user?.email?.toLowerCase().includes('operator') ||
                                 user?.email?.toLowerCase().includes('opérateur') ||
                                 (user as any)?.role === 'partner' ||
                                 (user as any)?.role === 'operator' ||
                                 (user as any)?.role === 'opérateur' ||
                                 (user as any)?.role === 'partners' ||
                                 (user as any)?.role === 'StoreOperator' ||
                                 (user as any)?.isPartner === true ||
                                 (user as any)?.isOperator === true;

    if (isPartnerOrOperator) {
      return <Redirect href="/(tabs)/partner-home" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/connexion/login');
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: width * nextPage,
        y: 0,
        animated: true
      });
      setCurrentPage(nextPage);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/connexion/login');
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    if (page !== currentPage && page >= 0 && page < onboardingData.length) {
      setCurrentPage(page);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const currentItem = onboardingData[currentPage];

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
            style={styles.scrollViewContent}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Scroll horizontal des slides */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={width}
              snapToAlignment="start"
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {onboardingData.map((item, index) => (
                <View key={index} style={styles.slideContent}>
                  {/* Badge de page */}
                  <View style={[styles.badge, { backgroundColor: `${item.badgeColor}15` }]}>
                    <View style={[styles.badgeDot, { backgroundColor: item.badgeColor }]} />
                    <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badgeText}</Text>
                  </View>

                  {/* Icône */}
                  <View style={styles.iconContainer}>
                    {item.icon}
                  </View>

                  {/* Titre */}
                  <Text style={styles.title}>{item.title}</Text>

                  {/* Description */}
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              ))}
            </ScrollView>
          </ScrollView>

          {/* Navigation en bas */}
          <View style={styles.navigation}>
            {/* Bouton Passer en haut à droite */}
            <View style={styles.skipContainer}>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipText}>Passer</Text>
              </TouchableOpacity>
            </View>

            {/* Pagination dots au centre */}
            <View style={styles.paginationContainer}>
              <PaginationDots totalPages={onboardingData.length} currentPage={currentPage} />
            </View>

            {/* Bouton suivant */}
            <AnimatedButton
              title={currentPage === onboardingData.length - 1 ? "Commencer maintenant" : "Suivant"}
              onPress={handleNext}
              icon={currentPage === onboardingData.length - 1 ? "arrow-forward-circle" : "arrow-forward"}
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
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    opacity: 0.9,
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
    marginBottom: Spacing.sm,
  } as ViewStyle,
  scrollViewContent: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    flexGrow: 1,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  horizontalScroll: {
    flex: 1,
  } as ViewStyle,
  horizontalScrollContent: {
    alignItems: 'flex-start',
  } as ViewStyle,
  slideContent: {
    width: width,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'flex-start',
  } as ViewStyle,
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  } as ViewStyle,
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1,
  } as TextStyle,
  iconContainer: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
    paddingHorizontal: Spacing.md,
    lineHeight: 34,
  } as TextStyle,
  description: {
    fontSize: Typography.sizes.base,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  navigation: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAF8F5',
  } as ViewStyle,
  skipContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  skipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#6B7280',
  } as TextStyle,
  paginationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  nextButton: {
    width: '100%',
  } as ViewStyle,
});
