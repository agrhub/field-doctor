import {
  LESION_COLORS,
  LESION_SHAPES,
  ORGANS,
  PATTERNS,
  SIGNS,
  UNKNOWN_ID,
  type CropModule,
} from '../knowledge';

/**
 * Plain JSON Schemas shared by both paths: passed as `responseConstraint` to
 * the on-device Prompt API and as `responseJsonSchema` to cloud Gemini, so
 * the app parses one shape no matter where inference ran.
 */
type JsonSchema = Record<string, unknown>;

const enumArray = (values: readonly string[]): JsonSchema => ({
  type: 'array',
  items: { type: 'string', enum: [...values] },
});

export const observationSchema: JsonSchema = {
  type: 'object',
  properties: {
    organs: enumArray(ORGANS),
    lesion_colors: enumArray(LESION_COLORS),
    lesion_shapes: enumArray(LESION_SHAPES),
    patterns: enumArray(PATTERNS),
    signs: enumArray(SIGNS),
    image_quality: { type: 'string', enum: ['ok', 'blurry', 'too_dark', 'too_far', 'not_a_plant'] },
    notes: { type: 'string' },
  },
  required: ['organs', 'lesion_colors', 'lesion_shapes', 'patterns', 'signs', 'image_quality', 'notes'],
};

export function classificationSchema(crop: CropModule): JsonSchema {
  const ids = [...crop.conditions.map((c) => c.id), UNKNOWN_ID];
  return {
    type: 'object',
    properties: {
      condition: { type: 'string', enum: ids },
      confidence: { type: 'number' },
      second_choice: { type: 'string', enum: ids },
      evidence: { type: 'string' },
    },
    required: ['condition', 'confidence', 'second_choice', 'evidence'],
  };
}

export const OTHER_ID = 'other';

export function expertSchema(crop: CropModule): JsonSchema {
  const ids = [...crop.conditions.map((c) => c.id), OTHER_ID, UNKNOWN_ID];
  const strings = { type: 'array', items: { type: 'string' } };
  return {
    type: 'object',
    properties: {
      condition: { type: 'string', enum: ids },
      other_name: { type: 'string' },
      confidence: { type: 'number' },
      severity: { type: 'string', enum: ['low', 'medium', 'high'] },
      summary: { type: 'string' },
      differential: {
        type: 'array',
        items: {
          type: 'object',
          properties: { condition: { type: 'string' }, why_not: { type: 'string' } },
          required: ['condition', 'why_not'],
        },
      },
      evidence: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            image_index: { type: 'integer' },
            description: { type: 'string' },
            box: { type: 'array', items: { type: 'number' } },
          },
          required: ['image_index', 'description'],
        },
      },
      actions_now: strings,
      ipm: {
        type: 'object',
        properties: {
          cultural: strings,
          biological: strings,
          chemical_guidance: { type: 'string' },
        },
        required: ['cultural', 'biological', 'chemical_guidance'],
      },
      follow_up: strings,
      see_extension_officer: { type: 'boolean' },
    },
    required: [
      'condition',
      'confidence',
      'severity',
      'summary',
      'differential',
      'evidence',
      'actions_now',
      'ipm',
      'follow_up',
      'see_extension_officer',
    ],
  };
}
