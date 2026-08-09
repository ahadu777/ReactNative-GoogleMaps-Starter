import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badgeColor: string;
  onPress: () => void;
};

export function FeatureCard({ title, description, iconName, badgeColor, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: badgeColor + '18' }]}>
        <Ionicons name={iconName} size={24} color={badgeColor} />
      </View>
      <ThemedView style={styles.textContainer}>
        <ThemedText type="default" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </ThemedView>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} style={styles.arrow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.three,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  arrow: {
    opacity: 0.6,
  },
});
