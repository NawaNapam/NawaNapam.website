import type { CapacitorConfig } from "@capacitor/cli";

// Point the app at your local dev server instead of production, e.g.:
//   CAPACITOR_SERVER_URL=http://localhost:3000 npx cap sync android
// Requires `adb reverse tcp:3000 tcp:3000` (see `npm run adb:reverse`) so the
// device can reach your machine's dev server over the USB connection.
const devServerUrl = process.env.CAPACITOR_SERVER_URL;
// || "https://www.nawanapam.com"

const config: CapacitorConfig = {
  appId: "com.nawanapam.app",
  appName: "Nawa Napam",
  webDir: "www",
  server: {
    url: "http://10.73.23.193:3000",
    cleartext: true,
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
