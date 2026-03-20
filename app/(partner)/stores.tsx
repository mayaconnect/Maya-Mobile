/**
 * Maya Connect V2 — Partner Stores Screen  (redesigned)
 *
 * Dark theme. Shows ALL partner stores. Each store can be managed.
 * Includes "Demander un nouveau magasin" flow via partner store request API.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { storesApi } from '../../src/api/stores.api';
import { referentielApi } from '../../src/api/referentiel.api';
import type { StoreCategoryDto, StoreOpeningHours, StoreCreateDto } from '../../src/types';
import { usePartnerStore } from '../../src/stores/partner.store';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { config } from '../../src/constants/config';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { OpeningHoursEditor } from '../../src/components/partner/OpeningHoursEditor';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─── Store thumbnail ─── */
const DEFAULT_STORE_IMAGE = require('../../assets/images/centered_logo_gradient.png');

function StoreThumbnail({ item, isActive }: { item: any; isActive: boolean }) {
  const [errored, setErrored] = React.useState(false);
  const uri =
    item.imageUrl ||
    item.partnerImageUrl ||
    (item.partnerId ? `${config.api.baseUrl}/api/partners/${item.partnerId}/image` : null);

  if (!errored && uri) {
    return (
      <Image
        source={{ uri }}
        style={[thumbStyles.img, isActive && thumbStyles.imgActive]}
        resizeMode="cover"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <Image
      source={DEFAULT_STORE_IMAGE}
      style={[thumbStyles.img, isActive && thumbStyles.imgActive]}
      resizeMode="cover"
    />
  );
}
const thumbStyles = StyleSheet.create({
  img: {
    width: wp(60),
    height: wp(60),
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imgActive: { borderColor: colors.orange[400] },
  placeholder: {
    width: wp(60),
    height: wp(60),
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderActive: { backgroundColor: colors.orange[500] },
});

/* ─── Request new store modal ─── */
function RequestStoreModal({
  visible,
  partnerId,
  partnerName,
  onClose,
  onCreated,
}: {
  visible: boolean;
  partnerId: string;
  partnerName: string;
  onClose: () => void;
  onCreated?: () => void;
}) {
  // Form fields
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [avgDiscount, setAvgDiscount] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openingHours, setOpeningHours] = useState<StoreOpeningHours>({ tz: 'Europe/Paris' });
  const [openingExpanded, setOpeningExpanded] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Fetch store categories
  const categoriesQ = useQuery({
    queryKey: ['storeCategories'],
    queryFn: () => referentielApi.getStoreCategories(),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 30,
  });
  const categories: StoreCategoryDto[] = categoriesQ.data ?? [];
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const isValid =
    storeName.trim().length > 0 &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    selectedCategoryId != null;

  const mutation = useMutation({
    mutationFn: () => {
      const dto: StoreCreateDto = {
        partnerId,
        name: storeName.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim() || 'France',
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        categoryId: selectedCategoryId!,
        avgDiscountPercent: avgDiscount ? parseFloat(avgDiscount) : 0,
        openingJson: JSON.stringify(openingHours),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };
      return storesApi.requestStore(dto);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      onCreated?.();
    },
  });

  const resetAndClose = useCallback(() => {
    setStoreName('');
    setAddress('');
    setCity('');
    setCountry('France');
    setLatitude('');
    setLongitude('');
    setSelectedCategoryId(null);
    setAvgDiscount('');
    setPhone('');
    setEmail('');
    setOpeningHours({ tz: 'Europe/Paris' });
    setOpeningExpanded(false);
    setCategoryDropdownOpen(false);
    setSubmitted(false);
    mutation.reset();
    onClose();
  }, [mutation, onClose]);

  const toggleOpeningAccordion = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpeningExpanded((prev) => !prev);
  }, []);

  const toggleCategoryDropdown = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoryDropdownOpen((prev) => !prev);
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={resetAndClose}>
      <Pressable style={mStyles.backdrop} onPress={resetAndClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={mStyles.kavWrap}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={mStyles.sheet}>
          <View style={mStyles.handle} />

          {submitted ? (
            /* ── Success ── */
            <View style={mStyles.successWrap}>
              <View style={mStyles.successIcon}>
                <Ionicons name="checkmark-circle" size={wp(52)} color="#4ADE80" />
              </View>
              <Text style={mStyles.successTitle}>Magasin créé !</Text>
              <Text style={mStyles.successDesc}>
                Votre magasin a été créé avec succès et est en attente de validation par notre équipe. Vous serez notifié dès qu'il sera activé.
              </Text>
              <TouchableOpacity style={mStyles.okBtn} onPress={resetAndClose}>
                <Text style={mStyles.okBtnText}>Parfait, merci</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form ── */
            <View style={mStyles.formWrap}>
              {/* Gradient Header */}
              <LinearGradient colors={['#FF6A00', '#1E293B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mStyles.formHeader}>
                <View style={mStyles.formIconWrap}>
                  <Ionicons name="add-circle" size={wp(30)} color="#FFFFFF" />
                </View>
                <Text style={mStyles.formTitle}>Nouveau magasin</Text>
                <Text style={mStyles.formSub}>Le magasin sera créé en attente de validation</Text>
              </LinearGradient>

              <ScrollView
                ref={scrollRef}
                style={{ maxHeight: wp(520) }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                <View style={mStyles.fields}>

                  {/* Partenaire (lecture seule) */}
                  <View style={mStyles.readOnlyRow}>
                    <Ionicons name="business-outline" size={wp(16)} color="rgba(255,255,255,0.35)" />
                    <Text style={mStyles.readOnlyLabel}>Partenaire</Text>
                    <Text style={mStyles.readOnlyValue} numberOfLines={1}>{partnerName}</Text>
                  </View>
                  <View style={mStyles.divider} />

                  {/* ── Section : Localisation ── */}
                  <Text style={mStyles.sectionHeading}>Localisation</Text>

                  <Text style={mStyles.fieldLabel}>Nom du magasin *</Text>
                  <View style={mStyles.inputWrap}>
                    <Ionicons name="storefront-outline" size={wp(16)} color="rgba(255,255,255,0.35)" />
                    <TextInput style={mStyles.input} value={storeName} onChangeText={setStoreName}
                      placeholder="Ex: Maya Connect – Lyon Part-Dieu" placeholderTextColor="rgba(255,255,255,0.2)"
                      onFocus={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />
                  </View>

                  <Text style={[mStyles.fieldLabel, { marginTop: spacing[3] }]}>Adresse *</Text>
                  <View style={[mStyles.inputWrap, { alignItems: 'flex-start', paddingTop: spacing[2] }]}>
                    <Ionicons name="map-outline" size={wp(16)} color="rgba(255,255,255,0.35)" style={{ marginTop: 2 }} />
                    <TextInput style={[mStyles.input, { textAlignVertical: 'top', minHeight: wp(52) }]}
                      value={address} onChangeText={setAddress} multiline
                      placeholder="Ex: 12 Rue de la Paix" placeholderTextColor="rgba(255,255,255,0.2)" />
                  </View>

                  <View style={mStyles.row2}>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.fieldLabel}>Ville *</Text>
                      <View style={mStyles.inputWrap}>
                        <Ionicons name="location-outline" size={wp(14)} color="rgba(255,255,255,0.35)" />
                        <TextInput style={mStyles.input} value={city} onChangeText={setCity}
                          placeholder="Lyon" placeholderTextColor="rgba(255,255,255,0.2)" />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.fieldLabel}>Pays *</Text>
                      <View style={mStyles.inputWrap}>
                        <Ionicons name="globe-outline" size={wp(14)} color="rgba(255,255,255,0.35)" />
                        <TextInput style={mStyles.input} value={country} onChangeText={setCountry}
                          placeholder="France" placeholderTextColor="rgba(255,255,255,0.2)" />
                      </View>
                    </View>
                  </View>

                  <View style={mStyles.row2}>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.fieldLabel}>Latitude</Text>
                      <View style={mStyles.inputWrap}>
                        <Ionicons name="navigate-outline" size={wp(14)} color="rgba(255,255,255,0.35)" />
                        <TextInput style={mStyles.input} value={latitude} onChangeText={setLatitude}
                          placeholder="48.8566" placeholderTextColor="rgba(255,255,255,0.2)"
                          keyboardType="decimal-pad" />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.fieldLabel}>Longitude</Text>
                      <View style={mStyles.inputWrap}>
                        <Ionicons name="navigate-outline" size={wp(14)} color="rgba(255,255,255,0.35)" />
                        <TextInput style={mStyles.input} value={longitude} onChangeText={setLongitude}
                          placeholder="2.3522" placeholderTextColor="rgba(255,255,255,0.2)"
                          keyboardType="decimal-pad" />
                      </View>
                    </View>
                  </View>

                  {/* ── Section : Activité ── */}
                  <Text style={[mStyles.sectionHeading, { marginTop: spacing[4] }]}>Activité</Text>

                  {/* Category dropdown */}
                  <Text style={mStyles.fieldLabel}>Catégorie *</Text>
                  <TouchableOpacity
                    style={[mStyles.inputWrap, { justifyContent: 'space-between' }]}
                    onPress={toggleCategoryDropdown}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 }}>
                      <Ionicons name="grid-outline" size={wp(16)} color="rgba(255,255,255,0.35)" />
                      <Text style={[mStyles.input, !selectedCategory && { color: 'rgba(255,255,255,0.2)' }]}>
                        {selectedCategory?.name ?? 'Sélectionnez une catégorie'}
                      </Text>
                    </View>
                    <Ionicons
                      name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={wp(16)}
                      color="rgba(255,255,255,0.35)"
                    />
                  </TouchableOpacity>

                  {categoryDropdownOpen && (
                    <View style={mStyles.dropdownList}>
                      {categoriesQ.isLoading ? (
                        <ActivityIndicator size="small" color={colors.orange[400]} style={{ padding: spacing[3] }} />
                      ) : (
                        categories.map((cat) => {
                          const sel = cat.id === selectedCategoryId;
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              style={[mStyles.dropdownItem, sel && mStyles.dropdownItemActive]}
                              onPress={() => {
                                setSelectedCategoryId(sel ? null : cat.id);
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setCategoryDropdownOpen(false);
                              }}
                            >
                              <Text style={[mStyles.dropdownItemText, sel && mStyles.dropdownItemTextActive]}>
                                {cat.name ?? cat.code ?? cat.id.slice(0, 8)}
                              </Text>
                              {sel && <Ionicons name="checkmark" size={wp(16)} color={colors.orange[400]} />}
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}

                  <Text style={[mStyles.fieldLabel, { marginTop: spacing[3] }]}>Réduction moyenne (%)</Text>
                  <View style={mStyles.inputWrap}>
                    <Ionicons name="pricetag-outline" size={wp(16)} color="rgba(255,255,255,0.35)" />
                    <TextInput style={mStyles.input} value={avgDiscount} onChangeText={setAvgDiscount}
                      placeholder="Ex: 10" placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric" maxLength={3} />
                    <Text style={mStyles.unitText}>%</Text>
                  </View>

                  {/* ── Section : Contact ── */}
                  <Text style={[mStyles.sectionHeading, { marginTop: spacing[4] }]}>Contact</Text>

                  <View style={mStyles.row2}>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.fieldLabel}>Téléphone</Text>
                      <View style={mStyles.inputWrap}>
                        <Ionicons name="call-outline" size={wp(14)} color="rgba(255,255,255,0.35)" />
                        <TextInput style={mStyles.input} value={phone} onChangeText={setPhone}
                          placeholder="+33 ..." placeholderTextColor="rgba(255,255,255,0.2)"
                          keyboardType="phone-pad" />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.fieldLabel}>Email</Text>
                      <View style={mStyles.inputWrap}>
                        <Ionicons name="mail-outline" size={wp(14)} color="rgba(255,255,255,0.35)" />
                        <TextInput style={mStyles.input} value={email} onChangeText={setEmail}
                          placeholder="contact@..." placeholderTextColor="rgba(255,255,255,0.2)"
                          keyboardType="email-address" autoCapitalize="none" />
                      </View>
                    </View>
                  </View>

                  {/* ── Section : Horaires (accordion) ── */}
                  <Text style={[mStyles.sectionHeading, { marginTop: spacing[4] }]}>Horaires d'ouverture</Text>

                  <TouchableOpacity
                    style={[mStyles.accordionHeader, openingExpanded && mStyles.accordionHeaderActive]}
                    onPress={toggleOpeningAccordion}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time-outline" size={wp(16)} color={openingExpanded ? colors.orange[400] : 'rgba(255,255,255,0.35)'} />
                    <Text style={[mStyles.accordionTitle, openingExpanded && mStyles.accordionTitleActive]}>
                      {openingExpanded ? 'Masquer les horaires' : 'Définir les horaires'}
                    </Text>
                    <Ionicons
                      name={openingExpanded ? 'chevron-up' : 'chevron-down'}
                      size={wp(16)}
                      color={openingExpanded ? colors.orange[400] : 'rgba(255,255,255,0.35)'}
                    />
                  </TouchableOpacity>

                  {openingExpanded && (
                    <View style={mStyles.accordionBody}>
                      <OpeningHoursEditor
                        value={openingHours}
                        onChange={setOpeningHours}
                      />
                    </View>
                  )}

                  {mutation.isError && (
                    <Text style={[mStyles.errorText, { marginTop: spacing[3] }]}>
                      Une erreur est survenue. Veuillez réessayer.
                    </Text>
                  )}

                </View>
              </ScrollView>

              <View style={mStyles.formActions}>
                <TouchableOpacity
                  style={[mStyles.submitBtn, !isValid && mStyles.submitBtnDisabled]}
                  onPress={() => mutation.mutate()}
                  disabled={!isValid || mutation.isPending}
                  activeOpacity={0.8}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="storefront-outline" size={wp(18)} color="#FFFFFF" />
                      <Text style={mStyles.submitBtnText}>Créer le magasin</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={mStyles.cancelBtn} onPress={resetAndClose}>
                  <Text style={mStyles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Main Screen                                                      */
/* ════════════════════════════════════════════════════════════════ */
export default function PartnerStoresScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  const stores = usePartnerStore((s) => s.stores);
  const partner = usePartnerStore((s) => s.partner);
  const activeStoreZus = usePartnerStore((s) => s.activeStore);
  const { alert, confirm, AlertModal } = useAppAlert();

  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
    retry: (count, error: any) => {
      if (error?.response?.status === 404) return false;
      return count < 2;
    },
  });

  const activeId = activeStoreQ.data?.storeId ?? activeStoreZus?.storeId;

  const setActiveMutation = useMutation({
    mutationFn: (storeId: string) => storeOperatorsApi.setActiveStore({ storeId }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['activeStore'] });
      queryClient.invalidateQueries({ queryKey: ['partnerTxHistory'] });
    },
    onError: (err: any) => {
      alert('Erreur', err?.response?.data?.detail ?? 'Impossible de changer le magasin actif.');
    },
  });

  const handleActivate = (storeId: string, storeName: string) => {
    if (storeId === activeId) return;
    confirm('Activer ce magasin', `Définir "${storeName}" comme magasin actif ?`, () =>
      setActiveMutation.mutate(storeId),
    );
  };

  const partnerName = partner?.displayName ?? partner?.legalName ?? 'Partenaire';

  return (
    <View style={styles.bg}>
      {/* ── Dark gradient header ── */}
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerSub}>{partnerName}</Text>
            <Text style={styles.headerTitle}>Mes magasins</Text>
          </View>
          {stores.length > 0 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.countBubble}>
              <Text style={styles.countText}>{stores.length}</Text>
            </Animated.View>
          )}
        </View>

        {/* Active store chip */}
        {activeId && (
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.activeChipWrap}>
            <View style={styles.activeDot} />
            <Text style={styles.activeChipText}>
              {stores.find((s: any) => s.id === activeId)?.name ?? 'Magasin actif'}
            </Text>
          </Animated.View>
        )}
      </LinearGradient>

      {/* ── List ── */}
      <FlatList
        data={stores}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + wp(100) + wp(72) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeStoreQ.isFetching}
            onRefresh={() => activeStoreQ.refetch()}
            tintColor={colors.orange[400]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="storefront-outline" size={wp(56)} color="rgba(255,255,255,0.12)" />
            <Text style={styles.emptyTitle}>Aucun magasin</Text>
            <Text style={styles.emptyDesc}>Vous n'avez pas encore de magasin associé à votre compte.</Text>
          </View>
        }
        renderItem={({ item, index }: any) => {
          const isActive = item.id === activeId;
          const isPending =
            setActiveMutation.isPending && setActiveMutation.variables === item.id;

          return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(320).springify()}>
              <View style={[styles.card, isActive && styles.cardActive]}>
                {/* Active left bar */}
                {isActive && <View style={styles.activeBar} />}

                <View style={styles.cardBody}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    <StoreThumbnail item={item} isActive={isActive} />

                    <View style={styles.cardInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.cardName, isActive && styles.cardNameActive]} numberOfLines={1}>
                          {item.name ?? 'Magasin'}
                        </Text>
                        {isActive && (
                          <View style={styles.activePill}>
                            <View style={styles.greenDot} />
                            <Text style={styles.activePillText}>Actif</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardAddress} numberOfLines={1}>
                        {[item.address, item.city].filter(Boolean).join(' · ') || 'Adresse non renseignée'}
                      </Text>
                      {item.category ? (
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Activate chevron */}
                    {!isActive && (
                      <TouchableOpacity
                        style={styles.activateBtn}
                        onPress={() => handleActivate(item.id, item.name ?? 'Magasin')}
                        disabled={setActiveMutation.isPending}
                      >
                        {isPending ? (
                          <ActivityIndicator size="small" color={colors.orange[400]} />
                        ) : (
                          <Ionicons name="radio-button-off-outline" size={wp(20)} color="rgba(255,255,255,0.3)" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Gérer button */}
                  <TouchableOpacity
                    style={[styles.manageBtn, isActive && styles.manageBtnActive]}
                    onPress={() =>
                      router.push(`/(partner)/store-management?storeId=${item.id}` as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={wp(15)}
                      color={isActive ? colors.orange[400] : 'rgba(255,255,255,0.55)'}
                    />
                    <Text style={[styles.manageBtnText, isActive && styles.manageBtnTextActive]}>
                      Gérer ce magasin
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={wp(15)}
                      color={isActive ? colors.orange[400] : 'rgba(255,255,255,0.3)'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          );
        }}
      />

      {/* ── FAB: Request new store ── */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + wp(85) }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setRequestModalVisible(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FF6A00', '#FF9F45']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={wp(22)} color="#FFFFFF" />
            <Text style={styles.fabText}>Demander un nouveau magasin</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Request store modal ── */}
      <RequestStoreModal
        visible={requestModalVisible}
        partnerId={partner?.id ?? ''}
        partnerName={partnerName}
        onClose={() => setRequestModalVisible(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['partnerStores'] })}
      />

      <AlertModal />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Styles                                                           */
/* ════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0F172A' },

  /* Header */
  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: wp(28),
    borderBottomRightRadius: wp(28),
    ...shadows.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    marginBottom: spacing[2],
  },
  headerTextWrap: { flex: 1 },
  headerSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: fontFamily.medium,
    marginBottom: 2,
  },
  headerTitle: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  countBubble: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  activeChipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  activeDot: { width: wp(6), height: wp(6), borderRadius: wp(3), backgroundColor: '#4ADE80' },
  activeChipText: { fontSize: wp(11), fontFamily: fontFamily.medium, color: '#4ADE80' },

  /* List */
  list: { padding: spacing[4], paddingTop: spacing[5] },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardActive: {
    borderColor: 'rgba(255,106,0,0.3)',
    backgroundColor: 'rgba(255,106,0,0.05)',
  },
  activeBar: {
    width: wp(4),
    backgroundColor: colors.orange[400],
  },
  cardBody: { flex: 1, padding: spacing[4] },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  cardInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
    flexWrap: 'wrap',
  },
  cardName: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: 'rgba(255,255,255,0.85)',
    flexShrink: 1,
  },
  cardNameActive: { color: '#FFFFFF' },
  cardAddress: { ...textStyles.caption, color: 'rgba(255,255,255,0.35)' },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(124,58,237,0.15)',
    marginTop: spacing[1],
  },
  categoryText: { ...textStyles.micro, color: colors.violet[300], fontFamily: fontFamily.medium },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  greenDot: { width: wp(5), height: wp(5), borderRadius: wp(3), backgroundColor: '#4ADE80' },
  activePillText: { fontSize: wp(9), fontFamily: fontFamily.semiBold, color: '#4ADE80' },
  activateBtn: {
    padding: spacing[2],
  },

  /* Manage button */
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  manageBtnActive: { backgroundColor: 'rgba(255,106,0,0.08)' },
  manageBtnText: {
    flex: 1,
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.55)',
  },
  manageBtnTextActive: { color: colors.orange[400] },

  /* FAB */
  fabWrap: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    alignItems: 'center',
  },
  fab: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
    width: '100%',
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  fabText: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },

  /* Empty */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: wp(80),
    paddingHorizontal: spacing[8],
  },
  emptyTitle: { ...textStyles.h4, color: 'rgba(255,255,255,0.45)', marginTop: spacing[4] },
  emptyDesc: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    marginTop: spacing[2],
  },
});

/* ─── Modal styles ─── */
const mStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  kavWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  handle: {
    width: wp(40),
    height: wp(4),
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginVertical: spacing[3],
  },

  /* Form */
  formWrap: { paddingBottom: spacing[6] },
  formHeader: {
    marginHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginBottom: spacing[4],
  },
  formIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  formTitle: { ...textStyles.h4, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  formSub: { ...textStyles.caption, color: 'rgba(255,255,255,0.55)', marginTop: 4 },

  fields: { paddingHorizontal: spacing[5] },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  readOnlyLabel: { ...textStyles.caption, color: 'rgba(255,255,255,0.35)', flex: 1 },
  readOnlyValue: { ...textStyles.body, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.7)', flex: 2, textAlign: 'right' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: spacing[2] },
  fieldLabel: { ...textStyles.caption, color: 'rgba(255,255,255,0.4)', marginBottom: spacing[1] },
  sectionHeading: { ...textStyles.caption, fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.55)', marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldHint: { ...textStyles.micro, color: 'rgba(255,255,255,0.25)', marginBottom: spacing[2], marginTop: -spacing[1] },
  row2: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive: { backgroundColor: 'rgba(255,106,0,0.2)', borderColor: colors.orange[500] },
  chipText: { ...textStyles.caption, color: 'rgba(255,255,255,0.45)', fontFamily: fontFamily.medium },
  chipTextActive: { color: colors.orange[300] },
  unitText: { ...textStyles.body, color: 'rgba(255,255,255,0.3)' },

  /* Dropdown */
  dropdownList: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: spacing[1],
    marginBottom: spacing[2],
    maxHeight: wp(200),
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255,106,0,0.12)',
  },
  dropdownItemText: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fontFamily.medium,
  },
  dropdownItemTextActive: {
    color: colors.orange[400],
    fontFamily: fontFamily.semiBold,
  },

  /* Accordion (opening hours) */
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  accordionHeaderActive: {
    borderColor: 'rgba(255,106,0,0.3)',
    backgroundColor: 'rgba(255,106,0,0.06)',
  },
  accordionTitle: {
    flex: 1,
    ...textStyles.body,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: fontFamily.medium,
  },
  accordionTitleActive: {
    color: colors.orange[400],
  },
  accordionBody: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[1],
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: '#FFFFFF',
    fontFamily: fontFamily.regular,
    paddingVertical: 0,
  },
  errorText: {
    ...textStyles.caption,
    color: '#F87171',
    textAlign: 'center',
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
  },

  formActions: { gap: spacing[3], paddingHorizontal: spacing[5], marginTop: spacing[4] },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.orange[500],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  submitBtnDisabled: { backgroundColor: 'rgba(255,106,0,0.35)' },
  submitBtnText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing[3] },
  cancelBtnText: { ...textStyles.body, color: 'rgba(255,255,255,0.3)', fontFamily: fontFamily.medium },

  /* Success */
  successWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  successIcon: {
    width: wp(88),
    height: wp(88),
    borderRadius: wp(44),
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  successTitle: { ...textStyles.h3, fontFamily: fontFamily.bold, color: '#FFFFFF', marginBottom: spacing[2] },
  successDesc: { ...textStyles.body, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 22 },
  okBtn: {
    marginTop: spacing[5],
    backgroundColor: colors.orange[500],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
  },
  okBtnText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },
});
