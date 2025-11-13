import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface NeoAvatar {
  id: string;
  name: string;
  avatarUrl?: string;
  color?: string;
}

interface NeoAvatarListProps {
  avatars: NeoAvatar[];
  style?: ViewStyle;
}

export const NeoAvatarList: React.FC<NeoAvatarListProps> = ({ avatars, style }) => {
  const palette = ['#3C4BFF', '#FF6B6B', '#27EFA1', '#2DD9FF', '#FF9F68'];

  return (
    <FlatList
      horizontal
      data={avatars}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.listContent, style]}
      renderItem={({ item, index }) => {
        const backgroundColor = item.color ?? palette[index % palette.length];
        return (
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor }]}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.avatarName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    gap: Spacing.md,
  },
  avatarWrapper: {
    alignItems: 'center',
    width: 64,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
  },
  avatarName: {
    marginTop: Spacing.xs,
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  },
});

export default NeoAvatarList;

