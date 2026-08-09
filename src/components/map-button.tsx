import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: string;
};

export function MapButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
}: Props) {
  const theme = useTheme();

  const bgColor =
    variant === 'primary'
      ? '#3b82f6'
      : variant === 'danger'
        ? '#ef4444'
        : theme.backgroundElement;

  const textColor = variant === 'secondary' ? theme.text : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {icon && <ThemedText style={styles.icon}>{icon}</ThemedText>}
      <ThemedText style={[styles.text, { color: textColor }]}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
    gap: Spacing.two,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
