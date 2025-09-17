import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.readandlead.app',
  appName: 'Read & Lead',
  webDir: 'build',
  bundledWebRuntime: false,
  // Use the default http scheme so the WebView origin is http://localhost
  // This matches common API key referrer/domain settings and avoids blocking.
  server: {
    androidScheme: 'http',
  },
};

export default config;