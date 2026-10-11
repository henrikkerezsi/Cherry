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
import type { Brewer, BrewerKind, Method } from '../../models';
import { BREWER_KIND_LABELS, METHOD_LABELS } from '../../utils/labels';
import { availableMethods } from '../../services/equipment-service';

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

function unlockLabel(missing: readonly Method[]): string {
  if (missing.length <= 3) {
    return missing.map((method) => METHOD_LABELS[method.id]).join(', ');
  }
  return `${missing.length} more methods`;
}

export default function EquipmentScreen() {
  const theme = useAppTheme();
  const { brewers, grindSettings, methods } = useAppData();

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

  const { available, missing } = useMemo(() => {
    const ready = brewers.length > 0 ? availableMethods(brewers, methods) : [];
    const readyIds = new Set(ready.map((method) => method.id));
    return {
      available: ready,
      missing: methods.filter((method) => !readyIds.has(method.id)),
    };
  }, [brewers, methods]);

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

        {brewers.length > 0 ? (
          <>
            <Text variant="titleMedium" style={styles.brewReady}>
              Ready to brew
            </Text>
            {available.length === methods.length ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Every brew method is unlocked with your equipment.
              </Text>
            ) : (
              <>
                {available.map((method) => (
                  <List.Item
                    key={method.id}
                    title={METHOD_LABELS[method.id]}
                    left={(props) => <List.Icon {...props} icon="coffee" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => router.push(`/method/${method.id}`)}
                  />
                ))}
                <Button
                  mode="text"
                  icon="plus"
                  onPress={() => router.push('/brewer/new')}
                  style={styles.unlockButton}
                  testID="equipment-unlock"
                >
                  Add equipment to unlock {unlockLabel(missing)}
                </Button>
              </>
            )}
          </>
        ) : null}

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
  brewReady: {
    marginTop: 16,
    marginBottom: 4,
  },
  subhead: {
    marginTop: 16,
    marginBottom: 4,
  },
  unlockButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
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
