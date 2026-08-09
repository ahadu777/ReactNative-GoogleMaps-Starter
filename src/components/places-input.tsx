import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchPlaceDetails, fetchPlacePredictions } from '@/services/google-maps';
import type { Location, PlacePrediction } from '@/types';

type Props = {
  placeholder?: string;
  value?: string;
  onPlaceSelected: (location: Location, description: string) => void;
  biasLocation?: Location;
  rightElement?: React.ReactNode;
};

export function PlacesInput({ placeholder = 'Search a place...', value, onPlaceSelected, biasLocation, rightElement }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState(value ?? '');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2 || query === value) {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await fetchPlacePredictions(query, biasLocation);
      setPredictions(results);
      setShowResults(results.length > 0);
      setLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, biasLocation, value]);

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      setShowResults(false);
      setQuery(prediction.description);
      const location = fetchPlaceDetails ? await fetchPlaceDetails(prediction.place_id) : null;
      if (location) {
        onPlaceSelected(location, prediction.description);
      }
    },
    [onPlaceSelected]
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
          },
        ]}
      >
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          onFocus={() => predictions.length > 0 && setShowResults(true)}
        />
        {loading && <ActivityIndicator size="small" color={theme.textSecondary} />}
        {rightElement}
      </View>

      {showResults && (
        <View
          style={[
            styles.resultsList,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.backgroundSelected,
            },
          ]}
        >
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.resultItem,
                  {
                    backgroundColor: pressed
                      ? theme.backgroundSelected
                      : 'transparent',
                  },
                ]}
              >
                <ThemedText style={styles.resultIcon}>📍</ThemedText>
                <View style={styles.resultText}>
                  <ThemedText type="small" numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    numberOfLines={1}
                    style={styles.secondaryText}
                  >
                    {item.structured_formatting.secondary_text}
                  </ThemedText>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 48,
    gap: Spacing.two,
  },
  searchIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  resultsList: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 250,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    gap: Spacing.two,
  },
  resultIcon: {
    fontSize: 16,
  },
  resultText: {
    flex: 1,
  },
  secondaryText: {
    fontSize: 12,
  },
});
