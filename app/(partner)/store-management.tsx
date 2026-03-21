/**
 * Maya Connect V2 — Partner Store Management Screen
 *
 * Dark theme. Accepts storeId either via route param or fallback to activeStore.
 * Capabilities:
 *  • Partner profile image (logo) upload / delete
 *  • Store image upload / delete
 *  • Opening hours editor + save
 *  • Phone number edit + save
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { storesApi } from '../../src/api/stores.api';
import { partnersApi } from '../../src/api/partners.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { LoadingSpinner, ErrorState } from '../../src/components/ui';
import { OpeningHoursEditor, StoreImageManager } from '../../src/components/partner';
import type { StoreOpeningHours, StorePatchDto } from '../../src/types';
import { parseOpeningHours, isStoreOpenNow } from '../../src/types';
import { extractApiError } from '../../src/api/client';

/* ══════════════════════════════════════════════════════════════════ */
/*  Partner Profile Image Manager (inline)                           */
/* ══════════════════════════════════════════════════════════════════ */
function PartnerImageManager({
  partnerId,
  imageUrl,
  onImageUpdated,
}: {
  partnerId: string;
  imageUrl?: string | null;
  onImageUpdated: (url: string | null) => void;
}) {
  const [current, setCurrent] = useState(imageUrl);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setCurrent(imageUrl); }, [imageUrl]);

  const doUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: 'partner-logo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as any);
      // Content-Type is intentionally omitted — React Native XHR sets the correct
      // multipart/form-data boundary automatically (see partnersApi.uploadImage)
      const res = await partnersApi.uploadImage(partnerId, form);
      const rawUrl = res.data?.url;
      // Cache-bust to bypass CDN/RN image cache (blob has 1yr cache headers)
      const newUrl = rawUrl ? `${rawUrl}?v=${Date.now()}` : rawUrl;
      if (newUrl) {
        setCurrent(newUrl);
        onImageUpdated(newUrl);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err?.response?.status === 403
          ? "Vous n'avez pas les droits pour modifier cette image."
          : err?.response?.data?.message ?? "Impossible de mettre à jour l'image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePick = () => {
    Alert.alert("Image du partenaire", "Choisissez une source", [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission requise', "L'accès à la caméra est nécessaire.");
            return;
          }
          const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.85 });
          if (!r.canceled && r.assets[0]) await doUpload(r.assets[0]);
        },
      },
      {
        text: 'Choisir depuis la galerie',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission requise', "L'accès à la galerie est nécessaire.");
            return;
          }
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.85,
          });
          if (!r.canceled && r.assets[0]) await doUpload(r.assets[0]);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Supprimer l'image", "Êtes-vous sûr de vouloir supprimer le logo ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await partnersApi.deleteImage(partnerId);
            setCurrent(null);
            onImageUpdated(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Erreur', "Impossible de supprimer l'image.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={imgStyles.container}>
      {/* Rectangular image preview — same layout as StoreImageManager */}
      <TouchableOpacity style={imgStyles.imageWrap} onPress={handlePick} activeOpacity={0.8}>
        {current ? (
          <Image source={{ uri: current }} style={imgStyles.image} resizeMode="cover" />
        ) : (
          <View style={imgStyles.placeholder}>
            <Ionicons name="image-outline" size={wp(36)} color="rgba(255,255,255,0.2)" />
            <Text style={imgStyles.placeholderText}>Ajouter une image</Text>
          </View>
        )}
        {(uploading || deleting) && (
          <View style={imgStyles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <View style={imgStyles.actions}>
        <TouchableOpacity
          style={imgStyles.actionBtn}
          onPress={handlePick}
          disabled={uploading || deleting}
        >
          <Ionicons name="camera-outline" size={wp(16)} color={colors.orange[400]} />
          <Text style={imgStyles.actionText}>{current ? "Changer l'image" : 'Ajouter une image'}</Text>
        </TouchableOpacity>
        {current && (
          <TouchableOpacity
            style={[imgStyles.actionBtn, imgStyles.deleteActionBtn]}
            onPress={handleDelete}
            disabled={uploading || deleting}
          >
            {deleting
              ? <ActivityIndicator size="small" color="#F87171" />
              : <Ionicons name="trash-outline" size={wp(16)} color="#F87171" />}
            <Text style={[imgStyles.actionText, { color: '#F87171' }]}>Supprimer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const imgStyles = StyleSheet.create({
  container: { gap: spacing[3] },
  imageWrap: { width: '100%', height: wp(180), borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', borderRadius: borderRadius.lg },
  placeholderText: { ...textStyles.caption, color: 'rgba(255,255,255,0.3)' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  deleteActionBtn: { borderColor: 'rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.06)' },
  actionText: { ...textStyles.caption, fontFamily: fontFamily.medium, color: colors.orange[400] },
});

/* ══════════════════════════════════════════════════════════════════ */
/*  Main Screen                                                       */
/* ══════════════════════════════════════════════════════════════════ */
export default function PartnerStoreManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ storeId?: string }>();

  const activeStore = usePartnerStore((s) => s.activeStore);
  const partner = usePartnerStore((s) => s.partner);
  const setPartner = usePartnerStore((s) => s.setPartner);

  // Accept storeId from route param or fall back to active store
  const storeId = params.storeId || activeStore?.storeId;
  const partnerId = partner?.id;

  const { alert, AlertModal } = useAppAlert();

  // ── Fetch store ──
  const storeQ = useQuery({
    queryKey: ['storeDetails', storeId],
    queryFn: () => storesApi.getById(storeId!),
    enabled: !!storeId,
    select: (res) => res.data,
  });
  const store = storeQ.data;

  // ── Opening hours ──
  const openingHours = useMemo(
    () => parseOpeningHours(store?.openingJson) ?? { tz: 'Europe/Paris' },
    [store?.openingJson],
  );
  const [editHours, setEditHours] = useState<StoreOpeningHours | null>(null);
  const currentHours = editHours ?? openingHours;
  const hasHoursChanges = editHours !== null;
  const [hoursExpanded, setHoursExpanded] = useState(false);

  // ── Phone editing ──
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  useEffect(() => {
    setPhoneValue(store?.phone ?? '');
  }, [store?.phone]);

  // ── Save opening hours ──
  const saveHoursMutation = useMutation({
    mutationFn: async (hours: StoreOpeningHours) => {
      if (!storeId || !store) throw new Error('No store');
      const dto: StorePatchDto = {
        id: storeId,
        openingJson: JSON.stringify(hours),
      };
      console.log('[StoreManagement] PATCH opening hours:', JSON.stringify(dto));
      return storesApi.patchStore(storeId, dto);
    },
    onSuccess: () => {
      setEditHours(null);
      queryClient.invalidateQueries({ queryKey: ['storeDetails', storeId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert('Succès', 'Les horaires ont été mis à jour.', 'success');
    },
    onError: (err: any) => {
      const detail = extractApiError(err);
      console.error('[StoreManagement] PATCH hours error:', err?.response?.status, err?.response?.data, detail);
      alert(
        'Erreur',
        err?.response?.status === 403
          ? "Vous n'avez pas les droits pour modifier ce magasin."
          : detail || 'Impossible de sauvegarder les horaires.',
      );
    },
  });

  // ── Save phone ──
  const savePhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      if (!storeId || !store) throw new Error('No store');
      const dto: StorePatchDto = {
        id: storeId,
        phone: phone || null,
      };
      console.log('[StoreManagement] PATCH phone:', JSON.stringify(dto));
      return storesApi.patchStore(storeId, dto);
    },
    onSuccess: () => {
      setEditingPhone(false);
      queryClient.invalidateQueries({ queryKey: ['storeDetails', storeId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert('Succès', 'Le numéro de téléphone a été mis à jour.', 'success');
    },
    onError: (err: any) => {
      const detail = extractApiError(err);
      console.error('[StoreManagement] PATCH phone error:', err?.response?.status, err?.response?.data, detail);
      alert(
        'Erreur',
        err?.response?.status === 403
          ? "Vous n'avez pas les droits pour modifier ce magasin."
          : detail || 'Impossible de sauvegarder le numéro de téléphone.',
      );
    },
  });

  const handleSaveHours = useCallback(() => {
    if (!editHours) return;
    saveHoursMutation.mutate(editHours);
  }, [editHours, saveHoursMutation]);

  // ── No store selected ──
  if (!storeId) {
    return (
      <View style={styles.bg}>
        <View style={[styles.fallbackHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={wp(22)} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestion du magasin</Text>
          <View style={{ width: wp(40) }} />
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="storefront-outline" size={wp(48)} color="rgba(255,255,255,0.15)" />
          <Text style={styles.fallbackTitle}>Aucun magasin sélectionné</Text>
          <Text style={styles.fallbackText}>Sélectionnez d'abord un magasin depuis la liste.</Text>
          <TouchableOpacity style={styles.backLinkBtn} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Retour aux magasins</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (storeQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement du magasin…" />;
  }

  if (storeQ.isError || !store) {
    return (
      <View style={styles.bg}>
        <ErrorState
          fullScreen
          title="Erreur"
          description="Impossible de charger les données du magasin."
          onRetry={() => storeQ.refetch()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.bg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Dark gradient header ── */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={wp(22)} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gestion du magasin</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{store.name ?? 'Magasin'}</Text>
          </View>
          <View style={{ width: wp(40) }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + wp(140) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ════════════════════════════════════════ */}
        {/*  Section 1 — Image du partenaire          */}
        {/* ════════════════════════════════════════ */}
        {partnerId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(124,58,237,0.15)' }]}>
                <Ionicons name="image" size={wp(16)} color={colors.violet[400]} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Image du partenaire</Text>
                <Text style={styles.sectionDesc}>Visible sur tous vos magasins</Text>
              </View>
            </View>
            <PartnerImageManager
              partnerId={partnerId}
              imageUrl={partner?.imageUrl}
              onImageUpdated={(url) => {
                if (partner) setPartner({ ...partner, imageUrl: url });
              }}
            />
          </View>
        )}

        {/* ════════════════════════════════════════ */}
        {/*  Section 2 — Image du magasin            */}
        {/* ════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(255,106,0,0.12)' }]}>
              <Ionicons name="image" size={wp(16)} color={colors.orange[400]} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Image du magasin</Text>
              <Text style={styles.sectionDesc}>Photo ou visuel de cet établissement</Text>
            </View>
          </View>
          <StoreImageManager
            storeId={store.id}
            imageUrl={store.imageUrl}
            partnerImageUrl={store.partnerImageUrl}
            onImageUpdated={() => queryClient.invalidateQueries({ queryKey: ['storeDetails', storeId] })}
          />
        </View>

        {/* ════════════════════════════════════════ */}
        {/*  Section 3 — Téléphone                   */}
        {/* ════════════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
              <Ionicons name="call" size={wp(16)} color="#4ADE80" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Téléphone</Text>
              <Text style={styles.sectionDesc}>Numéro de contact du magasin</Text>
            </View>
            {!editingPhone && (
              <TouchableOpacity
                style={styles.editIconBtn}
                onPress={() => { setPhoneValue(store.phone ?? ''); setEditingPhone(true); }}
              >
                <Ionicons name="pencil" size={wp(15)} color={colors.orange[400]} />
              </TouchableOpacity>
            )}
          </View>

          {editingPhone ? (
            <View style={styles.phoneEditWrap}>
              <View style={styles.phoneInputWrap}>
                <Ionicons name="call-outline" size={wp(16)} color="rgba(255,255,255,0.45)" />
                <TextInput
                  style={styles.phoneInput}
                  value={phoneValue}
                  onChangeText={setPhoneValue}
                  placeholder="+33 6 00 00 00 00"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>
              <View style={styles.phoneActions}>
                <TouchableOpacity
                  style={styles.cancelPhoneBtn}
                  onPress={() => { setEditingPhone(false); setPhoneValue(store.phone ?? ''); }}
                  disabled={savePhoneMutation.isPending}
                >
                  <Text style={styles.cancelPhoneText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.savePhoneBtn}
                  onPress={() => savePhoneMutation.mutate(phoneValue.trim())}
                  disabled={savePhoneMutation.isPending}
                >
                  <LinearGradient
                    colors={['#FF7A18', '#FF4D00']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    {savePhoneMutation.isPending
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Text style={styles.savePhoneText}>Enregistrer</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.phoneDisplayWrap}>
              {store.phone ? (
                <View style={styles.phonePill}>
                  <Ionicons name="call" size={wp(14)} color="#4ADE80" />
                  <Text style={styles.phoneValue}>{store.phone}</Text>
                </View>
              ) : (
                <View style={styles.phoneEmpty}>
                  <Ionicons name="call-outline" size={wp(14)} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.phoneHint}>Aucun numéro — appuyez sur ✏️ pour ajouter</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════ */}
        {/*  Section 4 — Horaires d'ouverture        */}
        {/* ════════════════════════════════════════ */}
        <View style={styles.section}>
          {/* ── Accordion header (cliquable) ── */}
          <TouchableOpacity
            style={[styles.sectionHeader, { marginBottom: hoursExpanded ? spacing[3] : 0 }]}
            onPress={() => setHoursExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
              <Ionicons name="time" size={wp(16)} color="#FBBF24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
              <Text style={styles.sectionDesc}>Jours et créneaux d'accueil</Text>
            </View>
            {/* Statut ouvert/fermé */}
            {(() => {
              const open = isStoreOpenNow(currentHours);
              return (
                <View style={[styles.statusBadge, open ? styles.statusOpen : styles.statusClosed]}>
                  <View style={[styles.statusDot, { backgroundColor: open ? '#4ADE80' : '#F87171' }]} />
                  <Text style={[styles.statusText, { color: open ? '#4ADE80' : '#F87171' }]}>
                    {open ? 'Ouvert' : 'Fermé'}
                  </Text>
                </View>
              );
            })()}
            {hasHoursChanges && (
              <View style={[styles.modifiedBadge, { marginLeft: spacing[1] }]}>
                <Text style={styles.modifiedText}>•</Text>
              </View>
            )}
            {/* Chevron */}
            <View style={styles.accordionChevron}>
              <Ionicons
                name={hoursExpanded ? 'chevron-up' : 'chevron-down'}
                size={wp(14)}
                color="rgba(255,255,255,0.4)"
              />
            </View>
          </TouchableOpacity>

          {/* ── Contenu accordéon ── */}
          {hoursExpanded && (
            <>
              <View style={styles.accordionDivider} />
              <OpeningHoursEditor value={currentHours} onChange={setEditHours} />
              {hasHoursChanges && (
                <View style={styles.hoursActions}>
                  <TouchableOpacity
                    style={styles.cancelHoursBtn}
                    onPress={() => setEditHours(null)}
                    disabled={saveHoursMutation.isPending}
                  >
                    <Text style={styles.cancelHoursText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveHoursBtn}
                    onPress={handleSaveHours}
                    disabled={saveHoursMutation.isPending}
                  >
                    <LinearGradient
                      colors={['#FF7A18', '#FF4D00']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.saveGradient}
                    >
                      {saveHoursMutation.isPending
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : (
                          <>
                            <Ionicons name="checkmark" size={wp(16)} color="#FFFFFF" />
                            <Text style={styles.saveHoursText}>Enregistrer</Text>
                          </>
                        )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* ════════════════════════════════════════ */}
        {/*  Section 5 — Informations (lecture seule) */}
        {/* ════════════════════════════════════════ */}
        <View style={[styles.section, { marginBottom: spacing[2] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(148,163,184,0.1)' }]}>
              <Ionicons name="information-circle" size={wp(16)} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={styles.sectionTitle}>Informations</Text>
          </View>

          {/* Adresse — multiline */}
          <View style={styles.infoRowMulti}>
            <Text style={styles.infoLabel}>Adresse</Text>
            <Text style={styles.infoValueMulti}>{store.address ?? '—'}</Text>
          </View>
          <View style={styles.infoSep} />

          {[
            { label: 'Ville', value: store.city },
            { label: 'Pays', value: store.country },
            { label: 'Email', value: store.email },
            { label: 'Catégorie', value: store.category },
            {
              label: 'Réduction moy.',
              value: store.avgDiscountPercent > 0
                ? `${Math.round(store.avgDiscountPercent)}%`
                : null,
            },
          ].map(({ label, value }, i, arr) => (
            <React.Fragment key={label}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value ?? '—'}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.infoSep} />}
            </React.Fragment>
          ))}
        </View>

      </ScrollView>
      <AlertModal />
    </KeyboardAvoidingView>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Styles                                                            */
/* ══════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0F172A' },

  /* Header */
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: wp(24),
    borderBottomRightRadius: wp(24),
    ...shadows.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing[3] },
  backBtn: { width: wp(40), height: wp(40), borderRadius: wp(20), backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...textStyles.h4, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  headerSub: { ...textStyles.micro, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  /* Scroll */
  scroll: { padding: spacing[4], gap: spacing[4] },

  /* Section card */
  section: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing[4],
    ...shadows.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[4] },
  sectionIconWrap: { width: wp(38), height: wp(38), borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  sectionDesc: { ...textStyles.micro, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  editIconBtn: { width: wp(34), height: wp(34), borderRadius: wp(17), backgroundColor: 'rgba(255,106,0,0.1)', alignItems: 'center', justifyContent: 'center' },

  /* Phone */
  phoneDisplayWrap: { gap: spacing[2] },
  phonePill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
  },
  phoneValue: { ...textStyles.body, color: '#FFFFFF', fontFamily: fontFamily.semiBold },
  phoneEmpty: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  phoneHint: { ...textStyles.micro, color: 'rgba(255,255,255,0.3)' },
  phoneEditWrap: { gap: spacing[3] },
  phoneInputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  phoneInput: { flex: 1, ...textStyles.body, color: '#FFFFFF', paddingVertical: 0 },
  phoneActions: { flexDirection: 'row', gap: spacing[3] },
  cancelPhoneBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing[3], borderRadius: borderRadius.lg, backgroundColor: 'rgba(255,255,255,0.05)' },
  cancelPhoneText: { ...textStyles.body, color: 'rgba(255,255,255,0.5)', fontFamily: fontFamily.medium },
  savePhoneBtn: { flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden' },
  savePhoneText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[1], paddingVertical: spacing[3] },

  /* Modified badge */
  modifiedBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: borderRadius.full, backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  modifiedText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: '#FBBF24' },

  /* Open / Closed status badge */
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: borderRadius.full, borderWidth: 1 },
  statusOpen: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.25)' },
  statusClosed: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.25)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: wp(10), fontFamily: fontFamily.semiBold },

  /* Accordion */
  accordionChevron: { width: wp(28), height: wp(28), borderRadius: wp(14), backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginLeft: spacing[1] },
  accordionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: spacing[3] },

  /* Hours actions */
  hoursActions: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] },
  cancelHoursBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing[3], borderRadius: borderRadius.lg, backgroundColor: 'rgba(255,255,255,0.05)' },
  cancelHoursText: { ...textStyles.body, color: 'rgba(255,255,255,0.5)', fontFamily: fontFamily.medium },
  saveHoursBtn: { flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden' },
  saveHoursText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },

  /* Info rows */
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[2] },
  infoRowMulti: { paddingVertical: spacing[2], gap: spacing[1] },
  infoSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { ...textStyles.body, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.8)', textAlign: 'right', flex: 1, marginLeft: spacing[3] },
  infoValueMulti: { ...textStyles.body, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.8)' },

  /* Fallback */
  fallbackHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingBottom: spacing[4] },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[3] },
  fallbackTitle: { ...textStyles.h4, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  fallbackText: { ...textStyles.body, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
  backLinkBtn: { marginTop: spacing[3], backgroundColor: colors.orange[500], borderRadius: borderRadius.xl, paddingVertical: spacing[3], paddingHorizontal: spacing[6] },
  backLinkText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },
});
