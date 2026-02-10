import { AnimatedTabSelector } from '@/components/navigation/AnimatedTabSelector';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const screenWidth = Dimensions.get('window').width;

  // Exclure les routes cachées (href: null)
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return options.href !== null;
  });

  const visibleTabWidth = screenWidth / visibleRoutes.length;
  
  // Trouver l'index de la route active dans les routes visibles
  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = visibleRoutes.findIndex((route) => route.key === activeRouteKey);

  return (
    <View style={styles.tabBar}>
      {activeIndex >= 0 && (
        <AnimatedTabSelector
          activeIndex={activeIndex}
          totalTabs={visibleRoutes.length}
          tabWidth={visibleTabWidth}
        />
      )}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        
        // Ignorer les routes cachées
        if (options.href === null) {
          return null;
        }

        const isFocused = state.index === index;
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

        // Déterminer l'icône et la couleur
        let iconName = 'home-outline';
        let iconNameFilled = 'home';
        let iconSize = 24;

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
            iconSize = 28;
            break;
          case 'history':
            iconName = 'receipt-outline';
            iconNameFilled = 'receipt';
            break;
          case 'profile':
            iconName = 'person-outline';
            iconNameFilled = 'person';
            break;
        }

        // Pour le QRCode, utiliser le bouton personnalisé si disponible
        if (route.name === 'qrcode' && options.tabBarButton) {
          const CustomButton = options.tabBarButton as React.ComponentType<any>;
          return (
            <View key={route.key} style={styles.tabButton}>
              <CustomButton 
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityState={isFocused ? { selected: true } : {}}
              />
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {isFocused ? (
                <LinearGradient
                  colors={['#8B2F3F', '#A03D52']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name={iconNameFilled as any}
                    size={iconSize}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              ) : (
                <Ionicons
                  name={iconName as any}
                  size={iconSize}
                  color="rgba(255, 255, 255, 0.5)"
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#1A0A0E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'relative',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'space-around',
  } as ViewStyle,
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  } as ViewStyle,
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  } as ViewStyle,
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
});

