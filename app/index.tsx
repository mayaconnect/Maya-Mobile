import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { FeatureIcon } from '@/components/feature-icon';
import { OnboardingContentCard } from '@/components/onboarding/onboarding-content-card';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { PaginationDots } from '@/components/pagination-dots';
import { Colors } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    icon: <FeatureIcon name="flash" color={Colors.accent.gold} backgroundColor="rgba(251, 191, 36, 0.2)" animated={true} />,
    title: "10% de remise immédiate",
    description: "Économisez sur tous vos achats chez nos partenaires avec un simple scan"
  },
  {
    icon: <FeatureIcon name="shield-checkmark" color={Colors.accent.emerald} backgroundColor="rgba(16, 185, 129, 0.2)" animated={true} />,
    title: "Sécurisé et simple",
    description: "Votre QR code unique vous garantit des paiements sécurisés et rapides"
  },
  {
    icon: <FeatureIcon name="gift" color={Colors.accent.rose} backgroundColor="rgba(244, 63, 94, 0.2)" animated={true} />,
    title: "Offres exclusives",
    description: "Accédez à des promotions spéciales réservées aux membres Maya"
  },
  {
    icon: <FeatureIcon name="star" color={Colors.accent.gold} backgroundColor="rgba(251, 191, 36, 0.2)" animated={true} />,
    title: "Rejoignez Maya",
    description: "Des milliers de partenaires vous attendent pour maximiser vos économies"
  }
];

export default function Index() {
  const { user, loading } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  // Note: pathname peut ne pas être disponible dans tous les contextes
  // On s'assure juste que si l'utilisateur n'est pas connecté, on affiche l'onboarding
  // Mais si l'utilisateur est déjà sur /connexion/login, il ne sera pas redirigé ici

  // Si l'utilisateur est connecté, rediriger immédiatement vers la page home
  if (!loading && user) {
    // Vérifier si l'utilisateur est un partenaire ou opérateur
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
    router.push('/connexion/login');
  };

  const scrollX = useSharedValue(0);

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: width * nextPage, animated: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/connexion/login');
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const page = Math.round(offsetX / width);
    if (page !== currentPage) {
      setCurrentPage(page);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <NavigationTransition direction="right">
      <OnboardingScreen onSkip={handleSkip}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="center"
        >
          {onboardingData.map((item, index) => (
            <OnboardingSlide
              key={index}
              index={index}
              item={item}
              scrollX={scrollX}
            />
          ))}
        </ScrollView>

        <View style={styles.paginationContainer}>
          <PaginationDots totalPages={onboardingData.length} currentPage={currentPage} />
          <AnimatedButton
            title={currentPage === onboardingData.length - 1 ? "Commencer" : "Suivant"}
            onPress={handleNext}
            icon="arrow-forward"
            style={styles.nextButton}
          />
        </View>
      </OnboardingScreen>
    </NavigationTransition>
  );
}

interface OnboardingSlideProps {
  index: number;
  item: typeof onboardingData[0];
  scrollX: Animated.SharedValue<number>;
}

function OnboardingSlide({ index, item, scrollX }: OnboardingSlideProps) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.slideContainer, animatedStyle]}>
      <OnboardingContentCard
        icon={item.icon}
        title={item.title}
        description={item.description}
        gradientColors={Colors.gradients.primary as any}
        delay={index * 100}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  nextButton: {
    marginTop: 24,
  },
});
