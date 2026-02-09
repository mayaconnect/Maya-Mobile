/**
 * Mapping d'images cohérentes pour les restaurants
 * Associe des images de restaurants réalistes basées sur le nom ou la catégorie
 */

// Mapping d'images de restaurants par type
export const restaurantImages: Record<string, string> = {
  'akoia': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
  'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
  'bistro': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  'café': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
  'cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
  'pizzeria': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
  'sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
  'japonais': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
  'italien': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  'français': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
  'brasserie': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  'fast food': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
  'burger': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
  'asiatique': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
  'chinois': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
  'thaï': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
  'mexicain': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
  'indien': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
  'bar': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  'pub': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
};

// Seeds pour images génériques de restaurants
const restaurantSeeds = [
  'restaurant-interior',
  'dining-room',
  'food-service',
  'restaurant-table',
  'cozy-restaurant',
  'modern-restaurant',
  'elegant-dining',
  'casual-dining',
];

/**
 * Obtient une image cohérente pour un restaurant basée sur son nom ou sa catégorie
 * @param partnerId - ID du partenaire (pour générer un seed cohérent)
 * @param partnerName - Nom du restaurant
 * @param category - Catégorie du restaurant
 * @param width - Largeur de l'image (défaut: 400)
 * @param height - Hauteur de l'image (défaut: 300)
 * @returns URI de l'image ou require() pour les images locales
 */
export const getRestaurantImage = (
  partnerId: string,
  partnerName?: string,
  category?: string,
  width: number = 400,
  height: number = 300
): string | number => {
  // Si le nom est "Akoia", utiliser l'image locale
  if (partnerName?.toLowerCase() === 'akoia') {
    return require('@/assets/images/DSC09655-1024x683.jpg');
  }
  
  // Chercher une image basée sur le nom du restaurant
  const nameLower = partnerName?.toLowerCase() || '';
  for (const [key, imageUrl] of Object.entries(restaurantImages)) {
    if (nameLower.includes(key)) {
      return imageUrl;
    }
  }
  
  // Chercher une image basée sur la catégorie
  const categoryLower = category?.toLowerCase() || '';
  for (const [key, imageUrl] of Object.entries(restaurantImages)) {
    if (categoryLower.includes(key)) {
      return imageUrl;
    }
  }
  
  // Si aucune correspondance, utiliser l'ID comme seed pour une image cohérente
  const seed = partnerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seedIndex = seed % restaurantSeeds.length;
  return `https://source.unsplash.com/featured/${width}x${height}/?${restaurantSeeds[seedIndex]},restaurant,dining`;
};

