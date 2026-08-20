import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.trimble.projectsight.mobile",
  appName: "ProjectSight",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: true,
    // When using adb reverse or local network dev server:
    url: "http://localhost:3000/mobile/signin",
  },
};

export default config;
