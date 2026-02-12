import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartnerTab } from './PartnerBottomNav';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedPartnerTabBarProps {
  selectedTab: PartnerTab;
  onTabChange: (tab: PartnerTab) => void;
  onScanQR?: () => void;
  validatingQR?: boolean;
}

export function AnimatedPartnerTabBar({ 
  selectedTab, 
  onTabChange, 
  onScanQR, 
  validatingQR = false 
}: AnimatedPartnerTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, responsiveSpacing(8));

  // 5 onglets : les 4 de base + QR Code au centre
  const tabs: { key: PartnerTab | 'qrcode'; label: string; icon: { active: string; inactive: string } }[] = [
    { key: 'overview', label: 'Home', icon: { active: 'grid', inactive: 'grid-outline' } },
    { key: 'history', label: 'Historique', icon: { active: 'time', inactive: 'time-outline' } },
    { key: 'qrcode', label: 'QR Code', icon: { active: 'qr-code', inactive: 'qr-code-outline' } },
    { key: 'stores', label: 'Stores', icon: { active: 'storefront', inactive: 'storefront-outline' } },
    { key: 'me', label: 'Me', icon: { active: 'person', inactive: 'person-outline' } },
  ];

  const visibleTabWidth = SCREEN_WIDTH / tabs.length;
  const activeIndex = tabs.findIndex(tab => tab.key === selectedTab || (tab.key === 'qrcode' && selectedTab === 'overview'));

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPadding }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === 'qrcode' 
          ? false // Le QR Code n'est jamais "actif" visuellement, mais reste cliquable
          : selectedTab === tab.key;

        const handlePress = () => {
          if (tab.key === 'qrcode' && onScanQR) {
            onScanQR();
          } else if (tab.key !== 'qrcode') {
            onTabChange(tab.key as PartnerTab);
          }
        };

        return (
          <AnimatedTabButton
            key={tab.key}
            tab={tab}
            isActive={isActive}
            onPress={handlePress}
            isQRCode={tab.key === 'qrcode'}
            validatingQR={validatingQR && tab.key === 'qrcode'}
          />
        );
      })}
    </View>
  );
}

interface AnimatedTabButtonProps {
  tab: { key: PartnerTab | 'qrcode'; label: string; icon: { active: string; inactive: string } };
  isActive: boolean;
  onPress: () => void;
  isQRCode?: boolean;
  validatingQR?: boolean;
}

const AnimatedTabButton: React.FC<AnimatedTabButtonProps> = ({ 
  tab, 
  isActive, 
  onPress, 
  isQRCode = false,
  validatingQR = false 
}) => {
  const scale = useSharedValue(isActive ? 1.15 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.5);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.15 : 1, {
      damping: 15,
      stiffness: 200,
    });
    opacity.value = withTiming(isActive ? 1 : 0.5, {
      duration: 200,
    });
  }, [isActive]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: interpolate(opacity.value, [0.5, 1], [0.95, 1]) }],
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.7}
      disabled={validatingQR}
    >
      <Animated.View style={[styles.tabContent, iconAnimatedStyle]}>
        {isActive ? (
          <LinearGradient
            colors={['#8B2F3F', '#A03D52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons
              name={tab.icon.active as any}
              size={22}
              color="#FFFFFF"
            />
          </LinearGradient>
        ) : (
          <Ionicons
            name={validatingQR && isQRCode ? 'hourglass' : (tab.icon.inactive as any)}
            size={20}
            color="rgba(255, 255, 255, 0.8)"
          />
        )}
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, labelAnimatedStyle, isActive && styles.tabLabelActive]}>
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A0A0E',
    borderTopLeftRadius: responsiveSpacing(20),
    borderTopRightRadius: responsiveSpacing(20),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: responsiveSpacing(6),
    minHeight: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  } as ViewStyle,
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
    paddingVertical: responsiveSpacing(1),
  } as ViewStyle,
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    marginBottom: 2,
  } as ViewStyle,
  iconGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  } as ViewStyle,
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  tabLabelActive: {
    color: '#FFFFFF',
  } as TextStyle,
});
