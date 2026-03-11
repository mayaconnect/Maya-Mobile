/**
 * Maya Connect V2 — MModal
 *
 * Full-screen modal with slide-up animation, handle bar, and backdrop blur.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

interface MModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}

export const MModal: React.FC<MModalProps> = ({
  visible,
  onClose,
  title,
  children,
  fullScreen = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      {/* Content */}
      <View
        style={[
          styles.container,
          fullScreen && styles.fullScreen,
          { paddingBottom: insets.bottom + spacing[4] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleWrapper}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={wp(24)} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Body */}
        <View style={styles.body}>{children}</View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.9,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
  fullScreen: {
    height: height * 0.95,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  handle: {
    width: wp(40),
    height: wp(4),
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  title: {
    ...textStyles.h4,
    color: colors.neutral[900],
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing[5],
    flex: 1,
  },
});
