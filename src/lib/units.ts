export type UnitPreference = 'metric' | 'imperial';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

/**
 * Format a kg value as a display string with unit label.
 * e.g. displayWeight(10, 'imperial') → "22.0 lbs"
 */
export function displayWeight(kg: number, preference: UnitPreference): string {
  if (preference === 'imperial') {
    return `${(kg * KG_TO_LBS).toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

/**
 * Convert a user-entered value to kg for canonical storage.
 * If the user is in imperial mode, the input is in lbs and gets converted.
 */
export function inputToKg(value: number, preference: UnitPreference): number {
  if (preference === 'imperial') return value * LBS_TO_KG;
  return value;
}

/**
 * Convert a canonical kg value to the user's display unit as a number.
 * Rounds to 1 decimal place to avoid floating point noise.
 */
export function kgToDisplay(kg: number, preference: UnitPreference): number {
  if (preference === 'imperial') return parseFloat((kg * KG_TO_LBS).toFixed(1));
  return parseFloat(kg.toFixed(1));
}

/**
 * Format a kg value for display with the appropriate unit suffix.
 * Similar to displayWeight but uses kgToDisplay for the numeric part.
 */
export function formatWeight(kg: number, preference: UnitPreference): string {
  const value = kgToDisplay(kg, preference);
  const unit = preference === 'imperial' ? 'lbs' : 'kg';
  return `${value} ${unit}`;
}
