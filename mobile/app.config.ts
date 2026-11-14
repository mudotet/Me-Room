import type { ExpoConfig } from 'expo/config';

// Only the backend URL is public. Never copy process.env into Expo extras.
const rawApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '';
let apiBaseUrl = '';
try {
  const url = new URL(rawApiUrl);
  if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash) {
    apiBaseUrl = url.toString().replace(/\/$/, '');
  }
} catch { /* The UI explains missing configuration. */ }

const config: ExpoConfig = {
  name: 'Me Room',
  slug: 'me-room',
  version: '1.0.0',
  orientation: 'default',
  userInterfaceStyle: 'light',
  scheme: 'meroom',
  ios: { supportsTablet: true, requireFullScreen: true, bundleIdentifier: 'com.meroom.app', infoPlist: { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } } },
  android: { package: 'com.meroom.app' },
  web: { bundler: 'metro', name: 'Me Room', lang: 'vi' },
  plugins: [
    'expo-asset',
    'expo-font',
    'expo-status-bar',
    ['expo-camera', { cameraPermission: 'Cho phép Me Room dùng camera để quét căn phòng.', recordAudioAndroid: false }],
    ['expo-image-picker', { photosPermission: 'Chọn video căn phòng để Me Room phân tích.', microphonePermission: false }],
    ['expo-screen-orientation', { initialOrientation: 'PORTRAIT_UP' }]
  ],
  extra: { apiBaseUrl }
};
export default config;
