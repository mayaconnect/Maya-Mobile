/**
 * Maya Connect V2 — Onboarding Screen
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
import { useAuthStore } from '../../src/stores/auth.store';
import { colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, hp } from '../../src/utils/responsive';
import { MButton } from '../../src/components/ui';

const { width: W } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'paw',
    iconBg: `${colors.orange[500]}18`,
    iconColor: colors.orange[500],
    title: 'Bienvenue sur\nMaya Connect',
    subtitle: 'Votre compagnon fidélité',
    description: 'Découvrez une nouvelle façon de profiter de réductions exclusives auprès de nos partenaires locaux. Maya, votre chiot préféré, vous guide !',
  },
  {
    id: '2',
    icon: 'qr-code',
    iconBg: `${colors.violet[500]}18`,
    iconColor: colors.violet[500],
    title: 'Scannez &\nÉconomisez',
    subtitle: 'Simple comme bonjour',
    description: 'Présentez votre QR code unique chez nos partenaires et bénéficiez instantanément de remises allant jusqu\'à 50 % sur vos achats.',
  },
  {
    id: '3',
    icon: 'storefront',
    iconBg: `${colors.orange[500]}18`,
    iconColor: colors.orange[500],
    title: 'Nos Partenaires\nPrès de Vous',
    subtitle: 'Un réseau qui grandit',
    description: 'Restaurants, boutiques, salons de beauté, loisirs… Explorez notre carte interactive et trouvez les meilleures offres autour de vous.',
  },
  {
    id: '4',
    icon: 'diamond',
    iconBg: `${colors.violet[500]}18`,
    iconColor: colors.violet[500],
    title: 'Abonnement\nPremium',
    subtitle: 'Des avantages sans limites',
    description: 'Choisissez la formule qui vous correspond et commencez à économiser dès aujourd\'hui. Essai gratuit de 7 jours inclus !',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleDone = useCallback(async () => {
    await completeOnboarding();
    router.replace('/auth/login');
  }, [completeOnboarding, router]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleDone();
    } else {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  }, [activeIndex, isLast, handleDone]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = useCallback(({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      {/* Zone blanche — icône + titre + subtitle */}
      <View style={styles.slideTop}>
        <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon} size={wp(60)} color={item.iconColor} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: item.iconColor }]}>{item.subtitle}</Text>
      </View>

      {/* Bulle sombre — description */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.slideBottom}
      >
        <Text style={styles.description}>{item.description}</Text>
      </LinearGradient>
    </View>
  ), []);

  const current = SLIDES[activeIndex];

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Skip */}
      {!isLast && (
        <TouchableOpacity
          onPress={handleDone}
          style={[styles.skipBtn, { top: insets.top + spacing[3] }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Contrôles fixes en bas (dots + bouton) */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={[styles.controls, { paddingBottom: insets.bottom + spacing[6] }]}
      >
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Boutons */}
        <View style={styles.btnRow}>
          {!isLast && (
            <TouchableOpacity onPress={handleDone} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Passer</Text>
            </TouchableOpacity>
          )}
          <MButton
            title={isLast ? 'Commencer' : 'Suivant'}
            onPress={handleNext}
            style={[styles.nextBtn, isLast && { flex: 1 }]}
            icon={
              !isLast ? (
                <Ionicons name="arrow-forward" size={wp(18)} color="#FFF" />
              ) : undefined
            }
            iconPosition="right"
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    right: spacing[5],
    zIndex: 10,
  },
  skipText: {
    ...textStyles.body,
    color: colors.neutral[400],
    fontFamily: fontFamily.medium,
  },

  /* Slide */
  slide: {
    width: W,
    flex: 1,
  },
  slideTop: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    backgroundColor: '#FFFFFF',
  },
  slideBottom: {
    flex: 1,
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
    justifyContent: 'center',
  },

  iconCircle: {
    width: wp(120),
    height: wp(120),
    borderRadius: wp(60),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    ...textStyles.h2,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    ...textStyles.h4,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  description: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: wp(22),
  },

  /* Contrôles fixes */
  controls: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  dot: {
    height: wp(8),
    borderRadius: wp(4),
  },
  dotActive: {
    width: wp(24),
    backgroundColor: colors.orange[500],
  },
  dotInactive: {
    width: wp(8),
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  ghostBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ghostBtnText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.7)',
  },
  nextBtn: {
    flex: 1,
  },
});
