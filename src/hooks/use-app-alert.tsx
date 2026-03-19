/**
 * Maya Connect V2 — useAppAlert
 *
 * Drop-in replacement for Alert.alert that renders a styled MModal instead of
 * the native dialog. Supports both simple alerts (Fermer) and confirmations
 * (Annuler / Confirmer with callback).
 *
 * Usage:
 *   const { alert, confirm, AlertModal } = useAppAlert();
 *
 *   alert('Erreur', 'Quelque chose a échoué.');
 *   confirm('Supprimer', 'Voulez-vous vraiment supprimer ?', () => doDelete());
 *
 *   // Render <AlertModal /> at the bottom of your JSX tree.
 */
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MModal } from '../components/ui';
import { MButton } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { wp } from '../utils/responsive';

type AlertIcon = 'error' | 'success' | 'warning' | 'info';

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  icon: AlertIcon;
  isConfirm: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const initialState: ModalState = {
  visible: false,
  title: '',
  message: '',
  icon: 'error',
  isConfirm: false,
};

const iconMap: Record<AlertIcon, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  error: { name: 'close-circle', color: colors.error[500] },
  success: { name: 'checkmark-circle', color: colors.success[500] },
  warning: { name: 'warning', color: colors.warning[500] },
  info: { name: 'information-circle', color: colors.info[500] },
};

export function useAppAlert() {
  const [state, setState] = useState<ModalState>(initialState);
  const callbackRef = useRef<(() => void) | undefined>(undefined);

  const close = useCallback(() => {
    setState(initialState);
    callbackRef.current = undefined;
  }, []);

  const alert = useCallback(
    (title: string, message: string, icon: AlertIcon = 'error') => {
      setState({ visible: true, title, message, icon, isConfirm: false });
    },
    [],
  );

  const confirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      opts?: { icon?: AlertIcon; confirmLabel?: string; cancelLabel?: string },
    ) => {
      callbackRef.current = onConfirm;
      setState({
        visible: true,
        title,
        message,
        icon: opts?.icon ?? 'warning',
        isConfirm: true,
        confirmLabel: opts?.confirmLabel,
        cancelLabel: opts?.cancelLabel,
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    const cb = callbackRef.current;
    close();
    cb?.();
  }, [close]);

  const AlertModal = useMemo(
    () =>
      function AlertModalComponent() {
        if (!state.visible) return null;
        const iconCfg = iconMap[state.icon];
        return (
          <MModal visible={state.visible} onClose={close} title={state.title}>
            <View style={styles.content}>
              <Ionicons
                name={iconCfg.name as any}
                size={wp(44)}
                color={iconCfg.color}
                style={styles.icon}
              />
              <Text style={styles.message}>{state.message}</Text>
              {state.isConfirm ? (
                <View style={styles.row}>
                  <MButton
                    title={state.cancelLabel ?? 'Annuler'}
                    variant="outline"
                    onPress={close}
                    style={styles.btn}
                  />
                  <MButton
                    title={state.confirmLabel ?? 'Confirmer'}
                    variant="primary"
                    onPress={handleConfirm}
                    style={styles.btn}
                  />
                </View>
              ) : (
                <MButton title="Fermer" variant="primary" onPress={close} />
              )}
            </View>
          </MModal>
        );
      },
    [state, close, handleConfirm],
  );

  return { alert, confirm, AlertModal } as const;
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  icon: {
    marginBottom: spacing[3],
  },
  message: {
    ...textStyles.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[5],
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  btn: {
    flex: 1,
  },
});
