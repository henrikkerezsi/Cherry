import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput } from 'react-native-paper';
import type { AgitationKind, StepKind } from '../models';
import { AGITATION_KINDS, STEP_KIND_IDS } from '../models';
import { STEP_KIND_LABELS } from '../utils/labels';
import { useAppTheme } from '../theme';
import { NumberField } from './number-field';
import { OptionField } from './option-field';

export interface EditableStep {
  kind: StepKind | null;
  label: string | null;
  targetWaterG: number | null;
  pourWaterG: number | null;
  pourDurationS: number | null;
  waitAfterS: number | null;
  agitationCount: number | null;
  agitationKind: AgitationKind | null;
  temperatureC: number | null;
  note: string | null;
}

export const EMPTY_STEP: EditableStep = {
  kind: null,
  label: null,
  targetWaterG: null,
  pourWaterG: null,
  pourDurationS: null,
  waitAfterS: null,
  agitationCount: null,
  agitationKind: null,
  temperatureC: null,
  note: null,
};

const STEP_KIND_OPTIONS = STEP_KIND_IDS.map((value) => ({
  value,
  label: STEP_KIND_LABELS[value],
}));

const AGITATION_OPTIONS = AGITATION_KINDS.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

interface StepListEditorProps {
  steps: EditableStep[];
  onChange: (steps: EditableStep[]) => void;
}

export function StepListEditor({ steps, onChange }: StepListEditorProps) {
  const theme = useAppTheme();

  const updateStep = (index: number, patch: Partial<EditableStep>) => {
    onChange(steps.map((step, position) => (position === index ? { ...step, ...patch } : step)));
  };

  return (
    <View>
      {steps.map((step, index) => (
        <Card key={index} mode="outlined" style={styles.stepCard}>
          <Card.Content>
            <View style={styles.stepHeader}>
              <Text variant="labelLarge">Step {index + 1}</Text>
              <IconButton
                icon="delete-outline"
                size={20}
                accessibilityLabel={`Remove step ${index + 1}`}
                onPress={() => onChange(steps.filter((_, position) => position !== index))}
              />
            </View>
            <OptionField<StepKind>
              label="Kind"
              value={step.kind}
              options={STEP_KIND_OPTIONS}
              onChange={(value) => updateStep(index, { kind: value })}
              emptyLabel="Not set"
            />
            <TextInput
              label="Label"
              mode="outlined"
              value={step.label ?? ''}
              onChangeText={(text) => updateStep(index, { label: text || null })}
              style={styles.field}
            />
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <NumberField
                  label="Target water"
                  value={step.targetWaterG}
                  onChange={(value) => updateStep(index, { targetWaterG: value })}
                  unit="g"
                />
              </View>
              <View style={styles.gridItem}>
                <NumberField
                  label="Pour water"
                  value={step.pourWaterG}
                  onChange={(value) => updateStep(index, { pourWaterG: value })}
                  unit="g"
                />
              </View>
              <View style={styles.gridItem}>
                <NumberField
                  label="Pour time"
                  value={step.pourDurationS}
                  onChange={(value) => updateStep(index, { pourDurationS: value })}
                  unit="s"
                  integer
                />
              </View>
              <View style={styles.gridItem}>
                <NumberField
                  label="Wait"
                  value={step.waitAfterS}
                  onChange={(value) => updateStep(index, { waitAfterS: value })}
                  unit="s"
                  integer
                />
              </View>
              <View style={styles.gridItem}>
                <NumberField
                  label="Agitations"
                  value={step.agitationCount}
                  onChange={(value) => updateStep(index, { agitationCount: value })}
                  integer
                />
              </View>
              <View style={styles.gridItem}>
                <OptionField<AgitationKind>
                  label="Agitation"
                  value={step.agitationKind}
                  options={AGITATION_OPTIONS}
                  onChange={(value) => updateStep(index, { agitationKind: value })}
                  emptyLabel="Not set"
                />
              </View>
            </View>
            <TextInput
              label="Note"
              mode="outlined"
              value={step.note ?? ''}
              onChangeText={(text) => updateStep(index, { note: text || null })}
              style={styles.field}
            />
          </Card.Content>
        </Card>
      ))}
      <Button
        mode="outlined"
        icon="plus"
        onPress={() => onChange([...steps, { ...EMPTY_STEP }])}
        textColor={theme.colors.primary}
      >
        Add step
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  gridItem: {
    width: '50%',
    paddingRight: 6,
    marginTop: 12,
  },
  stepCard: {
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
