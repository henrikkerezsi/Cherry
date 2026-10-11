import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { ScreenFade } from '../../components/screen-fade';
import { LoadingScreen } from '../../components/loading-screen';
import { TastingForm } from '../../components/tasting-form';
import { useAppData } from '../../data/DataProvider';
import { useAppTheme } from '../../theme';
import { getFlavourTagIdsForTasting } from '../../database/tastings';

export default function TastingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { brewId, id } = useLocalSearchParams<{ brewId: string; id?: string }>();
  const { ready, brews, tastings, addTasting, saveTasting } = useAppData();
  const [tagIds, setTagIds] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const brewNumericId = Number(brewId);
  const tastingId = id ? Number(id) : null;
  const existing =
    tastingId === null ? null : tastings.find((tasting) => tasting.id === tastingId) ?? null;

  useEffect(() => {
    let active = true;
    async function load() {
      if (tastingId === null) {
        setTagIds([]);
        return;
      }
      const loaded = await getFlavourTagIdsForTasting(tastingId);
      if (active) {
        setTagIds(loaded);
      }
    }
    if (ready) {
      void load();
    }
    return () => {
      active = false;
    };
  }, [ready, tastingId]);

  const brew = brews.find((candidate) => candidate.id === brewNumericId);

  if (!ready || tagIds === null) {
    return <LoadingScreen />;
  }

  if (!brew) {
    return (
      <>
        <Stack.Screen options={{ title: 'Tasting' }} />
        <ScreenFade>
          <View style={[styles.center, { padding: theme.spacing[6] }]}>
            <Text variant="bodyLarge">That brew does not exist.</Text>
          </View>
        </ScreenFade>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: existing ? 'Edit tasting' : 'Add a tasting' }} />
      <TastingForm
        brewId={brew.id}
        initial={existing}
        initialFlavourTagIds={tagIds}
        submitting={submitting}
        onSubmit={async (input) => {
          setSubmitting(true);
          try {
            if (existing) {
              await saveTasting(existing.id, input);
            } else {
              await addTasting(input);
            }
            router.back();
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
