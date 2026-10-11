import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Card, Divider, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenFade } from '../../components/screen-fade';
import { KeyboardAwareScrollView } from '../../components/keyboard-aware-scroll-view';
import { useAppData } from '../../data/DataProvider';
import { useAppTheme } from '../../theme';
import { BREW_METHOD_IDS } from '../../models';
import type { BrewMethodId, HealthyRange } from '../../models';
import { methodLabel } from '../../utils/labels';
import { getMethodGuide } from '../../config/method-guides';

function rangeText(range: HealthyRange, unit: string): string {
  if (range.min === null && range.max === null) {
    return 'not controlled';
  }
  if (range.min !== null && range.max !== null) {
    return `${range.min}–${range.max}${unit}`;
  }
  if (range.min !== null) {
    return `at least ${range.min}${unit}`;
  }
  return `at most ${range.max}${unit}`;
}

export default function MethodDetailScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes } = useAppData();

  const methodId = BREW_METHOD_IDS.find((candidate) => candidate === id);
  if (!methodId) {
    return (
      <>
        <Stack.Screen options={{ title: 'Method' }} />
        <ScreenFade>
          <View style={[styles.missing, { padding: theme.spacing[6] }]}>
            <Text variant="bodyLarge">That method does not exist.</Text>
          </View>
        </ScreenFade>
      </>
    );
  }

  const guide = getMethodGuide(methodId as BrewMethodId);
  const canonical = recipes.find(
    (recipe) => recipe.isBuiltin && recipe.methodId === methodId
  );

  return (
    <ScreenFade>
      <Stack.Screen options={{ title: methodLabel(methodId) }} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Text variant="bodyLarge" style={styles.summary}>
          {guide.summary}
        </Text>

        <Text variant="titleMedium" style={styles.section}>
          Technique
        </Text>
        {guide.technique.map((line, index) => (
          <View key={line} style={styles.step}>
            <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
              {index + 1}
            </Text>
            <Text variant="bodyMedium" style={styles.stepText}>
              {line}
            </Text>
          </View>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.section}>
          Healthy ranges
        </Text>
        <View style={styles.rangeRow}>
          <Text variant="bodyMedium">Dose</Text>
          <Text variant="bodyMedium" style={styles.rangeValue}>
            {rangeText(guide.healthy.doseG, ' g')}
          </Text>
        </View>
        <View style={styles.rangeRow}>
          <Text variant="bodyMedium">Ratio</Text>
          <Text variant="bodyMedium" style={styles.rangeValue}>
            {rangeText(guide.healthy.ratio, ':1')}
          </Text>
        </View>
        <View style={styles.rangeRow}>
          <Text variant="bodyMedium">Water temperature</Text>
          <Text variant="bodyMedium" style={styles.rangeValue}>
            {rangeText(guide.healthy.waterTempC, ' °C')}
          </Text>
        </View>
        <View style={styles.rangeRow}>
          <Text variant="bodyMedium">Total time</Text>
          <Text variant="bodyMedium" style={styles.rangeValue}>
            {rangeText(guide.healthy.totalTimeS, ' s')}
          </Text>
        </View>

        {canonical ? (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.section}>
              Canonical recipe
            </Text>
            <Card mode="outlined" onPress={() => router.push(`/recipe/${canonical.id}`)}>
              <Card.Content>
                <View style={styles.canonicalRow}>
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text variant="titleMedium" style={styles.canonicalName}>
                    {canonical.name}
                  </Text>
                </View>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {guide.canonicalRecipeName}
                </Text>
              </Card.Content>
            </Card>
          </>
        ) : null}
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    opacity: 0.85,
    marginBottom: 16,
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepText: {
    flex: 1,
    marginLeft: 10,
  },
  divider: {
    marginVertical: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rangeValue: {
    fontVariant: ['tabular-nums'],
  },
  canonicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  canonicalName: {
    marginLeft: 8,
  },
});
