# Guide du Système Responsive

Ce guide explique comment utiliser le système responsive pour adapter l'application à toutes les tailles d'écran.

## 📱 Fonctions Disponibles

### Import
```typescript
import { 
  scaleWidth, 
  scaleHeight, 
  scaleSize, 
  scaleFont, 
  widthPercentage, 
  heightPercentage,
  responsiveSpacing,
  responsiveIconSize,
  isTablet,
  isSmallDevice,
  isLargeDevice
} from '@/utils/responsive';
```

## 🎯 Utilisation

### 1. **scaleWidth(size)** - Pour les largeurs
Utilisez pour les éléments qui doivent s'adapter à la largeur de l'écran.

```typescript
const styles = StyleSheet.create({
  container: {
    width: scaleWidth(300), // S'adapte à la largeur de l'écran
  },
});
```

### 2. **scaleHeight(size)** - Pour les hauteurs
Utilisez pour les éléments qui doivent s'adapter à la hauteur de l'écran.

```typescript
const styles = StyleSheet.create({
  card: {
    height: scaleHeight(200), // S'adapte à la hauteur de l'écran
    minHeight: scaleHeight(150),
  },
});
```

### 3. **scaleSize(size)** - Pour les éléments carrés/circulaires
Utilisez pour les boutons, icônes, avatars, etc.

```typescript
const styles = StyleSheet.create({
  button: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
  },
  icon: {
    width: scaleSize(32),
    height: scaleSize(32),
  },
});
```

### 4. **scaleFont(size)** - Pour les tailles de police
Utilisez pour toutes les tailles de texte.

```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: scaleFont(24),
  },
  body: {
    fontSize: scaleFont(16),
  },
});
```

### 5. **widthPercentage(percentage)** - Pourcentages de largeur
Utilisez pour les éléments qui doivent prendre un pourcentage de l'écran.

```typescript
const styles = StyleSheet.create({
  image: {
    width: widthPercentage(80), // 80% de la largeur
    height: widthPercentage(80), // Pour garder le ratio carré
  },
});
```

### 6. **heightPercentage(percentage)** - Pourcentages de hauteur
Utilisez pour les éléments qui doivent prendre un pourcentage de la hauteur.

```typescript
const styles = StyleSheet.create({
  modal: {
    height: heightPercentage(70), // 70% de la hauteur
  },
});
```

### 7. **responsiveSpacing(value)** - Pour padding/margin
Utilisez pour tous les espacements.

```typescript
const styles = StyleSheet.create({
  card: {
    padding: responsiveSpacing(16),
    marginBottom: responsiveSpacing(24),
    gap: responsiveSpacing(12),
  },
});
```

### 8. **responsiveIconSize(size)** - Pour les icônes
Utilisez pour les tailles d'icônes dans les composants.

```typescript
<Ionicons 
  name="home" 
  size={responsiveIconSize(24)} 
  color={Colors.primary} 
/>
```

## 📐 Exemples Complets

### Exemple 1 : Carte avec Image
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: scaleSize(16),
    padding: responsiveSpacing(20),
    marginBottom: responsiveSpacing(16),
    width: widthPercentage(90), // 90% de la largeur
  },
  image: {
    width: widthPercentage(100), // 100% de la largeur de la carte
    height: scaleHeight(200),
    borderRadius: scaleSize(12),
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginTop: responsiveSpacing(12),
  },
  description: {
    fontSize: scaleFont(14),
    marginTop: responsiveSpacing(8),
  },
});
```

### Exemple 2 : Bouton avec Icône
```typescript
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveSpacing(24),
    paddingVertical: responsiveSpacing(12),
    borderRadius: scaleSize(12),
    gap: responsiveSpacing(8),
  },
  icon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  text: {
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
});
```

### Exemple 3 : Liste d'éléments
```typescript
const styles = StyleSheet.create({
  list: {
    paddingHorizontal: responsiveSpacing(16),
  },
  item: {
    flexDirection: 'row',
    padding: responsiveSpacing(16),
    marginBottom: responsiveSpacing(12),
    borderRadius: scaleSize(12),
    gap: responsiveSpacing(12),
  },
  avatar: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  subtitle: {
    fontSize: scaleFont(14),
    marginTop: responsiveSpacing(4),
  },
});
```

## 🔍 Détection du Type d'Appareil

```typescript
import { isTablet, isSmallDevice, isLargeDevice } from '@/utils/responsive';

if (isTablet()) {
  // Styles spécifiques pour tablette
}

if (isSmallDevice()) {
  // Styles pour petits téléphones (< 375px)
}

if (isLargeDevice()) {
  // Styles pour grands téléphones (>= 414px)
}
```

## ⚠️ Bonnes Pratiques

1. **Utilisez `scaleSize` pour les éléments carrés/circulaires** (boutons, icônes, avatars)
2. **Utilisez `scaleWidth` pour les largeurs fixes**
3. **Utilisez `scaleHeight` pour les hauteurs fixes**
4. **Utilisez `scaleFont` pour toutes les tailles de texte**
5. **Utilisez `responsiveSpacing` pour padding/margin/gap**
6. **Utilisez `widthPercentage` pour les éléments qui doivent prendre un pourcentage de l'écran**
7. **Évitez les valeurs fixes** comme `width: 220` ou `fontSize: 16`

## 🎨 Migration d'un Composant

### Avant (Non-responsive)
```typescript
const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 200,
    padding: 20,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
  },
  button: {
    width: 100,
    height: 40,
  },
});
```

### Après (Responsive)
```typescript
import { scaleWidth, scaleHeight, scaleSize, scaleFont, responsiveSpacing } from '@/utils/responsive';

const styles = StyleSheet.create({
  card: {
    width: scaleWidth(300),
    height: scaleHeight(200),
    padding: responsiveSpacing(20),
    borderRadius: scaleSize(16),
  },
  title: {
    fontSize: scaleFont(24),
  },
  button: {
    width: scaleWidth(100),
    height: scaleHeight(40),
  },
});
```

## 📱 Taille de Référence

Le système utilise un iPhone 14 (390x844) comme référence. Toutes les tailles sont calculées proportionnellement à cette référence.

## 🚀 Prochaines Étapes

Pour rendre l'application complètement responsive :

1. ✅ Utilitaire responsive créé
2. ✅ HomeQRCodeCard mis à jour
3. ⏳ Mettre à jour les autres composants principaux :
   - HomeScreen
   - ProfileScreen
   - SubscriptionScreen
   - LoginScreen
   - PartnerHomeScreen
   - Et tous les autres composants avec des valeurs fixes

