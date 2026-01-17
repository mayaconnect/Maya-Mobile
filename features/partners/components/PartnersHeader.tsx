import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';
import { PartnerViewMode } from '../types';

interface PartnersHeaderProps {
  viewMode: PartnerViewMode;
  onViewModeChange: (mode: PartnerViewMode) => void;
  showViewMenu: boolean;
  onToggleViewMenu: () => void;
}

export const PartnersHeader: React.FC<PartnersHeaderProps> = ({
  viewMode,
  onViewModeChange,
  showViewMenu,
  onToggleViewMenu,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="business" size={28} color="#F6C756" style={styles.titleIcon} />
            <Text style={styles.title}>Explorer</Text>
          </View>
          <Text style={styles.subtitle}>Trouvez vos partenaires Maya</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.viewSelectorContainer}>
            <TouchableOpacity
              style={styles.viewSelectorButton}
              onPress={onToggleViewMenu}
              activeOpacity={0.8}
            >
              <Ionicons
                name={viewMode === 'grille' ? 'grid' : viewMode === 'liste' ? 'list' : 'map'}
                size={20}
                color={Colors.text.light}
              />
              <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
            </TouchableOpacity>

            {showViewMenu && (
              <View style={styles.viewMenu}>
                <TouchableOpacity
                  style={[styles.viewMenuItem, viewMode === 'grille' && styles.viewMenuItemActive]}
                  onPress={() => {
                    onViewModeChange('grille');
                    onToggleViewMenu();
                  }}
                >
                  <Ionicons
                    name="grid"
                    size={18}
                    color={viewMode === 'grille' ? Colors.text.light : Colors.text.secondary}
                  />
                  <Text style={[styles.viewMenuText, viewMode === 'grille' && styles.viewMenuTextActive]}>
                    Grille
                  </Text>
                  {viewMode === 'grille' && <Ionicons name="checkmark" size={18} color={Colors.text.light} />}
                </TouchableOpacity>

                <View style={styles.viewMenuDivider} />

                <TouchableOpacity
                  style={[styles.viewMenuItem, viewMode === 'liste' && styles.viewMenuItemActive]}
                  onPress={() => {
                    onViewModeChange('liste');
                    onToggleViewMenu();
                  }}
                >
                  <Ionicons
                    name="list"
                    size={18}
                    color={viewMode === 'liste' ? Colors.text.light : Colors.text.secondary}
                  />
                  <Text style={[styles.viewMenuText, viewMode === 'liste' && styles.viewMenuTextActive]}>
                    Liste
                  </Text>
                  {viewMode === 'liste' && <Ionicons name="checkmark" size={18} color={Colors.text.light} />}
                </TouchableOpacity>

                <View style={styles.viewMenuDivider} />

                <TouchableOpacity
                  style={[styles.viewMenuItem, viewMode === 'carte' && styles.viewMenuItemActive]}
                  onPress={() => {
                    onViewModeChange('carte');
                    onToggleViewMenu();
                  }}
                >
                  <Ionicons
                    name="map"
                    size={18}
                    color={viewMode === 'carte' ? Colors.text.light : Colors.text.secondary}
                  />
                  <Text style={[styles.viewMenuText, viewMode === 'carte' && styles.viewMenuTextActive]}>
                    Carte
                  </Text>
                  {viewMode === 'carte' && <Ionicons name="checkmark" size={18} color={Colors.text.light} />}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  headerTextContainer: {
    flex: 1,
  } as ViewStyle,
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  titleIcon: {
    marginBottom: 4,
  } as TextStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -1,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  viewSelectorContainer: {
    position: 'relative',
    zIndex: 10,
  } as ViewStyle,
  viewSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.md,
  } as ViewStyle,
  viewMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xs,
    minWidth: 160,
    ...Shadows.xl,
    zIndex: 1000,
  } as ViewStyle,
  viewMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  } as ViewStyle,
  viewMenuItemActive: {
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.5)',
  } as ViewStyle,
  viewMenuText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  viewMenuTextActive: {
    color: Colors.text.light,
    fontWeight: '700',
  } as TextStyle,
  viewMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.xs,
  } as ViewStyle,
});

