import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AnimatedTabSelectorProps {
  activeIndex: number;
  totalTabs: number;
  tabWidth: number;
}

export const AnimatedTabSelector: React.FC<AnimatedTabSelectorProps> = ({
  activeIndex,
  totalTabs,
  tabWidth,
}) => {
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isInitialized = useRef(false);

  useEffect(() => {
    // Calculer la position X du sélecteur (centre de l'onglet actif)
    const targetX = activeIndex * tabWidth + tabWidth / 2;

    // Initialiser la position au premier rendu
    if (!isInitialized.current) {
      translateXAnim.setValue(targetX);
      isInitialized.current = true;
      return;
    }

    Animated.parallel([
      Animated.spring(translateXAnim, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]),
    ]).start();
  }, [activeIndex, tabWidth, translateXAnim, scaleAnim]);

  const selectorSize = 60;
  const radius = 30;
  const waveDepth = 8;

  // Créer le chemin SVG pour le sélecteur circulaire avec découpe en vague en bas
  // Cercle avec une découpe en vague en bas (comme dans l'image de référence)
  // Le cercle commence en haut et fait presque un tour complet avec une vague en bas
  const path = `
    M ${radius} 0
    A ${radius} ${radius} 0 1 1 ${radius * 0.15} ${radius * 1.1}
    Q ${radius * 0.3} ${radius + waveDepth} ${radius * 0.45} ${radius + waveDepth * 0.7}
    Q ${radius * 0.6} ${radius + waveDepth} ${radius * 0.75} ${radius + waveDepth * 0.7}
    Q ${radius * 0.9} ${radius + waveDepth} ${radius * 1.05} ${radius + waveDepth * 0.7}
    Q ${radius * 1.2} ${radius + waveDepth} ${radius * 1.35} ${radius + waveDepth * 0.7}
    Q ${radius * 1.5} ${radius + waveDepth} ${radius * 1.65} ${radius + waveDepth * 0.7}
    Q ${radius * 1.8} ${radius + waveDepth} ${radius * 1.85} ${radius * 1.1}
    A ${radius} ${radius} 0 1 1 ${radius} 0
    Z
  `;

  return (
    <Animated.View
      style={[
        styles.selectorContainer,
        {
          transform: [
            { translateX: Animated.subtract(translateXAnim, selectorSize / 2) },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Svg 
        width={selectorSize} 
        height={selectorSize} 
        style={styles.selectorSvg} 
        viewBox={`0 0 ${selectorSize} ${selectorSize}`}
      >
        <Path
          d={path}
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="0"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  selectorContainer: {
    position: 'absolute',
    bottom: -5,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 1,
    overflow: 'visible',
  } as ViewStyle,
  selectorSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  } as ViewStyle,
});
