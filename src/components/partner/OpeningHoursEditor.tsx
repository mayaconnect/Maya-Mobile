/**
 * OpeningHoursEditor — Edit opening hours for a store (Manager only).
 *
 * Multi-slot schema:
 *   { "tz": "Europe/Paris", "mon": [["12:00","14:30"],["19:00","23:00"]], ... }
 *
 * Features:
 *  • Toggle days open/closed
 *  • Add/remove time slots per day
 *  • Time picker for each slot boundary
 *  • Timezone display
 *
 * Usage:
 *   <OpeningHoursEditor
 *     value={storeOpeningHours}
 *     onChange={(hours) => updateStore(hours)}
 *     loading={isSaving}
 *   />
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { operatorColors as colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MCard, MButton } from '../ui';
import type { StoreOpeningHours, DayKey, TimeSlot } from '../../types';
import { DAY_KEYS, DAY_LABELS_FR } from '../../types';

/* ────────────────────────────────────────────────────────────── */
/*  Props                                                         */
/* ────────────────────────────────────────────────────────────── */
interface OpeningHoursEditorProps {
  value: StoreOpeningHours;
  onChange: (hours: StoreOpeningHours) => void;
  loading?: boolean;
}

/* ────────────────────────────────────────────────────────────── */
/*  Time Picker                                                    */
/* ────────────────────────────────────────────────────────────── */
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function formatTime(h: string, m: string) {
  return `${h}:${m}`;
}

function parseTime(time: string): [string, string] {
  const [h, m] = time.split(':');
  return [h ?? '00', m ?? '00'];
}

/** Inline time picker: scrollable hours + minutes columns */
function TimePicker({
  value,
  onSelect,
  visible,
  onClose,
}: {
  value: string;
  onSelect: (time: string) => void;
  visible: boolean;
  onClose: () => void;
}) {
  const [h, m] = parseTime(value);
  const [selH, setSelH] = useState(h);
  const [selM, setSelM] = useState(m);

  const handleConfirm = () => {
    onSelect(formatTime(selH, selM));
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={pickerStyles.container}>
          <Text style={pickerStyles.title}>Sélectionner l'heure</Text>

          <View style={pickerStyles.columns}>
            {/* Hours */}
            <ScrollView style={pickerStyles.column} showsVerticalScrollIndicator={false}>
              {HOURS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[pickerStyles.cell, selH === hour && pickerStyles.cellActive]}
                  onPress={() => setSelH(hour)}
                >
                  <Text style={[pickerStyles.cellText, selH === hour && pickerStyles.cellTextActive]}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={pickerStyles.separator}>:</Text>

            {/* Minutes */}
            <ScrollView style={pickerStyles.column} showsVerticalScrollIndicator={false}>
              {MINUTES.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[pickerStyles.cell, selM === min && pickerStyles.cellActive]}
                  onPress={() => setSelM(min)}
                >
                  <Text style={[pickerStyles.cellText, selM === min && pickerStyles.cellTextActive]}>
                    {min}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={pickerStyles.actions}>
            <TouchableOpacity onPress={onClose} style={pickerStyles.cancelBtn}>
              <Text style={pickerStyles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={pickerStyles.confirmBtn}>
              <Text style={pickerStyles.confirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Day Row                                                        */
/* ────────────────────────────────────────────────────────────── */
function DayRow({
  dayKey,
  slots,
  onToggle,
  onAddSlot,
  onRemoveSlot,
  onChangeSlot,
}: {
  dayKey: DayKey;
  slots: TimeSlot[];
  onToggle: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onChangeSlot: (index: number, field: 'open' | 'close', value: string) => void;
}) {
  const isOpen = slots.length > 0;
  const [pickerTarget, setPickerTarget] = useState<{
    slotIdx: number;
    field: 'open' | 'close';
  } | null>(null);

  return (
    <View style={styles.dayRow}>
      {/* Day header */}
      <View style={styles.dayHeader}>
        <TouchableOpacity style={styles.dayToggle} onPress={onToggle}>
          <View style={[styles.toggleDot, isOpen && styles.toggleDotActive]} />
          <Text style={[styles.dayLabel, isOpen && styles.dayLabelActive]}>
            {DAY_LABELS_FR[dayKey]}
          </Text>
        </TouchableOpacity>

        {isOpen && (
          <TouchableOpacity onPress={onAddSlot} style={styles.addSlotBtn}>
            <Ionicons name="add-circle-outline" size={wp(18)} color={colors.violet[500]} />
            <Text style={styles.addSlotText}>Créneau</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Time slots */}
      {isOpen ? (
        slots.map(([open, close], idx) => (
          <View key={idx} style={styles.slotRow}>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setPickerTarget({ slotIdx: idx, field: 'open' })}
            >
              <Text style={styles.timeText}>{open}</Text>
            </TouchableOpacity>

            <Text style={styles.timeSep}>—</Text>

            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setPickerTarget({ slotIdx: idx, field: 'close' })}
            >
              <Text style={styles.timeText}>{close}</Text>
            </TouchableOpacity>

            {slots.length > 1 && (
              <TouchableOpacity
                onPress={() => onRemoveSlot(idx)}
                style={styles.removeSlotBtn}
              >
                <Ionicons name="close-circle" size={wp(18)} color={colors.error[400]} />
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.closedLabel}>Fermé</Text>
      )}

      {/* Time picker modal */}
      {pickerTarget && (
        <TimePicker
          visible
          value={
            pickerTarget.field === 'open'
              ? slots[pickerTarget.slotIdx][0]
              : slots[pickerTarget.slotIdx][1]
          }
          onSelect={(time) => {
            onChangeSlot(pickerTarget.slotIdx, pickerTarget.field, time);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Main Component                                                 */
/* ────────────────────────────────────────────────────────────── */
export default function OpeningHoursEditor({
  value,
  onChange,
  loading = false,
}: OpeningHoursEditorProps) {
  const getSlots = useCallback(
    (day: DayKey): TimeSlot[] => value[day] ?? [],
    [value],
  );

  const updateDay = useCallback(
    (day: DayKey, slots: TimeSlot[]) => {
      onChange({ ...value, [day]: slots.length > 0 ? slots : undefined });
    },
    [value, onChange],
  );

  const toggleDay = useCallback(
    (day: DayKey) => {
      const current = getSlots(day);
      if (current.length > 0) {
        updateDay(day, []);
      } else {
        // Default: single slot 09:00–18:00
        updateDay(day, [['09:00', '18:00']]);
      }
    },
    [getSlots, updateDay],
  );

  const addSlot = useCallback(
    (day: DayKey) => {
      const current = getSlots(day);
      const lastClose = current.length > 0 ? current[current.length - 1][1] : '09:00';
      // Default new slot: 1 hour after last close
      const [h] = lastClose.split(':').map(Number);
      const newOpen = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:00`;
      const newClose = `${String(Math.min(h + 3, 23)).padStart(2, '0')}:00`;
      updateDay(day, [...current, [newOpen, newClose]]);
    },
    [getSlots, updateDay],
  );

  const removeSlot = useCallback(
    (day: DayKey, index: number) => {
      const current = getSlots(day);
      updateDay(day, current.filter((_, i) => i !== index));
    },
    [getSlots, updateDay],
  );

  const changeSlot = useCallback(
    (day: DayKey, index: number, field: 'open' | 'close', time: string) => {
      const current = [...getSlots(day)];
      const slot = [...current[index]] as TimeSlot;
      slot[field === 'open' ? 0 : 1] = time;
      current[index] = slot;
      updateDay(day, current);
    },
    [getSlots, updateDay],
  );

  return (
    <View style={styles.container}>
      {/* Timezone badge */}
      <View style={styles.tzRow}>
        <Ionicons name="globe-outline" size={wp(14)} color={colors.neutral[400]} />
        <Text style={styles.tzLabel}>{value.tz ?? 'Europe/Paris'}</Text>
      </View>

      {/* Days */}
      {DAY_KEYS.map((day) => (
        <DayRow
          key={day}
          dayKey={day}
          slots={getSlots(day)}
          onToggle={() => toggleDay(day)}
          onAddSlot={() => addSlot(day)}
          onRemoveSlot={(idx) => removeSlot(day, idx)}
          onChangeSlot={(idx, field, time) => changeSlot(day, idx, field, time)}
        />
      ))}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Styles                                                         */
/* ────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
  },
  tzRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  tzLabel: {
    ...textStyles.caption,
    color: colors.neutral[400],
    fontFamily: fontFamily.medium,
  },

  /* Day row */
  dayRow: {
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  toggleDot: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.neutral[200],
  },
  toggleDotActive: {
    backgroundColor: colors.success[500],
  },
  dayLabel: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[400],
  },
  dayLabelActive: {
    color: colors.neutral[700],
  },
  closedLabel: {
    ...textStyles.caption,
    color: colors.neutral[300],
    marginLeft: wp(22),
    marginTop: spacing[1],
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSlotText: {
    ...textStyles.caption,
    color: colors.violet[500],
    fontFamily: fontFamily.medium,
  },

  /* Slot row */
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(22),
    marginTop: spacing[1],
    gap: spacing[2],
  },
  timeBtn: {
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minWidth: wp(70),
    alignItems: 'center',
  },
  timeText: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[700],
  },
  timeSep: {
    ...textStyles.body,
    color: colors.neutral[300],
  },
  removeSlotBtn: {
    padding: 2,
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    width: wp(280),
    maxHeight: wp(400),
  },
  title: {
    ...textStyles.subtitle,
    fontFamily: fontFamily.bold,
    color: colors.neutral[700],
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: wp(160),
    gap: spacing[2],
  },
  column: {
    width: wp(60),
    maxHeight: wp(160),
  },
  separator: {
    ...textStyles.h3,
    color: colors.neutral[400],
  },
  cell: {
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  cellActive: {
    backgroundColor: colors.violet[500],
  },
  cellText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[600],
  },
  cellTextActive: {
    color: '#FFF',
    fontFamily: fontFamily.bold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    gap: spacing[3],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
  },
  cancelText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[500],
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[500],
  },
  confirmText: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: '#FFF',
  },
});
