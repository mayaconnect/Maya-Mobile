import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Taille de référence basée sur un iPhone 14 (390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Calcule une taille responsive basée sur la largeur de l'écran
 * @param size - Taille de base
 * @returns Taille adaptée à l'écran
 */
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
};

/**
 * Calcule une taille responsive basée sur la hauteur de l'écran
 * @param size - Taille de base
 * @returns Taille adaptée à l'écran
 */
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(size * scale);
};

/**
 * Calcule une taille responsive basée sur la plus petite dimension
 * Utile pour les éléments carrés ou circulaires
 * @param size - Taille de base
 * @returns Taille adaptée à l'écran
 */
export const scaleSize = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  return Math.round(size * scale);
};

/**
 * Calcule une taille de police responsive
 * @param fontSize - Taille de police de base
 * @returns Taille de police adaptée
 */
export const scaleFont = (fontSize: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = fontSize * scale;
  
  // Limiter la taille minimale et maximale
  if (Platform.OS === 'ios') {
    return Math.max(12, Math.min(newSize, fontSize * 1.3));
  }
  return Math.max(12, Math.min(newSize, fontSize * 1.3));
};

/**
 * Retourne un pourcentage de la largeur de l'écran
 * @param percentage - Pourcentage (0-100)
 * @returns Largeur en pixels
 */
export const widthPercentage = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Retourne un pourcentage de la hauteur de l'écran
 * @param percentage - Pourcentage (0-100)
 * @returns Hauteur en pixels
 */
export const heightPercentage = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Détermine si l'appareil est une tablette
 */
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (SCREEN_WIDTH >= 768 && SCREEN_HEIGHT >= 1024) ||
    (SCREEN_WIDTH >= 1024 && SCREEN_HEIGHT >= 768)
  );
};

/**
 * Détermine si l'appareil est un petit téléphone
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Détermine si l'appareil est un grand téléphone
 */
export const isLargeDevice = (): boolean => {
  return SCREEN_WIDTH >= 414;
};

/**
 * Retourne les dimensions de l'écran
 */
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: SCREEN_WIDTH / BASE_WIDTH,
});

/**
 * Normalise une valeur pour différentes densités de pixels
 * @param size - Taille à normaliser
 * @returns Taille normalisée
 */
export const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Crée un style responsive pour les padding/margin
 * @param value - Valeur de base
 * @returns Valeur responsive
 */
export const responsiveSpacing = (value: number): number => {
  return scaleWidth(value);
};

/**
 * Crée une taille d'icône responsive
 * @param size - Taille de base
 * @returns Taille responsive
 */
export const responsiveIconSize = (size: number): number => {
  return scaleSize(size);
};

