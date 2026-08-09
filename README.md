# React Native Maps Playground 🗺️

A comprehensive React Native & Expo SDK 57 demo application showcasing Google Maps integration, places search autocomplete, polyline directions, custom markers, and real-time driver matching simulation.

---

## 🌟 Features Overview

| Module | Description & Capabilities | Target Route |
|--------|---------------------------|--------------|
| **1. Basic Map** | Google Maps rendering centered on Addis Ababa, interactive user location toggle, static marker, and **Map Type switcher** (`Satellite 🛰️`, `Hybrid 🌐`, `Standard 🗺️`). | [`/basic-map`](file:///home/ahadu/Documents/Projects/reactnative-maps-concepts/src/app/basic-map.tsx) |
| **2. Places Search** | Real-time debounced Google Places Autocomplete search input with location biasing, automatic camera movement, and marker placement. | [`/places-search`](file:///home/ahadu/Documents/Projects/reactnative-maps-concepts/src/app/places-search.tsx) |
| **3. Directions & Routing** | Origin & destination autocomplete inputs, Google Directions polyline rendering, and live distance/duration metrics. | [`/directions`](file:///home/ahadu/Documents/Projects/reactnative-maps-concepts/src/app/directions.tsx) |
| **4. Custom Markers** | Custom styled emoji markers for Users (🧑), Drivers (🚗), and Destinations (📍) with map legend and selection panel. | [`/custom-markers`](file:///home/ahadu/Documents/Projects/reactnative-maps-concepts/src/app/custom-markers.tsx) |
| **5. Driver Simulation** | Simulated driver pool generation, nearest-driver assignment using the **Haversine formula**, path trail visualization, and smooth interpolated movement animation. | [`/driver-simulation`](file:///home/ahadu/Documents/Projects/reactnative-maps-concepts/src/app/driver-simulation.tsx) |

---

## 📱 Web Testing vs. Real Device / Emulator

This project uses an abstraction layer that selects the appropriate Map engine and service implementation depending on the build target:

### 🌐 Web Browser (`npx expo start --web`)
* **Map Component**: Uses `map-component.web.tsx` backed by the **Google Maps JavaScript API**.
* **Services**: Uses `google-maps.web.ts` which calls `AutocompleteService` / `AutocompleteSuggestion` and `DirectionsService` dynamically via script tag loading.
* **Best For**: Rapid UI/UX layout testing, component prototyping, and cross-platform verification directly in the browser.
* **CORS & Fallback**: Browser `fetch()` restrictions to `maps.googleapis.com` REST APIs are bypassed by using the official browser JS SDK with built-in Addis Ababa local search fallback protection.

### 📱 Real Device / Emulator (`npx expo run:android` / `npx expo run:ios`)
* **Map Component**: Uses `map-component.native.tsx` wrapping **`react-native-maps`**, executing native **Google Maps Android SDK** (`com.google.android.gms:play-services-maps`) or **Google Maps iOS SDK**.
* **Services**: Uses `google-maps.native.ts` making direct, high-performance REST API calls.
* **Best For**: Real device GPS location tracking, hardware 60fps gesture panning/zooming, native satellite/hybrid map tiles, and production APK builds.

---

## 🔑 Prerequisites & Google Cloud Console Setup

To run this application with live map data, autocomplete, and routing, you need a **Google Cloud API Key** with the following 5 Google Maps APIs enabled.

> ⚠️ **Important**: Google Cloud requires an active Billing Account linked to your project for Google Maps APIs to return data. [Set up Google Cloud Billing here](https://console.cloud.google.com/billing).

### 📋 Feature to Google Cloud API Direct Links

Click each direct link below to open the exact API page in Google Cloud Console and click **Enable**:

| Application Feature | Required Google Cloud API | Direct Console Enable Link |
|---------------------|--------------------------|----------------------------|
| **Android Native Map** | **Maps SDK for Android** | 🔗 [Enable Maps SDK for Android](https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com) |
| **iOS Native Map** | **Maps SDK for iOS** | 🔗 [Enable Maps SDK for iOS](https://console.cloud.google.com/apis/library/maps-ios-backend.googleapis.com) |
| **Web Map Preview & JS API** | **Maps JavaScript API** | 🔗 [Enable Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com) |
| **Places Search & Autocomplete** | **Places API** & **Places API (New)** | 🔗 [Enable Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com) / [Places API (New)](https://console.cloud.google.com/apis/library/places.googleapis.com) |
| **Directions & Route Polylines** | **Directions API** | 🔗 [Enable Directions API](https://console.cloud.google.com/apis/library/directions-backend.googleapis.com) |

---

### 🚀 Step-by-Step API Key Setup

1. **Select or Create a Project**:
   Open the [Google Cloud Console Project Selector](https://console.cloud.google.com/projectselector2/home/dashboard) and select your active project.

2. **Enable the APIs**:
   Use the direct links in the table above, or navigate to [APIs & Services > Library](https://console.cloud.google.com/apis/library) and enable all APIs.

3. **Generate API Key**:
   - Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
   - Click **+ Create Credentials** at the top → select **API key**.
   - Copy the generated API key.

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Insert your key into `.env`:
   ```env
   # EXPO_PUBLIC_ prefix is required for Expo Metro bundler to expose the key to browser JS
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyYourActualGoogleMapsApiKeyHere
   GOOGLE_MAPS_API_KEY=AIzaSyYourActualGoogleMapsApiKeyHere
   ```

3. `app.json` automatically injects `GOOGLE_MAPS_API_KEY` into Expo native config plugins:
   - `android.config.googleMaps.apiKey`
   - `ios.config.googleMaps.apiKey`

---

## 💻 Running the Application

### 📱 Option 1: Native Development Build (Recommended for Native Google Maps SDK)

```bash
# 1. Install dependencies
npm install

# 2. Run on Android Emulator or connected physical device
npx expo run:android

# 3. Run on iOS Simulator (macOS required)
npx expo run:ios
```

### 🌐 Option 2: Web Preview

```bash
npx expo start --web
```

---

## 📁 Project Architecture

```
reactnative-maps-concepts/
├── src/
│   ├── app/                        # Expo Router file-based screen routes
│   │   ├── _layout.tsx             # Stack navigation layout & headers
│   │   ├── index.tsx               # Home screen module cards hub
│   │   ├── basic-map.tsx           # Module 1: Basic Map + Satellite/Hybrid toggle
│   │   ├── places-search.tsx       # Module 2: Places Autocomplete & camera positioning
│   │   ├── directions.tsx          # Module 3: Origin/Destination Directions & Polyline
│   │   ├── custom-markers.tsx      # Module 4: Emoji Markers & Legend
│   │   └── driver-simulation.tsx   # Module 5: Nearest Driver Haversine Matching & Movement
│   ├── components/
│   │   ├── map-view/               # Cross-platform MapView (Native react-native-maps & Web)
│   │   ├── feature-card.tsx        # Vector-icon feature navigation cards
│   │   ├── places-input.tsx        # Shared debounced Google Places search input
│   │   ├── map-button.tsx          # Styled control buttons (primary/secondary/danger)
│   │   └── info-panel.tsx          # Horizontal distance/duration metrics bar
│   ├── services/
│   │   ├── google-maps.native.ts   # Native REST API calls for Places & Directions
│   │   ├── google-maps.web.ts      # Web Google Maps JS API integration
│   │   └── simulation.ts           # Haversine formula, driver generation & interpolation
│   ├── constants/
│   │   ├── map.ts                  # Default Addis Ababa coordinates & dark map style
│   │   └── theme.ts                # Theme tokens (colors, spacing, typography)
│   └── types/                      # Shared TypeScript definitions (Location, Driver, RouteInfo)
├── app.json                        # Expo config plugins (Google Maps & Location)
├── .env                            # Environment variable (GOOGLE_MAPS_API_KEY & EXPO_PUBLIC_)
├── .env.example                    # Environment variable template
└── README.md
```

---

## 📄 License

MIT
