import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StoreSelectionModalProps {
  visible: boolean;
  stores: any[];
  onClose: () => void;
  onSelectStore: (storeId: string) => void;
}

export function StoreSelectionModal({
  visible,
  stores,
  onClose,
  onSelectStore,
}: StoreSelectionModalProps) {
  return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          // Empêcher la fermeture du modal sans sélection
          // Le modal doit rester ouvert jusqu'à ce qu'un store soit sélectionné
        }}
      >
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            {/* Pas de bouton de fermeture - le modal doit rester ouvert jusqu'à sélection */}
            <View style={styles.placeholder} />
            <Text style={styles.title}>
              Sélectionner votre magasin actif
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>
              {stores.length > 0 && stores[0]?.id 
                ? 'Choisissez le magasin sur lequel vous souhaitez travailler. Toutes les données seront filtrées pour ce magasin.'
                : 'Choisissez le magasin pour lequel vous souhaitez scanner le QR Code'}
            </Text>

            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                onPress={() => onSelectStore(store.id)}
                activeOpacity={0.7}
              >
                <View style={styles.storeIcon}>
                  <Ionicons name="storefront" size={24} color="#8B2F3F" />
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>
                    {store.name || store.partner?.name || 'Magasin'}
                  </Text>
                  {(store.category || store.partner?.category) && (
                    <Text style={styles.storeCategory}>
                      {store.category || store.partner?.category}
                    </Text>
                  )}
                  {store.address && (
                    <View style={styles.storeAddressRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={Colors.text.secondary}
                      />
                      <Text style={styles.storeAddress}>
                        {store.address.city || store.address.street || 'Adresse'}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  } as ViewStyle,
  container: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    color: Colors.text.light,
  } as TextStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  } as ViewStyle,
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  } as TextStyle,
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.lg,
  } as ViewStyle,
  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  storeInfo: {
    flex: 1,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  storeCategory: {
    fontSize: Typography.sizes.sm,
    color: '#8B2F3F',
    fontWeight: '600',
    marginBottom: 4,
  } as TextStyle,
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  storeAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
});
