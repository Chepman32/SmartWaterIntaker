import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { WeightPicker } from '../../components/WeightPicker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from '../../state/slices/settingsSlice';
import { Colors } from '../../constants/colors';
import { RootState } from '../../state/store';

type ActivityLevel = 'low' | 'medium' | 'high';
type Climate = 'cool' | 'temperate' | 'hot';

interface ActivityOption {
  id: ActivityLevel;
  title: string;
  description: string;
  multiplier: number;
}

interface ClimateOption {
  id: Climate;
  title: string;
  description: string;
  multiplier: number;
}

const activityOptions: ActivityOption[] = [
  {
    id: 'low',
    title: 'Low Activity',
    description: 'Mostly sedentary, little to no exercise',
    multiplier: 1.0,
  },
  {
    id: 'medium',
    title: 'Moderate Activity',
    description: 'Light exercise 1-3 days per week',
    multiplier: 1.2,
  },
  {
    id: 'high',
    title: 'High Activity',
    description: 'Intense exercise 4+ days per week',
    multiplier: 1.4,
  },
];

const climateOptions: ClimateOption[] = [
  {
    id: 'cool',
    title: 'Cool Climate',
    description: 'Average temperature below 20°C (68°F)',
    multiplier: 1.0,
  },
  {
    id: 'temperate',
    title: 'Temperate Climate',
    description: 'Average temperature 20-25°C (68-77°F)',
    multiplier: 1.1,
  },
  {
    id: 'hot',
    title: 'Hot Climate',
    description: 'Average temperature above 25°C (77°F)',
    multiplier: 1.2,
  },
];

export const WeightActivityScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const unit = useSelector((state: RootState) => state.settings.profile.unit);
  
  const isMetric = unit === 'ml';
  const defaultWeightUnit = isMetric ? 'kg' : 'lbs';
  const defaultWeight = isMetric ? 70 : 154; // Default weight in kg or lbs

  const [weight, setWeight] = useState(defaultWeight);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(defaultWeightUnit);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>('medium');
  const [selectedClimate, setSelectedClimate] = useState<Climate>('temperate');
  
  const handleContinue = () => {
    const weightKg = weightUnit === 'kg'
      ? weight
      : weight * 0.453592; // Convert lbs to kg

    dispatch(updateProfile({
      weightKg,
      activityLevel: selectedActivity,
      climate: selectedClimate,
    }));

    navigation.navigate('GoalCalculationScreen' as never);
  };

  const handleSkip = () => {
    navigation.navigate('GoalCalculationScreen' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValid = weight > 0;

  const styles = getStyles(theme);
  
  const renderActivityOption = (option: ActivityOption) => {
    const isSelected = selectedActivity === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => setSelectedActivity(option.id)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.optionTitle,
          isSelected && styles.selectedText,
        ]}>
          {option.title}
        </Text>
        <Text style={[
          styles.optionDescription,
          isSelected && styles.selectedSubtext,
        ]}>
          {option.description}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const renderClimateOption = (option: ClimateOption) => {
    const isSelected = selectedClimate === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => setSelectedClimate(option.id)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.optionTitle,
          isSelected && styles.selectedText,
        ]}>
          {option.title}
        </Text>
        <Text style={[
          styles.optionDescription,
          isSelected && styles.selectedSubtext,
        ]}>
          {option.description}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell Us About Yourself</Text>
          <Text style={styles.subtitle}>
            This helps us calculate your personalized hydration goal.
          </Text>
        </View>
        
        {/* Weight Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Weight</Text>
          <WeightPicker
            value={weight}
            onValueChange={setWeight}
            unit={weightUnit}
            onUnitChange={setWeightUnit}
            theme={theme}
          />
        </View>
        
        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <View style={styles.optionsContainer}>
            {activityOptions.map(renderActivityOption)}
          </View>
        </View>
        
        {/* Climate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Climate</Text>
          <View style={styles.optionsContainer}>
            {climateOptions.map(renderClimateOption)}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !isValid && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !isValid && styles.continueButtonTextDisabled,
          ]}>
            Continue
          </Text>
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
  },
  header: {
    paddingTop: 40,
    marginBottom: 32,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight || theme.primary + '20',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  selectedText: {
    color: theme.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  selectedSubtext: {
    color: theme.primary,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: theme.textSecondary,
    opacity: 0.5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    opacity: 0.7,
  },
});
