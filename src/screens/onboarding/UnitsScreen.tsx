import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { setUnit } from '../../state/slices/settingsSlice';
import { Colors } from '../../constants/colors';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type UnitSystem = 'metric' | 'imperial';

interface UnitOption {
  id: UnitSystem;
  title: string;
  subtitle: string;
  volumeUnit: string;
  weightUnit: string;
}

const unitOptions: UnitOption[] = [
  {
    id: 'metric',
    title: 'Metric',
    subtitle: 'Milliliters and Kilograms',
    volumeUnit: 'ml',
    weightUnit: 'kg',
  },
  {
    id: 'imperial',
    title: 'Imperial',
    subtitle: 'Fluid Ounces and Pounds',
    volumeUnit: 'fl oz',
    weightUnit: 'lbs',
  },
];

export const UnitsScreen: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<UnitSystem>('metric');
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const handleContinue = () => {
    const unit = selectedUnit === 'metric' ? 'ml' : 'oz';
    dispatch(setUnit(unit));
    navigation.navigate('MotivationScreen' as never);
  };

  const styles = getStyles(theme);

  const renderUnitOption = (option: UnitOption) => {
    const isSelected = selectedUnit === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => setSelectedUnit(option.id)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text style={[
            styles.optionTitle,
            isSelected && styles.selectedText,
          ]}>
            {option.title}
          </Text>
          <Text style={[
            styles.optionSubtitle,
            isSelected && styles.selectedSubtext,
          ]}>
            {option.subtitle}
          </Text>
          <View style={styles.unitsRow}>
            <View style={styles.unitBadge}>
              <Text style={[
                styles.unitText,
                isSelected && styles.selectedUnitText,
              ]}>
                {option.volumeUnit}
              </Text>
            </View>
            <View style={styles.unitBadge}>
              <Text style={[
                styles.unitText,
                isSelected && styles.selectedUnitText,
              ]}>
                {option.weightUnit}
              </Text>
            </View>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleSkip = () => {
    navigation.navigate('MotivationScreen' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Units</Text>
          <Text style={styles.subtitle}>
            Select the measurement system you're most comfortable with.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {unitOptions.map(renderUnitOption)}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'flex-start',
  },
  skipButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight,
  },
  optionContent: {
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  selectedText: {
    color: theme.primary,
  },
  optionSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedSubtext: {
    color: theme.primary,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitBadge: {
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  selectedUnitText: {
    color: theme.primary,
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
