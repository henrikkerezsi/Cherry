import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { List, Text } from 'react-native-paper';
import { ScreenFade } from '../components/screen-fade';
import { KeyboardAwareScrollView } from '../components/keyboard-aware-scroll-view';
import { useAppTheme } from '../theme';
import { releaseInfo } from '../config/release-info';
import { GITHUB_REPO_URL } from '../config/repository';

export default function AboutScreen() {
  const theme = useAppTheme();

  return (
    <ScreenFade>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Cherry
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          A private coffee journal that tells you what to brew next.
        </Text>

        <Text variant="titleSmall" style={styles.section}>
          Version
        </Text>
        <Text variant="bodyMedium">{releaseInfo.version}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Build {releaseInfo.versionCode}
        </Text>

        <Text variant="titleSmall" style={styles.section}>
          Privacy
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          Everything you record is stored in one SQLite database on this device. There is no
          account, no server, no advertising, no analytics and no crash reporting.
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          The app works fully offline. The only network requests it ever makes are to an AI
          provider you configure yourself, and only when you invoke an AI feature. Your API key is
          stored only on this device and is stripped from every backup.
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          There is no on-device or local inference. Every AI operation is a cloud request you ask
          for.
        </Text>

        <Text variant="titleSmall" style={styles.section}>
          Source
        </Text>
        <List.Item
          title="View the source"
          description={GITHUB_REPO_URL}
          left={(props) => <List.Icon {...props} icon="github" />}
          onPress={() => Linking.openURL(GITHUB_REPO_URL)}
        />
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  title: {
    marginBottom: 4,
  },
  section: {
    marginTop: 24,
    marginBottom: 4,
  },
  body: {
    marginBottom: 12,
  },
});