import { AnimatedButton } from '@/components/common/animated-button';
import { FeatureIcon } from '@/components/feature-icon';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { OnboardingContentCard } from '@/components/onboarding/onboarding-content-card';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { PaginationDots } from '@/components/pagination-dots';
import { Colors } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Redirect, router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';


export default function Index() {
  const { user, loading } = useAuth();

  // Rediriger automatiquement si l'utilisateur est connecté
  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading]);

  // Si l'utilisateur est connecté, rediriger
  if (!loading && user) {
    return <Redirect href="/(tabs)/home" />;
  }

  const handleSkip = () => {
    router.push('/connexion/login');
  };

  const handleNext = () => {
    router.push('/onboarding/onboarding-2');
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
          gradientColors={Colors.gradients.primary as any}
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
