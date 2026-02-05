// Jest setup file for React Native/Expo testing

// Désactiver Expo Winter runtime pour les tests
if (typeof global.TextDecoderStream === 'undefined') {
  global.TextDecoderStream = class TextDecoderStream {};
}
if (typeof global.TextEncoderStream === 'undefined') {
  global.TextEncoderStream = class TextEncoderStream {};
}

// Note: Les mocks Expo Winter sont dans jest.setup.winter.js
// qui est chargé via setupFiles (avant les imports)

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  makeRedirectUri: jest.fn(() => 'redirect://'),
  ResponseType: { Token: 'token', Code: 'code' },
  AuthRequest: jest.fn(),
  AuthSession: jest.fn(),
  DiscoveryDocument: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  Link: ({ children }) => children,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
  },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 48.8566, longitude: 2.3522 },
    })
  ),
  watchPositionAsync: jest.fn(),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock expo-asset
jest.mock('expo-asset', () => {
  const mockAsset = {
    name: 'mock-asset',
    type: 'font',
    uri: 'mock://asset',
    hash: null,
    height: null,
    width: null,
    fileHashes: null,
    fileUris: null,
    localUri: null,
    downloadAsync: jest.fn(() => Promise.resolve(mockAsset)),
    downloadRequired: false,
  };

  return {
    Asset: {
      fromModule: jest.fn((moduleId) => {
        // Retourner un asset mocké pour n'importe quel moduleId
        return mockAsset;
      }),
      fromURI: jest.fn(() => mockAsset),
      fromMetadata: jest.fn(() => mockAsset),
    },
  };
});

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
  unloadAsync: jest.fn(() => Promise.resolve()),
  FontDisplay: {
    AUTO: 'auto',
    BLOCK: 'block',
    SWAP: 'swap',
    FALLBACK: 'fallback',
    OPTIONAL: 'optional',
  },
}));

// Mock @expo/vector-icons pour éviter le chargement des polices
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  // Créer un composant Icon mocké qui ne charge pas de polices
  const Icon = (props) => {
    return React.createElement(View, { ...props, testID: 'icon' });
  };
  
  // Ajouter les méthodes statiques nécessaires
  Icon.loadAsync = jest.fn(() => Promise.resolve());
  
  return {
    __esModule: true,
    default: Icon,
    Ionicons: Icon,
    MaterialIcons: Icon,
    FontAwesome: Icon,
    FontAwesome5: Icon,
    MaterialCommunityIcons: Icon,
    AntDesign: Icon,
    Entypo: Icon,
    Feather: Icon,
    Fontisto: Icon,
    Foundation: Icon,
    Octicons: Icon,
    SimpleLineIcons: Icon,
    Zocial: Icon,
  };
});

// Mock expo-constants
jest.mock('expo-constants', () => ({
  Constants: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: (component) => component,
    Directions: {},
    GestureHandlerRootView: View,
  };
});

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const View = require('react-native').View;
  const MockMapView = (props) => View(props);
  MockMapView.Marker = View;
  MockMapView.Callout = View;
  MockMapView.Polygon = View;
  MockMapView.Polyline = View;
  MockMapView.Circle = View;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: View,
    Callout: View,
    PROVIDER_GOOGLE: 'google',
    PROVIDER_DEFAULT: 'default',
  };
});

// Mock expo-maps
jest.mock('expo-maps', () => ({
  MapView: 'MapView',
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => {
  const defaultState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: null,
  };
  
  const mockFetch = jest.fn(() => Promise.resolve(defaultState));
  const mockAddEventListener = jest.fn((callback) => {
    // Simuler un événement immédiat
    setTimeout(() => callback(defaultState), 0);
    // Retourner une fonction de nettoyage
    return () => {};
  });
  
  return {
    fetch: mockFetch,
    addEventListener: mockAddEventListener,
    configure: jest.fn(),
    useNetInfo: jest.fn(() => defaultState),
    default: {
      fetch: mockFetch,
      addEventListener: mockAddEventListener,
    },
  };
}, { virtual: true });

// Define __DEV__ for tests
global.__DEV__ = true;

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg' }],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file://test-photo.jpg' }],
    })
  ),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('base64-encoded-string')),
  documentDirectory: 'file://test-documents/',
  cacheDirectory: 'file://test-cache/',
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'dismiss' })),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Console error filter to reduce noise during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: An update to') ||
      args[0].includes('act(...)'))
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};
