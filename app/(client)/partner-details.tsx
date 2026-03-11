/**
 * Maya Connect V2 — Partner Details Screen (Client)
 *
 * Premium store detail page with:
 *  • Full-bleed hero image with gradient overlay
 *  • Opening hours card with live "Open / Closed" badge
 *  • Full address + "S'y rendre" button (map link)
 *  • Contact row (phone, email)
 *  • Offers section
 *  • Stats row
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storesApi } from '../../src/api/stores.api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MHeader,
  MCard,
  MBadge,
  MButton,
  MAvatar,
  LoadingSpinner,
  EmptyState,
} from '../../src/components/ui';
import type { StoreDto } from '../../src/types';
import {
  parseOpeningHours,
  isStoreOpenNow,
  DAY_KEYS,
  DAY_LABELS_FR,
} from '../../src/types';
import type { StoreOpeningHours, DayKey } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = wp(280);
const DEFAULT_IMAGE = require('../../assets/images/centered_logo_gradient.png');

/* ── Day labels / order now imported from types ── */

/** Get the best image source for the store */
function getImageSource(store: StoreDto) {
  if (store.imageUrl) return { uri: store.imageUrl };
  if (store.partnerImageUrl) return { uri: store.partnerImageUrl };
  return DEFAULT_IMAGE;
}

/** Build a Google Maps / Apple Maps directions URL */
function getDirectionsUrl(store: StoreDto): string | null {
  if (store.latitude && store.longitude) {
    return Platform.select({
      ios: `maps://app?daddr=${store.latitude},${store.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`,
    })!;
  }
  const q = [store.address, store.city, store.country].filter(Boolean).join(', ');
  if (!q) return null;
  return Platform.select({
    ios: `maps://app?daddr=${encodeURIComponent(q)}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`,
  })!;
}

export default function PartnerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const detailsQ = useQuery({
    queryKey: ['storeDetails', id],
    queryFn: () => storesApi.getById(id!),
    enabled: !!id,
    select: (res) => res.data,
  });

  const store = detailsQ.data;

  const openingHours = useMemo(
    () => parseOpeningHours(store?.openingJson),
    [store?.openingJson],
  );
  const isOpen = useMemo(() => isStoreOpenNow(openingHours), [openingHours]);

  if (detailsQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement du partenaire…" />;
  }

  if (!store) {
    return (
      <EmptyState
        icon="business-outline"
        title="Partenaire introuvable"
        description="Ce partenaire n'existe pas ou a été supprimé."
        actionLabel="Retour"
        onAction={() => router.back()}
      />
    );
  }

  const offers = (store as any).offers ?? [];
  const directionsUrl = getDirectionsUrl(store);
  const fullAddress = [store.address, store.city, store.country]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: wp(40) }}
        bounces={false}
      >
        {/* ── Hero image with gradient overlay ── */}
        <View style={styles.heroWrap}>
          <Image source={getImageSource(store)} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + spacing[2] }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={wp(22)} color="#FFF" />
          </TouchableOpacity>
          {/* Hero text */}
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroName}>
              {store.name ?? store.partnerName ?? 'Partenaire'}
            </Text>
            {store.category && (
              <View style={styles.heroCategoryWrap}>
                <Ionicons name="pricetag-outline" size={wp(14)} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroCategory}>{store.category}</Text>
              </View>
            )}
            <View style={styles.heroBadges}>
              {openingHours && (
                <View style={[styles.openBadge, isOpen ? styles.openBadgeOpen : styles.openBadgeClosed]}>
                  <View style={[styles.openDot, isOpen ? styles.openDotOpen : styles.openDotClosed]} />
                  <Text style={[styles.openBadgeText, isOpen ? styles.openTextOpen : styles.openTextClosed]}>
                    {isOpen ? 'Ouvert' : 'Fermé'}
                  </Text>
                </View>
              )}
              {store.avgDiscountPercent > 0 && (
                <MBadge
                  label={`-${Math.round(store.avgDiscountPercent)}%`}
                  variant="orange"
                  size="sm"
                />
              )}
            </View>
          </View>
        </View>

        {/* ── Content body ── */}
        <View style={styles.body}>

          {/* Quick actions bar */}
          <View style={styles.actionsRow}>
            {directionsUrl && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(directionsUrl)}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.orange[50] }]}>
                  <Ionicons name="navigate" size={wp(20)} color={colors.orange[500]} />
                </View>
                <Text style={styles.actionLabel}>S'y rendre</Text>
              </TouchableOpacity>
            )}
            {store.phone && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`tel:${store.phone}`)}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.success[50] }]}>
                  <Ionicons name="call" size={wp(20)} color={colors.success[500]} />
                </View>
                <Text style={styles.actionLabel}>Appeler</Text>
              </TouchableOpacity>
            )}
            {store.email && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`mailto:${store.email}`)}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.info[50] }]}>
                  <Ionicons name="mail" size={wp(20)} color={colors.info[500]} />
                </View>
                <Text style={styles.actionLabel}>Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtn}>
              <View style={[styles.actionIcon, { backgroundColor: colors.violet[50] }]}>
                <Ionicons name="share-social" size={wp(20)} color={colors.violet[500]} />
              </View>
              <Text style={styles.actionLabel}>Partager</Text>
            </TouchableOpacity>
          </View>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{store.subscribersCount ?? 0}</Text>
              <Text style={styles.statLabel}>Abonnés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{offers.length}</Text>
              <Text style={styles.statLabel}>Offres</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {store.avgDiscountPercent > 0 ? `${Math.round(store.avgDiscountPercent)}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>Réduction moy.</Text>
            </View>
          </View>

          {/* ── Address card ── */}
          {fullAddress ? (
            <MCard style={styles.section} elevation="sm">
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={wp(18)} color={colors.orange[500]} />
                <Text style={styles.sectionTitle}>Adresse</Text>
              </View>
              <Text style={styles.addressText}>{fullAddress}</Text>
              {directionsUrl && (
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={() => Linking.openURL(directionsUrl)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[...colors.gradients.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.directionsBtnGradient}
                  >
                    <Ionicons name="navigate" size={wp(16)} color="#FFF" />
                    <Text style={styles.directionsBtnText}>S'y rendre</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </MCard>
          ) : null}

          {/* ── Opening hours ── */}
          {openingHours && (
            <MCard style={styles.section} elevation="sm">
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={wp(18)} color={colors.orange[500]} />
                <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
                <View style={[styles.openBadgeSm, isOpen ? styles.openBadgeOpen : styles.openBadgeClosed]}>
                  <Text style={[styles.openBadgeSmText, isOpen ? styles.openTextOpen : styles.openTextClosed]}>
                    {isOpen ? 'Ouvert' : 'Fermé'}
                  </Text>
                </View>
              </View>
              {DAY_KEYS.map((dayKey) => {
                const label = DAY_LABELS_FR[dayKey];
                const slots = openingHours[dayKey];
                const now = new Date();
                const dayIdx = now.getDay();
                const todayKey = DAY_KEYS[dayIdx === 0 ? 6 : dayIdx - 1];
                const isToday = dayKey === todayKey;
                return (
                  <View
                    key={dayKey}
                    style={[styles.hoursRow, isToday && styles.hoursRowToday]}
                  >
                    <Text style={[styles.hoursDay, isToday && styles.hoursDayToday]}>
                      {label}
                    </Text>
                    {slots && slots.length > 0 ? (
                      <View style={{ alignItems: 'flex-end' }}>
                        {slots.map(([open, close], idx) => (
                          <Text
                            key={idx}
                            style={[styles.hoursTime, isToday && styles.hoursTimeToday]}
                          >
                            {open} — {close}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.hoursClosed}>Fermé</Text>
                    )}
                  </View>
                );
              })}
            </MCard>
          )}

          {/* ── About / description ── */}
          {(store as any).description ? (
            <MCard style={styles.section} elevation="sm">
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={wp(18)} color={colors.orange[500]} />
                <Text style={styles.sectionTitle}>À propos</Text>
              </View>
              <Text style={styles.descText}>{(store as any).description}</Text>
            </MCard>
          ) : null}

          {/* ── Offers ── */}
          {offers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderStandalone}>
                <Ionicons name="pricetags" size={wp(18)} color={colors.violet[500]} />
                <Text style={styles.sectionTitle}>Offres disponibles</Text>
              </View>
              {offers.map((offer: any) => (
                <MCard key={offer.id} style={styles.offerCard} elevation="sm">
                  <View style={styles.offerRow}>
                    <LinearGradient
                      colors={[...colors.gradients.sunset]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.offerIconBox}
                    >
                      <Ionicons name="pricetag" size={wp(18)} color="#FFF" />
                    </LinearGradient>
                    <View style={styles.offerInfo}>
                      <Text style={styles.offerTitle}>
                        {offer.title ?? offer.name ?? 'Offre spéciale'}
                      </Text>
                      {offer.description && (
                        <Text style={styles.offerDesc} numberOfLines={2}>
                          {offer.description}
                        </Text>
                      )}
                    </View>
                    {offer.percent != null && (
                      <View style={styles.offerPercentBadge}>
                        <Text style={styles.offerPercentText}>
                          -{offer.percent}%
                        </Text>
                      </View>
                    )}
                  </View>
                </MCard>
              ))}
            </View>
          )}

          {/* ── Contact info ── */}
          {(store.phone || store.email) && (
            <MCard style={styles.section} elevation="sm">
              <View style={styles.sectionHeader}>
                <Ionicons name="call" size={wp(18)} color={colors.orange[500]} />
                <Text style={styles.sectionTitle}>Contact</Text>
              </View>
              {store.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`tel:${store.phone}`)}
                >
                  <Ionicons name="call-outline" size={wp(18)} color={colors.neutral[500]} />
                  <Text style={styles.contactText}>{store.phone}</Text>
                  <Ionicons name="chevron-forward" size={wp(16)} color={colors.neutral[300]} />
                </TouchableOpacity>
              )}
              {store.email && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`mailto:${store.email}`)}
                >
                  <Ionicons name="mail-outline" size={wp(18)} color={colors.neutral[500]} />
                  <Text style={styles.contactText}>{store.email}</Text>
                  <Ionicons name="chevron-forward" size={wp(16)} color={colors.neutral[300]} />
                </TouchableOpacity>
              )}
            </MCard>
          )}

          {/* ── Partner info ── */}
          {store.partnerName && (
            <MCard style={styles.section} elevation="sm">
              <View style={styles.sectionHeader}>
                <Ionicons name="business" size={wp(18)} color={colors.orange[500]} />
                <Text style={styles.sectionTitle}>Enseigne</Text>
              </View>
              <View style={styles.partnerRow}>
                <MAvatar
                  name={store.partnerName}
                  size="md"
                  uri={store.partnerImageUrl}
                />
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{store.partnerName}</Text>
                  {store.category && (
                    <Text style={styles.partnerCategory}>{store.category}</Text>
                  )}
                </View>
              </View>
            </MCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  /* Hero */
  heroWrap: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    resizeMode: 'cover',
    backgroundColor: colors.neutral[200],
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    left: spacing[4],
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
  },
  heroName: {
    ...textStyles.h1,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroCategoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  heroCategory: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  openBadgeOpen: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  openBadgeClosed: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  openDot: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },
  openDotOpen: {
    backgroundColor: colors.success[500],
  },
  openDotClosed: {
    backgroundColor: colors.error[500],
  },
  openBadgeText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
  },
  openTextOpen: {
    color: colors.success[500],
  },
  openTextClosed: {
    color: colors.error[500],
  },

  /* Body */
  body: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },

  /* Quick actions */
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[5],
    paddingHorizontal: spacing[2],
  },
  actionBtn: {
    alignItems: 'center',
    gap: spacing[1],
  },
  actionIcon: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(26),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionLabel: {
    ...textStyles.micro,
    color: colors.neutral[700],
    fontFamily: fontFamily.medium,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h3,
    color: colors.orange[500],
  },
  statLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: wp(30),
    backgroundColor: colors.neutral[200],
  },

  /* Sections */
  section: {
    marginBottom: spacing[4],
    backgroundColor: '#1E293B',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionHeaderStandalone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.neutral[900],
    flex: 1,
  },

  /* Address */
  addressText: {
    ...textStyles.body,
    color: colors.neutral[600],
    lineHeight: wp(22),
    marginBottom: spacing[3],
  },
  directionsBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  directionsBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  directionsBtnText: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },

  /* Opening hours */
  openBadgeSm: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  openBadgeSmText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.md,
  },
  hoursRowToday: {
    backgroundColor: colors.orange[50],
  },
  hoursDay: {
    ...textStyles.body,
    color: colors.neutral[700],
    width: wp(90),
  },
  hoursDayToday: {
    fontFamily: fontFamily.semiBold,
    color: colors.orange[600],
  },
  hoursTime: {
    ...textStyles.body,
    color: colors.neutral[900],
    fontFamily: fontFamily.medium,
  },
  hoursTimeToday: {
    color: colors.orange[600],
    fontFamily: fontFamily.semiBold,
  },
  hoursClosed: {
    ...textStyles.body,
    color: colors.neutral[400],
    fontStyle: 'italic',
  },

  /* Description */
  descText: {
    ...textStyles.body,
    color: colors.neutral[600],
    lineHeight: wp(22),
  },

  /* Offers */
  offerCard: {
    marginBottom: spacing[2],
    backgroundColor: '#1E293B',
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIconBox: {
    width: wp(44),
    height: wp(44),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  offerDesc: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  offerPercentBadge: {
    backgroundColor: colors.orange[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  offerPercentText: {
    ...textStyles.caption,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },

  /* Contact */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  contactText: {
    ...textStyles.body,
    color: colors.neutral[700],
    flex: 1,
  },

  /* Partner card */
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  partnerCategory: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});
