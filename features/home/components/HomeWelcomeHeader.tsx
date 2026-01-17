import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';

interface HomeWelcomeHeaderProps {
  firstName?: string;
  lastName?: string;
}

export const HomeWelcomeHeader: React.FC<HomeWelcomeHeaderProps> = ({ firstName, lastName }) => {
  return (
    <View style={styles.welcomeHeader}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Bonjour 👋</Text>
          <Text style={styles.welcomeName}>
            {firstName || 'Client'} {lastName || ''}
          </Text>
          <Text style={styles.welcomeSubtitle}>Profitez de vos avantages Maya</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="person-circle-outline" size={40} color="rgba(255, 255, 255, 0.9)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeHeader: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  welcomeTextContainer: {
    flex: 1,
  } as ViewStyle,
  welcomeText: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weights.medium as any,
    marginBottom: 4,
  } as TextStyle,
  welcomeName: {
    fontSize: 32,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    letterSpacing: -0.8,
    marginBottom: 4,
  } as TextStyle,
  welcomeSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  profileButton: {
    padding: 4,
  } as ViewStyle,
});

