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
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
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
  MInput,
  MButton,
  LoadingSpinner,
  ErrorState,
} from '../../src/components/ui';
import type {
  StoreOperatorLiteDto,
  StoreDto,
  CreateStoreOperatorDto,
  CreateStoreOperatorResultDto,
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
  const [createdResult, setCreatedResult] = useState<CreateStoreOperatorResultDto | null>(null);
  const { alert, confirm, AlertModal } = useAppAlert();

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
      queryClient.invalidateQueries({ queryKey: ['partnerOperators'] });
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
      queryClient.invalidateQueries({ queryKey: ['partnerOperators'] });
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
      setShowAssign(null);
      queryClient.invalidateQueries({ queryKey: ['partnerOperators'] });
      queryClient.invalidateQueries({ queryKey: ['myPartnerStores'] });
    },
    onError: (err: any) =>
      alert('Erreur', err?.response?.data?.message ?? "Impossible d'assigner l'opérateur."),
  });

  /* ─── Create ─── */
  const createMut = useMutation({
    mutationFn: (dto: CreateStoreOperatorDto) =>
      storeOperatorsApi.createOperator(dto),
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreatedResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['partnerOperators'] });
    },
    onError: (err: any) =>
      alert('Erreur', err?.response?.data?.message ?? "Impossible de créer l'opérateur."),
  });

  /* ─── Store picker helpers ─── */
  const confirmRemove = (op: StoreOperatorLiteDto) => {
    if (stores.length === 1) {
      confirm(
        "Retirer l'opérateur",
        `Voulez-vous retirer ${op.firstName ?? ''} ${op.lastName ?? ''} du magasin ?`,
        () => removeMut.mutate({ userId: op.userId, storeId: stores[0].id }),
      );
    } else {
      Alert.alert(
        'Retirer de quel magasin ?',
        `Choisissez le magasin duquel retirer ${op.firstName ?? ''} ${op.lastName ?? ''}.`,
        [
          ...stores.slice(0, 5).map((s) => ({
            text: s.name ?? s.id.slice(0, 8),
            onPress: () => removeMut.mutate({ userId: op.userId, storeId: s.id }),
          })),
          { text: 'Annuler', style: 'cancel' as const },
        ],
      );
    }
  };

  const confirmToggle = (op: StoreOperatorLiteDto) => {
    if (stores.length === 1) {
      toggleMgr.mutate({ userId: op.userId, storeId: stores[0].id });
    } else {
      Alert.alert(
        'Toggle manager — quel magasin ?', '',
        [
          ...stores.slice(0, 5).map((s) => ({
            text: s.name ?? s.id.slice(0, 8),
            onPress: () => toggleMgr.mutate({ userId: op.userId, storeId: s.id }),
          })),
          { text: 'Annuler', style: 'cancel' as const },
        ],
      );
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
              {role === 'partner' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmToggle(item)}>
                    <Ionicons
                      name={item.isManager ? 'shield-checkmark' : 'shield-outline'}
                      size={wp(15)}
                      color={item.isManager ? '#34D399' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={[styles.actionText, item.isManager && { color: '#34D399' }]}>
                      {item.isManager ? 'Retirer manager' : 'Promouvoir'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionSep} />

                  <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAssign(item)}>
                    <Ionicons name="add-circle-outline" size={wp(15)} color={colors.orange[400]} />
                    <Text style={[styles.actionText, { color: colors.orange[400] }]}>Assigner</Text>
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

  /* ─── Loading / Error ─── */
  if (opsQ.isLoading) {
    return (
      <View style={styles.bg}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={wp(22)} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon équipe</Text>
            <View style={{ width: wp(40) }} />
          </View>
        </LinearGradient>
        <LoadingSpinner message="Chargement de l'équipe…" />
      </View>
    );
  }

  if (opsQ.isError) {
    return (
      <View style={styles.bg}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={wp(22)} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon équipe</Text>
            <View style={{ width: wp(40) }} />
          </View>
        </LinearGradient>
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger la liste des opérateurs."
          onRetry={() => opsQ.refetch()}
          icon="people-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.bg}>

      {/* ── Dark gradient header ── */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={wp(22)} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Mon équipe</Text>
            {operators.length > 0 && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.countChip}>
                <Text style={styles.countChipText}>{operators.length} opérateur{operators.length > 1 ? 's' : ''}</Text>
              </Animated.View>
            )}
          </View>
          <View style={{ width: wp(40) }} />
        </View>
      </LinearGradient>

      {/* ── List ── */}
      <FlatList
        data={operators}
        keyExtractor={(item) => item.userId}
        renderItem={renderOperator}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (role === 'partner' ? wp(100) : wp(40)) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={opsQ.isFetching}
            onRefresh={() => opsQ.refetch()}
            tintColor={colors.orange[400]}
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

      {/* ── FAB: Ajouter un opérateur ── */}
      {role === 'partner' && (
        <View style={[styles.fabWrap, { bottom: insets.bottom + spacing[5] }]}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => { setCreatedResult(null); setShowCreate(true); }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#FF6A00', '#FF3D00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabGradient}>
              <Ionicons name="person-add-outline" size={wp(20)} color="#FFFFFF" />
              <Text style={styles.fabText}>Ajouter un opérateur</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Assign to store modal ── */}
      <MModal
        visible={!!showAssign}
        onClose={() => setShowAssign(null)}
        title={`Assigner ${showAssign?.firstName ?? ''} à un magasin`}
      >
        <ScrollView style={{ maxHeight: wp(300) }}>
          {(() => {
            const assignedStoreIds = new Set(
              stores
                .filter((s) => s.operators?.some((op) => op.userId === showAssign?.userId))
                .map((s) => s.id),
            );
            const available = stores.filter((s) => !assignedStoreIds.has(s.id));

            if (available.length === 0) {
              return (
                <View style={styles.assignDone}>
                  <Ionicons name="checkmark-circle" size={wp(36)} color="#4ADE80" />
                  <Text style={styles.assignDoneText}>
                    Cet opérateur est déjà assigné à tous les magasins.
                  </Text>
                </View>
              );
            }

            return available.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.storeOption}
                onPress={() => { if (showAssign) assignMut.mutate({ userId: showAssign.userId, storeId: s.id }); }}
              >
                <Ionicons name="storefront-outline" size={wp(18)} color={colors.violet[400]} />
                <Text style={styles.storeOptText} numberOfLines={1}>{s.name ?? s.id.slice(0, 8)}</Text>
                {assignMut.isPending
                  ? <ActivityIndicator size="small" color={colors.orange[400]} />
                  : <Ionicons name="chevron-forward" size={wp(14)} color="rgba(255,255,255,0.25)" />}
              </TouchableOpacity>
            ));
          })()}
        </ScrollView>
      </MModal>

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
/*  Create Operator Modal                                             */
/* ══════════════════════════════════════════════════════════════════ */
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
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const { alert, AlertModal: FormAlertModal } = useAppAlert();

  const resetForm = () => {
    setEmail(''); setFirstName(''); setLastName('');
    setSelectedStoreId(null); setIsManager(false);
  };

  const handleSubmit = () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      alert('Champs requis', 'Veuillez remplir tous les champs.', 'warning');
      return;
    }
    if (!selectedStoreId) {
      alert('Magasin requis', 'Veuillez sélectionner un magasin.', 'warning');
      return;
    }
    onSubmit({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), storeId: selectedStoreId, isManager });
  };

  const handleClose = () => { resetForm(); onClose(); };

  /* ── Success state ── */
  if (result) {
    return (
      <MModal visible={visible} onClose={handleClose} title="Opérateur créé ✓">
        <View style={styles.resultWrap}>
          <View style={styles.resultIconBox}>
            <Ionicons name="checkmark-circle" size={wp(48)} color="#4ADE80" />
          </View>
          <Text style={styles.resultEmail}>{result.email}</Text>
          <View style={styles.resultPasswordBox}>
            <Text style={styles.resultPasswordLabel}>Mot de passe temporaire</Text>
            <Text style={styles.resultPassword}>{result.temporaryPassword}</Text>
          </View>
          <Text style={styles.resultHint}>
            Communiquez ce mot de passe à l'opérateur. Il pourra le changer à sa première connexion.
          </Text>
          <MButton title="Fermer" variant="primary" onPress={handleClose} style={{ marginTop: spacing[4] }} />
        </View>
        <FormAlertModal />
      </MModal>
    );
  }

  /* ── Form ── */
  return (
    <MModal visible={visible} onClose={handleClose} title="Nouvel opérateur">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <MInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />
          <MInput
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            required
            containerStyle={{ marginTop: spacing[3] }}
          />
          <MInput
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            required
            containerStyle={{ marginTop: spacing[3] }}
          />

          {/* Store selector */}
          <Text style={styles.fieldLabel}>Magasin *</Text>
          <View style={styles.storePicker}>
            {stores.map((s) => {
              const sel = s.id === selectedStoreId;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.storeChip, sel && styles.storeChipActive]}
                  onPress={() => setSelectedStoreId(s.id)}
                >
                  <Ionicons name="storefront" size={wp(13)} color={sel ? '#FFFFFF' : colors.violet[400]} />
                  <Text style={[styles.storeChipText, sel && styles.storeChipTextActive]} numberOfLines={1}>
                    {s.name ?? s.id.slice(0, 8)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Manager toggle */}
          <TouchableOpacity style={styles.managerToggle} onPress={() => setIsManager(!isManager)}>
            <View style={[styles.checkbox, isManager && styles.checkboxActive]}>
              {isManager && <Ionicons name="checkmark" size={wp(14)} color="#FFFFFF" />}
            </View>
            <Text style={styles.managerToggleText}>Désigner comme manager</Text>
          </TouchableOpacity>

          <MButton
            title="Créer l'opérateur"
            variant="primary"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing[4] }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <FormAlertModal />
    </MModal>
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
    backgroundColor: 'rgba(255,106,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.25)',
  },
  countChipText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: colors.orange[300] },

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
  fabWrap: { position: 'absolute', left: spacing[4], right: spacing[4] },
  fab: { borderRadius: borderRadius['2xl'], overflow: 'hidden', ...shadows.lg },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  fabText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },

  /* Assign modal items */
  assignDone: { alignItems: 'center', paddingVertical: spacing[6], gap: spacing[3] },
  assignDoneText: { ...textStyles.body, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  storeOptText: { ...textStyles.body, color: 'rgba(255,255,255,0.7)', flex: 1 },

  /* Create modal form */
  fieldLabel: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.45)',
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
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
  managerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    paddingVertical: spacing[2],
  },
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
  managerToggleText: { ...textStyles.body, color: 'rgba(255,255,255,0.7)' },

  /* Result state */
  resultWrap: { alignItems: 'center', paddingVertical: spacing[3] },
  resultIconBox: { marginBottom: spacing[3] },
  resultEmail: { ...textStyles.h4, color: '#FFFFFF', marginBottom: spacing[3] },
  resultPasswordBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing[2],
  },
  resultPasswordLabel: { ...textStyles.caption, color: 'rgba(255,255,255,0.4)', marginBottom: spacing[1] },
  resultPassword: { ...textStyles.h3, fontFamily: fontFamily.bold, color: colors.orange[300], letterSpacing: 3 },
  resultHint: { ...textStyles.caption, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingHorizontal: spacing[2] },
});
