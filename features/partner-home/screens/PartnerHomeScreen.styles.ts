import { Spacing } from '@/constants/design-system';
import { StyleSheet, ViewStyle } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: Spacing.xl,
  } as ViewStyle,
});

