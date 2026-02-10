# AnimatedNavbar

Une barre de navigation animée avec effet "notch" pour React Native, intégrée au design system Maya.

## Fonctionnalités

- ✨ Animation fluide avec effet "notch" (encoche) qui suit l'icône active
- 🎯 Cercle blanc qui apparaît derrière l'icône active avec effet bounce
- 🎨 Intégration complète avec le design system Maya (couleurs, ombres, etc.)
- 📱 Responsive et adapté iOS/Android
- 🔧 Entièrement personnalisable

## Installation

Assurez-vous d'avoir installé les dépendances nécessaires :

```bash
npm install react-native-reanimated react-native-svg
```

Ou avec yarn :

```bash
yarn add react-native-reanimated react-native-svg
```

## Configuration de react-native-reanimated

Ajoutez le plugin Babel dans votre `babel.config.js` :

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // Doit être en dernier !
  ],
};
```

## Utilisation

### Exemple de base

```typescript
import AnimatedNavbar, { NavItem } from '@/components/navigation/AnimatedNavbar';

const navItems: NavItem[] = [
  { key: 'home', icon: 'home' },
  { key: 'explore', icon: 'globe' },
  { key: 'qr', icon: 'qr' },
  { key: 'profile', icon: 'profile' },
];

export default function MyScreen() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      {/* Votre contenu ici */}

      <AnimatedNavbar
        items={navItems}
        activeIndex={activeTab}
        onTabChange={setActiveTab}
      />
    </View>
  );
}
```

### Avec navigation (React Navigation)

```typescript
import { useNavigation } from '@react-navigation/native';
import AnimatedNavbar, { NavItem } from '@/components/navigation/AnimatedNavbar';

export default function TabLayout() {
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems: NavItem[] = [
    {
      key: 'home',
      icon: 'home',
      onPress: () => {
        navigation.navigate('Home');
        setActiveIndex(0);
      }
    },
    {
      key: 'partners',
      icon: 'globe',
      onPress: () => {
        navigation.navigate('Partners');
        setActiveIndex(1);
      }
    },
    {
      key: 'qr',
      icon: 'qr',
      onPress: () => {
        navigation.navigate('QRCode');
        setActiveIndex(2);
      }
    },
    {
      key: 'profile',
      icon: 'profile',
      onPress: () => {
        navigation.navigate('Profile');
        setActiveIndex(3);
      }
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Votre Stack.Navigator ou contenu */}

      <AnimatedNavbar
        items={navItems}
        activeIndex={activeIndex}
      />
    </View>
  );
}
```

### Mode non contrôlé (sans activeIndex)

Si vous n'avez pas besoin de contrôler l'état depuis le parent :

```typescript
const navItems: NavItem[] = [
  { key: 'home', icon: 'home' },
  { key: 'explore', icon: 'globe' },
  { key: 'settings', icon: 'settings' },
];

<AnimatedNavbar
  items={navItems}
  onTabChange={(index) => console.log('Tab changed to:', index)}
/>
```

## Props

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `items` | `NavItem[]` | ✅ | Liste des items de navigation |
| `activeIndex` | `number` | ❌ | Index de l'item actif (mode contrôlé) |
| `onTabChange` | `(index: number) => void` | ❌ | Callback appelé quand l'utilisateur change d'onglet |

### Type NavItem

```typescript
interface NavItem {
  key: string;                    // Identifiant unique
  icon: 'home' | 'globe' | 'settings' | 'qr' | 'profile';  // Type d'icône
  onPress?: () => void;           // Action personnalisée au clic
}
```

## Icônes disponibles

- `home` : Icône maison
- `globe` : Icône globe/monde
- `settings` : Icône paramètres/réglages
- `qr` : Icône QR code
- `profile` : Icône profil utilisateur

## Personnalisation

### Ajouter de nouvelles icônes

Éditez le composant `AnimatedNavbar.tsx` et ajoutez votre icône SVG :

```typescript
const MyCustomIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    {/* Votre SVG path ici */}
  </Svg>
);

// Puis ajoutez-la à ICON_MAP
const ICON_MAP = {
  home: HomeIcon,
  globe: GlobeIcon,
  // ... autres icônes
  mycustom: MyCustomIcon,  // Nouvelle icône
};
```

### Modifier les couleurs

Les couleurs utilisent le design system Maya. Pour les changer :

```typescript
// Dans AnimatedNavbar.tsx
const GOLD = Colors.accent.gold;      // Couleur de l'icône active
const DARK = Colors.background.surface; // Couleur de la barre
const GRAY = Colors.text.muted;        // Couleur des icônes inactives
const WHITE = Colors.text.light;       // Couleur du cercle
```

### Ajuster les dimensions

```typescript
// Dans AnimatedNavbar.tsx
const BAR_HEIGHT = 64;        // Hauteur de la barre
const NOTCH_RADIUS = 34;      // Rayon de l'encoche
const NOTCH_DEPTH = 28;       // Profondeur de l'encoche
const CIRCLE_SIZE = 56;       // Taille du cercle blanc
const ICON_SIZE = 28;         // Taille des icônes
```

## Design System

Le composant utilise le design system Maya pour :
- Les couleurs (Colors.accent.gold, Colors.background.surface, etc.)
- Les ombres (Shadows.md)
- Le style cohérent avec l'application

## Notes

- Le composant gère automatiquement le safe area sur iOS
- Les animations utilisent `withSpring` pour un effet naturel
- L'encoche SVG est générée dynamiquement avec des courbes de Bézier
- Compatible avec React Native 0.70+

## Dépannage

### Les animations ne fonctionnent pas

Assurez-vous que le plugin Babel de reanimated est bien configuré et en **dernier** dans la liste des plugins.

### Les icônes SVG ne s'affichent pas

Vérifiez que `react-native-svg` est bien installé et lié correctement.

### L'espacement en bas est incorrect

Ajustez les valeurs `Platform.OS === 'ios' ? 20 : 10` dans les styles selon vos besoins.
