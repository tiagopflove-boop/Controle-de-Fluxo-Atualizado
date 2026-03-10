import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluxocontrol.app',
  appName: 'FluxoControl',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
