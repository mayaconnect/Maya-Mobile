/**
 * Maya Connect V2 — MAvatar
 */
import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { wp } from '../../utils/responsive';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface MAvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const SIZES: Record<AvatarSize, number> = {
  xs: wp(28),
  sm: wp(36),
  md: wp(48),
  lg: wp(64),
  xl: wp(96),
};

const FONT_SIZES: Record<AvatarSize, number> = {
  xs: wp(11),
  sm: wp(14),
  md: wp(18),
  lg: wp(24),
  xl: wp(36),
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const MAvatar: React.FC<MAvatarProps> = ({
  uri,
  name,
  size = 'md',
  style,
}) => {
  const dim = SIZES[size];
  const containerStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    overflow: 'hidden',
  };

  if (uri) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[...gradients.primary] as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[containerStyle, styles.center, style]}
    >
      <Text style={[styles.initials, { fontSize: FONT_SIZES[size] }]}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
});
