/**
 * Maya Connect V2 — Partner Team Management Screen
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
} from 'react-native';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MCard,
  MBadge,
  MButton,
  MAvatar,
  MHeader,
  MModal,
  MInput,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '../../src/components/ui';
import type {
  StoreOperatorLiteDto,
  StoreDto,
  CreateStoreOperatorDto,
  CreateStoreOperatorResultDto,
} from '../../src/types';
import { useAppAlert } from '../../src/hooks/use-app-alert';

/* ================================================================== */
/*  Screen                                                             */
/* ================================================================== */

export default function PartnerTeamScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const partner = usePartnerStore((s) => s.partner);
  const stores = usePartnerStore((s) => s.stores);
  const partnerId = partner?.id;

  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<StoreOperatorLiteDto | null>(null);
  const [createdResult, setCreatedResult] = useState<CreateStoreOperatorResultDto | null>(null);
  const { alert, confirm, AlertModal } = useAppAlert();

  /* ---- Fetch operators ---- */
  const opsQ = useQuery({
    queryKey: ['partnerOperators', partnerId],
    queryFn: () => storeOperatorsApi.getOperatorsByPartner(partnerId!),
    enabled: !!partnerId,
    select: (res) => res.data,
  });

  const operators: StoreOperatorLiteDto[] = opsQ.data ?? [];

  /* ---- Toggle manager mutation ---- */
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

  /* ---- Remove mutation ---- */
  const removeMut = useMutation({
    mutationFn: (vars: { userId: string; storeId: string }) =>
      storeOperatorsApi.removeOperator(vars),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['partnerOperators'] });
    },
    onError: (err: any) =>
      alert('Erreur', err?.response?.data?.message ?? 'Impossible de retirer l\'opérateur.'),
  });

  /* ---- Assign mutation ---- */
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
      alert('Erreur', err?.response?.data?.message ?? 'Impossible d\'assigner l\'opérateur.'),
  });

  /* ---- Create mutation ---- */
  const createMut = useMutation({
    mutationFn: (dto: CreateStoreOperatorDto) =>
      storeOperatorsApi.createOperator(dto),
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreatedResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['partnerOperators'] });
    },
    onError: (err: any) =>
      alert('Erreur', err?.response?.data?.message ?? 'Impossible de créer l\'opérateur.'),
  });

  /* ---- Handlers ---- */
  const confirmRemove = (op: StoreOperatorLiteDto) => {
    // For now, we pick the first store — the by-partner endpoint doesn't return storeId per operator
    // We need to prompt the user which store. For simplicity, pick the first store.
    if (stores.length === 1) {
      confirm(
        'Retirer l\'opérateur',
        `Voulez-vous retirer ${op.firstName ?? ''} ${op.lastName ?? ''} du magasin ?`,
        () => removeMut.mutate({ userId: op.userId, storeId: stores[0].id }),
      );
    } else {
      // Show store picker for removal
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
        'Toggle manager — quel magasin ?',
        '',
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

  /* ---- Render operator card ---- */
  const renderOperator = useCallback(
    ({ item }: { item: StoreOperatorLiteDto }) => {
      const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email || 'Opérateur';
      return (
        <MCard style={styles.opCard} elevation="sm">
          <View style={styles.opRow}>
            <MAvatar name={fullName} uri={item.avatarUrl} size="md" />
            <View style={styles.opInfo}>
              <Text style={styles.opName} numberOfLines={1}>
                {fullName}
              </Text>
              {item.email ? (
                <Text style={styles.opEmail} numberOfLines={1}>
                  {item.email}
                </Text>
              ) : null}
              <View style={styles.badgeRow}>
                {item.isManager && (
                  <MBadge label="Manager" variant="violet" size="sm" />
                )}
              </View>
            </View>
          </View>

          {/* Action buttons (Partner role only) */}
          {role === 'partner' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => confirmToggle(item)}
              >
                <Ionicons
                  name={item.isManager ? 'shield-checkmark' : 'shield-outline'}
                  size={wp(18)}
                  color={colors.violet[600]}
                />
                <Text style={styles.actionText}>
                  {item.isManager ? 'Retirer manager' : 'Promouvoir'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowAssign(item)}
              >
                <Ionicons name="add-circle-outline" size={wp(18)} color={colors.success[600]} />
                <Text style={[styles.actionText, { color: colors.success[600] }]}>
                  Assigner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => confirmRemove(item)}
              >
                <Ionicons name="trash-outline" size={wp(18)} color={colors.error[500]} />
                <Text style={[styles.actionText, { color: colors.error[500] }]}>
                  Retirer
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </MCard>
      );
    },
    [role, stores, toggleMgr, removeMut],
  );

  /* ---- Loading / Error states ---- */
  if (opsQ.isLoading) {
    return <LoadingSpinner message="Chargement de l'équipe…" />;
  }

  if (opsQ.isError) {
    return (
      <View style={styles.container}>
        <MHeader title="Mon équipe" showBack onBack={() => router.back()} />
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
    <View style={styles.container}>
      <MHeader title="Mon équipe" showBack onBack={() => router.back()} />

      {/* Create button (Partner only) */}
      {role === 'partner' && (
        <View style={styles.createRow}>
          <MButton
            title="Ajouter un opérateur"
            variant="primary"
            size="md"
            icon={<Ionicons name="person-add-outline" size={wp(18)} color="#FFFFFF" />}
            onPress={() => {
              setCreatedResult(null);
              setShowCreate(true);
            }}
          />
        </View>
      )}

      <FlatList
        data={operators}
        keyExtractor={(item) => item.userId}
        renderItem={renderOperator}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={opsQ.isFetching}
            onRefresh={() => opsQ.refetch()}
            tintColor={colors.violet[500]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Aucun opérateur"
            description="Ajoutez votre premier opérateur pour qu'il puisse scanner les clients."
          />
        }
      />

      {/* ── Assign to store modal ── */}
      <MModal
        visible={!!showAssign}
        onClose={() => setShowAssign(null)}
        title={`Assigner ${showAssign?.firstName ?? ''} à un magasin`}
      >
        <ScrollView style={{ maxHeight: wp(300) }}>
          {(() => {
            // Filter out stores the operator is already assigned to
            const assignedStoreIds = new Set(
              stores
                .filter((s) =>
                  s.operators?.some((op) => op.userId === showAssign?.userId),
                )
                .map((s) => s.id),
            );
            const availableStores = stores.filter(
              (s) => !assignedStoreIds.has(s.id),
            );

            if (availableStores.length === 0) {
              return (
                <View style={{ alignItems: 'center', paddingVertical: spacing[6] }}>
                  <Ionicons name="checkmark-circle" size={wp(40)} color={colors.success[500]} />
                  <Text style={[textStyles.body, { textAlign: 'center', marginTop: spacing[3], color: colors.neutral[600] }]}>
                    Cet opérateur est déjà assigné à tous les magasins.
                  </Text>
                </View>
              );
            }

            return availableStores.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.storeOption}
                onPress={() => {
                  if (!showAssign) return;
                  assignMut.mutate({ userId: showAssign.userId, storeId: s.id });
                }}
              >
                <Ionicons name="storefront-outline" size={wp(20)} color={colors.violet[500]} />
                <Text style={styles.storeOptText} numberOfLines={1}>
                  {s.name ?? s.id.slice(0, 8)}
                </Text>
                <Ionicons name="chevron-forward" size={wp(16)} color={colors.neutral[300]} />
              </TouchableOpacity>
            ));
          })()}
          {assignMut.isPending && <LoadingSpinner message="Assignation…" />}
        </ScrollView>
      </MModal>

      {/* ── Create SO modal ── */}
      <CreateOperatorModal
        visible={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreatedResult(null);
        }}
        stores={stores}
        onSubmit={(dto) => createMut.mutate(dto)}
        loading={createMut.isPending}
        result={createdResult}
      />

      <AlertModal />
    </View>
  );
}

/* ================================================================== */
/*  Create Operator Modal                                              */
/* ================================================================== */

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
    setEmail('');
    setFirstName('');
    setLastName('');
    setSelectedStoreId(null);
    setIsManager(false);
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
    onSubmit({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      storeId: selectedStoreId,
      isManager,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // If we have a result, show the success state
  if (result) {
    return (
      <MModal visible={visible} onClose={handleClose} title="Opérateur créé ✓">
        <View style={styles.resultContainer}>
          <View style={styles.resultIconBox}>
            <Ionicons name="checkmark-circle" size={wp(48)} color={colors.success[500]} />
          </View>
          <Text style={styles.resultTitle}>
            {result.email}
          </Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Mot de passe temporaire :</Text>
            <Text style={styles.resultPassword}>{result.temporaryPassword}</Text>
          </View>
          <Text style={styles.resultHint}>
            Communiquez ce mot de passe à l'opérateur. Il pourra le changer à sa première connexion.
          </Text>
          <MButton
            title="Fermer"
            variant="primary"
            onPress={handleClose}
            style={{ marginTop: spacing[4] }}
          />
        </View>
        <FormAlertModal />
      </MModal>
    );
  }

  return (
    <MModal visible={visible} onClose={handleClose} title="Nouvel opérateur">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
              const isSel = s.id === selectedStoreId;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.storeChip, isSel && styles.storeChipActive]}
                  onPress={() => setSelectedStoreId(s.id)}
                >
                  <Ionicons
                    name="storefront"
                    size={wp(14)}
                    color={isSel ? '#FFFFFF' : colors.violet[500]}
                  />
                  <Text
                    style={[styles.storeChipText, isSel && styles.storeChipTextActive]}
                    numberOfLines={1}
                  >
                    {s.name ?? s.id.slice(0, 8)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Manager toggle */}
          <TouchableOpacity
            style={styles.managerToggle}
            onPress={() => setIsManager(!isManager)}
          >
            <Ionicons
              name={isManager ? 'checkbox' : 'square-outline'}
              size={wp(22)}
              color={colors.violet[600]}
            />
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

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  createRow: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: wp(100),
  },
  opCard: {
    marginBottom: spacing[3],
    backgroundColor: '#111827',
  },
  opRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  opName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  opEmail: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
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
    backgroundColor: colors.neutral[50],
  },
  actionText: {
    ...textStyles.micro,
    fontFamily: fontFamily.medium,
    color: colors.violet[600],
  },
  /* Store option inside assign modal */
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  storeOptText: {
    ...textStyles.body,
    color: colors.neutral[800],
    flex: 1,
  },
  /* Create modal form */
  fieldLabel: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[700],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  storePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.violet[300],
    backgroundColor: colors.violet[50],
  },
  storeChipActive: {
    backgroundColor: colors.violet[600],
    borderColor: colors.violet[600],
  },
  storeChipText: {
    ...textStyles.caption,
    fontFamily: fontFamily.medium,
    color: colors.violet[600],
  },
  storeChipTextActive: {
    color: '#FFFFFF',
  },
  managerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingVertical: spacing[2],
  },
  managerToggleText: {
    ...textStyles.body,
    color: colors.neutral[700],
  },
  /* Result state */
  resultContainer: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  resultIconBox: {
    marginBottom: spacing[3],
  },
  resultTitle: {
    ...textStyles.h4,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  resultRow: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  resultLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  resultPassword: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: colors.violet[600],
    letterSpacing: 2,
  },
  resultHint: {
    ...textStyles.caption,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
});
