import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text, TextInput } from 'react-native-paper';
import type { AttributeLevel, Tasting, Verdict } from '../models';
import { ATTRIBUTE_LEVELS, VERDICTS } from '../models';
import type { TastingInput } from '../database/tastings';
import { useAppData } from '../data/DataProvider';
import { useAppTheme } from '../theme';
import { VERDICT_LABELS } from '../utils/labels';
import { dateToTimestamp, isoNow, timestampDate, todayDate } from '../utils/date';
import { KeyboardAwareScrollView } from './keyboard-aware-scroll-view';
import { RatingSelector } from './rating-selector';
import type { TasteRating } from './rating-selector';
import { DateField } from './date-field';
import { NumberField } from './number-field';
import { OptionField } from './option-field';

type AttributeKey =
  | 'attributeAcidity'
  | 'attributeSweetness'
  | 'attributeBody'
  | 'attributeBitterness'
  | 'attributeFinish';

type ScaKey =
  | 'scaAroma'
  | 'scaFlavour'
  | 'scaAftertaste'
  | 'scaAcidity'
  | 'scaBody'
  | 'scaBalance'
  | 'scaUniformity'
  | 'scaCleanCup'
  | 'scaSweetness'
  | 'scaOverall';

const ATTRIBUTE_FIELDS: { key: AttributeKey; label: string }[] = [
  { key: 'attributeAcidity', label: 'Acidity' },
  { key: 'attributeSweetness', label: 'Sweetness' },
  { key: 'attributeBody', label: 'Body' },
  { key: 'attributeBitterness', label: 'Bitterness' },
  { key: 'attributeFinish', label: 'Finish' },
];

const SCA_FIELDS: { key: ScaKey; label: string }[] = [
  { key: 'scaAroma', label: 'Aroma' },
  { key: 'scaFlavour', label: 'Flavour' },
  { key: 'scaAftertaste', label: 'Aftertaste' },
  { key: 'scaAcidity', label: 'Acidity' },
  { key: 'scaBody', label: 'Body' },
  { key: 'scaBalance', label: 'Balance' },
  { key: 'scaUniformity', label: 'Uniformity' },
  { key: 'scaCleanCup', label: 'Clean cup' },
  { key: 'scaSweetness', label: 'Sweetness' },
  { key: 'scaOverall', label: 'Overall' },
];

const ATTRIBUTE_OPTIONS = ATTRIBUTE_LEVELS.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

interface TastingFormProps {
  brewId: number;
  initial: Tasting | null;
  initialFlavourTagIds: string[];
  submitting: boolean;
  onSubmit: (input: TastingInput) => Promise<void>;
}

export function TastingForm({
  brewId,
  initial,
  initialFlavourTagIds,
  submitting,
  onSubmit,
}: TastingFormProps) {
  const theme = useAppTheme();
  const { flavourTags, addFlavourTag } = useAppData();

  const [verdict, setVerdict] = useState<Verdict | null>(initial?.verdict ?? null);
  const [rating, setRating] = useState<TasteRating | null>(
    initial?.overallRating != null ? (initial.overallRating as TasteRating) : null
  );
  const [tastedDate, setTastedDate] = useState(
    initial?.tastedAt ? timestampDate(initial.tastedAt) : todayDate()
  );
  const [temperatureC, setTemperatureC] = useState<number | null>(
    initial?.temperatureC ?? null
  );
  const [attributes, setAttributes] = useState<Record<AttributeKey, AttributeLevel | null>>({
    attributeAcidity: initial?.attributeAcidity ?? null,
    attributeSweetness: initial?.attributeSweetness ?? null,
    attributeBody: initial?.attributeBody ?? null,
    attributeBitterness: initial?.attributeBitterness ?? null,
    attributeFinish: initial?.attributeFinish ?? null,
  });
  const [sca, setSca] = useState<Record<ScaKey, number | null>>({
    scaAroma: initial?.scaAroma ?? null,
    scaFlavour: initial?.scaFlavour ?? null,
    scaAftertaste: initial?.scaAftertaste ?? null,
    scaAcidity: initial?.scaAcidity ?? null,
    scaBody: initial?.scaBody ?? null,
    scaBalance: initial?.scaBalance ?? null,
    scaUniformity: initial?.scaUniformity ?? null,
    scaCleanCup: initial?.scaCleanCup ?? null,
    scaSweetness: initial?.scaSweetness ?? null,
    scaOverall: initial?.scaOverall ?? null,
  });
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tagIds, setTagIds] = useState<string[]>(initialFlavourTagIds);
  const [newTag, setNewTag] = useState('');
  const [showSca, setShowSca] = useState(false);

  const toggleTag = (id: string) => {
    setTagIds((current) =>
      current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id]
    );
  };

  const handleSubmit = async () => {
    const tastedAt = tastedDate === todayDate() ? isoNow() : dateToTimestamp(tastedDate);
    await onSubmit({
      brewId,
      verdict,
      overallRating: rating,
      tastedAt,
      temperatureC,
      attributeAcidity: attributes.attributeAcidity,
      attributeSweetness: attributes.attributeSweetness,
      attributeBody: attributes.attributeBody,
      attributeBitterness: attributes.attributeBitterness,
      attributeFinish: attributes.attributeFinish,
      scaAroma: sca.scaAroma,
      scaFlavour: sca.scaFlavour,
      scaAftertaste: sca.scaAftertaste,
      scaAcidity: sca.scaAcidity,
      scaBody: sca.scaBody,
      scaBalance: sca.scaBalance,
      scaUniformity: sca.scaUniformity,
      scaCleanCup: sca.scaCleanCup,
      scaSweetness: sca.scaSweetness,
      scaOverall: sca.scaOverall,
      notes: notes.trim() === '' ? null : notes.trim(),
      flavourTagIds: tagIds,
    });
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.container, { padding: theme.spacing[4] }]}
    >
      <Text variant="titleSmall" style={styles.groupTitle}>
        Verdict
      </Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {VERDICTS.map((value) => (
          <Chip
            key={value}
            selected={verdict === value}
            showSelectedCheck={false}
            onPress={() => setVerdict(verdict === value ? null : value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: verdict === value }}
            accessibilityLabel={VERDICT_LABELS[value]}
            testID={`verdict-${value}`}
            style={styles.chip}
          >
            {VERDICT_LABELS[value]}
          </Chip>
        ))}
      </View>

      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.groupTitle}>
          Rating
        </Text>
        <RatingSelector value={rating} onChange={setRating} />
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <DateField label="Tasted" value={tastedDate} onChange={(value) => setTastedDate(value ?? todayDate())} />
        </View>
        <View style={styles.gridItem}>
          <NumberField
            label="Temperature"
            value={temperatureC}
            onChange={setTemperatureC}
            unit="°C"
          />
        </View>
      </View>

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Cup shape
      </Text>
      {ATTRIBUTE_FIELDS.map((field) => (
        <View key={field.key} style={styles.field}>
          <OptionField<AttributeLevel>
            label={field.label}
            value={attributes[field.key]}
            options={ATTRIBUTE_OPTIONS}
            onChange={(value) =>
              setAttributes((current) => ({ ...current, [field.key]: value }))
            }
            emptyLabel="Not set"
          />
        </View>
      ))}

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Flavour notes
      </Text>
      <View style={styles.chips}>
        {flavourTags.map((tag) => (
          <Chip
            key={tag.id}
            selected={tagIds.includes(tag.id)}
            showSelectedCheck={false}
            onPress={() => toggleTag(tag.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: tagIds.includes(tag.id) }}
            accessibilityLabel={tag.name}
            style={styles.chip}
          >
            {tag.name}
          </Chip>
        ))}
      </View>
      <View style={styles.tagRow}>
        <TextInput
          label="Add a descriptor"
          mode="outlined"
          value={newTag}
          onChangeText={setNewTag}
          style={styles.tagInput}
        />
        <Button
          mode="outlined"
          onPress={async () => {
            const name = newTag.trim();
            if (name === '') {
              return;
            }
            const id = await addFlavourTag(name);
            setTagIds((current) => [...current, id]);
            setNewTag('');
          }}
          style={styles.tagButton}
        >
          Add
        </Button>
      </View>

      <Divider style={styles.divider} />
      <Button
        mode="text"
        icon={showSca ? 'chevron-up' : 'chevron-down'}
        onPress={() => setShowSca((current) => !current)}
      >
        {showSca ? 'Hide full cupping form' : 'Full cupping form'}
      </Button>
      {showSca ? (
        <View style={styles.grid}>
          {SCA_FIELDS.map((field) => (
            <View key={field.key} style={styles.gridItem}>
              <NumberField
                label={field.label}
                value={sca[field.key]}
                onChange={(value) =>
                  setSca((current) => ({ ...current, [field.key]: value }))
                }
                integer
              />
            </View>
          ))}
        </View>
      ) : null}

      <Divider style={styles.divider} />
      <TextInput
        label="Notes"
        mode="outlined"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        style={styles.submit}
      >
        {initial ? 'Save tasting' : 'Add tasting'}
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  groupTitle: {
    marginBottom: 10,
  },
  section: {
    marginTop: 16,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  tagButton: {
    marginTop: 6,
  },
  divider: {
    marginVertical: 16,
  },
  submit: {
    marginTop: 24,
  },
});
