import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { RootState } from '../state/store';
import { logIntakeEvent } from '../state/slices/intakeSlice';
import { IntakeEvent } from '../types/models';

interface QuickAddChipProps {
  amountMl: number;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

export default function QuickAddChip({
  amountMl,
  color = '#E2E8F0',
  textColor = '#1F2937',
  style,
}: QuickAddChipProps) {
  const dispatch = useDispatch();
  const hapticsEnabled = useSelector((state: RootState) => state.settings.settings.haptics);

  const handlePress = () => {
    dispatch(logIntakeEvent({
      amountMl,
      source: 'chip',
      note: `Quick add ${amountMl}ml`,
    }));
    if (hapticsEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: color },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: textColor }]}>+{amountMl}ml</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
