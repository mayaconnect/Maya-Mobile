import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import {
    StyleSheet,
    Switch,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

interface SettingsSectionProps {
  pushEnabled: boolean;
  darkMode: boolean;
  faceId: boolean;
  onPushToggle: (value: boolean) => void;
  onDarkModeToggle: (value: boolean) => void;
  onFaceIdToggle: (value: boolean) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  pushEnabled,
  darkMode,
  faceId,
  onPushToggle,
  onDarkModeToggle,
  onFaceIdToggle,
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Paramètres</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingTitle}>Notifications push</Text>
          <Text style={styles.settingSubtitle}>Offres et alertes</Text>
        </View>
        <Switch value={pushEnabled} onValueChange={onPushToggle} />
      </View>

      <View style={styles.separator} />

      <View style={styles.settingRow}>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingTitle}>Mode sombre</Text>
          <Text style={styles.settingSubtitle}>Interface sombre</Text>
        </View>
        <Switch value={darkMode} onValueChange={onDarkModeToggle} />
      </View>

      <View style={styles.separator} />

      <View style={styles.settingRow}>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingTitle}>Face ID</Text>
          <Text style={styles.settingSubtitle}>Connexion biométrique</Text>
        </View>
        <Switch value={faceId} onValueChange={onFaceIdToggle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
        borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
    maxWidth: '100%',
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  } as TextStyle,
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  } as ViewStyle,
  settingTextCol: {
    flex: 1,
  } as ViewStyle,
  settingTitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  separator: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.sm,
  } as ViewStyle,
});

