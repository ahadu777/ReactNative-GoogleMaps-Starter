import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Maps Playground',
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="basic-map"
          options={{ title: 'Basic Map' }}
        />
        <Stack.Screen
          name="places-search"
          options={{ title: 'Places Search' }}
        />
        <Stack.Screen
          name="directions"
          options={{ title: 'Directions' }}
        />
        <Stack.Screen
          name="custom-markers"
          options={{ title: 'Custom Markers' }}
        />
        <Stack.Screen
          name="driver-simulation"
          options={{ title: 'Driver Simulation' }}
        />
      </Stack>
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}

