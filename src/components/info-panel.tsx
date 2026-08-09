import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  items: { label: string; value: string }[];
};

export function InfoPanel({ items }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
      ]}
    >
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.item,
            index < items.length - 1 && {
              borderRightWidth: 1,
              borderRightColor: theme.backgroundSelected,
            },
          ]}
        >
          <ThemedText type="small" themeColor="textSecondary">
            {item.label}
          </ThemedText>
          <ThemedText type="default" style={styles.value}>
            {item.value}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    gap: 2,
  },
  value: {
    fontWeight: '700',
    fontSize: 16,
  },
});
