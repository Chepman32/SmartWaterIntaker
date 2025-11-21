import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setDailyGoal } from '../../state/slices/intakeSlice';
import { Colors } from '../../constants/colors';
import { RootState } from '../../state/store';

const calculateDailyGoal = (
  weightKg: number,
  activityLevel: string,
  climate: string,
  unit: string
): { goalMl: number; goalDisplay: number; displayUnit: string } => {
  // Base calculation: 35ml per kg of body weight
  let baseMl = weightKg * 35;
  
  // Activity multiplier
  const activityMultipliers = {
    low: 1.0,
    medium: 1.2,
    high: 1.4,
  };
  
  // Climate multiplier
  const climateMultipliers = {
    cool: 1.0,
    temperate: 1.1,
    hot: 1.2,
  };
  
  const activityMultiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.0;
  const climateMultiplier = climateMultipliers[climate as keyof typeof climateMultipliers] || 1.0;
  
  const goalMl = Math.round(baseMl * activityMultiplier * climateMultiplier);
  
  if (unit === 'oz') {
    const goalOz = Math.round(goalMl * 0.033814);
    return {
      goalMl,
      goalDisplay: goalOz,
      displayUnit: 'fl oz',
    };
  }
  
  return {
    goalMl,
    goalDisplay: goalMl,
    displayUnit: 'ml',
  };
};

export const GoalCalculationScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  
  const profile = useSelector((state: RootState) => state.settings.profile);
  const [animatedValue] = useState(new Animated.Value(0));
  const [showGoal, setShowGoal] = useState(false);
  
  const { goalMl, goalDisplay, displayUnit } = calculateDailyGoal(
    profile.weightKg || 70,
    profile.activityLevel,
    profile.climate,
    profile.unit
  );
  
  useEffect(() => {
    // Animate the goal reveal
    const timer = setTimeout(() => {
      setShowGoal(true);
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [animatedValue]);
  
  const handleContinue = () => {
    dispatch(setDailyGoal(goalMl));
    navigation.navigate('RemindersScreen' as never);
  };

  const handleCustomize = () => {
    // TODO: Navigate to goal customization screen
    dispatch(setDailyGoal(goalMl));
    navigation.navigate('RemindersScreen' as never);
  };

  const handleSkip = () => {
    navigation.navigate('RemindersScreen' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };
  
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Daily Goal</Text>
          <Text style={styles.subtitle}>
            Based on your profile, here's your personalized hydration goal.
          </Text>
        </View>
        
        <View style={styles.calculationContainer}>
          <View style={styles.factorsContainer}>
            <View style={styles.factor}>
              <Text style={styles.factorLabel}>Weight</Text>
              <Text style={styles.factorValue}>
                {profile.weightKg ? Math.round(profile.weightKg) : 70} kg
              </Text>
            </View>
            
            <Text style={styles.plus}>+</Text>
            
            <View style={styles.factor}>
              <Text style={styles.factorLabel}>Activity</Text>
              <Text style={styles.factorValue}>
                {profile.activityLevel.charAt(0).toUpperCase() + profile.activityLevel.slice(1)}
              </Text>
            </View>
            
            <Text style={styles.plus}>+</Text>
            
            <View style={styles.factor}>
              <Text style={styles.factorLabel}>Climate</Text>
              <Text style={styles.factorValue}>
                {profile.climate.charAt(0).toUpperCase() + profile.climate.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.equals}>
            <Text style={styles.equalsText}>=</Text>
          </View>
          
          {showGoal && (
            <Animated.View
              style={[
                styles.goalContainer,
                {
                  transform: [
                    {
                      scale: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                  opacity: animatedValue,
                },
              ]}
            >
              <Text style={styles.goalAmount}>{goalDisplay.toLocaleString()}</Text>
              <Text style={styles.goalUnit}>{displayUnit}</Text>
              <Text style={styles.goalSubtext}>per day</Text>
            </Animated.View>
          )}
        </View>
        
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>How we calculated this:</Text>
          <Text style={styles.explanationText}>
            • Base: 35ml per kg of body weight{"\n"}
            • Activity level increases hydration needs{"\n"}
            • Climate affects fluid loss through perspiration
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Looks Good!</Text>
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
  calculationContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  factorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  factor: {
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    minWidth: 80,
    marginHorizontal: 4,
  },
  factorLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  factorValue: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  plus: {
    fontSize: 20,
    color: theme.textSecondary,
    marginHorizontal: 8,
    fontWeight: '300',
  },
  equals: {
    marginVertical: 20,
  },
  equalsText: {
    fontSize: 24,
    color: theme.primary,
    fontWeight: '600',
  },
  goalContainer: {
    alignItems: 'center',
    backgroundColor: theme.primaryLight || theme.primary + '20',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  goalAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.primary,
    lineHeight: 52,
  },
  goalUnit: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '500',
    marginTop: -4,
  },
  goalSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  explanationContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
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
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
