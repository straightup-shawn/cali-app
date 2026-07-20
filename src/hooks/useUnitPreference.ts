import { useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { type UnitPreference, displayWeight, inputToKg, kgToDisplay, formatWeight } from '@/lib/units';

export function useUnitPreference() {
  const { data: profile } = useProfile();

  const preference: UnitPreference = (profile?.unit_preference as UnitPreference) ?? 'metric';
  const weightLabel = preference === 'imperial' ? 'lbs' : 'kg';

  const helpers = useMemo(
    () => ({
      /** Format kg as display string with unit: "10.0 kg" or "22.0 lbs" */
      displayWeight: (kg: number) => displayWeight(kg, preference),
      /** Convert user input to kg for storage */
      inputToKg: (value: number) => inputToKg(value, preference),
      /** Convert kg to numeric display value */
      kgToDisplay: (kg: number) => kgToDisplay(kg, preference),
      /** Format kg with unit suffix */
      formatWeight: (kg: number) => formatWeight(kg, preference),
    }),
    [preference],
  );

  return {
    preference,
    weightLabel,
    ...helpers,
  };
}
