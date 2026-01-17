import { Colors, Spacing, Typography } from '@/constants/design-system';
import { PartnerCard } from '@/components/partners/partner-card';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Partner } from '../types';

interface PartnersListViewProps {
  partners: Partner[];
  loading: boolean;
  error: string;
  onPartnerSelect: (partner: Partner) => void;
}

export const PartnersListView: React.FC<PartnersListViewProps> = ({
  partners,
  loading,
  error,
  onPartnerSelect,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2F3F" />
        <Text style={styles.loadingText}>Chargement des partenaires…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.status.error} />
        <Text style={styles.emptyStateTitle}>Oups…</Text>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  if (partners.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="storefront-outline" size={64} color={Colors.text.secondary} />
        <Text style={styles.emptyStateTitle}>Aucun partenaire trouvé</Text>
        <Text style={styles.emptyStateText}>Essayez de modifier vos critères de recherche</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.partnersList}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.partnersListContent}
    >
      {partners.map((partner, index) => (
        <PartnerCard
          key={partner.id ?? index}
          partner={partner}
          onPress={() => onPartnerSelect(partner)}
          style={styles.partnerCard}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  partnersList: {
    flex: 1,
  } as ViewStyle,
  partnersListContent: {
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  partnerCard: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  } as TextStyle,
  emptyStateText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});

