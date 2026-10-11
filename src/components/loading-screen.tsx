import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { CherryLogo } from './cherry-logo';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <CherryLogo size={56} />
      <Text variant="bodyMedium" style={styles.label}>
        Cherry
      </Text>
      <ActivityIndicator size="small" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 12,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 13,
  },
  spinner: {
    marginTop: 16,
    opacity: 0.6,
  },
});
