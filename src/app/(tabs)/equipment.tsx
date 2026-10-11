import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Button, Divider, List, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ScreenFade } from '../../components/screen-fade';
import { KeyboardAwareScrollView } from '../../components/keyboard-aware-scroll-view';
import { EmptyState } from '../../components/empty-state';
import { useAppData } from '../../data/DataProvider';
import { useAppTheme } from '../../theme';
import { BREWER_KINDS } from '../../models';
import type { Brewer, BrewerKind } from '../../models';
import { BREWER_KIND_LABELS } from '../../utils/labels';

const KIND_ICONS: Record<BrewerKind, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  dripper: 'coffee-maker-outline',
  kettle: 'kettle-outline',
  scale: 'weight-gram',
  grinder: 'cog-outline',
  press: 'coffee-maker-outline',
  filter: 'filter-variant',
  carafe: 'coffee-maker-outline',
  portafilter: 'coffee-maker-outline',
  moka: 'coffee-maker-outline',
  cup: 'coffee-outline',
  other: 'tools',
};

function brewerDescription(brewer: Brewer): string {
  const parts = [brewer.manufacturer, brewer.model].filter(
    (part): part is string => part !== null && part.trim() !== ''
  );
  return parts.length > 0 ? parts.join(' · ') : BREWER_KIND_LABELS[brewer.kind];
}

export default function EquipmentScreen() {
  const theme = useAppTheme();
  const { brewers, grindSettings } = useAppData();

  const groups = useMemo(() => {
    const byKind = new Map<BrewerKind, Brewer[]>();
    for (const brewer of brewers) {
      const existing = byKind.get(brewer.kind);
      if (existing) {
        existing.push(brewer);
      } else {
        byKind.set(brewer.kind, [brewer]);
      }
    }
    return BREWER_KINDS.filter((kind) => byKind.has(kind)).map((kind) => ({
      kind,
      items: byKind.get(kind) ?? [],
    }));
  }, [brewers]);

  return (
    <ScreenFade>
      <Stack.Screen options={{ title: 'Equipment' }} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Button
          mode="contained"
          icon="plus"
          onPress={() => router.push('/brewer/new')}
          style={styles.addButton}
          testID="equipment-add"
        >
          Add equipment
        </Button>

        {brewers.length === 0 ? (
          <EmptyState
            icon={
              <MaterialCommunityIcons
                name="coffee-maker-outline"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
            }
            message="No equipment yet. Add your drippers, kettles, grinders and scales."
            actionLabel="Add equipment"
            onAction={() => router.push('/brewer/new')}
          />
        ) : (
          groups.map((group) => (
            <View key={group.kind}>
              <Text variant="titleSmall" style={styles.subhead}>
                {BREWER_KIND_LABELS[group.kind]}
              </Text>
              {group.items.map((brewer) => (
                <List.Item
                  key={brewer.id}
                  title={brewer.name}
                  description={brewerDescription(brewer)}
                  left={(props) => <List.Icon {...props} icon={KIND_ICONS[brewer.kind]} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push(`/brewer/${brewer.id}`)}
                />
              ))}
            </View>
          ))
        )}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Grind settings
        </Text>
        {grindSettings.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No grind settings yet.
          </Text>
        ) : (
          grindSettings.map((setting) => (
            <List.Item
              key={setting.id}
              title={setting.name}
              description={setting.selectionLabel ?? 'No selection label'}
              left={(props) => <List.Icon {...props} icon="tune-variant" />}
              onPress={() => router.push(`/grinder/${setting.id}`)}
            />
          ))
        )}
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => router.push('/grinder/new')}
          style={styles.addButton}
          testID="equipment-add-grind-setting"
        >
          Add grind setting
        </Button>

        <View style={styles.spacer} />
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 4,
  },
  subhead: {
    marginTop: 16,
    marginBottom: 4,
  },
  addButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 16,
  },
  spacer: {
    height: 24,
  },
});
