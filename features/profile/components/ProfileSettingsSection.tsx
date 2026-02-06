import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, TextStyle, View, ViewStyle } from 'react-native';

interface ProfileSettingsSectionProps {
  darkMode: boolean;
  pushEnabled: boolean;
  weeklyReport: boolean;
  onDarkModeToggle: (value: boolean) => void;
  onPushToggle: (value: boolean) => void;
  onWeeklyReportToggle: (value: boolean) => void;
}

export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  darkMode,
  pushEnabled,
  weeklyReport,
  onDarkModeToggle,
  onPushToggle,
  onWeeklyReportToggle,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Paramètres rapides</Text>
      
      {/* Mode sombre */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Ionicons name="moon-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Mode sombre</Text>
            <Text style={styles.settingSubtitle}>Thème de l'application</Text>
          </View>
        </View>
        <Switch
          value={darkMode}
          onValueChange={onDarkModeToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(139, 47, 63, 0.5)' }}
          thumbColor={darkMode ? '#8B2F3F' : '#FFFFFF'}
        />
      </View>

      {/* Notifications push */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Ionicons name="notifications-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications push</Text>
            <Text style={styles.settingSubtitle}>Promotions et offres</Text>
          </View>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={onPushToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(139, 47, 63, 0.5)' }}
          thumbColor={pushEnabled ? '#8B2F3F' : '#FFFFFF'}
        />
      </View>

      {/* Rapport hebdomadaire */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Ionicons name="time-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Rapport hebdomadaire</Text>
            <Text style={styles.settingSubtitle}>Récapitulatif par email</Text>
          </View>
        </View>
        <Switch
          value={weeklyReport}
          onValueChange={onWeeklyReportToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(139, 47, 63, 0.5)' }}
          thumbColor={weeklyReport ? '#8B2F3F' : '#FFFFFF'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.sm,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  } as TextStyle,
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  settingContent: {
    flex: 1,
  } as ViewStyle,
  settingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  } as TextStyle,
});

