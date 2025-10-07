import { NavigationTransition } from '@/components/navigation-transition';
import { FilterChips } from '@/components/partners/filter-chips';
import { PartnerCard } from '@/components/partners/partner-card';
import { RealMapsView } from '@/components/partners/real-maps-view';
import { ViewToggle } from '@/components/partners/view-toggle';
import { SharedHeader } from '@/components/shared-header';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PartnersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tous');
  const [viewMode, setViewMode] = useState<'liste' | 'carte'>('liste');
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Données des partenaires (à remplacer par des données réelles)
  const partners = [
    {
      id: 1,
      name: 'Café des Arts',
      rating: 4.8,
      description: 'Café cosy avec terrasse',
      address: '15 rue de la Paix, Paris',
      distance: 0.2,
      isOpen: true,
      closingTime: '22h00',
      category: 'Café',
      image: '☕',
      promotion: {
        discount: '10% OFF',
        description: 'Remise immédiate avec Maya',
        isActive: true,
      },
    },
    {
      id: 2,
      name: 'Bistro Le Marché',
      rating: 4.6,
      description: 'Cuisine française traditionnelle',
      address: '8 place du Marché, Paris',
      distance: 0.5,
      isOpen: true,
      closingTime: '23h00',
      category: 'Restaurant',
      image: '🍽️',
      promotion: null,
    },
    {
      id: 3,
      name: 'Boulangerie Martin',
      rating: 4.9,
      description: 'Pain artisanal et pâtisseries',
      address: '12 avenue des Champs, Paris',
      distance: 0.8,
      isOpen: true,
      closingTime: '19h00',
      category: 'Shop',
      image: '🥖',
      promotion: {
        discount: '15% OFF',
        description: 'Sur tous les viennoiseries',
        isActive: true,
      },
    },
    {
      id: 4,
      name: 'Restaurant Sushi Zen',
      rating: 4.7,
      description: 'Sushi frais et cuisine japonaise',
      address: '25 rue de Rivoli, Paris',
      distance: 1.2,
      isOpen: false,
      closingTime: '22h30',
      category: 'Restaurant',
      image: '🍣',
      promotion: null,
    },
    {
      id: 5,
      name: 'Coffee Shop Corner',
      rating: 4.5,
      description: 'Café de spécialité et snacks',
      address: '7 boulevard Saint-Germain, Paris',
      distance: 0.9,
      isOpen: true,
      closingTime: '18h00',
      category: 'Café',
      image: '☕',
      promotion: null,
    },
  ];

  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Logique de recherche
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    // Logique de filtrage
  };

  const handleViewToggle = (mode: 'liste' | 'carte') => {
    setViewMode(mode);
  };

  const handlePartnerSelect = (partner: any) => {
    setSelectedPartner(partner);
    setShowPartnerModal(true);
  };

  const closePartnerModal = () => {
    setShowPartnerModal(false);
    setSelectedPartner(null);
  };

  return (
    <NavigationTransition>
      <View style={styles.container}>
        <SharedHeader
          title="Partenaires"
          subtitle={`${partners.length} partenaires près de vous`}
          onPartnerModePress={handlePartnerMode}
        />

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un partenaire..."
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Toggle Liste/Carte */}
          <ViewToggle
            selectedMode={viewMode}
            onModeChange={handleViewToggle}
            style={styles.viewToggle}
          />

          {/* Filtres */}
          <FilterChips
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
            style={styles.filters}
          />

          {/* Contenu conditionnel : Liste ou Carte */}
          {viewMode === 'liste' ? (
            /* Liste des partenaires */
            <ScrollView
              style={styles.partnersList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.partnersListContent}
            >
              {partners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  style={styles.partnerCard}
                />
              ))}
            </ScrollView>
          ) : (
            /* Carte interactive */
            <RealMapsView
              partners={partners}
              onPartnerSelect={handlePartnerSelect}
              style={styles.mapView}
            />
          )}
        </View>

        {/* Modal des détails du partenaire */}
        <Modal
          visible={showPartnerModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closePartnerModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={closePartnerModal}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Détails du partenaire</Text>
            </View>
            
            {selectedPartner && (
              <View style={styles.modalContent}>
                <View style={styles.modalImageContainer}>
                  <Text style={styles.modalImageText}>{selectedPartner.image}</Text>
                </View>
                
                <View style={styles.modalInfo}>
                  <Text style={styles.modalName}>{selectedPartner.name}</Text>
                  <View style={styles.modalRating}>
                    <Ionicons name="star" size={20} color={Colors.accent.gold} />
                    <Text style={styles.modalRatingText}>{selectedPartner.rating}</Text>
                  </View>
                  
                  <Text style={styles.modalDescription}>{selectedPartner.description}</Text>
                  
                  <View style={styles.modalLocation}>
                    <Ionicons name="location" size={16} color={Colors.text.secondary} />
                    <Text style={styles.modalAddress}>{selectedPartner.address}</Text>
                    <Text style={styles.modalDistance}>{selectedPartner.distance} km</Text>
                  </View>
                  
                  <View style={styles.modalStatus}>
                    <View style={[styles.modalStatusChip, selectedPartner.isOpen ? styles.modalStatusOpen : styles.modalStatusClosed]}>
                      <Ionicons 
                        name="time" 
                        size={14} 
                        color={selectedPartner.isOpen ? Colors.status.success : Colors.status.error} 
                      />
                      <Text style={[
                        styles.modalStatusText,
                        { color: selectedPartner.isOpen ? Colors.status.success : Colors.status.error }
                      ]}>
                        {selectedPartner.isOpen ? 'Ouvert' : 'Fermé'}
                      </Text>
                      {selectedPartner.isOpen && (
                        <Text style={styles.modalClosingTime}>• {selectedPartner.closingTime}</Text>
                      )}
                    </View>
                  </View>
                  
                  {selectedPartner.promotion && selectedPartner.promotion.isActive && (
                    <View style={styles.modalPromotion}>
                      <View style={styles.modalPromotionTag}>
                        <Text style={styles.modalPromotionDiscount}>{selectedPartner.promotion.discount}</Text>
                      </View>
                      <Text style={styles.modalPromotionText}>{selectedPartner.promotion.description}</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="navigate" size={20} color={Colors.text.light} />
                  <Text style={styles.modalActionText}>Y aller</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  } as ViewStyle,
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  titleContainer: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
  } as TextStyle,
  partnerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent.orange,
    gap: Spacing.xs,
  } as ViewStyle,
  partnerModeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.accent.orange,
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
  } as TextStyle,
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  } as ViewStyle,
  viewToggle: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  filters: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  partnersList: {
    flex: 1,
  } as ViewStyle,
  partnersListContent: {
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  partnerCard: {
    marginBottom: Spacing.sm,
  } as ViewStyle,
  mapView: {
    flex: 1,
  } as ViewStyle,
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[200],
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  } as TextStyle,
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  } as ViewStyle,
  modalImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  modalImageText: {
    fontSize: 32,
    color: Colors.text.primary,
  } as TextStyle,
  modalInfo: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  modalName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  } as TextStyle,
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  } as ViewStyle,
  modalRatingText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  } as TextStyle,
  modalDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  } as TextStyle,
  modalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  } as ViewStyle,
  modalAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
    textAlign: 'center',
  } as TextStyle,
  modalDistance: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  modalStatus: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  modalStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  } as ViewStyle,
  modalStatusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  } as ViewStyle,
  modalStatusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  } as ViewStyle,
  modalStatusText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  } as TextStyle,
  modalClosingTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  modalPromotion: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: Colors.status.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  modalPromotionTag: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  modalPromotionDiscount: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  modalPromotionText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: '500',
  } as TextStyle,
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  } as ViewStyle,
  modalActionText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
});
