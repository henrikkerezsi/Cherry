import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Chip, List, Searchbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenFade } from '../../components/screen-fade';
import { KeyboardAwareScrollView } from '../../components/keyboard-aware-scroll-view';
import { EmptyState } from '../../components/empty-state';
import { useAppData } from '../../data/DataProvider';
import { useAppTheme } from '../../theme';
import type { Brew, BrewMethodId } from '../../models';
import { BREW_METHOD_IDS } from '../../models';
import { METHOD_LABELS } from '../../utils/labels';
import { dayLabel } from '../../utils/date';
import { primaryRating } from '../../services/tasting-service';

const MIN_RATING_OPTIONS = [3, 4, 5] as const;

export default function LogScreen() {
  const theme = useAppTheme();
  const { brews, tastings } = useAppData();
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<BrewMethodId | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);

  const ratingByBrew = useMemo(() => {
    const map = new Map<number, number | null>();
    for (const brew of brews) {
      map.set(
        brew.id,
        primaryRating(tastings.filter((tasting) => tasting.brewId === brew.id))
      );
    }
    return map;
  }, [brews, tastings]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return brews.filter((brew) => {
      if (methodFilter !== null && brew.methodId !== methodFilter) {
        return false;
      }
      const rating = ratingByBrew.get(brew.id) ?? null;
      if (minRating !== null && (rating === null || rating < minRating)) {
        return false;
      }
      if (needle === '') {
        return true;
      }
      const beanName = (brew.beanNameSnapshot ?? '').toLowerCase();
      if (beanName.includes(needle)) {
        return true;
      }
      if ((brew.notes ?? '').toLowerCase().includes(needle)) {
        return true;
      }
      return tastings.some(
        (tasting) =>
          tasting.brewId === brew.id && (tasting.notes ?? '').toLowerCase().includes(needle)
      );
    });
  }, [brews, tastings, methodFilter, minRating, query, ratingByBrew]);

  const groups = useMemo(() => {
    const result: { date: string; brews: Brew[] }[] = [];
    for (const brew of filtered) {
      const last = result[result.length - 1];
      if (last && last.date === brew.brewDate) {
        last.brews.push(brew);
      } else {
        result.push({ date: brew.brewDate, brews: [brew] });
      }
    }
    return result;
  }, [filtered]);

  return (
    <ScreenFade>
      <Stack.Screen options={{ title: 'Log' }} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Searchbar
          placeholder="Search beans and tasting notes"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            selected={methodFilter === null}
            onPress={() => setMethodFilter(null)}
            style={styles.chip}
          >
            All methods
          </Chip>
          {BREW_METHOD_IDS.map((methodId) => (
            <Chip
              key={methodId}
              selected={methodFilter === methodId}
              onPress={() =>
                setMethodFilter(methodFilter === methodId ? null : methodId)
              }
              style={styles.chip}
            >
              {METHOD_LABELS[methodId]}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            selected={minRating === null}
            onPress={() => setMinRating(null)}
            style={styles.chip}
          >
            Any rating
          </Chip>
          {MIN_RATING_OPTIONS.map((option) => (
            <Chip
              key={option}
              selected={minRating === option}
              onPress={() => setMinRating(minRating === option ? null : option)}
              style={styles.chip}
            >
              {`${option}+`}
            </Chip>
          ))}
        </ScrollView>

        {groups.length === 0 ? (
          <EmptyState
            icon={
              <MaterialCommunityIcons
                name="notebook-outline"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
            }
            message={
              brews.length === 0
                ? 'Your brew history will appear here, newest first.'
                : 'No brews match these filters.'
            }
            actionLabel={brews.length === 0 ? 'Log a brew' : undefined}
            onAction={brews.length === 0 ? () => router.push('/brew/new') : undefined}
          />
        ) : (
          groups.map((group) => (
            <View key={group.date}>
              <Text variant="labelLarge" style={styles.dayHeader}>
                {dayLabel(group.date)}
              </Text>
              {group.brews.map((brew) => (
                <BrewRow
                  key={brew.id}
                  brew={brew}
                  rating={ratingByBrew.get(brew.id) ?? null}
                />
              ))}
            </View>
          ))
        )}
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

function BrewRow({ brew, rating }: { brew: Brew; rating: number | null }) {
  const beanName = brew.beanNameSnapshot ?? 'No bean';
  return (
    <List.Item
      title={beanName}
      description={`${METHOD_LABELS[brew.methodId]} · ${volumeLabel(brew)} · ${
        rating === null ? 'Not rated' : `${rating} / 5`
      }`}
      left={(props) => <List.Icon {...props} icon="coffee-outline" />}
      onPress={() => router.push(`/brew/${brew.id}`)}
    />
  );
}

function volumeLabel(brew: Brew): string {
  if (brew.doseG !== null && brew.waterTotalG !== null) {
    return `${brew.doseG} g → ${brew.waterTotalG} g`;
  }
  if (brew.doseG !== null && brew.yieldG !== null) {
    return `${brew.doseG} g → ${brew.yieldG} g`;
  }
  if (brew.doseG !== null) {
    return `${brew.doseG} g`;
  }
  return 'No measurements';
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  search: {
    marginBottom: 12,
  },
  chips: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 8,
  },
  chip: {
    marginRight: 4,
  },
  dayHeader: {
    marginTop: 12,
    marginBottom: 2,
    opacity: 0.7,
  },
});
