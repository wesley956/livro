import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wesley956.lumereader',
  appName: 'Lume Reader',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
