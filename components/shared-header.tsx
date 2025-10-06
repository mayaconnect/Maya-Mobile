import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SharedHeaderProps {
  title: string;
  subtitle?: string;
  onPartnerModePress?: () => void;
  showPartnerMode?: boolean;
  showFamilyBadge?: boolean;
}

export function SharedHeader({ 
  title, 
  subtitle, 
  onPartnerModePress, 
  showPartnerMode = true,
  showFamilyBadge = true 
}: SharedHeaderProps) {
  return (
    <LinearGradient
      colors={['#8B5CF6', '#A855F7', '#EC4899']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {showPartnerMode && (
              <TouchableOpacity style={styles.partnerModeButton} onPress={onPartnerModePress}>
                <Ionicons name="home" size={16} color="#F59E0B" />
                <Text style={styles.partnerModeText}>Mode Partenaire</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {showFamilyBadge && (
            <View style={styles.familyContainer}>
              <Text style={styles.familyText}>Famille</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    minHeight: 200, // Hauteur minimale pour plus d'espace
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    flex: 1,
  } as ViewStyle,
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    flex: 1,
  } as ViewStyle,
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: 'bold',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    lineHeight: 48,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.xl,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 28,
  } as TextStyle,
  partnerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  partnerModeText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: '#F59E0B',
  } as TextStyle,
  familyContainer: {
    alignItems: 'flex-end',
    marginTop: Spacing.xl,
  } as ViewStyle,
  familyText: {
    fontSize: Typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  } as TextStyle,
});
