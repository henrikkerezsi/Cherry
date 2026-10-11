import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Divider, List, Text } from 'react-native-paper';
import { ScreenFade } from '../../components/screen-fade';
import { KeyboardAwareScrollView } from '../../components/keyboard-aware-scroll-view';
import { useAppData } from '../../data/DataProvider';
import { useAppTheme } from '../../theme';
import { BREWER_KIND_LABELS, METHOD_LABELS } from '../../utils/labels';

export default function BrewerDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { brewers, grindSettings, removeBrewer } = useAppData();

  const brewer = brewers.find((candidate) => candidate.id === Number(id));

  if (!brewer) {
    return (
      <>
        <Stack.Screen options={{ title: 'Equipment' }} />
        <ScreenFade>
          <View style={[styles.center, { padding: theme.spacing[6] }]}>
            <Text variant="bodyLarge">That equipment does not exist.</Text>
          </View>
        </ScreenFade>
      </>
    );
  }

  const settings = grindSettings.filter((setting) => setting.brewerId === brewer.id);

  return (
    <ScreenFade>
      <Stack.Screen options={{ title: brewer.name }} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Card mode="contained" style={styles.headerCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {BREWER_KIND_LABELS[brewer.kind]}
              {brewer.model ? ` · ${brewer.model}` : ''}
            </Text>
          </Card.Content>
        </Card>

        {brewer.methodId !== null ? (
          <List.Item
            title="Brew method"
            description={METHOD_LABELS[brewer.methodId]}
            left={(props) => <List.Icon {...props} icon="coffee" />}
          />
        ) : null}

        <List.Item
          title="Manufacturer"
          description={brewer.manufacturer ?? 'Not set'}
          left={(props) => <List.Icon {...props} icon="factory" />}
        />
        <List.Item
          title="Capacity"
          description={brewer.capacityMl === null ? 'Not set' : `${brewer.capacityMl} ml`}
          left={(props) => <List.Icon {...props} icon="cup-water" />}
        />
        <List.Item
          title="Material"
          description={brewer.material ?? 'Not set'}
          left={(props) => <List.Icon {...props} icon="layers-outline" />}
        />

        {settings.length > 0 ? (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.section}>
              Grind settings
            </Text>
            {settings.map((setting) => (
              <List.Item
                key={setting.id}
                title={setting.name}
                description={setting.selectionLabel ?? 'No selection label'}
                left={(props) => <List.Icon {...props} icon="tune" />}
                onPress={() => router.push(`/grinder/${setting.id}`)}
              />
            ))}
          </>
        ) : null}

        {brewer.notes ? (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleSmall" style={styles.notesTitle}>
              Notes
            </Text>
            <Text variant="bodyMedium">{brewer.notes}</Text>
          </>
        ) : null}

        <Divider style={styles.divider} />
        <Button
          mode="contained"
          icon="pencil"
          onPress={() => router.push(`/brewer/new?id=${brewer.id}`)}
        >
          Edit equipment
        </Button>
        <Button
          mode="text"
          textColor={theme.semantic.error}
          icon="delete-outline"
          onPress={async () => {
            await removeBrewer(brewer.id);
            router.back();
          }}
          style={styles.delete}
        >
          Remove equipment
        </Button>
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  notesTitle: {
    marginBottom: 6,
  },
  section: {
    marginBottom: 4,
  },
  delete: {
    marginTop: 8,
  },
});
