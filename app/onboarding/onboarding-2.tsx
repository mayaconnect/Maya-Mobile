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

export default function Onboarding2Screen() {
  const handleSkip = () => {
    router.push('/connexion/login');
  };

  const handleNext = () => {
    router.push('/onboarding/onboarding-3');
  };

  return (
    <NavigationTransition direction="right">
      <OnboardingScreen onSkip={handleSkip} onBack={() => router.back()} showBack={true}>
        <OnboardingContentCard
          icon={
            <FeatureIcon
              name="shield-checkmark"
              color={Colors.accent.emerald}
              backgroundColor="rgba(16, 185, 129, 0.2)"
              animated={true}
            />
          }
          title="Sécurisé et simple"
          description="Votre QR code unique vous garantit des paiements sécurisés et rapides"
          gradientColors={[...Colors.gradients.success]}
        />
        
        <View style={styles.paginationContainer}>
          <PaginationDots totalPages={4} currentPage={1} />
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
