import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeatureCard } from '@/components/feature-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PRIMARY_ACCENT = '#3B82F6';

const FEATURES = [
  {
    title: 'Basic Map',
    description: 'Map rendering, camera control & map types',
    iconName: 'map-outline' as const,
    badgeColor: '#3B82F6', // Blue
    route: '/basic-map' as const,
  },
  {
    title: 'Places Search',
    description: 'Google Places autocomplete & camera navigation',
    iconName: 'search-outline' as const,
    badgeColor: '#06B6D4', // Cyan
    route: '/places-search' as const,
  },
  {
    title: 'Directions',
    description: 'Polyline route drawing, distance & ETA metrics',
    iconName: 'navigate-outline' as const,
    badgeColor: '#F59E0B', // Amber
    route: '/directions' as const,
  },
  {
    title: 'Custom Markers',
    description: 'Styled user, driver & destination markers with legend',
    iconName: 'location-outline' as const,
    badgeColor: '#EC4899', // Pink / Rose
    route: '/custom-markers' as const,
  },
  {
    title: 'Driver Simulation',
    description: 'Haversine matching, route trail & live driver animation',
    iconName: 'car-sport-outline' as const,
    badgeColor: '#10B981', // Emerald Green
    route: '/driver-simulation' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.four },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.heroIconBadge, { backgroundColor: PRIMARY_ACCENT + '1F' }]}>
          <Ionicons name="compass-outline" size={36} color={PRIMARY_ACCENT} />
        </View>
        <ThemedText type="subtitle" style={styles.title}>
          Maps Playground
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Interactive React Native & Google Maps showcases
        </ThemedText>
      </View>

      <View style={styles.cards}>
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.route}
            title={feature.title}
            description={feature.description}
            iconName={feature.iconName}
            badgeColor={feature.badgeColor}
            onPress={() => router.push(feature.route)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  heroIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
  },
  cards: {
    gap: Spacing.three,
  },
});
