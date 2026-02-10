/**
 * Hook personnalisé pour gérer la navigation entre les tabs
 */

import { useRouter, usePathname } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { NavItem } from '@/components/navigation/AnimatedNavbar';

export function useTabNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);

  // Déterminer l'index actif basé sur le pathname
  useEffect(() => {
    try {
      if (!pathname) return;

      if (pathname.includes('/home')) setActiveIndex(0);
      else if (pathname.includes('/partners')) setActiveIndex(1);
      else if (pathname.includes('/qrcode')) setActiveIndex(2);
      else if (pathname.includes('/history')) setActiveIndex(3);
      else if (pathname.includes('/profile')) setActiveIndex(4);
    } catch (error) {
      console.error('Error in useTabNavigation pathname effect:', error);
    }
  }, [pathname]);

  // Configuration des items de navigation avec useMemo pour éviter les re-créations
  const navItems: NavItem[] = useMemo(() => [
    {
      key: 'home',
      icon: 'home',
      onPress: () => {
        try {
          router.push('/(tabs)/home');
          setActiveIndex(0);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    },
    {
      key: 'partners',
      icon: 'globe',
      onPress: () => {
        try {
          router.push('/(tabs)/partners');
          setActiveIndex(1);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    },
    {
      key: 'qr',
      icon: 'qr',
      onPress: () => {
        try {
          router.push('/(tabs)/qrcode');
          setActiveIndex(2);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    },
    {
      key: 'history',
      icon: 'receipt',
      onPress: () => {
        try {
          router.push('/(tabs)/history');
          setActiveIndex(3);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    },
    {
      key: 'profile',
      icon: 'profile',
      onPress: () => {
        try {
          router.push('/(tabs)/profile');
          setActiveIndex(4);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    },
  ], [router]);

  return { navItems, activeIndex };
}
