import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conservatory.app',
  appName: 'The Conservatory',
  webDir: 'build_output',
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0c120c",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "814637797090-nkkhv6shv0kvvqr8kbqcbbklshvhpsqv.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
