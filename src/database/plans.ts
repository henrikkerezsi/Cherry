import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  AgitationKind,
  BrewMethodId,
  GrindUnit,
  Plan,
  PlanEvent,
  PlanStatus,
  PlanStep,
  StepKind,
} from '../models';
import { getDatabase } from './database';

interface PlanRow {
  id: number;
  uuid: string | null;
  name: string | null;
  method_id: string;
  brewer_id: number | null;
  bean_id: number | null;
  recipe_id: number | null;
  recommendation_id: number | null;
  status: string;
  target_date: string | null;
  dose_g: number | null;
  water_total_g: number | null;
  water_temp_c: number | null;
  grinder_id: number | null;
  grind_setting_id: number | null;
  grind_value: number | null;
  grind_unit: string | null;
  expected_total_time_s: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  deleted: number;
}

interface PlanStepRow {
  id: number;
  uuid: string | null;
  plan_id: number;
  step_index: number;
  kind: string | null;
  label: string | null;
  target_water_g: number | null;
  pour_water_g: number | null;
  pour_duration_s: number | null;
  wait_after_s: number | null;
  agitation_count: number | null;
  agitation_kind: string | null;
  temperature_c: number | null;
  note: string | null;
  created_at: string;
  updated_at: string | null;
}

interface PlanEventRow {
  id: number;
  uuid: string | null;
  plan_id: number;
  kind: string;
  field: string | null;
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
  updated_at: string | null;
}

function rowToPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    methodId: row.method_id as BrewMethodId,
    brewerId: row.brewer_id,
    beanId: row.bean_id,
    recipeId: row.recipe_id,
    recommendationId: row.recommendation_id,
    status: row.status as PlanStatus,
    targetDate: row.target_date,
    doseG: row.dose_g,
    waterTotalG: row.water_total_g,
    waterTempC: row.water_temp_c,
    grinderId: row.grinder_id,
    grindSettingId: row.grind_setting_id,
    grindValue: row.grind_value,
    grindUnit: row.grind_unit as GrindUnit | null,
    expectedTotalTimeS: row.expected_total_time_s,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
  };
}

function rowToPlanStep(row: PlanStepRow): PlanStep {
  return {
    id: row.id,
    uuid: row.uuid,
    planId: row.plan_id,
    stepIndex: row.step_index,
    kind: row.kind as StepKind | null,
    label: row.label,
    targetWaterG: row.target_water_g,
    pourWaterG: row.pour_water_g,
    pourDurationS: row.pour_duration_s,
    waitAfterS: row.wait_after_s,
    agitationCount: row.agitation_count,
    agitationKind: row.agitation_kind as AgitationKind | null,
    temperatureC: row.temperature_c,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPlanEvent(row: PlanEventRow): PlanEvent {
  return {
    id: row.id,
    uuid: row.uuid,
    planId: row.plan_id,
    kind: row.kind,
    field: row.field,
    previousValue: row.previous_value,
    newValue: row.new_value,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PlanStepInput {
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

export interface PlanInput {
  name: string | null;
  methodId: BrewMethodId;
  brewerId: number | null;
  beanId: number | null;
  recipeId: number | null;
  recommendationId: number | null;
  status: PlanStatus;
  targetDate: string | null;
  doseG: number | null;
  waterTotalG: number | null;
  waterTempC: number | null;
  grinderId: number | null;
  grindSettingId: number | null;
  grindValue: number | null;
  grindUnit: GrindUnit | null;
  expectedTotalTimeS: number | null;
  notes: string | null;
  steps: PlanStepInput[];
}

export interface PlanEventInput {
  planId: number;
  kind: string;
  field: string | null;
  previousValue: string | null;
  newValue: string | null;
  note: string | null;
}

const PLAN_COLUMNS = `name, method_id, brewer_id, bean_id, recipe_id, recommendation_id, status,
  target_date, dose_g, water_total_g, water_temp_c, grinder_id, grind_setting_id, grind_value,
  grind_unit, expected_total_time_s, notes`;

function planParams(input: PlanInput): (string | number | null)[] {
  return [
    input.name,
    input.methodId,
    input.brewerId,
    input.beanId,
    input.recipeId,
    input.recommendationId,
    input.status,
    input.targetDate,
    input.doseG,
    input.waterTotalG,
    input.waterTempC,
    input.grinderId,
    input.grindSettingId,
    input.grindValue,
    input.grindUnit,
    input.expectedTotalTimeS,
    input.notes,
  ];
}

async function insertSteps(
  database: SQLiteDatabase,
  planId: number,
  steps: PlanStepInput[]
): Promise<void> {
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    await database.runAsync(
      `INSERT INTO plan_steps (
         plan_id, step_index, kind, label, target_water_g, pour_water_g, pour_duration_s,
         wait_after_s, agitation_count, agitation_kind, temperature_c, note
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planId,
        index,
        step.kind,
        step.label,
        step.targetWaterG,
        step.pourWaterG,
        step.pourDurationS,
        step.waitAfterS,
        step.agitationCount,
        step.agitationKind,
        step.temperatureC,
        step.note,
      ]
    );
  }
}

export async function getAllPlans(db?: SQLiteDatabase): Promise<Plan[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<PlanRow>(
    "SELECT * FROM plans WHERE deleted = 0 AND status IN ('planned','active','abandoned') ORDER BY COALESCE(target_date, '9999-12-31') ASC, id ASC"
  );
  return rows.map(rowToPlan);
}

export async function getPlansByStatus(
  status: PlanStatus,
  db?: SQLiteDatabase
): Promise<Plan[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<PlanRow>(
    'SELECT * FROM plans WHERE deleted = 0 AND status = ? ORDER BY id ASC',
    [status]
  );
  return rows.map(rowToPlan);
}

export async function getActivePlan(db?: SQLiteDatabase): Promise<Plan | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<PlanRow>(
    "SELECT * FROM plans WHERE deleted = 0 AND status = 'active' ORDER BY id DESC LIMIT 1"
  );
  return row ? rowToPlan(row) : null;
}

export async function getPlan(id: number, db?: SQLiteDatabase): Promise<Plan | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<PlanRow>('SELECT * FROM plans WHERE id = ?', [id]);
  return row ? rowToPlan(row) : null;
}

export async function getPlanSteps(planId: number, db?: SQLiteDatabase): Promise<PlanStep[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<PlanStepRow>(
    'SELECT * FROM plan_steps WHERE plan_id = ? ORDER BY step_index ASC',
    [planId]
  );
  return rows.map(rowToPlanStep);
}

export async function getPlanEvents(planId: number, db?: SQLiteDatabase): Promise<PlanEvent[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<PlanEventRow>(
    'SELECT * FROM plan_events WHERE plan_id = ? ORDER BY id ASC',
    [planId]
  );
  return rows.map(rowToPlanEvent);
}

export async function createPlan(input: PlanInput, db?: SQLiteDatabase): Promise<number> {
  const database = db ?? (await getDatabase());
  let id = 0;
  await database.withTransactionAsync(async () => {
    const result = await database.runAsync(
      `INSERT INTO plans (${PLAN_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      planParams(input)
    );
    id = result.lastInsertRowId;
    await insertSteps(database, id, input.steps);
    await createPlanEvent(
      { planId: id, kind: 'created', field: null, previousValue: null, newValue: null, note: null },
      database
    );
  });
  return id;
}

export async function updatePlan(
  id: number,
  input: PlanInput,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE plans SET name = ?, method_id = ?, brewer_id = ?, bean_id = ?, recipe_id = ?,
              recommendation_id = ?, status = ?, target_date = ?, dose_g = ?, water_total_g = ?,
              water_temp_c = ?, grinder_id = ?, grind_setting_id = ?, grind_value = ?,
              grind_unit = ?, expected_total_time_s = ?, notes = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = ?`,
      [...planParams(input), id]
    );
    await database.runAsync('DELETE FROM plan_steps WHERE plan_id = ?', [id]);
    await insertSteps(database, id, input.steps);
  });
}

export async function setPlanStatus(
  id: number,
  status: PlanStatus,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE plans SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [status, id]
  );
}

export async function deletePlan(id: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE plans SET deleted = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [id]
  );
}

/**
 * Every deliberate change to a plan is recorded, so a plan can explain itself
 * later (idea.txt §3.1). The UI never writes a plan without an event.
 */
export async function createPlanEvent(
  input: PlanEventInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO plan_events (plan_id, kind, field, previous_value, new_value, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.planId, input.kind, input.field, input.previousValue, input.newValue, input.note]
  );
  return result.lastInsertRowId;
}

export async function recordPlanFieldChange(
  planId: number,
  field: string,
  previousValue: string | null,
  newValue: string | null,
  db?: SQLiteDatabase
): Promise<void> {
  await createPlanEvent(
    { planId, kind: 'changed', field, previousValue, newValue, note: null },
    db
  );
}