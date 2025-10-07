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

export default function Index() {
  const handleSkip = () => {
    router.push('/login');
  };

  const handleNext = () => {
    router.push('/onboarding-2');
  };

  return (
    <NavigationTransition direction="right">
      <OnboardingScreen onSkip={handleSkip}>
        <OnboardingContentCard
          icon={
            <FeatureIcon
              name="flash"
              color={Colors.accent.gold}
              backgroundColor="rgba(251, 191, 36, 0.2)"
              animated={true}
            />
          }
          title="10% de remise immédiate"
          description="Économisez sur tous vos achats chez nos partenaires avec un simple scan"
          gradientColors={Colors.gradients.primary}
        />
        
        <View style={styles.paginationContainer}>
          <PaginationDots totalPages={4} currentPage={0} />
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
