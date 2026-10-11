import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenFade } from '../components/screen-fade';
import { KeyboardAwareScrollView } from '../components/keyboard-aware-scroll-view';
import { useAppTheme } from '../theme';
import { whatsNew } from '../config/whats-new';
import { longDateLabel } from '../utils/date';

export default function WhatsNewScreen() {
  const theme = useAppTheme();

  return (
    <ScreenFade>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        {whatsNew.map((entry, index) => (
          <View
            key={entry.version}
            style={[styles.entry, index > 0 && { marginTop: theme.spacing[7] }]}
          >
            <Text variant="headlineSmall">What&apos;s new in {entry.version}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {longDateLabel(entry.releasedAt)}
            </Text>

            {entry.intro ? (
              <Text variant="bodyMedium" style={styles.intro}>
                {entry.intro}
              </Text>
            ) : null}

            {entry.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text
                  variant="bodyMedium"
                  style={[styles.bullet, { color: theme.colors.primary }]}
                >
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.feature}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  entry: {
    marginBottom: 8,
  },
  intro: {
    marginTop: 12,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
  },
  feature: {
    flex: 1,
  },
});