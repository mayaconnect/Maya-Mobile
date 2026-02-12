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
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveSpacing } from '@/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, responsiveSpacing(8));

  // Exclure les routes cachées (href: null) et ne garder que les 5 icônes de base
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    // Ne garder que les 5 icônes de base : home, partners, qrcode, history, profile
    const allowedRoutes = ['home', 'partners', 'qrcode', 'history', 'profile'];
    return options.href !== null && allowedRoutes.includes(route.name);
  });

  const visibleTabWidth = SCREEN_WIDTH / visibleRoutes.length;
  
  // Trouver l'index de la route active dans les routes visibles
  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = visibleRoutes.findIndex((route) => route.key === activeRouteKey);

  // Animation pour l'indicateur actif
  const indicatorPosition = useSharedValue(activeIndex * visibleTabWidth + visibleTabWidth / 2);
  const indicatorScale = useSharedValue(1);

  useEffect(() => {
    const targetPosition = activeIndex * visibleTabWidth + visibleTabWidth / 2;
    indicatorPosition.value = withSpring(targetPosition, {
      damping: 20,
      stiffness: 150,
    });
    
    // Animation de pulse pour l'indicateur
    indicatorScale.value = withSpring(1.1, {
      damping: 15,
      stiffness: 200,
    }, () => {
      indicatorScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    });
  }, [activeIndex, visibleTabWidth]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: indicatorPosition.value - 25 },
        { scale: indicatorScale.value },
      ],
    };
  });

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPadding }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const originalIndex = state.routes.findIndex(r => r.key === route.key);
        const isFocused = state.index === originalIndex;
        const label = options.tabBarLabel || options.title || route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Ne garder que les 5 icônes autorisées
        const allowedRoutes = ['home', 'partners', 'qrcode', 'history', 'profile'];
        if (!allowedRoutes.includes(route.name)) {
          return null;
        }

        // Déterminer l'icône et la couleur
        let iconName = 'home-outline';
        let iconNameFilled = 'home';
        let iconSize = 22;

        switch (route.name) {
          case 'home':
            iconName = 'home-outline';
            iconNameFilled = 'home';
            break;
          case 'partners':
            iconName = 'storefront-outline';
            iconNameFilled = 'storefront';
            break;
          case 'qrcode':
            iconName = 'qr-code-outline';
            iconNameFilled = 'qr-code';
            iconSize = 24; // Même taille que les autres
            break;
          case 'history':
            iconName = 'receipt-outline';
            iconNameFilled = 'receipt';
            break;
          case 'profile':
            iconName = 'person-outline';
            iconNameFilled = 'person';
            break;
          default:
            return null;
        }

        return (
          <AnimatedTabButton
            key={route.key}
            isFocused={isFocused}
            iconName={iconName}
            iconNameFilled={iconNameFilled}
            iconSize={iconSize}
            label={typeof label === 'string' ? label : route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
          />
        );
      })}
    </View>
  );
};

interface AnimatedTabButtonProps {
  isFocused: boolean;
  iconName: string;
  iconNameFilled: string;
  iconSize: number;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityState: { selected?: boolean };
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedTabButton: React.FC<AnimatedTabButtonProps> = ({
  isFocused,
  iconName,
  iconNameFilled,
  iconSize,
  label,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
  testID,
}) => {
  const scale = useSharedValue(isFocused ? 1.15 : 1);
  const opacity = useSharedValue(isFocused ? 1 : 0.5);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, {
      damping: 15,
      stiffness: 200,
    });
    opacity.value = withTiming(isFocused ? 1 : 0.5, {
      duration: 200,
    });
  }, [isFocused]);

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
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.tabContent, iconAnimatedStyle]}>
        {isFocused ? (
          <LinearGradient
            colors={['#8B2F3F', '#A03D52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons
              name={iconNameFilled as any}
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        ) : (
          <Ionicons
            name={iconName as any}
            size={18}
            color="rgba(255, 255, 255, 0.5)"
          />
        )}
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, labelAnimatedStyle, isFocused && styles.tabLabelActive]}>
        {label}
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
    position: 'relative',
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
  activeIndicator: {
    position: 'absolute',
    bottom: responsiveSpacing(4),
    width: 50,
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  } as ViewStyle,
  indicatorDot: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8B2F3F',
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
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
    width: 38,
    height: 38,
    marginBottom: 2,
  } as ViewStyle,
  iconGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  tabLabelActive: {
    color: '#FFFFFF',
  } as TextStyle,
});

