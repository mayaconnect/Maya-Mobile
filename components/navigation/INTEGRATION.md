# 🎯 Guide d'intégration de la Navbar Animée

## ✅ Étapes déjà complétées :

1. ✅ Composant `AnimatedNavbar` créé avec effet notch
2. ✅ Layout des tabs configuré pour masquer la navbar par défaut
3. ✅ Hook `useTabNavigation` créé pour gérer l'état de navigation
4. ✅ Composant `TabScreenWrapper` créé pour wrapper les écrans

## 📝 Prochaines étapes :

### Pour intégrer la navbar dans chaque écran :

Il y a **2 méthodes** possibles :

---

## 🎨 **MÉTHODE 1 : Wrapper individuel** (Recommandée)

Enveloppe chaque écran avec `TabScreenWrapper` :

```typescript
// features/home/screens/HomeScreen.tsx
import TabScreenWrapper from '@/components/navigation/TabScreenWrapper';

export default function HomeScreen() {
  // ... ton code existant

  return (
    <TabScreenWrapper>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={Colors.gradients.primary}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView}>
            {/* Ton contenu existant */}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </TabScreenWrapper>
  );
}
```

### Avantages :
- ✅ Contrôle précis par écran
- ✅ Peut personnaliser la navbar par écran
- ✅ Plus flexible

---

## 🔄 **MÉTHODE 2 : Layout global** (Plus rapide)

Modifie le `_layout.tsx` pour ajouter automatiquement la navbar :

```typescript
// app/(tabs)/_layout.tsx
import { useAuth } from '@/hooks/use-auth';
import { Redirect, Tabs, Slot } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AnimatedNavbar from '@/components/navigation/AnimatedNavbar';
import { useTabNavigation } from '@/hooks/use-tab-navigation';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { navItems, activeIndex } = useTabNavigation();

  if (loading) return null;
  if (!user) return <Redirect href="/connexion/login" />;

  const isPartner = /* ... ton code de vérification */;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}>
        {/* ... tes screens */}
      </Tabs>

      {/* Navbar globale */}
      {!isPartner && (
        <AnimatedNavbar
          items={navItems}
          activeIndex={activeIndex}
        />
      )}
    </View>
  );
}
```

### Avantages :
- ✅ Plus rapide à implémenter
- ✅ Une seule modification
- ✅ Navbar présente sur tous les écrans automatiquement

---

## 🎯 **Ma recommandation : MÉTHODE 2**

Pour tester rapidement et avoir la navbar fonctionnelle immédiatement, utilise la **Méthode 2**.

---

## 🚀 Application rapide (Méthode 2)

Remplace tout le contenu de `app/(tabs)/_layout.tsx` par :

```typescript
import { useAuth } from '@/hooks/use-auth';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import AnimatedNavbar from '@/components/navigation/AnimatedNavbar';
import { useTabNavigation } from '@/hooks/use-tab-navigation';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { navItems, activeIndex } = useTabNavigation();

  if (loading) return null;
  if (!user) return <Redirect href="/connexion/login" />;

  const isPartner = user?.email?.toLowerCase().includes('partner') ||
                    user?.email?.toLowerCase().includes('partenaire') ||
                    user?.email?.toLowerCase().includes('operator') ||
                    user?.email?.toLowerCase().includes('opérateur') ||
                    (user as any)?.role === 'partner' ||
                    (user as any)?.role === 'operator' ||
                    (user as any)?.role === 'opérateur' ||
                    (user as any)?.role === 'StoreOperator' ||
                    (user as any)?.isPartner === true ||
                    (user as any)?.isOperator === true;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="partners" />
        <Tabs.Screen name="qrcode" />
        <Tabs.Screen name="subscription" options={{ href: null }} />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="partner-home" options={{ href: null }} />
        <Tabs.Screen name="stores-map" options={{ href: null }} />
      </Tabs>

      {!isPartner && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <AnimatedNavbar items={navItems} activeIndex={activeIndex} />
        </View>
      )}
    </>
  );
}
```

---

## 🐛 Troubleshooting

### La navbar n'apparaît pas
- ✅ Vérifie que tu n'es pas connecté en tant que partenaire
- ✅ Vérifie que `react-native-reanimated` est bien installé
- ✅ Vérifie que le plugin Babel est configuré dans `babel.config.js`

### L'app crash au démarrage
- ✅ Clear cache : `npx expo start -c`
- ✅ Réinstalle les dépendances : `npm install`
- ✅ Vérifie les imports

### Les animations ne fonctionnent pas
- ✅ Assure-toi d'avoir le plugin dans `babel.config.js` :
```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin', // Doit être en dernier !
  ],
};
```

---

Tu veux que j'applique la **Méthode 2** directement pour toi ?
