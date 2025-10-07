import { AnimatedButton } from '@/components/animated-button';
import { FeatureIcon } from '@/components/feature-icon';
import { NavigationTransition } from '@/components/navigation-transition';
import { OnboardingContentCard } from '@/components/onboarding-content-card';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { PaginationDots } from '@/components/pagination-dots';
import { Colors } from '@/constants/design-system';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function Onboarding3Screen() {
  const handleSkip = () => {
    router.push('/login');
  };

  const handleNext = () => {
    router.push('/onboarding-4');
  };

  return (
    <NavigationTransition direction="right">
      <OnboardingScreen onSkip={handleSkip} onBack={() => router.back()} showBack={true}>
        <OnboardingContentCard
          icon={
            <FeatureIcon
              name="gift"
              color={Colors.accent.rose}
              backgroundColor="rgba(244, 63, 94, 0.2)"
              animated={true}
            />
          }
          title="Offres exclusives"
          description="Accédez à des promotions spéciales réservées aux membres Maya"
          gradientColors={Colors.gradients.warning}
        />
        
        <View style={styles.paginationContainer}>
          <PaginationDots totalPages={4} currentPage={2} />
          <AnimatedButton
            title="Suivant"
            onPress={handleNext}
            icon="arrow-forward"
            style={styles.nextButton}
          />
        </View>
      </OnboardingScreen>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  paginationContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nextButton: {
    marginTop: 24,
  },
});
