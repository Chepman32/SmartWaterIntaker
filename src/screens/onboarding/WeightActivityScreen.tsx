import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { WeightPicker } from '../../components/WeightPicker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from '../../state/slices/settingsSlice';
import { Colors } from '../../constants/colors';
import { RootState } from '../../state/store';

type ActivityLevel = 'low' | 'medium' | 'high';

interface ActivityOption {
  id: ActivityLevel;
  title: string;
  description: string;
  multiplier: number;
}

export const WeightActivityScreen: React.FC = () => {
  const { t } = useTranslation();
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
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityLevel>('medium');

  const activityOptions: ActivityOption[] = [
    {
      id: 'low',
      title: t('onboarding.weightActivity.lowActivity'),
      description: t('onboarding.weightActivity.lowActivityDesc'),
      multiplier: 1.0,
    },
    {
      id: 'medium',
      title: t('onboarding.weightActivity.moderateActivity'),
      description: t('onboarding.weightActivity.moderateActivityDesc'),
      multiplier: 1.2,
    },
    {
      id: 'high',
      title: t('onboarding.weightActivity.highActivity'),
      description: t('onboarding.weightActivity.highActivityDesc'),
      multiplier: 1.4,
    },
  ];

  const handleContinue = () => {
    const weightKg = weightUnit === 'kg' ? weight : weight * 0.453592;

    dispatch(
      updateProfile({
        weightKg,
        activityLevel: selectedActivity,
      }),
    );

    navigation.navigate('ClimateScreen' as never);
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
        style={[styles.optionCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedActivity(option.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionTitle, isSelected && styles.selectedText]}>
          {option.title}
        </Text>
        <Text
          style={[
            styles.optionDescription,
            isSelected && styles.selectedSubtext,
          ]}
        >
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('onboarding.weightActivity.title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('onboarding.weightActivity.subtitle')}
          </Text>
        </View>

        {/* Weight Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('onboarding.weightActivity.yourWeight')}
          </Text>
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
          <Text style={styles.sectionTitle}>
            {t('onboarding.weightActivity.activityLevel')}
          </Text>
          <View style={styles.optionsContainer}>
            {activityOptions.map(renderActivityOption)}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
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
          <Text
            style={[
              styles.continueButtonText,
              !isValid && styles.continueButtonTextDisabled,
            ]}
          >
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    header: {
      paddingTop: 24,
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
