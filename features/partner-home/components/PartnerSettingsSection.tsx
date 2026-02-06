import { Colors, Spacing, Typography } from '@/constants/design-system';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextStyle, View, ViewStyle } from 'react-native';

interface PartnerSettingsSectionProps {
  scanNotifications?: boolean;
  weeklyReport?: boolean;
  automaticOffers?: boolean;
  onScanNotificationsChange?: (value: boolean) => void;
  onWeeklyReportChange?: (value: boolean) => void;
  onAutomaticOffersChange?: (value: boolean) => void;
}

export const PartnerSettingsSection: React.FC<PartnerSettingsSectionProps> = ({
  scanNotifications = false,
  weeklyReport = false,
  automaticOffers = true,
  onScanNotificationsChange,
  onWeeklyReportChange,
  onAutomaticOffersChange,
}) => {
  const [scanNotif, setScanNotif] = useState(scanNotifications);
  const [weekly, setWeekly] = useState(weeklyReport);
  const [autoOffers, setAutoOffers] = useState(automaticOffers);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Paramètres</Text>

      {/* Notifications de scan */}
      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Notifications de scan</Text>
          <Text style={styles.settingSubtitle}>Recevoir une notification à chaque scan</Text>
        </View>
        <Switch
          value={scanNotif}
          onValueChange={(value) => {
            setScanNotif(value);
            onScanNotificationsChange?.(value);
          }}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(139, 47, 63, 0.5)' }}
          thumbColor={scanNotif ? '#8B2F3F' : '#FFFFFF'}
        />
      </View>

      {/* Rapport hebdomadaire */}
      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Rapport hebdomadaire</Text>
          <Text style={styles.settingSubtitle}>Résumé d'activité par email</Text>
        </View>
        <Switch
          value={weekly}
          onValueChange={(value) => {
            setWeekly(value);
            onWeeklyReportChange?.(value);
          }}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(139, 47, 63, 0.5)' }}
          thumbColor={weekly ? '#8B2F3F' : '#FFFFFF'}
        />
      </View>

      {/* Offres automatiques */}
      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Offres automatiques</Text>
          <Text style={styles.settingSubtitle}>Suggestions d'offres basées sur l'IA</Text>
        </View>
        <Switch
          value={autoOffers}
          onValueChange={(value) => {
            setAutoOffers(value);
            onAutomaticOffersChange?.(value);
          }}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(139, 47, 63, 0.5)' }}
          thumbColor={autoOffers ? '#8B2F3F' : '#FFFFFF'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  } as TextStyle,
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  } as ViewStyle,
  settingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
});

