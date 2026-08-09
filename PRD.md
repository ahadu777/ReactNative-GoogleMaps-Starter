📄 Product Requirements Document (PRD)
🧭 Product Name

React Native Maps Playground (Demo Maps Lab)

🎯 Objective

Build a React Native demo application that showcases advanced usage of Google Maps, including:

Map rendering
Location search with autocomplete
Route drawing with directions API
Custom markers/icons
Driver matching simulation (nearest + sequential assignment)

This project is intended for:

Portfolio demonstration
Reusable foundation for Demo features (flight paths, airport mapping)
🏗️ Tech Stack
Core
React Native (Expo preferred)
TypeScript
Libraries
react-native-maps
react-native-google-places-autocomplete
react-native-maps-directions
expo-location (or community geolocation)
APIs
Google Maps SDK
Google Places API
Google Directions API
🔑 Configuration Requirements
Environment Variables

check .env:

GOOGLE_MAPS_API_KEY=your_api_key_here
API Enablement (Google Cloud)

Enable:

Maps SDK for Android/iOS
Places API
Directions API
📱 App Structure
Navigation

Use simple stack or tab navigation:

Home
 ├── Basic Map
 ├── Places Search
 ├── Directions
 ├── Custom Markers
 └── Driver Simulation
📦 Functional Modules
1️⃣ Module: Basic Map Rendering
🎯 Goal

Display a map centered on a default location.

Functional Requirements
Render MapView
Set default region (Addis Ababa preferred)
Show user location (if permission granted)
Add a static marker
Acceptance Criteria
Map loads without crash
Marker is visible
User location toggles correctly
2️⃣ Module: Places Autocomplete Search
🎯 Goal

Allow user to search for locations using Google Places API.

Functional Requirements
Input search field
Autocomplete suggestions
On selection:
Extract latitude & longitude
Move map camera to selected place
Place a marker
Acceptance Criteria
Suggestions appear as user types
Selecting a suggestion updates the map
Marker updates correctly
3️⃣ Module: Directions & Routing
🎯 Goal

Draw route between two points.

Functional Requirements
Two inputs:
Origin
Destination
Fetch route using Directions API
Render polyline on map
Optional Enhancements
Display:
Distance
Duration
Acceptance Criteria
Route renders correctly
Updates when origin/destination changes
4️⃣ Module: Custom Markers
🎯 Goal

Render map markers with custom icons.

Functional Requirements
Replace default marker with custom image
Support multiple marker types:
User
Driver
Destination
Acceptance Criteria
Icons render correctly on both platforms
Marker positions are accurate
5️⃣ Module: Driver Matching Simulation (Core Feature)
🎯 Goal

Simulate ride-hailing logic:
Find and assign nearest driver to user.

Functional Requirements
Data Model
type Location = {
  latitude: number;
  longitude: number;
};

type Driver = {
  id: string;
  location: Location;
  status: 'idle' | 'assigned';
};
Simulation Setup
Generate N drivers (5–20)
Randomize positions around user
Core Logic
Distance Calculation
distance = sqrt((lat1 - lat2)^2 + (lng1 - lng2)^2)
Matching Algorithm
Find nearest driver to user
Assign driver
Mark status = "assigned"
Sequential Matching (Advanced)
Simulate multiple ride requests
Assign drivers in sequence
Skip already assigned drivers
Animation
Animate driver moving toward user
Use AnimatedRegion
Acceptance Criteria
Drivers appear on map
Nearest driver is correctly selected
Assigned driver moves toward user
No duplicate assignment
🧠 Non-Functional Requirements
Performance
Map interactions must be smooth
Avoid unnecessary re-renders
Code Quality
Use TypeScript
Modular architecture
Clean separation:
UI
Logic
Services
📁 Folder Structure
src/
 ├── screens/
 ├── components/
 ├── services/
 ├── utils/
 ├── constants/
🔌 Services Layer
googleMaps.ts

Handles:

Places API
Directions API
simulation.ts

Handles:

Driver generation
Matching logic
Distance calculation
🧪 Testing Requirements
Test nearest driver logic
Test route rendering
Validate location parsing
📊 Future Enhancements (Demo Alignment)
Airport markers (from dataset)
Flight path visualization
Runway overlays
Real-time aircraft tracking (mocked)
🚀 Deliverables
Working React Native app
Clean GitHub repository
README with:
Setup steps
Features
Screenshots / GIF
✅ Definition of Done
All 5 modules implemented
No crashes
API integration works
Code is clean and structured
App runs on both Android & iOS (Expo acceptable)