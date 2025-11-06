import { AnimatedButton } from '@/components/common/animated-button';
import { FeatureIcon } from '@/components/feature-icon';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { OnboardingContentCard } from '@/components/onboarding/onboarding-content-card';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { PaginationDots } from '@/components/pagination-dots';
import { Colors } from '@/constants/design-system';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function Onboarding4Screen() {
  const handleSkip = () => {
    router.push('/connexion/login');
  };

  const handleNext = () => {
    router.push('/connexion/login');
  };

  return (
    <NavigationTransition direction="right">
      <OnboardingScreen onSkip={handleSkip} onBack={() => router.back()} showBack={true}>
        <OnboardingContentCard
          icon={
            <FeatureIcon
              name="star"
              color={Colors.accent.gold}
              backgroundColor="rgba(251, 191, 36, 0.2)"
              animated={true}
            />
          }
          title="Rejoignez Maya"
          description="Des milliers de partenaires vous attendent pour maximiser vos économies"
          gradientColors={Colors.gradients.info}
        />
        
        <View style={styles.paginationContainer}>
          <PaginationDots totalPages={4} currentPage={3} />
          <AnimatedButton
            title="Commencer"
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
