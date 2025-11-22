import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WheelPicker } from './WheelPicker';

interface WeightPickerProps {
  value: number;
  onValueChange: (value: number) => void;
  unit: 'kg' | 'lbs';
  onUnitChange: (unit: 'kg' | 'lbs') => void;
  theme: {
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
}

// Weight ranges
const KG_MIN = 30;
const KG_MAX = 200;
const LBS_MIN = 66;
const LBS_MAX = 440;

const UNITS: string[] = ['kg', 'lbs'];

export const WeightPicker: React.FC<WeightPickerProps> = ({
  value,
  onValueChange,
  unit,
  onUnitChange,
  theme,
}) => {
  const isMetric = unit === 'kg';
  const minWeight = isMetric ? KG_MIN : LBS_MIN;
  const maxWeight = isMetric ? KG_MAX : LBS_MAX;

  // Generate whole number data
  const wholeNumbers = useMemo(() => {
    const numbers: number[] = [];
    for (let i = minWeight; i <= maxWeight; i++) {
      numbers.push(i);
    }
    return numbers;
  }, [minWeight, maxWeight]);

  // Get current whole value
  const wholeValue = Math.round(Math.max(minWeight, Math.min(maxWeight, value)));
  const wholeIndex = Math.max(0, wholeNumbers.indexOf(wholeValue));

  const handleValueChange = useCallback(
    (_index: number, val: string | number) => {
      const newValue = typeof val === 'number' ? val : parseInt(val, 10);
      onValueChange(newValue);
    },
    [onValueChange]
  );

  const unitIndex = UNITS.indexOf(unit);

  const handleUnitChange = useCallback(
    (_index: number, val: string | number) => {
      const newUnit = val as 'kg' | 'lbs';
      if (newUnit !== unit) {
        // Convert weight when switching units
        const convertedWeight = newUnit === 'lbs'
          ? Math.round(value * 2.20462) // kg to lbs
          : Math.round(value / 2.20462); // lbs to kg
        onUnitChange(newUnit);
        onValueChange(convertedWeight);
      }
    },
    [unit, value, onUnitChange, onValueChange]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Top fade */}
      <View style={[styles.fadeTop, { backgroundColor: theme.surface }]} pointerEvents="none" />

      <View style={styles.pickersRow}>
        <WheelPicker
          data={wholeNumbers}
          selectedIndex={wholeIndex}
          onValueChange={handleValueChange}
          width={120}
          textColor={theme.textSecondary}
          selectedTextColor={theme.text}
        />

        {/* Unit picker */}
        <WheelPicker
          data={UNITS}
          selectedIndex={unitIndex}
          onValueChange={handleUnitChange}
          width={70}
          textColor={theme.textSecondary}
          selectedTextColor={theme.primary}
        />
      </View>

      {/* Bottom fade */}
      <View style={[styles.fadeBottom, { backgroundColor: theme.surface }]} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
    opacity: 0.9,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
    opacity: 0.9,
  },
});

export default WeightPicker;
