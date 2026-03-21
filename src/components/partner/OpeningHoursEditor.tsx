/**
 * OpeningHoursEditor — Edit opening hours for a store (Manager only).
 * Dark-themed, simplified UI.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
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

function parseTime(time: string): [string, string] {
  const [h, m] = time.split(':');
  return [h ?? '00', m ?? '00'];
}

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
    onSelect(`${selH}:${selM}`);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={pStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={pStyles.container}>
          <Text style={pStyles.title}>Choisir l'heure</Text>

          <View style={pStyles.grid}>
            {/* Hours */}
            <View style={pStyles.col}>
              <Text style={pStyles.colLabel}>Heure</Text>
              <View style={pStyles.pills}>
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[pStyles.pill, selH === hour && pStyles.pillActive]}
                    onPress={() => setSelH(hour)}
                  >
                    <Text style={[pStyles.pillText, selH === hour && pStyles.pillTextActive]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={pStyles.divider} />

            {/* Minutes */}
            <View style={pStyles.col}>
              <Text style={pStyles.colLabel}>Min</Text>
              <View style={pStyles.pills}>
                {MINUTES.map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={[pStyles.pill, selM === min && pStyles.pillActive]}
                    onPress={() => setSelM(min)}
                  >
                    <Text style={[pStyles.pillText, selM === min && pStyles.pillTextActive]}>
                      {min}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={pStyles.preview}>
            <Text style={pStyles.previewTime}>{selH}:{selM}</Text>
          </View>

          <View style={pStyles.actions}>
            <TouchableOpacity onPress={onClose} style={pStyles.cancelBtn}>
              <Text style={pStyles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={pStyles.confirmBtn}>
              <Ionicons name="checkmark" size={wp(14)} color="#FFFFFF" />
              <Text style={pStyles.confirmText}>OK</Text>
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
      {/* Day toggle row */}
      <View style={styles.dayHeader}>
        <Text style={[styles.dayLabel, isOpen && styles.dayLabelActive]}>
          {DAY_LABELS_FR[dayKey]}
        </Text>
        <Switch
          value={isOpen}
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,122,24,0.4)' }}
          thumbColor={isOpen ? '#FF7A18' : 'rgba(255,255,255,0.3)'}
          ios_backgroundColor="rgba(255,255,255,0.1)"
        />
      </View>

      {/* Slots */}
      {isOpen && (
        <View style={styles.slotsWrap}>
          {slots.map(([open, close], idx) => (
            <View key={idx} style={styles.slotRow}>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setPickerTarget({ slotIdx: idx, field: 'open' })}
              >
                <Ionicons name="time-outline" size={wp(13)} color="#FF7A18" />
                <Text style={styles.timeText}>{open}</Text>
              </TouchableOpacity>

              <Text style={styles.timeSep}>→</Text>

              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setPickerTarget({ slotIdx: idx, field: 'close' })}
              >
                <Ionicons name="time-outline" size={wp(13)} color="rgba(255,255,255,0.4)" />
                <Text style={styles.timeText}>{close}</Text>
              </TouchableOpacity>

              <View style={styles.slotActions}>
                {slots.length > 1 && (
                  <TouchableOpacity onPress={() => onRemoveSlot(idx)} style={styles.removeBtn} hitSlop={8}>
                    <Ionicons name="close-circle" size={wp(16)} color="rgba(248,113,113,0.6)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={onAddSlot} style={styles.addSlotBtn}>
            <Ionicons name="add" size={wp(13)} color="rgba(255,255,255,0.3)" />
            <Text style={styles.addSlotText}>Ajouter un créneau</Text>
          </TouchableOpacity>
        </View>
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
          onSelect={(time) => onChangeSlot(pickerTarget.slotIdx, pickerTarget.field, time)}
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
      updateDay(day, current.length > 0 ? [] : [['09:00', '18:00']]);
    },
    [getSlots, updateDay],
  );

  const addSlot = useCallback(
    (day: DayKey) => {
      const current = getSlots(day);
      const lastClose = current.length > 0 ? current[current.length - 1][1] : '09:00';
      const [h] = lastClose.split(':').map(Number);
      const newOpen = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:00`;
      const newClose = `${String(Math.min(h + 3, 23)).padStart(2, '0')}:00`;
      updateDay(day, [...current, [newOpen, newClose]]);
    },
    [getSlots, updateDay],
  );

  const removeSlot = useCallback(
    (day: DayKey, index: number) => {
      updateDay(day, getSlots(day).filter((_, i) => i !== index));
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
    gap: 2,
  },
  dayRow: {
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1],
  },
  dayLabel: {
    fontSize: wp(14),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.3)',
  },
  dayLabelActive: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
  },

  slotsWrap: {
    marginTop: spacing[2],
    gap: spacing[2],
    paddingLeft: spacing[2],
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: wp(72),
  },
  timeText: {
    fontSize: wp(14),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  timeSep: {
    fontSize: wp(12),
    color: 'rgba(255,255,255,0.2)',
  },
  slotActions: {
    flex: 1,
    alignItems: 'flex-end',
  },
  removeBtn: {
    padding: 2,
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
  },
  addSlotText: {
    fontSize: wp(11),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.25)',
  },
});

/* ── Time picker styles ── */
const pStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: spacing[5],
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: wp(15),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  grid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: wp(10),
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'center',
  },
  pill: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    minWidth: wp(36),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pillActive: {
    backgroundColor: '#FF7A18',
    borderColor: '#FF7A18',
  },
  pillText: {
    fontSize: wp(13),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.5)',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: spacing[2],
  },
  preview: {
    alignItems: 'center',
    marginVertical: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,122,24,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,122,24,0.15)',
  },
  previewTime: {
    fontSize: wp(28),
    fontFamily: fontFamily.bold,
    color: '#FF7A18',
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cancelText: {
    fontSize: wp(14),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.4)',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FF7A18',
  },
  confirmText: {
    fontSize: wp(14),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
});
