import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from '../../state/slices/settingsSlice';
import { Colors } from '../../constants/colors';
import { MotivationType } from '../../types/models';

// Import motivation images
const motivationImages: Partial<Record<MotivationType, ImageSourcePropType>> = {
  work: require('../../assets/motivation/WorkPerformance.png'),
  brain: require('../../assets/motivation/MentalClarity.png'),
  fitness: require("../../assets/motivation/'FitnessGoals.png"),
  meditation: require('../../assets/motivation/Wellness.png'),
  health: require('../../assets/motivation/Health.png'),
  beauty: require('../../assets/motivation/Beauty.png'),
};

interface MotivationOption {
  id: MotivationType;
  title: string;
  icon: string;
  description: string;
}

export const MotivationScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const motivationOptions: MotivationOption[] = [
    {
      id: 'work',
      title: t('onboarding.motivation.workPerformance'),
      icon: '🏢',
      description: t('onboarding.motivation.workPerformanceDesc'),
    },
    {
      id: 'brain',
      title: t('onboarding.motivation.mentalClarity'),
      icon: '🧠',
      description: t('onboarding.motivation.mentalClarityDesc'),
    },
    {
      id: 'fitness',
      title: t('onboarding.motivation.fitnessGoals'),
      icon: '🏋️',
      description: t('onboarding.motivation.fitnessGoalsDesc'),
    },
    {
      id: 'meditation',
      title: t('onboarding.motivation.wellness'),
      icon: '🧘',
      description: t('onboarding.motivation.wellnessDesc'),
    },
    {
      id: 'health',
      title: t('onboarding.motivation.health'),
      icon: '👩‍⚕️',
      description: t('onboarding.motivation.healthDesc'),
    },
    {
      id: 'beauty',
      title: t('onboarding.motivation.beauty'),
      icon: '⭐',
      description: t('onboarding.motivation.beautyDesc'),
    },
  ];

  const [selectedMotivation, setSelectedMotivation] =
    useState<MotivationType | null>(null);

  const selectMotivation = (id: MotivationType) => {
    setSelectedMotivation(id);
  };

  const handleContinue = () => {
    if (selectedMotivation) {
      dispatch(
        updateProfile({
          motivation: [selectedMotivation],
        }),
      );
    }

    navigation.navigate('DailyRoutineScreen' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValid = selectedMotivation !== null;

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.motivation.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.motivation.subtitle')}
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {motivationOptions.map(option => {
            const isSelected = selectedMotivation === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, isSelected && styles.selectedCard]}
                onPress={() => selectMotivation(option.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                  ]}
                >
                  {motivationImages[option.id] ? (
                    <Image
                      source={motivationImages[option.id]!}
                      style={styles.iconImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.icon}>{option.icon}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.optionTitle,
                    isSelected && styles.selectedText,
                  ]}
                >
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
          })}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
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
    </SafeAreaView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
    },
    header: {
      marginBottom: 5,
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
    iconImage: {
      width: 48,
      height: 48,
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
    footerSafeArea: {
      backgroundColor: theme.background,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 16,
      paddingTop: 16,
      flexDirection: 'row',
      gap: 12,
      backgroundColor: theme.background,
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
