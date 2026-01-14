import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerHeaderProps {
  firstName?: string;
  lastName?: string;
  onLogout?: () => void;
  showWelcome?: boolean;
  title?: string;
}

export function PartnerHeader({ firstName, lastName, onLogout, showWelcome = true, title }: PartnerHeaderProps) {
  return (
    <View style={styles.header}>
      <LinearGradient
        colors={['#1A0A0E', '#2D0F15', '#1A0A0E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            {showWelcome ? (
              <>
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>Bienvenue,</Text>
                  <View style={styles.nameBadge}>
                    <Ionicons name="sparkles" size={16} color="#8B2F3F" style={styles.sparkleIcon} />
                    <Text style={styles.headerTitle}>
                      {firstName || 'Partenaire'} {lastName || ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>Tableau de bord partenaire</Text>
              </>
            ) : (
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>
                  {title || `${firstName || 'Partenaire'} ${lastName || ''}`}
                </Text>
              </View>
            )}
          </View>
          {onLogout && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  } as ViewStyle,
  gradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  headerTextContainer: {
    flex: 1,
  } as ViewStyle,
  welcomeContainer: {
    marginBottom: Spacing.xs,
  } as ViewStyle,
  titleContainer: {
    paddingVertical: Spacing.xs,
  } as ViewStyle,
  welcomeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
    marginBottom: 4,
  } as TextStyle,
  nameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  sparkleIcon: {
    marginRight: 4,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  headerSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  } as TextStyle,
  logoutButton: {
    padding: Spacing.md,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  } as ViewStyle,
});

