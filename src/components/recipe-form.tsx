import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import type { BrewMethodId, GrindUnit, Recipe } from '../models';
import { GRIND_UNITS } from '../models';
import type { RecipeInput, RecipeStepInput } from '../database/recipes';
import { useAppData } from '../data/DataProvider';
import { useAppTheme } from '../theme';
import { GRIND_UNIT_LABELS, METHOD_LABELS } from '../utils/labels';
import { availableMethods, compatibleBrewers, methodById } from '../services/equipment-service';
import { KeyboardAwareScrollView } from './keyboard-aware-scroll-view';
import { NumberField } from './number-field';
import { OptionField } from './option-field';
import { StepListEditor } from './step-list-editor';

interface RecipeFormProps {
  initial: Recipe | null;
  initialSteps: RecipeStepInput[];
  submitting: boolean;
  onSubmit: (input: RecipeInput) => Promise<void>;
}

const GRIND_UNIT_OPTIONS = GRIND_UNITS.map((value) => ({
  value,
  label: GRIND_UNIT_LABELS[value],
}));

export function RecipeForm({
  initial,
  initialSteps,
  submitting,
  onSubmit,
}: RecipeFormProps) {
  const theme = useAppTheme();
  const { brewers, beans, grindSettings, methods } = useAppData();

  const methodOptions = availableMethods(brewers, methods).map((method) => ({
    value: method.id,
    label: METHOD_LABELS[method.id],
  }));
  if (
    initial?.methodId !== null &&
    initial?.methodId !== undefined &&
    !methodOptions.some((option) => option.value === initial.methodId)
  ) {
    methodOptions.push({ value: initial.methodId, label: METHOD_LABELS[initial.methodId] });
  }

  const [name, setName] = useState(initial?.name ?? '');
  const [methodId, setMethodId] = useState<BrewMethodId>(
    initial?.methodId ?? availableMethods(brewers, methods)[0]?.id ?? 'v60'
  );
  const [brewerId, setBrewerId] = useState<number | null>(initial?.brewerId ?? null);
  const [beanId, setBeanId] = useState<number | null>(initial?.beanId ?? null);
  const [doseG, setDoseG] = useState<number | null>(initial?.doseG ?? null);
  const [waterTotalG, setWaterTotalG] = useState<number | null>(
    initial?.waterTotalG ?? null
  );
  const [waterTempC, setWaterTempC] = useState<number | null>(
    initial?.waterTempC ?? null
  );
  const [grinderId, setGrinderId] = useState<number | null>(initial?.grinderId ?? null);
  const [grindSettingId, setGrindSettingId] = useState<number | null>(
    initial?.grindSettingId ?? null
  );
  const [grindValue, setGrindValue] = useState<number | null>(initial?.grindValue ?? null);
  const [grindUnit, setGrindUnit] = useState<GrindUnit | null>(
    initial?.grindUnit ?? null
  );
  const [expectedTotalTimeS, setExpectedTotalTimeS] = useState<number | null>(
    initial?.expectedTotalTimeS ?? null
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [steps, setSteps] = useState<RecipeStepInput[]>(initialSteps);
  const [error, setError] = useState<string | null>(null);

  const brewerOptions = useMemo(() => {
    const method = methodById(methodId, methods);
    const compatible = method === null ? [] : compatibleBrewers(brewers, method);
    const compatibleIds = new Set(compatible.map((brewer) => brewer.id));
    const keepCurrent = brewers.filter(
      (brewer) => brewer.id === brewerId && !compatibleIds.has(brewer.id)
    );
    return [...compatible, ...keepCurrent].map((brewer) => ({
      value: brewer.id,
      label: brewer.name,
    }));
  }, [brewers, methods, methodId, brewerId]);
  const beanOptions = beans.map((bean) => ({ value: bean.id, label: bean.name }));
  const grinderOptions = brewers
    .filter((brewer) => brewer.kind === 'grinder')
    .map((brewer) => ({ value: brewer.id, label: brewer.name }));
  const settingOptions = grindSettings
    .filter((setting) => grinderId === null || setting.brewerId === grinderId)
    .map((setting) => ({ value: setting.id, label: setting.name }));

  const handleSubmit = async () => {
    if (name.trim() === '') {
      setError('Give the recipe a name.');
      return;
    }
    if (steps.length === 0) {
      setError('A recipe needs at least one step.');
      return;
    }
    setError(null);
    await onSubmit({
      name: name.trim(),
      methodId,
      brewerId,
      beanId,
      source: 'own',
      parentRecipeId: initial?.id ?? null,
      isBuiltin: false,
      doseG,
      waterTotalG,
      waterTempC,
      grinderId,
      grindSettingId,
      grindValue,
      grindUnit,
      expectedTotalTimeS,
      notes: notes.trim() === '' ? null : notes.trim(),
      steps,
    });
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
    >
      <TextInput
        label="Name"
        mode="outlined"
        value={name}
        onChangeText={setName}
        error={Boolean(error)}
        autoFocus={initial === null}
      />
      <View style={styles.field}>
        <OptionField<BrewMethodId>
          label="Method"
          value={methodId}
          options={methodOptions}
          onChange={(value) => {
            const next = value ?? 'v60';
            setMethodId(next);
            setBrewerId((current) => {
              if (current === null) {
                return current;
              }
              const method = methodById(next, methods);
              if (method === null) {
                return current;
              }
              return compatibleBrewers(brewers, method).some((brewer) => brewer.id === current)
                ? current
                : null;
            });
          }}
          nullable={false}
        />
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <NumberField label="Dose" value={doseG} onChange={setDoseG} unit="g" />
        </View>
        <View style={styles.gridItem}>
          <NumberField
            label="Water"
            value={waterTotalG}
            onChange={setWaterTotalG}
            unit="g"
          />
        </View>
        <View style={styles.gridItem}>
          <NumberField
            label="Temperature"
            value={waterTempC}
            onChange={setWaterTempC}
            unit="°C"
          />
        </View>
        <View style={styles.gridItem}>
          <NumberField
            label="Total time"
            value={expectedTotalTimeS}
            onChange={setExpectedTotalTimeS}
            unit="s"
            integer
          />
        </View>
      </View>

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Grind
      </Text>
      <OptionField<number>
        label="Grinder"
        value={grinderId}
        options={grinderOptions}
        onChange={setGrinderId}
        emptyLabel="Not set"
      />
      <View style={styles.field}>
        <OptionField<number>
          label="Grind setting"
          value={grindSettingId}
          options={settingOptions}
          onChange={setGrindSettingId}
          emptyLabel="Not set"
        />
      </View>
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <NumberField label="Grind value" value={grindValue} onChange={setGrindValue} />
        </View>
        <View style={styles.gridItem}>
          <OptionField<GrindUnit>
            label="Unit"
            value={grindUnit}
            options={GRIND_UNIT_OPTIONS}
            onChange={setGrindUnit}
            emptyLabel="Not set"
          />
        </View>
      </View>

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Brew with
      </Text>
      <OptionField<number>
        label="Brewer"
        value={brewerId}
        options={brewerOptions}
        onChange={setBrewerId}
        emptyLabel="Any"
      />
      <View style={styles.field}>
        <OptionField<number>
          label="Bean"
          value={beanId}
          options={beanOptions}
          onChange={setBeanId}
          emptyLabel="Any"
        />
      </View>

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Steps
      </Text>
      <StepListEditor steps={steps} onChange={setSteps} />

      <Divider style={styles.divider} />
      <TextInput
        label="Notes"
        mode="outlined"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      {error ? (
        <Text variant="bodySmall" style={{ color: theme.semantic.error }}>
          {error}
        </Text>
      ) : null}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        style={styles.submit}
      >
        {initial ? 'Save recipe' : 'Add recipe'}
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
  },
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
  divider: {
    marginVertical: 16,
  },
  groupTitle: {
    marginBottom: 10,
  },
  submit: {
    marginTop: 24,
  },
});
