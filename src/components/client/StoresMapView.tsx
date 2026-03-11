/**
 * Web Fallback Map View Component
 * This file is resolved by Metro on web (via .tsx as default when .native.tsx exists).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MHeader } from '../ui';

export default function StoresMapView() {
  return (
    <View style={styles.container}>
      <MHeader title="Carte des magasins" showBack />
      <View style={styles.content}>
        <Ionicons name="map-outline" size={wp(64)} color={colors.neutral[300]} />
        <Text style={styles.title}>Carte non disponible sur le web</Text>
        <Text style={styles.text}>
          La carte interactive est uniquement disponible sur l'application mobile.
          Veuillez utiliser l'application iOS ou Android pour voir les magasins sur la carte.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  title: {
    ...textStyles.h3,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  text: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center' as const,
    lineHeight: 22,
  },
});
