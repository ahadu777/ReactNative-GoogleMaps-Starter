// Default export — re-uses native implementation.
// Platform-specific files:
//   google-maps.native.ts → used on iOS/Android
//   google-maps.web.ts    → used on Web (browser-safe via JS API)
export * from './google-maps.native';
