import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rizzlyai.app',
  appName: 'Rizzly AI',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://rizzlyai.com',
    cleartext: false,
  },
};

export default config;
