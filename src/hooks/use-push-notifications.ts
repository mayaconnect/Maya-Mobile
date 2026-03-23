/**
 * Maya Connect V2 — Push Notifications Hook
 *
 * Handles Expo push token registration, permission requests,
 * and incoming notification listeners.
 *
 * IMPORTANT: All expo-notifications calls are wrapped in try-catch
 * to prevent app crashes if the native module isn't ready.
 * The notification handler is configured lazily (not at module top-level)
 * to avoid crashes on app startup.
 */
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';

// Lazy imports — resolved only when the hook actually runs
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let Constants: typeof import('expo-constants').default | null = null;

let _handlerConfigured = false;

/**
 * Safely load expo-notifications and related modules.
 * Returns false if any module fails to load.
 */
async function ensureModulesLoaded(): Promise<boolean> {
  if (Notifications && Device && Constants) return true;

  try {
    const [notifModule, deviceModule, constantsModule] = await Promise.all([
      import('expo-notifications'),
      import('expo-device'),
      import('expo-constants'),
    ]);
    Notifications = notifModule;
    Device = deviceModule;
    Constants = constantsModule.default;
    return true;
  } catch (err) {
    console.error('[Push] Failed to load notification modules:', err);
    return false;
  }
}

/**
 * Configure the foreground notification handler (once).
 */
function configureNotificationHandler() {
  if (_handlerConfigured || !Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    _handlerConfigured = true;
    console.log('[Push] Notification handler configured');
  } catch (err) {
    console.error('[Push] Failed to configure notification handler:', err);
  }
}

/**
 * Register for push notifications and return the Expo push token.
 * Must be called on a physical device (not simulator).
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || !Device || !Constants) return null;

  try {
    if (!Device.isDevice) {
      console.warn('[Push] Push notifications require a physical device');
      return null;
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.manifest?.extra?.eas?.projectId ??
      (Constants as any)?.manifest2?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('[Push] Missing EAS project ID in app config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[Push] Expo push token:', token);

    // Android: create notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('maya-transactions', {
        name: 'Transactions Maya',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#764ba2',
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'Général',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }

    return token;
  } catch (err) {
    console.error('[Push] Registration failed:', err);
    return null;
  }
}

/**
 * Hook to manage push notification lifecycle.
 *
 * - Loads notification modules lazily on mount
 * - Requests permission & registers token (when authenticated)
 * - Listens for incoming notifications (foreground + background tap)
 * - All native calls are wrapped in try-catch to prevent crashes
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    (async () => {
      // Step 1: load native modules
      const loaded = await ensureModulesLoaded();
      if (!loaded || cancelled || !Notifications) return;

      // Step 2: configure foreground handler
      configureNotificationHandler();

      // Step 3: register for push
      const token = await registerForPushNotificationsAsync();
      if (cancelled) return;

      if (token) {
        setExpoPushToken(token);

        // Persist token for logout unregister
        try {
          const { setItemAsync } = await import('expo-secure-store');
          await setItemAsync('expo_push_token', token);
        } catch {}

        // Send token to backend (retry up to 3 times)
        let registered = false;
        for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
          try {
            const { pushDeviceApi } = await import('../api/push-device.api');
            const platform = Platform.OS === 'ios' ? 'ios' : 'android';
            await pushDeviceApi.register({ token, platform });
            console.log('[Push] Token registered with backend (attempt', attempt + 1, ')');
            registered = true;
            break;
          } catch (err: any) {
            const detail = err?.response?.data ?? err?.message ?? err;
            console.error('[Push] Failed to register token with backend (attempt', attempt + 1, '):', JSON.stringify(detail));
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            }
          }
        }
        if (!registered) {
          console.warn('[Push] Token registration failed after 3 attempts');
        }
      }

      // Step 4: set up listeners
      try {
        notificationListener.current = Notifications.addNotificationReceivedListener(
          (notif) => {
            console.log('[Push] Notification received:', notif.request.content.title);
            if (!cancelled) setNotification(notif);
          }
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data;
            console.log('[Push] Notification tapped, data:', data);

            const role = user?.role;
            if (data?.type === 'transaction_confirmed' || data?.type === 'transaction_pending') {
              if (role === 'partner') router.push('/(partner)/history');
              else if (role === 'storeoperator') router.push('/(storeoperator)/history');
              else router.push('/(client)/history');
            }
          }
        );
      } catch (err) {
        console.error('[Push] Failed to set up listeners:', err);
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (err) {
        console.error('[Push] Cleanup error:', err);
      }
    };
  }, [isAuthenticated]);

  return { expoPushToken, notification };
}
