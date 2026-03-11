/**
 * Maya Connect V2 — Onboarding Screen
 *
 * 4 beautiful swipable slides with:
 *  • Gradient backgrounds
 *  • Animated illustrations (Ionicons placeholders)
 *  • Pro French marketing copy
 *  • Pagination dots
 *  • Skip + Next + Commencer CTA
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, gradients } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, hp } from '../../src/utils/responsive';
import { MButton } from '../../src/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ------------------------------------------------------------------ */
/*  Slides Data                                                        */
/* ------------------------------------------------------------------ */
interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgGradient: readonly string[];
  title: string;
  subtitle: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'paw',
    iconColor: colors.orange[500],
    bgGradient: [colors.orange[50], '#FFFFFF'],
    title: 'Bienvenue sur\nMaya Connect',
    subtitle: 'Votre compagnon fidélité',
    description:
      'Découvrez une nouvelle façon de profiter de réductions exclusives auprès de nos partenaires locaux. Maya, votre chiot préféré, vous guide !',
  },
  {
    id: '2',
    icon: 'qr-code',
    iconColor: colors.violet[500],
    bgGradient: [colors.violet[50], '#FFFFFF'],
    title: 'Scannez &\nÉconomisez',
    subtitle: 'Simple comme bonjour',
    description:
      'Présentez votre QR code unique chez nos partenaires et bénéficiez instantanément de remises allant jusqu\'à 50 % sur vos achats.',
  },
  {
    id: '3',
    icon: 'storefront',
    iconColor: colors.orange[500],
    bgGradient: [colors.orange[50], '#FFFFFF'],
    title: 'Nos Partenaires\nPrès de Vous',
    subtitle: 'Un réseau qui grandit',
    description:
      'Restaurants, boutiques, salons de beauté, loisirs… Explorez notre carte interactive et trouvez les meilleures offres autour de vous.',
  },
  {
    id: '4',
    icon: 'diamond',
    iconColor: colors.violet[500],
    bgGradient: [colors.violet[50], '#FFFFFF'],
    title: 'Abonnement\nPremium',
    subtitle: 'Des avantages sans limites',
    description:
      'Choisissez la formule qui vous correspond et commencez à économiser dès aujourd\'hui. Essai gratuit de 7 jours inclus !',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const handleDone = useCallback(async () => {
    await completeOnboarding();
    router.replace('/auth/login');
  }, [completeOnboarding, router]);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      handleDone();
    } else {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      // Also update activeIndex immediately so dots reflect the change
      setActiveIndex(nextIndex);
    }
  }, [activeIndex, isLastSlide, handleDone]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  /* ---- Render each slide ---- */
  const renderItem = useCallback(
    ({ item, index }: { item: Slide; index: number }) => (
      <LinearGradient
        colors={item.bgGradient as [string, string, ...string[]]}
        style={styles.slide}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${item.iconColor}15` },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={wp(64)}
            color={item.iconColor}
          />
        </View>

        {/* Text */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </LinearGradient>
    ),
    [],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Skip */}
      {!isLastSlide && (
        <TouchableOpacity
          onPress={handleDone}
          style={[styles.skipBtn, { top: insets.top + spacing[3] }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing[6] }]}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* CTA */}
        <MButton
          title={isLastSlide ? 'Commencer' : 'Suivant'}
          onPress={handleNext}
          variant={isLastSlide ? 'primary' : 'primary'}
          icon={
            !isLastSlide ? (
              <Ionicons name="arrow-forward" size={wp(18)} color="#FFF" />
            ) : undefined
          }
          iconPosition="right"
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipBtn: {
    position: 'absolute',
    right: spacing[5],
    zIndex: 10,
  },
  skipText: {
    ...textStyles.body,
    color: colors.neutral[500],
    fontFamily: fontFamily.medium,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingBottom: hp(120),
  },
  iconCircle: {
    width: wp(140),
    height: wp(140),
    borderRadius: wp(70),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  title: {
    ...textStyles.h1,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    ...textStyles.h4,
    color: colors.orange[500],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  description: {
    ...textStyles.body,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: wp(22),
    maxWidth: wp(320),
  },
  bottom: {
    paddingHorizontal: spacing[6],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  dot: {
    borderRadius: wp(4),
    marginHorizontal: spacing[1],
  },
  dotActive: {
    width: wp(28),
    height: wp(8),
    backgroundColor: colors.orange[500],
    borderRadius: wp(4),
  },
  dotInactive: {
    width: wp(8),
    height: wp(8),
    backgroundColor: colors.neutral[200],
  },
});
