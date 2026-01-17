import { Partner } from '../types';

const fallbackEmojis = ['🏬', '🍽️', '☕', '🍕', '🍣', '🥗', '🍰'];

export const computeCategory = (dto: any): string => {
  if (!dto) return 'Partenaire';
  if (dto.category) return dto.category;
  if (dto.sector) return dto.sector;
  if (dto.businessType) return dto.businessType;
  if (dto.tags?.length) return dto.tags[0];
  return 'Partenaire';
};

export const computeAddress = (dto: any): string => {
  if (!dto) {
    return 'Adresse non renseignée';
  }

  const address = dto.address;

  if (address) {
    if (typeof address === 'string') {
      return address;
    }

    const parts = [address.street, address.postalCode, address.city].filter(Boolean);
    if (parts.length) {
      return parts.join(', ');
    }
  }

  return dto.city ?? dto.location ?? 'Adresse non renseignée';
};

export const computePromotion = (dto: any) => {
  // D'abord chercher une promotion active spécifique
  const promo = dto.activePromotion ?? dto.currentPromotion ?? dto.promotion;
  
  // Sinon, utiliser la réduction standard du magasin
  const discountPercent = dto.avgDiscountPercent ?? dto.discountPercent ?? dto.discount;
  
  // Si on a une promo active, l'utiliser
  if (promo) {
    return {
      discount: promo.discountLabel ?? promo.discount ?? promo.title ?? (discountPercent ? `-${discountPercent}%` : 'Promo'),
      description: promo.description ?? promo.details ?? 'Promotion disponible',
      isActive: promo.isActive ?? true,
    };
  }
  
  // Sinon, si le magasin a une réduction standard, l'afficher
  if (discountPercent != null && discountPercent > 0) {
    return {
      discount: `-${discountPercent}%`,
      description: `${discountPercent}% de réduction sur votre addition`,
      isActive: true,
    };
  }
  
  // Sinon, pas de promotion
  return null;
};

export const mapStoreToPartner = (dto: any, index: number): Partner => {
  const image = dto.emoji ?? dto.icon ?? fallbackEmojis[index % fallbackEmojis.length];

  const rawDistance = dto.distance ?? dto.distanceKm ?? dto.distanceKM ?? dto.distanceMeters ?? null;
  const distanceValue =
    rawDistance === null || rawDistance === undefined ? null : Number(rawDistance);
  const rawRating = dto.averageRating ?? dto.rating ?? dto.score ?? dto.reviewScore;
  const ratingValue =
    rawRating === null || rawRating === undefined || Number.isNaN(Number(rawRating))
      ? 4
      : Number(rawRating);

  // Récupérer les infos du partenaire depuis le store
  const partner = dto.partner ?? dto.partnerData;
  const partnerName = partner?.name ?? dto.partnerName ?? dto.name ?? 'Partenaire';
  const partnerDescription = partner?.description ?? dto.partnerDescription ?? dto.description ?? 'Partenaire du programme Maya';

  // Extraire les coordonnées pour la carte
  const latitude = dto.latitude ?? dto.address?.latitude ?? dto.location?.latitude ?? 
    (typeof dto.address === 'object' && dto.address?.lat) ?? null;
  const longitude = dto.longitude ?? dto.address?.longitude ?? dto.location?.longitude ?? 
    (typeof dto.address === 'object' && dto.address?.lng) ?? null;

  return {
    id: dto.id ?? dto.storeId ?? `store-${index}`,
    name: partnerName,
    description: partnerDescription,
    address: computeAddress(dto),
    distance: distanceValue,
    isOpen: dto.isOpen ?? dto.openNow ?? true,
    closingTime: dto.closingTime ?? dto.openingHours?.closing ?? null,
    category: computeCategory(dto),
    image,
    promotion: computePromotion(dto),
    rating: ratingValue,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
  };
};

