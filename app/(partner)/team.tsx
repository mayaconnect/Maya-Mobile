/**
 * Maya Connect V2 — Partner Team Management Screen  (dark redesign)
 *
 * Lists all store operators linked to the partner.
 * Partners can: view operators, toggle manager, remove from store,
 * assign to a store, and create new operators.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MModal,
  MButton,
  LoadingSpinner,
  ErrorState,
} from '../../src/components/ui';
import type {
  StoreOperatorLiteDto,
  StoreDto,
  CreateStoreOperatorDto,
  CreateStoreOperatorResultDto,
  StoreAssignmentDto,
} from '../../src/types';
import { useAppAlert } from '../../src/hooks/use-app-alert';

/* ══════════════════════════════════════════════════════════════════ */
/*  Operator Avatar (initials fallback)                              */
/* ══════════════════════════════════════════════════════════════════ */
function OperatorAvatar({ name, uri, size = wp(44) }: { name: string; uri?: string | null; size?: number }) {
  const [errored, setErrored] = React.useState(false);
  const initials = name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();

  if (uri && !errored) {
    return (
      <Animated.Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' }}
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
    }}>
      <Text style={{ ...textStyles.caption, fontFamily: fontFamily.bold, color: colors.violet[300], fontSize: size * 0.35 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Screen                                                            */
/* ══════════════════════════════════════════════════════════════════ */
export default function PartnerTeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const partner = usePartnerStore((s) => s.partner);
  const stores = usePartnerStore((s) => s.stores);
  const partnerId = partner?.id;

  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<StoreOperatorLiteDto | null>(null);
  const [showRemove, setShowRemove] = useState<StoreOperatorLiteDto | null>(null);
  const [showToggle, setShowToggle] = useState<StoreOperatorLiteDto | null>(null);
  const [createdResult, setCreatedResult] = useState<CreateStoreOperatorResultDto | null>(null);
  const { alert, confirm, AlertModal } = useAppAlert();
  const setStores = usePartnerStore((s) => s.setStores);

  /* ─── Refresh stores + operators after any mutation ─── */
  const refreshAll = useCallback(async () => {
    try {
      const res = await storeOperatorsApi.getMyPartnerStores();
      if (res.data?.stores?.length) setStores(res.data.stores);
    } catch {}
    queryClient.refetchQueries({ queryKey: ['partnerOperators', partnerId] });
  }, [partnerId, setStores, queryClient]);

  /* ─── Fetch operators ─── */
  const opsQ = useQuery({
    queryKey: ['partnerOperators', partnerId],
    queryFn: () => storeOperatorsApi.getOperatorsByPartner(partnerId!),
    enabled: !!partnerId,
    select: (res) => res.data,
  });
  const operators: StoreOperatorLiteDto[] = opsQ.data ?? [];

  /* ─── Toggle manager ─── */
  const toggleMgr = useMutation({
    mutationFn: (vars: { userId: string; storeId: string }) =>
      storeOperatorsApi.toggleManager(vars),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshAll();
    },
    onError: (err: any) =>
      alert('Erreur', err?.response?.data?.message ?? 'Échec du changement de statut.'),
  });

  /* ─── Remove ─── */
  const removeMut = useMutation({
    mutationFn: (vars: { userId: string; storeId: string }) =>
      storeOperatorsApi.removeOperator(vars),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshAll();
    },
    onError: (err: any) =>
      alert('Erreur', err?.response?.data?.message ?? "Impossible de retirer l'opérateur."),
  });

  /* ─── Assign ─── */
  const assignMut = useMutation({
    mutationFn: (vars: { userId: string; storeId: string; isManager?: boolean }) =>
      storeOperatorsApi.assignOperator(vars),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshAll();
    },
    onError: (err: any) =>
      alert('Erreur', err?.response?.data?.message ?? "Impossible d'assigner l'opérateur."),
  });

  /* ─── Create ─── */
  const createMut = useMutation({
    mutationFn: (dto: CreateStoreOperatorDto) => {
      console.log('[CreateOperator] Payload:', JSON.stringify(dto));
      return storeOperatorsApi.createOperator(dto);
    },
    onSuccess: (res) => {
      console.log('[CreateOperator] Success:', JSON.stringify(res.data));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreatedResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['partnerOperators'] });
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      console.error('[CreateOperator] Error:', JSON.stringify(data));
      const msg =
        data?.detail ??
        data?.title ??
        data?.message ??
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ??
        err?.message ??
        "Impossible de créer l'opérateur.";
      alert('Erreur', msg);
    },
  });

  /* ─── Store picker helpers ─── */
  const confirmRemove = (op: StoreOperatorLiteDto) => setShowRemove(op);

  const confirmToggle = (op: StoreOperatorLiteDto) => {
    if (stores.length === 1) {
      toggleMgr.mutate({ userId: op.userId, storeId: stores[0].id });
    } else {
      setShowToggle(op);
    }
  };

  /* ─── Render operator card ─── */
  const renderOperator = useCallback(
    ({ item, index }: { item: StoreOperatorLiteDto; index: number }) => {
      const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email || 'Opérateur';
      return (
        <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
          <View style={styles.opCard}>

            {/* Left accent bar for managers */}
            {item.isManager && <View style={styles.managerBar} />}

            <View style={styles.opCardInner}>
              {/* Avatar + info */}
              <View style={styles.opRow}>
                <OperatorAvatar name={fullName} uri={item.avatarUrl} />
                <View style={styles.opInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.opName} numberOfLines={1}>{fullName}</Text>
                    {item.isManager && (
                      <View style={styles.managerChip}>
                        <Ionicons name="shield-checkmark" size={wp(10)} color="#34D399" />
                        <Text style={styles.managerChipText}>Manager</Text>
                      </View>
                    )}
                  </View>
                  {item.email ? (
                    <Text style={styles.opEmail} numberOfLines={1}>{item.email}</Text>
                  ) : null}
                </View>
              </View>

              {/* Action buttons (Partner only) */}
              {(role === 'partner' || partner != null) && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmToggle(item)}>
                    <Ionicons
                      name={item.isManager ? 'shield-checkmark' : 'shield-outline'}
                      size={wp(15)}
                      color={item.isManager ? '#34D399' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={[styles.actionText, item.isManager && { color: '#34D399' }]}>
                      {item.isManager ? 'Retirer ' : 'Promouvoir'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionSep} />

                  <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAssign(item)}>
                    <Ionicons name="add-circle-outline" size={wp(15)} color="#6366F1" />
                    <Text style={[styles.actionText, { color: '#6366F1' }]}>Assigner</Text>
                  </TouchableOpacity>

                  <View style={styles.actionSep} />

                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmRemove(item)}>
                    <Ionicons name="trash-outline" size={wp(15)} color="#F87171" />
                    <Text style={[styles.actionText, { color: '#F87171' }]}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      );
    },
    [role, stores, toggleMgr, removeMut],
  );

  /* ─── Determine content to show ─── */
  const isPartnerOrHasContext = role === 'partner' || partner != null;

  /* ─── Tab bar height (matches _layout.tsx tabBarStyle) ─── */
  const TAB_BAR_HEIGHT = wp(80) + insets.bottom;

  /* ─── Render FAB helper ─── */
  const renderFab = () =>
    isPartnerOrHasContext ? (
      <View style={[styles.fabWrap, { bottom: TAB_BAR_HEIGHT + spacing[3] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { setCreatedResult(null); setShowCreate(true); }}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#4F46E5', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabGradient}>
            <Ionicons name="person-add-outline" size={wp(20)} color="#FFFFFF" />
            <Text style={styles.fabText}>Ajouter un opérateur</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    ) : null;

  return (
    <View style={styles.bg}>

      {/* ── Dark gradient header ── */}
      <LinearGradient colors={['#0D0E20', '#1a1b3e']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={wp(22)} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Mon équipe</Text>
            {!opsQ.isLoading && !opsQ.isError && operators.length > 0 && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.countChip}>
                <Text style={styles.countChipText}>{operators.length} opérateur{operators.length > 1 ? 's' : ''}</Text>
              </Animated.View>
            )}
          </View>
          <View style={{ width: wp(40) }} />
        </View>
      </LinearGradient>

      {/* ── Content: loading / error / list ── */}
      {opsQ.isLoading ? (
        <LoadingSpinner message="Chargement de l'équipe…" />
      ) : opsQ.isError ? (
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger la liste des opérateurs."
          onRetry={() => opsQ.refetch()}
          icon="people-outline"
        />
      ) : (
        <FlatList
          data={operators}
          keyExtractor={(item) => item.userId}
          renderItem={renderOperator}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_HEIGHT + (isPartnerOrHasContext ? wp(100) : wp(40)) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={opsQ.isFetching}
              onRefresh={() => opsQ.refetch()}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={wp(40)} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={styles.emptyTitle}>Aucun opérateur</Text>
              <Text style={styles.emptyDesc}>
                Ajoutez votre premier opérateur pour qu'il puisse scanner les clients.
              </Text>
            </View>
          }
        />
      )}

      {/* ── FAB: Ajouter un opérateur ── */}
      {renderFab()}

      {/* ── Assign to store modal ── */}
      {showAssign && (() => {
        const op = showAssign;
        const fullName = `${op.firstName ?? ''} ${op.lastName ?? ''}`.trim() || op.email || 'Opérateur';
        const assignedStoreIds = new Set(
          stores.filter((s) => s.operators?.some((o) => o.userId === op.userId)).map((s) => s.id),
        );
        const available = stores.filter((s) => !assignedStoreIds.has(s.id));
        const assigned = stores.filter((s) => assignedStoreIds.has(s.id));
        return (
          <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowAssign(null)}>
            <Pressable style={rStyles.backdrop} onPress={() => setShowAssign(null)} />
            <View style={rStyles.sheet}>
              <View style={rStyles.handle} />

              {/* Header */}
              <View style={rStyles.header}>
                <View style={[rStyles.headerIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <Ionicons name="add-circle-outline" size={wp(18)} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={rStyles.headerTitle}>Assigner à un magasin</Text>
                  <Text style={rStyles.headerSub}>Choisissez le magasin</Text>
                </View>
                <TouchableOpacity style={rStyles.closeBtn} onPress={() => setShowAssign(null)}>
                  <Ionicons name="close" size={wp(18)} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              {/* Operator banner */}
              <View style={rStyles.opBanner}>
                <OperatorAvatar name={fullName} uri={op.avatarUrl} size={wp(40)} />
                <View style={{ flex: 1 }}>
                  <Text style={rStyles.opName} numberOfLines={1}>{fullName}</Text>
                  {op.email ? <Text style={rStyles.opEmail} numberOfLines={1}>{op.email}</Text> : null}
                </View>
                {op.isManager && (
                  <View style={rStyles.mgrChip}>
                    <Ionicons name="shield-checkmark" size={wp(10)} color="#34D399" />
                    <Text style={rStyles.mgrChipText}>Manager</Text>
                  </View>
                )}
              </View>

              <ScrollView style={rStyles.scroll} showsVerticalScrollIndicator={false}>
                {/* Already assigned */}
                {assigned.length > 0 && (
                  <>
                    <Text style={[rStyles.listHint, { color: '#22C55E' }]}>
                      Déjà assigné ({assigned.length} magasin{assigned.length > 1 ? 's' : ''})
                    </Text>
                    {assigned.map((s) => (
                      <View key={s.id} style={aStyles.storeRowDone}>
                        <View style={aStyles.storeIconDone}>
                          <Ionicons name="checkmark" size={wp(14)} color="#22C55E" />
                        </View>
                        <Text style={aStyles.storeNameDone} numberOfLines={1}>{s.name ?? s.id.slice(0, 8)}</Text>
                        <View style={aStyles.doneBadge}>
                          <Text style={aStyles.doneBadgeText}>Assigné</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {/* Available */}
                {available.length > 0 ? (
                  <>
                    <Text style={[rStyles.listHint, { marginTop: assigned.length > 0 ? spacing[3] : spacing[3] }]}>
                      {assigned.length > 0
                        ? `Autres magasins disponibles (${available.length}) :`
                        : `Choisissez un magasin pour assigner ${op.firstName ?? 'cet opérateur'} :`}
                    </Text>
                    {available.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[rStyles.storeRow, { borderColor: 'rgba(99,102,241,0.15)' }]}
                        activeOpacity={0.7}
                        disabled={assignMut.isPending}
                        onPress={() => assignMut.mutate(
                          { userId: op.userId, storeId: s.id },
                          { onSuccess: () => setShowAssign(null) },
                        )}
                      >
                        <View style={[rStyles.storeIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                          <Ionicons name="storefront-outline" size={wp(16)} color="#6366F1" />
                        </View>
                        <Text style={rStyles.storeName} numberOfLines={1}>{s.name ?? s.id.slice(0, 8)}</Text>
                        {assignMut.isPending && assignMut.variables?.storeId === s.id
                          ? <ActivityIndicator size="small" color="#6366F1" />
                          : <View style={aStyles.addChip}>
                              <Ionicons name="add" size={wp(12)} color="#6366F1" />
                              <Text style={aStyles.addChipText}>Assigner</Text>
                            </View>
                        }
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <View style={rStyles.emptyWrap}>
                    <Ionicons name="checkmark-circle" size={wp(40)} color="#22C55E" />
                    <Text style={[rStyles.emptyText, { color: 'rgba(34,197,94,0.7)' }]}>
                      {op.firstName ?? 'Cet opérateur'} est déjà assigné à tous vos magasins.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={rStyles.cancelBtn} onPress={() => setShowAssign(null)}>
                <Text style={rStyles.cancelBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        );
      })()}

      {/* ── Toggle manager modal ── */}
      {showToggle && (() => {
        const op = showToggle;
        const fullName = `${op.firstName ?? ''} ${op.lastName ?? ''}`.trim() || op.email || 'Opérateur';
        const assignedStores = stores.filter((s) => s.operators?.some((o) => o.userId === op.userId));
        const isPromoting = !op.isManager;
        const accentColor = isPromoting ? '#34D399' : '#FBBF24';
        const accentBg = isPromoting ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)';
        const accentBorder = isPromoting ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)';
        return (
          <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowToggle(null)}>
            <Pressable style={rStyles.backdrop} onPress={() => setShowToggle(null)} />
            <View style={rStyles.sheet}>
              <View style={rStyles.handle} />

              <View style={rStyles.header}>
                <View style={[rStyles.headerIcon, { backgroundColor: accentBg }]}>
                  <Ionicons name={isPromoting ? 'shield-checkmark-outline' : 'shield-outline'} size={wp(18)} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={rStyles.headerTitle}>{isPromoting ? 'Promouvoir manager' : 'Retirer le rôle manager'}</Text>
                  <Text style={rStyles.headerSub}>Choisissez le magasin</Text>
                </View>
                <TouchableOpacity style={rStyles.closeBtn} onPress={() => setShowToggle(null)}>
                  <Ionicons name="close" size={wp(18)} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              <View style={rStyles.opBanner}>
                <OperatorAvatar name={fullName} uri={op.avatarUrl} size={wp(40)} />
                <View style={{ flex: 1 }}>
                  <Text style={rStyles.opName} numberOfLines={1}>{fullName}</Text>
                  {op.email ? <Text style={rStyles.opEmail} numberOfLines={1}>{op.email}</Text> : null}
                </View>
                {op.isManager && (
                  <View style={rStyles.mgrChip}>
                    <Ionicons name="shield-checkmark" size={wp(10)} color="#34D399" />
                    <Text style={rStyles.mgrChipText}>Manager</Text>
                  </View>
                )}
              </View>

              <ScrollView style={rStyles.scroll} showsVerticalScrollIndicator={false}>
                {assignedStores.length === 0 ? (
                  <View style={rStyles.emptyWrap}>
                    <Ionicons name="storefront-outline" size={wp(36)} color="rgba(255,255,255,0.15)" />
                    <Text style={rStyles.emptyText}>Aucun magasin trouvé pour cet opérateur.</Text>
                  </View>
                ) : (
                  <>
                    <Text style={rStyles.listHint}>
                      {isPromoting ? 'Promouvoir manager sur :' : 'Retirer le rôle manager sur :'}
                    </Text>
                    {assignedStores.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[rStyles.storeRow, { borderColor: accentBorder }]}
                        activeOpacity={0.7}
                        disabled={toggleMgr.isPending}
                        onPress={() => toggleMgr.mutate(
                          { userId: op.userId, storeId: s.id },
                          { onSuccess: () => setShowToggle(null) },
                        )}
                      >
                        <View style={[rStyles.storeIconWrap, { backgroundColor: accentBg }]}>
                          <Ionicons name="storefront-outline" size={wp(16)} color={accentColor} />
                        </View>
                        <Text style={rStyles.storeName} numberOfLines={1}>{s.name ?? s.id.slice(0, 8)}</Text>
                        {toggleMgr.isPending && toggleMgr.variables?.storeId === s.id
                          ? <ActivityIndicator size="small" color={accentColor} />
                          : <View style={[rStyles.removeChip, { backgroundColor: accentBg, borderColor: accentBorder }]}>
                              <Ionicons name={isPromoting ? 'shield-checkmark-outline' : 'shield-outline'} size={wp(12)} color={accentColor} />
                              <Text style={[rStyles.removeChipText, { color: accentColor }]}>
                                {isPromoting ? 'Promouvoir' : 'Retirer'}
                              </Text>
                            </View>
                        }
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>

              <TouchableOpacity style={rStyles.cancelBtn} onPress={() => setShowToggle(null)}>
                <Text style={rStyles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        );
      })()}

      {/* ── Remove from store modal ── */}
      {showRemove && (() => {
        const op = showRemove;
        const fullName = `${op.firstName ?? ''} ${op.lastName ?? ''}`.trim() || op.email || 'Opérateur';
        const assignedStores = stores.filter((s) =>
          s.operators?.some((o) => o.userId === op.userId),
        );
        return (
          <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowRemove(null)}>
            <Pressable style={rStyles.backdrop} onPress={() => setShowRemove(null)} />
            <View style={rStyles.sheet}>
              <View style={rStyles.handle} />

              {/* Header */}
              <View style={rStyles.header}>
                <View style={rStyles.headerIcon}>
                  <Ionicons name="trash-outline" size={wp(18)} color="#F87171" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={rStyles.headerTitle}>Retirer un opérateur</Text>
                  <Text style={rStyles.headerSub}>Choisissez le magasin</Text>
                </View>
                <TouchableOpacity style={rStyles.closeBtn} onPress={() => setShowRemove(null)}>
                  <Ionicons name="close" size={wp(18)} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              {/* Operator banner */}
              <View style={rStyles.opBanner}>
                <OperatorAvatar name={fullName} uri={op.avatarUrl} size={wp(40)} />
                <View style={{ flex: 1 }}>
                  <Text style={rStyles.opName} numberOfLines={1}>{fullName}</Text>
                  {op.email ? <Text style={rStyles.opEmail} numberOfLines={1}>{op.email}</Text> : null}
                </View>
                {op.isManager && (
                  <View style={rStyles.mgrChip}>
                    <Ionicons name="shield-checkmark" size={wp(10)} color="#34D399" />
                    <Text style={rStyles.mgrChipText}>Manager</Text>
                  </View>
                )}
              </View>

              {/* Store list */}
              <ScrollView style={rStyles.scroll} showsVerticalScrollIndicator={false}>
                {assignedStores.length === 0 ? (
                  <View style={rStyles.emptyWrap}>
                    <Ionicons name="storefront-outline" size={wp(36)} color="rgba(255,255,255,0.15)" />
                    <Text style={rStyles.emptyText}>Aucun magasin trouvé pour cet opérateur.</Text>
                  </View>
                ) : (
                  <>
                    <Text style={rStyles.listHint}>
                      Sélectionnez le magasin duquel retirer {op.firstName ?? 'cet opérateur'} :
                    </Text>
                    {assignedStores.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={rStyles.storeRow}
                        activeOpacity={0.7}
                        disabled={removeMut.isPending}
                        onPress={() => {
                          removeMut.mutate(
                            { userId: op.userId, storeId: s.id },
                            { onSuccess: () => setShowRemove(null) },
                          );
                        }}
                      >
                        <View style={rStyles.storeIconWrap}>
                          <Ionicons name="storefront-outline" size={wp(16)} color="#F87171" />
                        </View>
                        <Text style={rStyles.storeName} numberOfLines={1}>{s.name ?? s.id.slice(0, 8)}</Text>
                        {removeMut.isPending && removeMut.variables?.storeId === s.id
                          ? <ActivityIndicator size="small" color="#F87171" />
                          : <View style={rStyles.removeChip}>
                              <Ionicons name="trash-outline" size={wp(12)} color="#F87171" />
                              <Text style={rStyles.removeChipText}>Retirer</Text>
                            </View>
                        }
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>

              <TouchableOpacity style={rStyles.cancelBtn} onPress={() => setShowRemove(null)}>
                <Text style={rStyles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        );
      })()}

      {/* ── Create SO modal ── */}
      <CreateOperatorModal
        visible={showCreate}
        onClose={() => { setShowCreate(false); setCreatedResult(null); }}
        stores={stores}
        onSubmit={(dto) => createMut.mutate(dto)}
        loading={createMut.isPending}
        result={createdResult}
      />

      <AlertModal />
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Create Operator Modal — Multi-store + Email invitation            */
/* ══════════════════════════════════════════════════════════════════ */
const SCREEN_H = Dimensions.get('window').height;

/* ── Dark field input ── */
function DarkField({
  label, value, onChangeText, placeholder, icon, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; icon?: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[cStyles.fieldWrap, focused && cStyles.fieldWrapFocused]}>
      {icon && (
        <View style={[cStyles.fieldIcon, focused && cStyles.fieldIconFocused]}>
          <Ionicons name={icon} size={wp(15)} color={focused ? '#6366F1' : 'rgba(255,255,255,0.25)'} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[cStyles.fieldLabel, focused && cStyles.fieldLabelFocused]}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.18)"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          style={cStyles.fieldInput}
        />
      </View>
      {focused && <View style={cStyles.fieldBar} />}
    </View>
  );
}

function CreateOperatorModal({
  visible,
  onClose,
  stores,
  onSubmit,
  loading,
  result,
}: {
  visible: boolean;
  onClose: () => void;
  stores: StoreDto[];
  onSubmit: (dto: CreateStoreOperatorDto) => void;
  loading: boolean;
  result: CreateStoreOperatorResultDto | null;
}) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedStores, setSelectedStores] = useState<Map<string, boolean>>(new Map());
  const [sendEmail, setSendEmail] = useState(true);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const resetForm = () => {
    setEmail(''); setFirstName(''); setLastName('');
    setSelectedStores(new Map()); setSendEmail(true); setPasswordCopied(false);
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores((prev) => {
      const next = new Map(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.set(storeId, false);
      return next;
    });
  };

  const toggleStoreManager = (storeId: string) => {
    setSelectedStores((prev) => {
      const next = new Map(prev);
      if (next.has(storeId)) next.set(storeId, !next.get(storeId));
      return next;
    });
  };

  const handleSubmit = () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir l\'email, le prénom et le nom.');
      return;
    }
    if (selectedStores.size === 0) {
      Alert.alert('Magasin requis', 'Veuillez sélectionner au moins un magasin.');
      return;
    }
    const storeAssignments: StoreAssignmentDto[] = Array.from(selectedStores.entries()).map(
      ([storeId, isManager]) => ({ storeId, isManager }),
    );
    onSubmit({
      email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(),
      storeId: storeAssignments[0].storeId, isManager: storeAssignments[0].isManager,
      storeAssignments, sendInvitationEmail: sendEmail,
    });
  };

  const handleCopyPassword = async (password: string) => {
    await Clipboard.setStringAsync(password);
    setPasswordCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setPasswordCopied(false), 2500);
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <Pressable style={cStyles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[cStyles.kav, { height: SCREEN_H * 0.92 }]}
      >
        <View style={[cStyles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
          {/* Handle */}
          <View style={cStyles.handle} />

          {/* Header — simple dark */}
          <View style={cStyles.darkHeader}>
            <View style={cStyles.headerIcon}>
              <Ionicons name="person-add-outline" size={wp(16)} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={cStyles.headerTitle}>Inviter un opérateur</Text>
              <Text style={cStyles.headerSub}>Créez un compte et assignez-le à vos magasins</Text>
            </View>
            <TouchableOpacity style={cStyles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={wp(18)} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={cStyles.scrollContent}
          >
            {result ? (
              /* ── Success state ── */
              <View style={cStyles.successWrap}>
                <LinearGradient colors={['#22C55E', '#16A34A']} style={cStyles.successIcon}>
                  <Ionicons name="checkmark" size={wp(36)} color="#FFFFFF" />
                </LinearGradient>
                <Text style={cStyles.successTitle}>
                  {result.temporaryPassword ? 'Compte créé !' : 'Opérateur lié !'}
                </Text>
                <Text style={cStyles.successEmail}>{result.email}</Text>

                {(result.assignments ?? []).length > 0 && (
                  <View style={cStyles.resultStores}>
                    <Text style={cStyles.resultStoresLabel}>Magasins assignés</Text>
                    {(result.assignments ?? []).map((a) => (
                      <View key={a.storeId} style={cStyles.resultStoreRow}>
                        <Ionicons name="storefront-outline" size={wp(13)} color="#6366F1" />
                        <Text style={cStyles.resultStoreName} numberOfLines={1}>{a.storeName}</Text>
                        {a.isManager && (
                          <View style={cStyles.resultMgrChip}>
                            <Ionicons name="shield-checkmark" size={wp(9)} color="#34D399" />
                            <Text style={cStyles.resultMgrText}>Manager</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {result.temporaryPassword && (
                  <View style={cStyles.pwdBox}>
                    <Text style={cStyles.pwdLabel}>Mot de passe temporaire</Text>
                    <Text style={cStyles.pwdValue}>{result.temporaryPassword}</Text>
                    <TouchableOpacity
                      style={[cStyles.copyBtn, passwordCopied && cStyles.copyBtnDone]}
                      onPress={() => handleCopyPassword(result.temporaryPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={passwordCopied ? 'checkmark-circle' : 'copy-outline'} size={wp(15)} color={passwordCopied ? '#4ADE80' : '#6366F1'} />
                      <Text style={[cStyles.copyBtnText, passwordCopied && cStyles.copyBtnDoneText]}>
                        {passwordCopied ? 'Copié !' : 'Copier'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={cStyles.infoRow}>
                  <Ionicons name={sendEmail ? 'mail-outline' : 'information-circle-outline'} size={wp(15)} color="rgba(99,102,241,0.7)" />
                  <Text style={cStyles.infoText}>
                    {result.temporaryPassword
                      ? (sendEmail ? "Email d'invitation envoyé avec les identifiants." : 'Partagez les identifiants manuellement.')
                      : 'Utilisateur existant lié aux magasins sélectionnés.'}
                  </Text>
                </View>

                <TouchableOpacity style={cStyles.submitBtn} onPress={handleClose} activeOpacity={0.85}>
                  <LinearGradient colors={['#4F46E5', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cStyles.submitBtnInner}>
                    <Text style={cStyles.submitBtnText}>Fermer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Form ── */
              <>
                {/* Section identité */}
                <View style={cStyles.sectionHead}>
                  <View style={[cStyles.sectionDot, { backgroundColor: '#6366F1' }]} />
                  <Ionicons name="person-outline" size={wp(12)} color="#6366F1" />
                  <Text style={[cStyles.sectionLabel, { color: '#6366F1' }]}>Identité</Text>
                  <View style={cStyles.sectionLine} />
                </View>

                <DarkField label="Email" value={email} onChangeText={setEmail}
                  icon="mail-outline" placeholder="operateur@exemple.fr" keyboardType="email-address" />

                <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                  <View style={{ flex: 1 }}>
                    <DarkField label="Prénom" value={firstName} onChangeText={setFirstName}
                      icon="person-outline" placeholder="Jean" autoCapitalize="words" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DarkField label="Nom" value={lastName} onChangeText={setLastName}
                      placeholder="Dupont" autoCapitalize="words" />
                  </View>
                </View>

                {/* Section magasins */}
                <View style={cStyles.sectionHead}>
                  <View style={[cStyles.sectionDot, { backgroundColor: '#6366F1' }]} />
                  <Ionicons name="storefront-outline" size={wp(12)} color="#6366F1" />
                  <Text style={[cStyles.sectionLabel, { color: '#6366F1' }]}>Magasins</Text>
                  <View style={cStyles.sectionLine} />
                </View>

                <Text style={cStyles.sectionHint}>Appuyez sur le bouclier pour définir comme manager.</Text>

                {stores.map((s) => {
                  const isSelected = selectedStores.has(s.id);
                  const isMgr = selectedStores.get(s.id) === true;
                  return (
                    <View key={s.id} style={[cStyles.storeRow, isSelected && cStyles.storeRowActive]}>
                      <TouchableOpacity style={cStyles.storeLeft} onPress={() => toggleStore(s.id)} activeOpacity={0.7}>
                        <View style={[cStyles.checkbox, isSelected && cStyles.checkboxActive]}>
                          {isSelected && <Ionicons name="checkmark" size={wp(11)} color="#FFFFFF" />}
                        </View>
                        <Ionicons name="storefront-outline" size={wp(15)} color={isSelected ? '#6366F1' : 'rgba(255,255,255,0.3)'} />
                        <Text style={[cStyles.storeName, isSelected && cStyles.storeNameActive]} numberOfLines={1}>
                          {s.name ?? s.id.slice(0, 8)}
                        </Text>
                      </TouchableOpacity>
                      {isSelected && (
                        <TouchableOpacity
                          style={[cStyles.mgrBtn, isMgr && cStyles.mgrBtnActive]}
                          onPress={() => toggleStoreManager(s.id)}
                          hitSlop={8}
                        >
                          <Ionicons name={isMgr ? 'shield-checkmark' : 'shield-outline'} size={wp(13)} color={isMgr ? '#34D399' : 'rgba(255,255,255,0.35)'} />
                          {isMgr && <Text style={cStyles.mgrBtnText}>Manager</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {/* Email toggle */}
                <View style={cStyles.sectionHead}>
                  <View style={[cStyles.sectionDot, { backgroundColor: '#38BDF8' }]} />
                  <Ionicons name="mail-outline" size={wp(12)} color="#38BDF8" />
                  <Text style={[cStyles.sectionLabel, { color: '#38BDF8' }]}>Invitation</Text>
                  <View style={cStyles.sectionLine} />
                </View>

                <TouchableOpacity style={[cStyles.emailToggle, sendEmail && cStyles.emailToggleActive]} onPress={() => setSendEmail(!sendEmail)} activeOpacity={0.8}>
                  <View style={[cStyles.checkbox, sendEmail && cStyles.checkboxActive]}>
                    {sendEmail && <Ionicons name="checkmark" size={wp(11)} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cStyles.emailToggleText}>Envoyer un email d'invitation</Text>
                    <Text style={cStyles.emailToggleHint}>L'opérateur recevra ses identifiants par email</Text>
                  </View>
                  <Ionicons name="mail-outline" size={wp(17)} color={sendEmail ? '#6366F1' : 'rgba(255,255,255,0.2)'} />
                </TouchableOpacity>

                <View style={cStyles.infoRow}>
                  <Ionicons name="information-circle-outline" size={wp(14)} color="rgba(99,102,241,0.6)" />
                  <Text style={cStyles.infoText}>
                    Un mot de passe sera généré. {sendEmail ? "Il sera inclus dans l'email." : 'Vous pourrez le copier après création.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[cStyles.submitBtn, (loading) && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#6366F1']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={cStyles.submitBtnInner}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={wp(17)} color="#FFFFFF" />
                        <Text style={cStyles.submitBtnText}>
                          Inviter{selectedStores.size > 0 ? ` (${selectedStores.size} magasin${selectedStores.size > 1 ? 's' : ''})` : ''}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: spacing[5],
    borderBottomLeftRadius: wp(24),
    borderBottomRightRadius: wp(24),
    ...shadows.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing[3] },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: spacing[1] },
  headerTitle: { ...textStyles.h4, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  countChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  countChipText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: '#818CF8' },

  /* List */
  listContent: { padding: spacing[4] },

  /* Operator card */
  opCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing[3],
    overflow: 'hidden',
    ...shadows.sm,
  },
  managerBar: {
    width: wp(4),
    backgroundColor: '#34D399',
  },
  opCardInner: { flex: 1, padding: spacing[4] },
  opRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  opInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  opName: { ...textStyles.body, fontFamily: fontFamily.semiBold, color: '#FFFFFF', flexShrink: 1 },
  managerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: wp(6),
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  managerChipText: { fontSize: wp(9), fontFamily: fontFamily.semiBold, color: '#34D399' },
  opEmail: { ...textStyles.micro, color: 'rgba(255,255,255,0.35)', marginTop: spacing[1] },

  /* Action row */
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: spacing[2],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionText: { ...textStyles.micro, fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.4)' },
  actionSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },

  /* Empty state */
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: wp(80), paddingHorizontal: spacing[8] },
  emptyIcon: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: { ...textStyles.h4, color: 'rgba(255,255,255,0.4)', marginBottom: spacing[2] },
  emptyDesc: { ...textStyles.body, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 22 },

  /* FAB */
  fabWrap: { position: 'absolute', left: spacing[4], right: spacing[4], zIndex: 100, elevation: 10 },
  fab: { borderRadius: borderRadius['2xl'], overflow: 'hidden', ...shadows.lg },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  fabText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },

  /* Assign modal — redesigned for white MModal background */
  assignOperatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing[4],
  },
  assignOperatorName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: '#1E293B',
  },
  assignOperatorEmail: {
    ...textStyles.micro,
    color: '#94A3B8',
    marginTop: 2,
  },
  assignSection: {
    marginBottom: spacing[4],
  },
  assignSectionTitle: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: '#475569',
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignSectionHint: {
    ...textStyles.micro,
    color: '#94A3B8',
    marginBottom: spacing[3],
  },
  assignStoreRowDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    marginBottom: spacing[1],
    opacity: 0.7,
  },
  assignStoreNameDone: {
    ...textStyles.body,
    color: '#94A3B8',
    flex: 1,
  },
  assignedBadge: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignStoreRowAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: spacing[2],
  },
  assignStoreNameAvailable: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
    flex: 1,
  },
  assignArrowBtn: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignAllDone: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
  },
  assignAllDoneIcon: {
    marginBottom: spacing[3],
  },
  assignAllDoneTitle: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: spacing[1],
  },
  assignAllDoneDesc: {
    ...textStyles.body,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Create modal form — redesigned for white MModal background */
  fieldLabel: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: '#475569',
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  fieldHint: {
    ...textStyles.micro,
    color: '#94A3B8',
    marginBottom: spacing[2],
  },

  /* Multi-store list */
  storeList: { gap: spacing[2] },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  storeRowSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#FFF4EC',
  },
  storeSelectArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  storeCheckbox: {
    width: wp(20),
    height: wp(20),
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: '#CBD0DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCheckboxActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  storeRowName: {
    ...textStyles.body,
    color: '#64708B',
    flex: 1,
  },
  storeRowNameSelected: {
    color: '#1E293B',
    fontFamily: fontFamily.medium,
  },

  /* Manager badge per-store */
  managerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
  },
  managerBadgeActive: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  managerBadgeText: {
    fontSize: wp(9),
    fontFamily: fontFamily.semiBold,
    color: '#34D399',
  },

  /* Email toggle */
  emailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  emailToggleCheck: {
    width: wp(22),
    height: wp(22),
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: '#CBD0DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailToggleCheckActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  emailToggleText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
  },
  emailToggleHint: {
    ...textStyles.micro,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Info callout */
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: '#F0F1F5',
    borderWidth: 1,
    borderColor: '#DDE0E8',
  },
  infoCalloutText: {
    ...textStyles.caption,
    color: '#475569',
    flex: 1,
    lineHeight: wp(16),
  },

  /* Result state */
  resultWrap: { alignItems: 'center', paddingVertical: spacing[3] },
  resultIconBox: { marginBottom: spacing[3] },
  resultIconGradient: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: spacing[1],
  },
  resultEmail: {
    ...textStyles.body,
    color: '#94A3B8',
    marginBottom: spacing[4],
  },

  /* Assigned stores in result */
  resultStoresBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  resultStoresLabel: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: '#475569',
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  resultStoreName: {
    ...textStyles.body,
    color: '#1E293B',
    flex: 1,
  },
  resultManagerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: wp(6),
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  resultManagerText: {
    fontSize: wp(8),
    fontFamily: fontFamily.semiBold,
    color: '#34D399',
  },

  /* Password result */
  resultPasswordBox: {
    backgroundColor: '#FFF4EC',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4CC',
    marginBottom: spacing[3],
  },
  resultPasswordLabel: {
    ...textStyles.caption,
    color: '#64708B',
    marginBottom: spacing[2],
  },
  resultPassword: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: '#6366F1',
    letterSpacing: 3,
    marginBottom: spacing[3],
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    backgroundColor: '#FFF4EC',
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  copyBtnDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  copyBtnText: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: '#6366F1',
  },
  copyBtnTextDone: {
    color: '#059669',
  },

  /* Email sent notice in result */
  resultEmailSent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: '#F0F1F5',
    borderWidth: 1,
    borderColor: '#DDE0E8',
    width: '100%',
  },
  resultEmailSentText: {
    ...textStyles.caption,
    color: '#475569',
    flex: 1,
    lineHeight: wp(16),
  },

  /* Legacy/compat (keep for assign modal) */
  storePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  storeChipActive: { backgroundColor: colors.violet[600], borderColor: colors.violet[500] },
  storeChipText: { ...textStyles.caption, fontFamily: fontFamily.medium, color: colors.violet[300] },
  storeChipTextActive: { color: '#FFFFFF' },
  checkbox: {
    width: wp(22),
    height: wp(22),
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.violet[600], borderColor: colors.violet[500] },
});

/* ── Create Operator Modal styles ── */
const cStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  kav: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: { width: wp(40), height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: spacing[3], marginBottom: spacing[1] },

  /* Header */
  darkHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    marginBottom: spacing[2],
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerIcon: { width: wp(36), height: wp(36), borderRadius: wp(18), backgroundColor: 'rgba(99,102,241,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  headerSub: { fontSize: wp(11), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  closeBtn: { width: wp(32), height: wp(32), borderRadius: wp(16), backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: spacing[4], paddingBottom: spacing[6] },

  /* Section head */
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[4], marginBottom: spacing[3] },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: { fontSize: wp(11), fontFamily: fontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.9 },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  sectionHint: { fontSize: wp(11), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.7)', marginBottom: spacing[2], marginTop: -spacing[2] },

  /* Dark field */
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: '#1A2640', borderRadius: borderRadius.xl,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: spacing[3], paddingVertical: 10,
    marginBottom: spacing[3], position: 'relative', overflow: 'hidden',
  },
  fieldWrapFocused: { borderColor: '#6366F1', backgroundColor: '#1E2D45' },
  fieldIcon: { width: wp(28), height: wp(28), borderRadius: borderRadius.md, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldIconFocused: { backgroundColor: 'rgba(99,102,241,0.15)' },
  fieldLabel: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  fieldLabelFocused: { color: '#6366F1' },
  fieldInput: { fontSize: wp(14), fontFamily: fontFamily.medium, color: '#FFFFFF', padding: 0, margin: 0 },
  fieldBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#6366F1' },

  /* Stores */
  storeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: spacing[2], overflow: 'hidden' },
  storeRowActive: { borderColor: 'rgba(99,102,241,0.35)', backgroundColor: '#1E2D3A' },
  storeLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], paddingHorizontal: spacing[3] },
  checkbox: { width: wp(20), height: wp(20), borderRadius: borderRadius.sm, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  storeName: { fontSize: wp(13), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.7)', flex: 1 },
  storeNameActive: { color: '#FFFFFF' },
  mgrBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing[3], paddingHorizontal: spacing[3], borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)' },
  mgrBtnActive: { backgroundColor: 'rgba(52,211,153,0.08)' },
  mgrBtnText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: '#34D399' },

  /* Email toggle */
  emailToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: '#1E293B', borderRadius: borderRadius.xl, padding: spacing[3], borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  emailToggleActive: { borderColor: 'rgba(99,102,241,0.3)', backgroundColor: '#1E2D3A' },
  emailToggleText: { fontSize: wp(13), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.85)' },
  emailToggleHint: { fontSize: wp(10), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  /* Info row */
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], marginTop: spacing[3], paddingHorizontal: spacing[1] },
  infoText: { fontSize: wp(11), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.6)', flex: 1, lineHeight: 16 },

  /* Submit */
  submitBtn: { borderRadius: borderRadius['2xl'], overflow: 'hidden', marginTop: spacing[5] },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  submitBtnText: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF' },

  /* Success */
  successWrap: { alignItems: 'center', paddingTop: spacing[4] },
  successIcon: { width: wp(80), height: wp(80), borderRadius: wp(40), alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4] },
  successTitle: { fontSize: wp(20), fontFamily: fontFamily.bold, color: '#FFFFFF', marginBottom: spacing[1] },
  successEmail: { fontSize: wp(13), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.65)', marginBottom: spacing[5] },
  resultStores: { width: '100%', backgroundColor: '#1E293B', borderRadius: borderRadius.xl, padding: spacing[3], marginBottom: spacing[4], borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  resultStoresLabel: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[2] },
  resultStoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2] },
  resultStoreName: { fontSize: wp(13), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.8)', flex: 1 },
  resultMgrChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: borderRadius.full, paddingHorizontal: spacing[2], paddingVertical: 2 },
  resultMgrText: { fontSize: wp(9), fontFamily: fontFamily.semiBold, color: '#34D399' },
  pwdBox: { width: '100%', backgroundColor: '#1E293B', borderRadius: borderRadius.xl, padding: spacing[4], marginBottom: spacing[4], borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center' },
  pwdLabel: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[2] },
  pwdValue: { fontSize: wp(20), fontFamily: fontFamily.bold, color: '#FFFFFF', letterSpacing: 2, marginBottom: spacing[3] },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: borderRadius.lg, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  copyBtnDone: { backgroundColor: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.2)' },
  copyBtnText: { fontSize: wp(12), fontFamily: fontFamily.semiBold, color: '#6366F1' },
  copyBtnDoneText: { color: '#4ADE80' },
});

/* ══════════════════════════════════════════════════════════════════ */
/*  Remove Operator Modal styles                                      */
/* ══════════════════════════════════════════════════════════════════ */
const rStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: wp(28),
    borderTopRightRadius: wp(28),
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingBottom: spacing[6],
    overflow: 'hidden',
  },
  handle: {
    width: wp(40), height: wp(4), borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginVertical: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerIcon: {
    width: wp(36), height: wp(36), borderRadius: wp(18),
    backgroundColor: 'rgba(248,113,113,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  headerSub: { fontSize: wp(11), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  closeBtn: {
    width: wp(32), height: wp(32), borderRadius: wp(16),
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  opBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  opName: { fontSize: wp(14), fontFamily: fontFamily.semiBold, color: '#FFFFFF' },
  opEmail: { fontSize: wp(11), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  mgrChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
  },
  mgrChipText: { fontSize: wp(9), fontFamily: fontFamily.semiBold, color: '#34D399' },

  scroll: { maxHeight: wp(280), paddingHorizontal: spacing[5] },
  listHint: {
    fontSize: wp(11), fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.45)',
    marginTop: spacing[3], marginBottom: spacing[2],
  },

  storeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)',
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  storeIconWrap: {
    width: wp(34), height: wp(34), borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(248,113,113,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  storeName: { flex: 1, fontSize: wp(13), fontFamily: fontFamily.medium, color: '#FFFFFF' },
  removeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[2], paddingVertical: spacing[1],
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
  },
  removeChipText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: '#F87171' },

  emptyWrap: { alignItems: 'center', paddingVertical: spacing[6], gap: spacing[2] },
  emptyText: { fontSize: wp(12), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  cancelBtn: {
    marginHorizontal: spacing[5],
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: wp(14), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.6)' },
});

/* Assign modal — extra styles (reuses rStyles for shared parts) */
const aStyles = StyleSheet.create({
  storeRowDone: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: 'rgba(34,197,94,0.05)',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)',
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  storeIconDone: {
    width: wp(34), height: wp(34), borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(34,197,94,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  storeNameDone: { flex: 1, fontSize: wp(13), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.5)' },
  doneBadge: {
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  doneBadgeText: { fontSize: wp(9), fontFamily: fontFamily.semiBold, color: '#22C55E' },

  addChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[2], paddingVertical: spacing[1],
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
  },
  addChipText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: '#6366F1' },
});
