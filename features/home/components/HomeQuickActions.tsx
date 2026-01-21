import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';

export const HomeQuickActions: React.FC = () => {
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push('/(tabs)/partners')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(139, 47, 63, 0.15)' }]}>
          <Ionicons name="storefront" size={26} color="#8B2F3F" />
        </View>
        <Text style={styles.quickActionText}>Partenaires</Text>
        <Text style={styles.quickActionSubtext}>Découvrir les offres</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push('/(tabs)/subscription')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
          <Ionicons name="card" size={26} color={Colors.accent.gold} />
        </View>
        <Text style={styles.quickActionText}>Abonnement</Text>
        <Text style={styles.quickActionSubtext}>Gérer mon compte</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push('/(tabs)/history')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
          <Ionicons name="time" size={26} color="#3B82F6" />
        </View>
        <Text style={styles.quickActionText}>Historique</Text>
        <Text style={styles.quickActionSubtext}>Mes transactions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
  } as ViewStyle,
  quickActionIconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  quickActionText: {
    marginTop: 2,
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    textAlign: 'center',
  } as TextStyle,
  quickActionSubtext: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  } as TextStyle,
});

