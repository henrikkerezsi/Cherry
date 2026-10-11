import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme';

export const RATING_STOPS = [1, 2, 3, 4, 5] as const;
export type TasteRating = (typeof RATING_STOPS)[number];

export const RATING_LABELS: Record<TasteRating, string> = {
  1: 'Never again',
  2: 'Not for me',
  3: 'Fine',
  4: 'Really good',
  5: 'Best I have had',
};

const ICON_FOR_RATING: Record<TasteRating, string> = {
  1: 'star-off-outline',
  2: 'star-outline',
  3: 'star-half-full',
  4: 'star',
  5: 'star',
};

interface RatingSelectorProps {
  value: TasteRating | null;
  onChange: (rating: TasteRating) => void;
  disabled?: boolean;
  size?: number;
}

/**
 * The 1–5 taste rating of idea.txt §3.4. Three is the neutral midpoint, so an
 * unrated brew resting on the middle stop still reads as "no strong opinion".
 */
export function RatingSelector({
  value,
  onChange,
  disabled = false,
  size = 22,
}: RatingSelectorProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {RATING_STOPS.map((rating) => {
        const selected = value === rating;
        return (
          <Pressable
            key={rating}
            onPress={() => onChange(rating)}
            disabled={disabled}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${rating} of 5, ${RATING_LABELS[rating]}`}
            testID={`rating-${rating}`}
            style={({ pressed }) => [
              styles.stop,
              { borderRadius: theme.radii.pill, marginRight: theme.spacing[2] },
              selected
                ? { backgroundColor: theme.colors.primary, opacity: disabled ? 0.4 : 1 }
                : {
                    backgroundColor: theme.colors.surfaceVariant,
                    opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
                  },
            ]}
          >
            <MaterialCommunityIcons
              name={ICON_FOR_RATING[rating] as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
              size={size}
              color={selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stop: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function ratingLabel(rating: number | null): string {
  if (rating === null || rating < 1 || rating > 5) {
    return 'Not rated';
  }
  return RATING_LABELS[rating as TasteRating];
}