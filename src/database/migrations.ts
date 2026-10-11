import { SCHEMA_SQL, SEED_FLAVOUR_TAGS_SQL, SEED_METHODS_SQL } from './schema';
import { SEED_CANONICAL_RECIPES_SQL } from './canonicalRecipes';

export interface Migration {
  id: number;
  description: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    description: 'Initial schema',
    sql: `
${SCHEMA_SQL}

${SEED_METHODS_SQL}

${SEED_FLAVOUR_TAGS_SQL}
`,
  },
  {
    id: 2,
    description: 'Seed nine canonical method recipes',
    sql: SEED_CANONICAL_RECIPES_SQL,
  },
  {
    id: 3,
    description: 'Brewers declare the brew method they are for',
    sql: `
ALTER TABLE brewers ADD COLUMN method_id TEXT
  CHECK (method_id IS NULL OR method_id IN ('v60','chemex','kalita','french-press','aeropress','clever','cold-brew','espresso','moka'));

CREATE INDEX IF NOT EXISTS idx_brewers_method ON brewers (method_id, is_active);
`,
  },
];
