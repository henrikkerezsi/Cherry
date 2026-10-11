import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Divider, List, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { ScreenFade } from '../../components/screen-fade';
import { KeyboardAwareScrollView } from '../../components/keyboard-aware-scroll-view';
import { NumberField } from '../../components/number-field';
import { OptionField } from '../../components/option-field';
import { useAppData } from '../../data/DataProvider';
import { useAppTheme } from '../../theme';
import { BREW_METHOD_IDS } from '../../models';
import type { BrewMethodId, ThemeMode } from '../../models';
import { releaseInfo } from '../../config/release-info';
import { METHOD_LABELS } from '../../utils/labels';

const METHOD_OPTIONS = BREW_METHOD_IDS.map((value) => ({
  value,
  label: METHOD_LABELS[value],
}));

export default function SettingsScreen() {
  const { settings, aiState, roasters, saveSettings } = useAppData();
  const theme = useAppTheme();

  return (
    <ScreenFade>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Text variant="titleMedium" style={styles.section}>
          Appearance
        </Text>
        <SegmentedButtons
          value={settings.themeMode}
          onValueChange={(value) => saveSettings({ themeMode: value as ThemeMode })}
          buttons={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Coffee
        </Text>
        <OptionField<BrewMethodId>
          label="Default method"
          value={settings.defaultMethodId}
          options={METHOD_OPTIONS}
          onChange={(value) => saveSettings({ defaultMethodId: value })}
          emptyLabel="No default"
        />
        <View style={styles.field}>
          <NumberField
            label="Bean freshness nudge"
            value={settings.beanFreshnessWarningDays}
            onChange={(value) =>
              saveSettings({ beanFreshnessWarningDays: value ?? settings.beanFreshnessWarningDays })
            }
            unit="days"
            integer
          />
        </View>
        <View style={styles.field}>
          <NumberField
            label="Low bean threshold"
            value={settings.lowBeanThresholdG}
            onChange={(value) =>
              saveSettings({ lowBeanThresholdG: value ?? settings.lowBeanThresholdG })
            }
            unit="g"
          />
        </View>

        <Text variant="titleSmall" style={styles.subhead}>
          Roasters
        </Text>
        {roasters.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No roasters yet.
          </Text>
        ) : (
          roasters.map((roaster) => (
            <List.Item
              key={roaster.id}
              title={roaster.name}
              description={roaster.location ?? 'No location'}
              left={(props) => <List.Icon {...props} icon="store-outline" />}
              onPress={() => router.push(`/roaster/${roaster.id}`)}
            />
          ))
        )}
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => router.push('/roaster/new')}
          style={styles.addButton}
        >
          Add roaster
        </Button>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Recording
        </Text>
        <List.Item
          title="Keep audio"
          description="Audio is retained so a memo can be re-transcribed later."
          right={() => (
            <Switch
              value={settings.audioRetention === 'keep'}
              onValueChange={handleKeepAudio}
            />
          )}
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Notifications
        </Text>
        <List.Item
          title="Enable notifications"
          description="Bean freshness, low bean and unlogged-session reminders."
          right={() => (
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => saveSettings({ notificationsEnabled: value })}
            />
          )}
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          AI provider
        </Text>
        <List.Item
          title="Provider and keys"
          description={
            aiState.enabled
              ? 'A provider is configured. Credentials are stored only on this device.'
              : 'Not configured. The app works fully offline without it.'
          }
          left={(props) => <List.Icon {...props} icon="brain" />}
          onPress={() => router.push('/ai-provider')}
          testID="settings-ai-provider"
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Data
        </Text>
        <List.Item
          title="Backup and restore"
          description="Export the whole database as one file, or restore from one."
          left={(props) => <List.Icon {...props} icon="database-export-outline" />}
          onPress={() => router.push('/backup')}
          testID="settings-backup"
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Help
        </Text>
        <List.Item
          title="Tour"
          description="What Cherry does, and how it stays private."
          left={(props) => <List.Icon {...props} icon="compass-outline" />}
          onPress={() => router.push('/tutorial')}
          testID="settings-tutorial"
        />
        <List.Item
          title="What's new"
          description={`Version ${releaseInfo.version}`}
          left={(props) => <List.Icon {...props} icon="star-four-points" />}
          onPress={() => router.push('/whats-new')}
          testID="settings-whats-new"
        />
        <List.Item
          title="About"
          description="Version, privacy and source."
          left={(props) => <List.Icon {...props} icon="information-outline" />}
          onPress={() => router.push('/about')}
          testID="settings-about"
        />
        <View style={styles.spacer} />
      </KeyboardAwareScrollView>
    </ScreenFade>
  );

  function handleKeepAudio(value: boolean) {
    saveSettings({ audioRetention: value ? 'keep' : 'delete-after-commit' });
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 8,
  },
  subhead: {
    marginTop: 16,
    marginBottom: 4,
  },
  field: {
    marginTop: 12,
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
