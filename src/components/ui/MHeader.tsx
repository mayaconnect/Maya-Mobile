/**
 * Maya Connect V2 — MHeader
 *
 * Screen header with optional back button, title, and right action.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

interface MHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  transparent?: boolean;
  lightContent?: boolean;
  style?: ViewStyle;
}

export const MHeader: React.FC<MHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
  transparent = false,
  lightContent = false,
  style,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const iconColor = lightContent ? '#FFFFFF' : colors.neutral[800];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing[2] },
        !transparent && styles.bgWhite,
        style,
      ]}
    >
      {/* Left */}
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack ?? router.back}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={wp(24)} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      {title && (
        <Text
          style={[styles.title, lightContent && styles.whiteText]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}

      {/* Right */}
      <View style={[styles.side, styles.rightSide]}>
        {rightIcon && onRightPress && (
          <TouchableOpacity
            onPress={onRightPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
          >
            <Ionicons name={rightIcon} size={wp(24)} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  bgWhite: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  side: {
    width: wp(44),
    alignItems: 'flex-start',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  title: {
    ...textStyles.h4,
    color: colors.neutral[900],
    flex: 1,
    textAlign: 'center',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  iconBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
