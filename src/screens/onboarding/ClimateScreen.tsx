import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from '../../state/slices/settingsSlice';
import { Colors } from '../../constants/colors';

type Climate = 'cool' | 'temperate' | 'hot';

interface ClimateOption {
  id: Climate;
  title: string;
  icon: string;
  description: string;
}

export const ClimateScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedClimate, setSelectedClimate] = useState<Climate>('temperate');

  const climateOptions: ClimateOption[] = [
    {
      id: 'cool',
      title: t('onboarding.climate.cool'),
      icon: '❄️',
      description: t('onboarding.climate.coolDesc'),
    },
    {
      id: 'temperate',
      title: t('onboarding.climate.temperate'),
      icon: '🌤️',
      description: t('onboarding.climate.temperateDesc'),
    },
    {
      id: 'hot',
      title: t('onboarding.climate.hot'),
      icon: '☀️',
      description: t('onboarding.climate.hotDesc'),
    },
  ];

  const handleContinue = () => {
    dispatch(updateProfile({ climate: selectedClimate }));
    navigation.navigate('GoalCalculationScreen' as never);
  };

  const handleSkip = () => {
    navigation.navigate('GoalCalculationScreen' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.climate.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.climate.subtitle')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {climateOptions.map(option => {
            const isSelected = selectedClimate === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, isSelected && styles.selectedCard]}
                onPress={() => setSelectedClimate(option.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                  ]}
                >
                  <Text style={styles.icon}>{option.icon}</Text>
                </View>
                <View style={styles.optionInfo}>
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
                </View>
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
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    topBar: { paddingHorizontal: 24, paddingTop: 12, alignItems: 'flex-start' },
    skipButton: { paddingVertical: 8, paddingHorizontal: 12 },
    skipButtonText: {
      fontSize: 16,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
    header: { marginBottom: 32 },
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
    optionsContainer: { gap: 16 },
    optionCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedCard: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight || theme.primary + '20',
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.border + '40',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    iconContainerSelected: { backgroundColor: theme.primary + '30' },
    icon: { fontSize: 28 },
    optionInfo: { flex: 1 },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    selectedText: { color: theme.primary },
    optionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    selectedSubtext: { color: theme.primary, opacity: 0.8 },
    checkmark: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkText: { color: 'white', fontSize: 16, fontWeight: '600' },
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
    continueButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  });
