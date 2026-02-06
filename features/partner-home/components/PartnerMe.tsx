import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { PartnerAccountManagement } from './PartnerAccountManagement';
import { PartnerRecentActivity } from './PartnerRecentActivity';
import { PartnerSettingsSection } from './PartnerSettingsSection';
import { PartnerStoreProfile } from './PartnerStoreProfile';

interface PartnerMeProps {
  user: any;
  storeSearchQuery: string;
  stores: any[];
  storesLoading: boolean;
  storesError: string | null;
  filteredStores: any[];
  activeStoreId?: string | null;
  activeStore?: any | null;
  transactions: any[];
  clients: any[];
  scans: any[];
  onSearchChange: (query: string) => void;
  onStoreSelect: (store: any) => void;
  onChangeStore: () => void;
  onLogout?: () => void;
}

export function PartnerMe({
  user,
  storeSearchQuery,
  stores,
  storesLoading,
  storesError,
  filteredStores,
  activeStoreId,
  activeStore,
  transactions = [],
  clients = [],
  scans = [],
  onSearchChange,
  onStoreSelect,
  onChangeStore,
  onLogout,
}: PartnerMeProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profil du magasin */}
      <PartnerStoreProfile
        store={activeStore}
        stores={stores}
        transactions={transactions}
        clients={clients}
        onChangeStore={onChangeStore}
        loading={storesLoading && !activeStore}
      />

      {/* Section Paramètres */}
      <PartnerSettingsSection />

      {/* Activité récente */}
      <PartnerRecentActivity
        transactions={transactions}
        scans={scans}
      />

      {/* Gestion du compte */}
      <PartnerAccountManagement
        onManageBusiness={() => {
          // TODO: Naviguer vers la page de gestion business
          console.log('Gérer les informations business');
        }}
        onPartnerSupport={() => {
          // TODO: Ouvrir le support partenaire
          console.log('Support partenaire');
        }}
        onLogout={onLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  settingsSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.md,
  } as TextStyle,
});


