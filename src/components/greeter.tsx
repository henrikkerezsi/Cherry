import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import type { DailyGreeting } from '../services/greeting-service';

interface GreeterProps {
  greeting: DailyGreeting;
}

export function Greeter({ greeting }: GreeterProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.secondaryContainer,
          borderRadius: theme.radii.large,
          padding: theme.spacing[4],
        },
      ]}
    >
      <Text variant="titleMedium" style={[styles.hello, { color: theme.colors.onSurface }]}>
        {greeting.hello}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {greeting.pun}
      </Text>
      <Divider style={styles.divider} />
      <View style={styles.factRow}>
        <MaterialCommunityIcons
          name="coffee-outline"
          size={14}
          color={theme.colors.onSurfaceVariant}
          style={styles.factIcon}
        />
        <Text variant="bodySmall" style={[styles.fact, { color: theme.colors.onSurfaceVariant }]}>
          {greeting.fact}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  hello: {
    fontWeight: '700',
    marginBottom: 2,
  },
  divider: {
    marginVertical: 10,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  factIcon: {
    marginTop: 1,
    marginRight: 6,
  },
  fact: {
    flexShrink: 1,
    lineHeight: 18,
  },
});