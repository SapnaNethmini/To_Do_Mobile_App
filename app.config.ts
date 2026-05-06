import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'TODO',
  slug: 'todo-mobile',
  version: '1.0.0',
  scheme: 'todo',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.todomobile.app',
    // No NSAllowsArbitraryLoads — dev LAN access handled via tunnel or explicit host exception
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.todomobile.app',
    // usesCleartextTraffic is set to false for production via expo-build-properties plugin
    // (Expo config types don't expose this field directly; see eas.json build profiles)
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api',
    appEnv: process.env.APP_ENV ?? 'development',
  },
};

export default config;
