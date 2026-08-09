module.exports = ({ config }) => ({
  ...config,
  name: "reactnative-maps-concepts",
  slug: "reactnative-maps-concepts",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "reactnativemapsconcepts",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: "com.mapsdemo.reactnativemapsconcepts",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "",
      },
    },
    predictiveBackGestureEnabled: false,
    package: "com.mapsdemo.reactnativemapsconcepts",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
    [
      "react-native-maps",
      {
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "",
        iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Allow Maps Playground to use your location.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
