import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Button,
  List,
  Modal,
  Portal,
  RadioButton,
  Searchbar,
  Text,
} from 'react-native-paper';
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
import { availableMethods } from '../../services/equipment-service';

const MIN_RATING_OPTIONS = [3, 4, 5] as const;
const ALL_METHODS = 'all' as const;

export default function LogScreen() {
  const theme = useAppTheme();
  const { brews, tastings, brewers, methods } = useAppData();
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<BrewMethodId | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);

  const availableMethodIds = useMemo(
    () => availableMethods(brewers, methods).map((method) => method.id),
    [brewers, methods]
  );

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

  const activeFilterCount =
    (methodFilter === null ? 0 : 1) + (minRating === null ? 0 : 1);
  const resultCount =
    filtered.length === brews.length
      ? `${brews.length} brews`
      : `${filtered.length} of ${brews.length} brews`;

  const clearFilters = () => {
    setMethodFilter(null);
    setMinRating(null);
  };

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

        <View style={styles.controls}>
          <Button
            mode="outlined"
            compact
            icon="filter-variant"
            onPress={() => setFilterVisible(true)}
            accessibilityLabel={
              activeFilterCount > 0
                ? `Filter, ${activeFilterCount} active`
                : 'Filter brew list'
            }
          >
            {activeFilterCount > 0 ? `Filter · ${activeFilterCount}` : 'Filter'}
          </Button>
          {activeFilterCount > 0 ? (
            <Button
              mode="text"
              compact
              onPress={clearFilters}
              accessibilityLabel="Clear all filters"
            >
              Clear
            </Button>
          ) : null}
          <Text variant="labelMedium" style={styles.count}>
            {resultCount}
          </Text>
        </View>

        <FilterModal
          visible={filterVisible}
          methodFilter={methodFilter}
          minRating={minRating}
          availableMethodIds={availableMethodIds}
          onMethodChange={setMethodFilter}
          onRatingChange={setMinRating}
          onClear={clearFilters}
          onClose={() => setFilterVisible(false)}
        />

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

interface FilterModalProps {
  visible: boolean;
  methodFilter: BrewMethodId | null;
  minRating: number | null;
  availableMethodIds: BrewMethodId[];
  onMethodChange: (method: BrewMethodId | null) => void;
  onRatingChange: (rating: number | null) => void;
  onClear: () => void;
  onClose: () => void;
}

function FilterModal({
  visible,
  methodFilter,
  minRating,
  availableMethodIds,
  onMethodChange,
  onRatingChange,
  onClear,
  onClose,
}: FilterModalProps) {
  const theme = useAppTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modal,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.large,
            padding: theme.spacing[5],
            marginHorizontal: theme.spacing[4],
          },
        ]}
      >
        <Text variant="titleMedium" style={styles.modalTitle}>
          Filter
        </Text>
        <ScrollView style={styles.modalBody}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Method
          </Text>
          <RadioButton.Group
            value={methodFilter === null ? ALL_METHODS : methodFilter}
            onValueChange={(value) =>
              onMethodChange(value === ALL_METHODS ? null : (value as BrewMethodId))
            }
          >
            <RadioButton.Item label="Any method" value={ALL_METHODS} />
            {BREW_METHOD_IDS.filter(
              (id) => availableMethodIds.includes(id) || id === methodFilter
            ).map((methodId) => (
              <RadioButton.Item
                key={methodId}
                label={METHOD_LABELS[methodId]}
                value={methodId}
              />
            ))}
          </RadioButton.Group>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Minimum rating
          </Text>
          <RadioButton.Group
            value={minRating === null ? 'any' : String(minRating)}
            onValueChange={(value) =>
              onRatingChange(value === 'any' ? null : Number(value))
            }
          >
            <RadioButton.Item label="Any rating" value="any" />
            {MIN_RATING_OPTIONS.map((option) => (
              <RadioButton.Item
                key={option}
                label={`${option} stars or more`}
                value={String(option)}
              />
            ))}
          </RadioButton.Group>
        </ScrollView>
        <View style={styles.modalActions}>
          <Button mode="text" onPress={onClear} accessibilityLabel="Clear all filters">
            Clear
          </Button>
          <Button mode="contained" onPress={onClose} accessibilityLabel="Apply filters">
            Apply
          </Button>
        </View>
      </Modal>
    </Portal>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  count: {
    marginLeft: 12,
    opacity: 0.7,
  },
  modal: {
  },
  modalTitle: {
    marginBottom: 12,
  },
  modalBody: {
    maxHeight: 380,
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 2,
    opacity: 0.7,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  dayHeader: {
    marginTop: 12,
    marginBottom: 2,
    opacity: 0.7,
  },
});