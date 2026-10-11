import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Switch, Text, TextInput } from 'react-native-paper';
import type { BrewMethodId, Brewer, BrewerKind } from '../models';
import { BREWER_KINDS } from '../models';
import type { BrewerInput } from '../database/brewers';
import { useAppData } from '../data/DataProvider';
import { useAppTheme } from '../theme';
import { BREWER_KIND_LABELS, METHOD_LABELS } from '../utils/labels';
import { methodsForKind } from '../services/equipment-service';
import { KeyboardAwareScrollView } from './keyboard-aware-scroll-view';
import { NumberField } from './number-field';
import { OptionField } from './option-field';

interface BrewerFormProps {
  initial: Brewer | null;
  defaultKind?: BrewerKind;
  submitting: boolean;
  onSubmit: (input: BrewerInput) => Promise<void>;
}

const KIND_OPTIONS = BREWER_KINDS.map((value) => ({
  value,
  label: BREWER_KIND_LABELS[value],
}));

export function BrewerForm({
  initial,
  defaultKind = 'dripper',
  submitting,
  onSubmit,
}: BrewerFormProps) {
  const theme = useAppTheme();
  const { methods } = useAppData();
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<BrewerKind>(initial?.kind ?? defaultKind);
  const [methodId, setMethodId] = useState<BrewMethodId | null>(initial?.methodId ?? null);
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [capacityMl, setCapacityMl] = useState<number | null>(initial?.capacityMl ?? null);
  const [material, setMaterial] = useState(initial?.material ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const kindMethods = methodsForKind(kind, methods);
  const methodOptions = kindMethods.map((method) => ({
    value: method.id,
    label: METHOD_LABELS[method.id],
  }));

  const handleSubmit = async () => {
    if (name.trim() === '') {
      setError('Give the equipment a name.');
      return;
    }
    setError(null);
    await onSubmit({
      name: name.trim(),
      kind,
      methodId,
      manufacturer: emptyToNull(manufacturer),
      model: emptyToNull(model),
      capacityMl,
      material: emptyToNull(material),
      notes: emptyToNull(notes),
      isActive,
      sortOrder: initial?.sortOrder ?? 0,
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
        <OptionField<BrewerKind>
          label="Kind"
          value={kind}
          options={KIND_OPTIONS}
          onChange={(value) => {
            const next = value ?? defaultKind;
            setKind(next);
            if (methodId !== null && !methodsForKind(next, methods).some((m) => m.id === methodId)) {
              setMethodId(null);
            }
          }}
          nullable={false}
        />
      </View>
      {methodOptions.length > 0 ? (
        <View style={styles.field}>
          <OptionField<BrewMethodId>
            label="Brew method"
            value={methodId}
            options={methodOptions}
            onChange={setMethodId}
            emptyLabel="Not tied to a method"
          />
        </View>
      ) : null}
      <TextInput
        label="Manufacturer"
        mode="outlined"
        value={manufacturer}
        onChangeText={setManufacturer}
        style={styles.field}
      />
      <TextInput
        label="Model"
        mode="outlined"
        value={model}
        onChangeText={setModel}
        style={styles.field}
      />
      <View style={styles.field}>
        <NumberField label="Capacity" value={capacityMl} onChange={setCapacityMl} unit="ml" />
      </View>
      <TextInput
        label="Material"
        mode="outlined"
        value={material}
        onChangeText={setMaterial}
        style={styles.field}
      />
      <TextInput
        label="Notes"
        mode="outlined"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.field}
      />
      <View style={styles.switchRow}>
        <Text variant="bodyLarge">Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>
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
        {initial ? 'Save equipment' : 'Add equipment'}
      </Button>
    </KeyboardAwareScrollView>
  );
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  field: {
    marginTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submit: {
    marginTop: 24,
  },
});
