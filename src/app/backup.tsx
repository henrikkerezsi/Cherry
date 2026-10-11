import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Portal, Text } from 'react-native-paper';
import { AppDialog } from '../components/app-dialog';
import { KeyboardAwareScrollView } from '../components/keyboard-aware-scroll-view';
import { LoadingScreen } from '../components/loading-screen';
import { ScreenFade } from '../components/screen-fade';
import { ScreenToast } from '../components/screen-toast';
import { useAppData } from '../data/DataProvider';
import { useAppTheme } from '../theme';
import { pickBackupFile, restoreFromBackup, shareBackup } from '../utils/backup';
import { resetDatabase } from '../database/database';

export default function BackupScreen() {
  const theme = useAppTheme();
  const { ready, refresh } = useAppData();
  const [busy, setBusy] = useState(false);
  const [confirmUri, setConfirmUri] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <ScreenFade>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Card mode="elevated" style={styles.card}>
          <Card.Title title="Export backup" />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.text}>
              Creates a single file containing your entire Cherry dataset: roasters, beans,
              equipment, recipes, plans, brews, tastings and everything the app has learned. Keep it
              somewhere safe.
            </Text>
            <Text variant="bodyMedium" style={styles.text}>
              Your AI provider key is removed from the backup. Everything else, including the
              provider base URL and model, is kept, so a restore needs no reconfiguration beyond the
              key.
            </Text>
            <Button
              mode="contained"
              icon="share-variant-outline"
              disabled={busy}
              loading={busy}
              testID="backup-export"
              style={styles.button}
              onPress={handleExport}
            >
              Export backup
            </Button>
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Title title="Restore from backup" />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.text}>
              Pick a backup file to replace the current data. The restore overwrites everything on
              this device, including anything recorded since the backup was taken.
            </Text>
            <Button
              mode="outlined"
              icon="folder-open-outline"
              disabled={busy}
              testID="backup-pick"
              style={styles.button}
              onPress={handlePick}
            >
              Choose backup file
            </Button>
          </Card.Content>
        </Card>

        <Card mode="outlined" style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall">Tip</Text>
            <Text variant="bodyMedium" style={styles.text}>
              Export a backup before restoring, so the current data is never lost for good.
            </Text>
          </Card.Content>
        </Card>

        <Portal>
          <AppDialog visible={confirmUri !== null} onDismiss={() => setConfirmUri(null)}>
            <AppDialog.Title>Replace current data?</AppDialog.Title>
            <AppDialog.Content>
              <Text variant="bodyMedium">
                Every roaster, bean, recipe, plan, brew and tasting currently in the app will be
                replaced with the contents of the backup. This cannot be undone.
              </Text>
            </AppDialog.Content>
            <AppDialog.Actions>
              <Button onPress={() => setConfirmUri(null)}>Cancel</Button>
              <Button
                loading={busy}
                disabled={busy}
                testID="backup-restore-confirm"
                onPress={handleRestore}
              >
                Replace everything
              </Button>
            </AppDialog.Actions>
          </AppDialog>
        </Portal>

        <ScreenToast visible={toast !== null} message={toast} onDismiss={() => setToast(null)} />
      </KeyboardAwareScrollView>
    </ScreenFade>
  );

  async function handleExport() {
    setBusy(true);
    try {
      if (await shareBackup()) {
        setToast('Backup exported');
      } else {
        setToast('Sharing is not available on this device');
      }
    } catch {
      setToast('Could not create the backup');
    } finally {
      setBusy(false);
    }
  }

  async function handlePick() {
    setBusy(true);
    try {
      const file = await pickBackupFile();
      if (file) {
        setConfirmUri(file.uri);
      }
    } catch {
      setToast('Could not open the file picker');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    if (confirmUri === null) {
      return;
    }
    setBusy(true);
    try {
      await restoreFromBackup(confirmUri);
      await resetDatabase();
      await refresh();
      setToast('Backup restored');
    } catch {
      setToast('The backup could not be restored');
    } finally {
      setBusy(false);
      setConfirmUri(null);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
  },
  text: {
    marginBottom: 12,
  },
  button: {
    marginTop: 4,
  },
});