/**
 * AI Exercise Classification Engine
 *
 * Uses NVIDIA NIM to classify exercises by their biomechanics properties,
 * estimating what fraction of bodyweight is moved during the exercise.
 */

const NIM_API_KEY = import.meta.env.VITE_NVIDIA_NIM_API_KEY;
const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-70b-instruct';

// =============================================================================
// Types
// =============================================================================

export type ResistanceModel =
  | 'bodyweight'
  | 'bodyweight_plus_external'
  | 'assisted_bodyweight'
  | 'external_load_only'
  | 'isometric_bodyweight'
  | 'isometric_external'
  | 'not_quantifiable';

export type MovementFamily =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'core'
  | 'isometric'
  | 'cardio'
  | 'skill'
  | 'other';

export type VolumeMode = 'repetitions' | 'duration' | 'none';

export interface ClassificationResult {
  resistance_model: ResistanceModel;
  movement_family: MovementFamily;
  bodyweight_fraction: number;
  bodyweight_fraction_min: number;
  bodyweight_fraction_max: number;
  volume_mode: VolumeMode;
  confidence: number;
  rationale: string;
}

export interface ExerciseInput {
  name: string;
  exercise_type: string;
  muscle_groups: string[];
  instructions: string | null;
}

// =============================================================================
// Constants / Validation
// =============================================================================

const VALID_RESISTANCE_MODELS: ResistanceModel[] = [
  'bodyweight',
  'bodyweight_plus_external',
  'assisted_bodyweight',
  'external_load_only',
  'isometric_bodyweight',
  'isometric_external',
  'not_quantifiable',
];

const VALID_MOVEMENT_FAMILIES: MovementFamily[] = [
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'squat',
  'hinge',
  'lunge',
  'core',
  'isometric',
  'cardio',
  'skill',
  'other',
];

const VALID_VOLUME_MODES: VolumeMode[] = ['repetitions', 'duration', 'none'];

const SYSTEM_PROMPT = `You are a biomechanics exercise-classification engine. Analyze the exercise and estimate what percentage of the athlete's bodyweight is moved during the exercise.

Return ONLY valid JSON with these exact fields:
{
  "resistance_model": "bodyweight|bodyweight_plus_external|assisted_bodyweight|external_load_only|isometric_bodyweight|isometric_external|not_quantifiable",
  "movement_family": "horizontal_push|vertical_push|horizontal_pull|vertical_pull|squat|hinge|lunge|core|isometric|cardio|skill|other",
  "bodyweight_fraction": 0.70,
  "bodyweight_fraction_min": 0.65,
  "bodyweight_fraction_max": 0.75,
  "volume_mode": "repetitions|duration|none",
  "confidence": 0.85,
  "rationale": "Brief explanation"
}

Rules:
- bodyweight_fraction is the average percentage (0.00-1.00) of bodyweight moved
- Push-up: ~0.64-0.70, Pull-up: ~1.0, Dip: ~1.0, Plank: ~0.50-0.60
- Incline push-up: lower (~0.40-0.55), Decline push-up: higher (~0.70-0.80)
- External_load_only (e.g. dumbbell curls): fraction = 0.00
- Static holds (plank, L-sit): use isometric_bodyweight, volume_mode = "duration"
- If you cannot make a responsible estimate, use "not_quantifiable"
- Do not include added weight in the fraction - that's handled separately
- Do not invent citations
- Return ONLY the JSON object, nothing else`;

// =============================================================================
// Sanitization
// =============================================================================

/**
 * Strips potential prompt injection from exercise data.
 * Removes any strings that look like system/assistant role injections.
 */
function sanitize(input: string): string {
  return input
    .replace(/(\bsystem\b|\bassistant\b|\buser\b)\s*:/gi, '')
    .replace(/[<>{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, 500);
}

// =============================================================================
// Classification Function
// =============================================================================

export async function classifyExercise(exercise: ExerciseInput): Promise<ClassificationResult> {
  if (!NIM_API_KEY) {
    throw new Error('NVIDIA NIM API key not configured');
  }

  const safeName = sanitize(exercise.name);
  const safeType = sanitize(exercise.exercise_type);
  const safeMuscles = exercise.muscle_groups.map(sanitize).join(', ');
  const safeInstructions = exercise.instructions ? sanitize(exercise.instructions) : 'None provided';

  const userPrompt = `Classify this exercise:
Name: ${safeName}
Type: ${safeType}
Muscle Groups: ${safeMuscles}
Instructions: ${safeInstructions}`;

  const response = await fetch(NIM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI classification failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  return parseAndValidate(content);
}

// =============================================================================
// Response Parsing & Validation
// =============================================================================

function parseAndValidate(content: string): ClassificationResult {
  // Extract JSON from the response (handle potential markdown wrapping)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AI response contained malformed JSON');
  }

  // Validate resistance_model
  const resistanceModel = parsed.resistance_model as string;
  if (!VALID_RESISTANCE_MODELS.includes(resistanceModel as ResistanceModel)) {
    throw new Error(`Invalid resistance_model: ${resistanceModel}`);
  }

  // Validate movement_family
  const movementFamily = parsed.movement_family as string;
  if (!VALID_MOVEMENT_FAMILIES.includes(movementFamily as MovementFamily)) {
    throw new Error(`Invalid movement_family: ${movementFamily}`);
  }

  // Validate bodyweight_fraction (0-1)
  const fraction = Number(parsed.bodyweight_fraction);
  if (isNaN(fraction) || fraction < 0 || fraction > 1) {
    throw new Error(`Invalid bodyweight_fraction: ${parsed.bodyweight_fraction}`);
  }

  // Validate bodyweight_fraction_min (0-1)
  const fractionMin = Number(parsed.bodyweight_fraction_min);
  if (isNaN(fractionMin) || fractionMin < 0 || fractionMin > 1) {
    throw new Error(`Invalid bodyweight_fraction_min: ${parsed.bodyweight_fraction_min}`);
  }

  // Validate bodyweight_fraction_max (0-1)
  const fractionMax = Number(parsed.bodyweight_fraction_max);
  if (isNaN(fractionMax) || fractionMax < 0 || fractionMax > 1) {
    throw new Error(`Invalid bodyweight_fraction_max: ${parsed.bodyweight_fraction_max}`);
  }

  // Validate volume_mode
  const volumeMode = parsed.volume_mode as string;
  if (!VALID_VOLUME_MODES.includes(volumeMode as VolumeMode)) {
    throw new Error(`Invalid volume_mode: ${volumeMode}`);
  }

  // Validate confidence (0-1)
  const confidence = Number(parsed.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`Invalid confidence: ${parsed.confidence}`);
  }

  // Validate rationale (string)
  const rationale = typeof parsed.rationale === 'string' ? parsed.rationale.slice(0, 500) : '';

  return {
    resistance_model: resistanceModel as ResistanceModel,
    movement_family: movementFamily as MovementFamily,
    bodyweight_fraction: fraction,
    bodyweight_fraction_min: fractionMin,
    bodyweight_fraction_max: fractionMax,
    volume_mode: volumeMode as VolumeMode,
    confidence,
    rationale,
  };
}
