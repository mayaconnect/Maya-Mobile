import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { responsiveSpacing, scaleFont } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

interface ErrorMessageProps {
  message: string;
  type?: ErrorType;
  onDismiss?: () => void;
  icon?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  onDismiss,
  icon,
  style,
  animated = true,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-20)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fadeAnim, slideAnim]);

  const getErrorConfig = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          borderColor: '#F59E0B',
          iconColor: '#F59E0B',
          textColor: '#92400E',
          defaultIcon: 'warning',
        };
      case 'info':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: '#3B82F6',
          iconColor: '#3B82F6',
          textColor: '#1E40AF',
          defaultIcon: 'information-circle',
        };
      case 'success':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: '#10B981',
          iconColor: '#10B981',
          textColor: '#065F46',
          defaultIcon: 'checkmark-circle',
        };
      default: // error
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: '#EF4444',
          iconColor: '#EF4444',
          textColor: '#991B1B',
          defaultIcon: 'alert-circle',
        };
    }
  };

  const config = getErrorConfig();
  const iconName = icon || config.defaultIcon;

  const content = (
    <View style={[styles.container, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }, style]}>
      <View style={styles.content}>
        <Ionicons name={iconName as any} size={responsiveSpacing(20)} color={config.iconColor} />
        <Text style={[styles.text, { color: config.textColor }]}>{message}</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={responsiveSpacing(18)} color={config.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!animated) {
    return content;
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderRadius: BorderRadius.lg,
    padding: responsiveSpacing(Spacing.md),
    marginBottom: responsiveSpacing(Spacing.md),
    gap: responsiveSpacing(Spacing.sm),
    ...Shadows.sm,
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: responsiveSpacing(Spacing.sm),
  } as ViewStyle,
  text: {
    flex: 1,
    fontSize: scaleFont(Typography.sizes.sm),
    fontWeight: Typography.weights.medium as any,
    lineHeight: scaleFont(20),
  } as TextStyle,
  dismissButton: {
    padding: responsiveSpacing(4),
    marginLeft: responsiveSpacing(Spacing.xs),
  } as ViewStyle,
});

