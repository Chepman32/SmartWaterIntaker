import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { updateProfile } from '../../state/slices/settingsSlice';
import { Colors } from '../../constants/colors';
import { MotivationType } from '../../types/models';

interface MotivationOption {
  id: MotivationType;
  title: string;
  icon: string;
  description: string;
}

const motivationOptions: MotivationOption[] = [
  {
    id: 'work',
    title: 'Work Performance',
    icon: '🏢',
    description: 'Stay focused and productive',
  },
  {
    id: 'brain',
    title: 'Mental Clarity',
    icon: '🧠',
    description: 'Improve cognitive function',
  },
  {
    id: 'fitness',
    title: 'Fitness Goals',
    icon: '🏋️',
    description: 'Support workout recovery',
  },
  {
    id: 'meditation',
    title: 'Wellness',
    icon: '🧘',
    description: 'Mindfulness and balance',
  },
  {
    id: 'health',
    title: 'Health',
    icon: '👩‍⚕️',
    description: 'Overall health improvement',
  },
  {
    id: 'beauty',
    title: 'Beauty',
    icon: '⭐',
    description: 'Healthy skin and appearance',
  },
];

export const MotivationScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedMotivation, setSelectedMotivation] = useState<MotivationType | null>(null);

  const selectMotivation = (id: MotivationType) => {
    setSelectedMotivation(id);
  };

  const handleContinue = () => {
    if (selectedMotivation) {
      dispatch(updateProfile({
        motivation: [selectedMotivation],
      }));
    }

    navigation.navigate('DailyRoutineScreen' as never);
  };

  const handleSkip = () => {
    navigation.navigate('DailyRoutineScreen' as never);
  };

  const isValid = selectedMotivation !== null;

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Why Drink More Water?</Text>
          <Text style={styles.subtitle}>
            What motivated you to drink more water?
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {motivationOptions.map((option) => {
            const isSelected = selectedMotivation === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => selectMotivation(option.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}>
                  <Text style={styles.icon}>{option.icon}</Text>
                </View>
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
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  optionCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    width: '47%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCard: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight || theme.primary + '20',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.border + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: theme.primary + '30',
  },
  icon: {
    fontSize: 32,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedText: {
    color: theme.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedSubtext: {
    color: theme.primary,
    opacity: 0.8,
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
  skipButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
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
