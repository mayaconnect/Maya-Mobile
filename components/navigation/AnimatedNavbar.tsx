// AnimatedNavbar.tsx
// Animated Bottom Navbar for React Native with Maya Design System
// Dependencies: react-native-reanimated, react-native-svg

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { Colors, BorderRadius, Shadows } from '@/constants/design-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Config ───────────────────────────────────────────────────
export interface NavItem {
  key: string;
  icon: 'home' | 'globe' | 'settings' | 'qr' | 'profile' | 'receipt' | 'storefront';
  onPress?: () => void;
}

interface AnimatedNavbarProps {
  items: NavItem[];
  activeIndex?: number;
  onTabChange?: (index: number) => void;
}

const BAR_MARGIN = 20;
const BAR_WIDTH = SCREEN_WIDTH - BAR_MARGIN * 2;
const BAR_HEIGHT = 64;
const NOTCH_RADIUS = 34;
const NOTCH_DEPTH = 28;
const CORNER_RADIUS = 16;
const CIRCLE_SIZE = 56;
const ICON_SIZE = 28;

// Couleurs du design system Maya
const GOLD = Colors.accent.gold;
const DARK = Colors.background.surface;
const GRAY = Colors.text.muted;
const WHITE = Colors.text.light;

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── SVG Icon Components ──────────────────────────────────────
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="9,22 9,12 15,12 15,22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GlobeIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Line x1={2} y1={12} x2={22} y2={12} stroke={color} strokeWidth={2} />
    <Path
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      stroke={color}
      strokeWidth={2}
    />
  </Svg>
);

const SettingsIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QRIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 14h3v3h-3v-3zm3 3h3v3h-3v-3zm0-6h3v3h-3v-3z"
      fill={color}
    />
  </Svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={5} stroke={color} strokeWidth={2} />
    <Path
      d="M3 21c0-4.418 4.03-8 9-8s9 3.582 9 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ReceiptIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 2h16v20l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L4 22V2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={8} y1={8} x2={16} y2={8} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={8} y1={12} x2={16} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={8} y1={16} x2={12} y2={16} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const StorefrontIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l2-7h14l2 7-2 2v9H5v-9L3 9z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 21v-6h6v6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ICON_MAP = {
  home: HomeIcon,
  globe: GlobeIcon,
  settings: SettingsIcon,
  qr: QRIcon,
  profile: ProfileIcon,
  receipt: ReceiptIcon,
  storefront: StorefrontIcon,
};

// ─── Notch Path Builder ───────────────────────────────────────
function buildNotchPath(centerX: number): string {
  const W = BAR_WIDTH;
  const H = BAR_HEIGHT + NOTCH_DEPTH;
  const barTop = NOTCH_DEPTH;
  const r = CORNER_RADIUS;
  const nR = NOTCH_RADIUS;
  const nD = NOTCH_DEPTH;
  const cp = nR * 0.55;

  const leftNotch = centerX - nR;
  const rightNotch = centerX + nR;

  return [
    `M ${r} ${barTop}`,
    `L ${leftNotch} ${barTop}`,
    `C ${leftNotch + cp * 0.3} ${barTop}, ${centerX - cp} ${barTop - nD}, ${centerX} ${barTop - nD}`,
    `C ${centerX + cp} ${barTop - nD}, ${rightNotch - cp * 0.3} ${barTop}, ${rightNotch} ${barTop}`,
    `L ${W - r} ${barTop}`,
    `Q ${W} ${barTop} ${W} ${barTop + r}`,
    `L ${W} ${H - r}`,
    `Q ${W} ${H} ${W - r} ${H}`,
    `L ${r} ${H}`,
    `Q 0 ${H} 0 ${H - r}`,
    `L 0 ${barTop + r}`,
    `Q 0 ${barTop} ${r} ${barTop}`,
    'Z',
  ].join(' ');
}

// ─── Helper: item center X positions ─────────────────────────
function getItemCenterX(index: number, itemCount: number): number {
  const segmentWidth = BAR_WIDTH / itemCount;
  return segmentWidth * index + segmentWidth / 2;
}

// ─── NavButton Component ──────────────────────────────────────
interface NavButtonProps {
  index: number;
  activeIndex: number;
  onPress: (index: number) => void;
  icon: 'home' | 'globe' | 'settings' | 'qr' | 'profile' | 'receipt' | 'storefront';
}

const NavButton: React.FC<NavButtonProps> = ({ index, activeIndex, onPress, icon }) => {
  const isActive = activeIndex === index;
  const progress = useSharedValue(isActive ? 1 : 0);
  const IconComponent = ICON_MAP[icon];

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    });
  }, [isActive]);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: progress.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [0, -30]),
      },
    ],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(index)}
      style={styles.navBtnTouchable}
    >
      <Animated.View style={[styles.navBtn, animatedButtonStyle]}>
        <Animated.View style={[styles.bgCircle, animatedCircleStyle]} />
        <View style={styles.iconWrap}>
          <IconComponent color={isActive ? GOLD : GRAY} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Notch Bar (Animated SVG) ─────────────────────────────────
interface NotchBarProps {
  activeIndex: number;
  itemCount: number;
}

const NotchBar: React.FC<NotchBarProps> = ({ activeIndex, itemCount }) => {
  const animatedCenterX = useSharedValue(getItemCenterX(0, itemCount));

  useEffect(() => {
    animatedCenterX.value = withSpring(getItemCenterX(activeIndex, itemCount), {
      damping: 18,
      stiffness: 100,
      mass: 0.9,
    });
  }, [activeIndex, itemCount]);

  const animatedProps = useAnimatedProps(() => ({
    d: buildNotchPath(animatedCenterX.value),
  }));

  return (
    <View style={styles.notchSvgContainer}>
      <Svg
        width={BAR_WIDTH}
        height={BAR_HEIGHT + NOTCH_DEPTH}
        viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT + NOTCH_DEPTH}`}
      >
        <AnimatedPath animatedProps={animatedProps} fill={DARK} />
      </Svg>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────
export default function AnimatedNavbar({
  items,
  activeIndex: controlledActiveIndex,
  onTabChange
}: AnimatedNavbarProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;

  // Validation: vérifier que items existe et n'est pas vide
  if (!items || items.length === 0) {
    console.warn('AnimatedNavbar: items is empty or undefined');
    return null;
  }

  const handlePress = (index: number) => {
    try {
      const item = items[index];
      if (!item) return;

      // Si l'item a un onPress personnalisé, l'appeler
      if (item.onPress) {
        item.onPress();
      }

      // Mettre à jour l'état interne si non contrôlé
      if (controlledActiveIndex === undefined) {
        setInternalActiveIndex(index);
      }

      // Appeler le callback onTabChange si fourni
      onTabChange?.(index);
    } catch (error) {
      console.error('Error in AnimatedNavbar handlePress:', error);
    }
  };

  return (
    <View style={styles.bottomNavContainer}>
      {/* SVG notch bar */}
      <NotchBar activeIndex={activeIndex} itemCount={items.length} />

      {/* Nav buttons row (positioned over the bar) */}
      <View style={styles.navItemsRow}>
        {items.map((item, i) => (
          <NavButton
            key={item.key}
            index={i}
            activeIndex={activeIndex}
            onPress={handlePress}
            icon={item.icon}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  bottomNavContainer: {
    height: BAR_HEIGHT + NOTCH_DEPTH + (Platform.OS === 'ios' ? 20 : 10),
    paddingHorizontal: BAR_MARGIN,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  notchSvgContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    left: BAR_MARGIN,
    width: BAR_WIDTH,
    height: BAR_HEIGHT + NOTCH_DEPTH,
  },
  navItemsRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    left: BAR_MARGIN,
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  navBtnTouchable: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: WHITE,
    ...Shadows.md,
  },
  iconWrap: {
    zIndex: 2,
  },
});
