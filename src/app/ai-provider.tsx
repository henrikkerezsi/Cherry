import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  List,
  Portal,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { AppDialog } from '../components/app-dialog';
import { KeyboardAwareScrollView } from '../components/keyboard-aware-scroll-view';
import { ScreenFade } from '../components/screen-fade';
import { ScreenToast } from '../components/screen-toast';
import { useAppData } from '../data/DataProvider';
import { useAppTheme } from '../theme';
import { TRANSCRIPTION_ENGINES } from '../models';
import type { TranscriptionEngine } from '../models';
import { getAiUsageTotals } from '../database/extractionRuns';

const STT_ENGINE_LABELS: Record<TranscriptionEngine, string> = {
  'openai-compatible': 'Provider',
  android: 'Android',
  manual: 'Type it',
};

const STT_ENGINE_HELP: Record<TranscriptionEngine, string> = {
  manual:
    'You type or edit the transcript yourself. Nothing recorded is ever sent anywhere.',
  android:
    "Android's built-in speech recogniser does the work, so no key is needed and nothing leaves the device through this app.",
  'openai-compatible':
    'Audio is sent to your provider for transcription. The result is always a candidate, never a save.',
};

interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
  runCount: number;
}

export default function AiProviderScreen() {
  const theme = useAppTheme();
  const { aiState, saveAiState, clearAiCredentials, settings, saveSettings } = useAppData();
  const [toast, setToast] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  const [llmBaseUrl, setLlmBaseUrl] = useState(aiState.llmBaseUrl ?? '');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState(aiState.llmModel ?? '');
  const [sttBaseUrl, setSttBaseUrl] = useState(aiState.sttBaseUrl ?? '');
  const [sttApiKey, setSttApiKey] = useState('');
  const [sttModel, setSttModel] = useState(aiState.sttModel ?? '');
  const [sttLanguage, setSttLanguage] = useState(aiState.sttLanguage ?? '');

  useEffect(() => {
    void getAiUsageTotals().then((totals) =>
      setUsage({
        inputTokens: totals.inputTokens,
        outputTokens: totals.outputTokens,
        runCount: totals.runCount,
      })
    );
  }, []);

  const sttUsesProvider = aiState.sttEngine === 'openai-compatible';
  const llmComplete =
    trimmedOrNull(llmBaseUrl) !== null &&
    trimmedOrNull(llmModel) !== null &&
    (trimmedOrNull(llmApiKey) !== null || aiState.llmApiKey !== null);

  async function handleSave() {
    setSaving(true);
    try {
      await saveAiState({
        llmBaseUrl: trimmedOrNull(llmBaseUrl),
        llmModel: trimmedOrNull(llmModel),
        sttBaseUrl: trimmedOrNull(sttBaseUrl),
        sttModel: trimmedOrNull(sttModel),
        sttLanguage: trimmedOrNull(sttLanguage),
      });
      if (llmApiKey.trim() !== '') {
        await saveAiState({ llmApiKey: llmApiKey.trim() });
      }
      if (sttApiKey.trim() !== '') {
        await saveAiState({ sttApiKey: sttApiKey.trim() });
      }
      setLlmApiKey('');
      setSttApiKey('');
      setToast('AI settings saved');
    } catch {
      setToast('Could not save the AI settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenFade>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
      >
        <Card mode="outlined" style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium">
              AI is optional. The app is complete without it, and every field an AI feature can fill
              is also fillable by hand. Bring your own provider — Cherry ships with no
              provider, no key and no model, and contacts nothing until you ask it to.
            </Text>
            <Text variant="bodyMedium" style={styles.help}>
              Your key is stored only in this app&apos;s local database, is never logged, and is
              stripped from every backup.
            </Text>
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Title
            title="Extraction and narration"
            subtitle="An OpenAI-compatible chat endpoint"
          />
          <Card.Content>
            <TextInput
              label="Base URL"
              mode="outlined"
              value={llmBaseUrl}
              onChangeText={setLlmBaseUrl}
              placeholder="https://your-provider.example/v1"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              testID="ai-llm-base-url"
            />
            <View style={styles.field}>
              <TextInput
                label="API key"
                mode="outlined"
                value={llmApiKey}
                onChangeText={setLlmApiKey}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                testID="ai-llm-api-key"
              />
            </View>
            <View style={styles.field}>
              <TextInput
                label="Model"
                mode="outlined"
                value={llmModel}
                onChangeText={setLlmModel}
                autoCapitalize="none"
                autoCorrect={false}
                testID="ai-llm-model"
              />
            </View>

            <Divider style={styles.divider} />

            <List.Item
              title="Enable AI features"
              description={
                llmComplete
                  ? 'A base URL, a model and a key are all present.'
                  : 'Needs a base URL, a model and a key.'
              }
              left={(props) => <List.Icon {...props} icon="brain" />}
              right={() => (
                <Switch
                  value={aiState.enabled}
                  onValueChange={(value) => saveAiState({ enabled: value })}
                  testID="ai-llm-enabled"
                />
              )}
            />
            <List.Item
              title="Commit without asking"
              description="Skip the review screen when the extraction has no questions and nothing it is unsure about."
              left={(props) => <List.Icon {...props} icon="check-decagram-outline" />}
              right={() => (
                <Switch
                  value={settings.aiAutoAccept}
                  onValueChange={(value) => saveSettings({ aiAutoAccept: value })}
                  testID="ai-auto-accept"
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Title title="Transcription" subtitle="How recorded audio becomes text" />
          <Card.Content>
            <SegmentedButtons
              value={aiState.sttEngine}
              onValueChange={(value) =>
                saveAiState({ sttEngine: value as TranscriptionEngine })
              }
              buttons={TRANSCRIPTION_ENGINES.map((engine) => ({
                value: engine,
                label: STT_ENGINE_LABELS[engine],
              }))}
            />

            <Text variant="bodySmall" style={styles.help}>
              {STT_ENGINE_HELP[aiState.sttEngine]}
            </Text>

            {sttUsesProvider ? (
              <>
                <TextInput
                  label="Base URL"
                  mode="outlined"
                  value={sttBaseUrl}
                  onChangeText={setSttBaseUrl}
                  placeholder="https://your-provider.example/v1"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  testID="ai-stt-base-url"
                />
                <View style={styles.field}>
                  <TextInput
                    label="API key"
                    mode="outlined"
                    value={sttApiKey}
                    onChangeText={setSttApiKey}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="ai-stt-api-key"
                  />
                </View>
                <View style={styles.field}>
                  <TextInput
                    label="Transcription model"
                    mode="outlined"
                    value={sttModel}
                    onChangeText={setSttModel}
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="ai-stt-model"
                  />
                </View>
              </>
            ) : null}

            <View style={styles.field}>
              <TextInput
                label="Language hint (optional)"
                mode="outlined"
                value={sttLanguage}
                onChangeText={setSttLanguage}
                placeholder="en"
                autoCapitalize="none"
                autoCorrect={false}
                testID="ai-stt-language"
              />
            </View>
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Title title="Usage" subtitle="Everything the app has ever asked a provider" />
          <Card.Content>
            <Text variant="bodyMedium">
              {usage === null
                ? 'Reading usage…'
                : usage.runCount === 0
                  ? 'No AI request has been made yet.'
                  : `${usage.runCount} ${usage.runCount === 1 ? 'request' : 'requests'}, ${usage.inputTokens} input and ${usage.outputTokens} output tokens.`}
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          icon="key-remove"
          onPress={() => setConfirmClear(true)}
          style={styles.clearButton}
          testID="ai-clear-credentials"
        >
          Remove stored keys
        </Button>

        <Button
          mode="contained"
          icon="content-save-outline"
          onPress={handleSave}
          style={styles.saveButton}
          loading={saving}
          disabled={saving}
          testID="ai-save"
        >
          Save
        </Button>

        <Portal>
          <AppDialog visible={confirmClear} onDismiss={() => setConfirmClear(false)}>
            <AppDialog.Title>Remove stored keys?</AppDialog.Title>
            <AppDialog.Content>
              <Text variant="bodyMedium">
                Both API keys are deleted from this device. The base URLs and models stay, so you
                only have to paste the keys again.
              </Text>
            </AppDialog.Content>
            <AppDialog.Actions>
              <Button onPress={() => setConfirmClear(false)}>Cancel</Button>
              <Button
                onPress={async () => {
                  await clearAiCredentials();
                  setConfirmClear(false);
                  setLlmApiKey('');
                  setSttApiKey('');
                  setToast('Stored keys removed');
                }}
              >
                Remove
              </Button>
            </AppDialog.Actions>
          </AppDialog>
        </Portal>

        <ScreenToast visible={toast !== null} message={toast} onDismiss={() => setToast(null)} />
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

function trimmedOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
  },
  field: {
    marginTop: 12,
  },
  help: {
    marginTop: 12,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  clearButton: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 12,
  },
});