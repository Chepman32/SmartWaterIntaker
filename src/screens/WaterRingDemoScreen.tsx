import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import WaterRing from '../components/WaterRing';

export default function WaterRingDemoScreen() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? 'dark' : 'light';
  const themeColors = isDark ? Colors.dark : Colors.light;
  
  // Demo state
  const [progress, setProgress] = useState(0.2);
  const [valueMl, setValueMl] = useState(400);
  const [goalMl, setGoalMl] = useState(2000);
  const [size, setSize] = useState(280);
  const [strokeWidth, setStrokeWidth] = useState(14);
  const [enableTilt, setEnableTilt] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  
  // Animation tuning
  const [idleAmplitude, setIdleAmplitude] = useState(6);
  const [idleFrequency, setIdleFrequency] = useState(1.8);
  const [idlePeriodMs, setIdlePeriodMs] = useState(4000);
  const [splashAmplitudeMax, setSplashAmplitudeMax] = useState(18);
  const [splashDurationMs, setSplashDurationMs] = useState(900);
  const [levelRiseDurationMs, setLevelRiseDurationMs] = useState(450);
  
  // Quick test buttons
  const quickTests = [
    { label: 'Small (150ml)', value: 150, progress: 0.075 },
    { label: 'Medium (400ml)', value: 400, progress: 0.2 },
    { label: 'Large (800ml)', value: 800, progress: 0.4 },
    { label: 'XLarge (1200ml)', value: 1200, progress: 0.6 },
    { label: 'Goal (2000ml)', value: 2000, progress: 1.0 },
  ];
  
  const handleQuickTest = useCallback((test: typeof quickTests[0]) => {
    setValueMl(test.value);
    setProgress(test.progress);
  }, []);
  
  const handleRandomSplash = useCallback(() => {
    const randomIncrease = Math.random() * 0.3; // 0-30% increase
    const newProgress = Math.min(1, progress + randomIncrease);
    const newValueMl = Math.round(newProgress * goalMl);
    
    setProgress(newProgress);
    setValueMl(newValueMl);
  }, [progress, goalMl]);
  
  const handleAnimationEnd = useCallback(() => {
    console.log('Water ring animation completed');
  }, []);
  
  const resetToDefault = useCallback(() => {
    setProgress(0.2);
    setValueMl(400);
    setSize(280);
    setStrokeWidth(14);
    setIdleAmplitude(6);
    setIdleFrequency(1.8);
    setIdlePeriodMs(4000);
    setSplashAmplitudeMax(18);
    setSplashDurationMs(900);
    setLevelRiseDurationMs(450);
    setEnableTilt(false);
    setReduceMotion(false);
  }, []);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Water Ring Demo
        </Text>
        
        {/* Main Water Ring Display */}
        <View style={styles.ringContainer}>
          <WaterRing
            size={size}
            strokeWidth={strokeWidth}
            progress={progress}
            valueMl={valueMl}
            goalMl={goalMl}
            theme={theme}
            enableTilt={enableTilt}
            idleAmplitude={idleAmplitude}
            idleFrequency={idleFrequency}
            idlePeriodMs={idlePeriodMs}
            splashAmplitudeMax={splashAmplitudeMax}
            splashDurationMs={splashDurationMs}
            levelRiseDurationMs={levelRiseDurationMs}
            reduceMotion={reduceMotion}
            onAnimationEnd={handleAnimationEnd}
          />
        </View>
        
        {/* Quick Test Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Quick Tests
          </Text>
          <View style={styles.buttonGrid}>
            {quickTests.map((test, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.testButton, { backgroundColor: themeColors.surface }]}
                onPress={() => handleQuickTest(test)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: themeColors.text }]}>
                  {test.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.randomButton, { backgroundColor: themeColors.primary }]}
            onPress={handleRandomSplash}
            activeOpacity={0.8}
          >
            <Text style={styles.randomButtonText}>🎲 Random Splash</Text>
          </TouchableOpacity>
        </View>
        
        {/* Basic Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Basic Controls
          </Text>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Progress: {Math.round(progress * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              onValueChange={setProgress}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Size: {size}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={120}
              maximumValue={400}
              value={size}
              onValueChange={setSize}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Stroke Width: {strokeWidth}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={8}
              maximumValue={24}
              value={strokeWidth}
              onValueChange={setStrokeWidth}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
        </View>
        
        {/* Animation Tuning */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Animation Tuning
          </Text>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Idle Amplitude: {idleAmplitude}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={2}
              maximumValue={12}
              value={idleAmplitude}
              onValueChange={setIdleAmplitude}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Idle Frequency: {idleFrequency.toFixed(1)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={3.0}
              value={idleFrequency}
              onValueChange={setIdleFrequency}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Idle Period: {idlePeriodMs}ms
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={2000}
              maximumValue={8000}
              value={idlePeriodMs}
              onValueChange={setIdlePeriodMs}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Splash Amplitude Max: {splashAmplitudeMax}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={30}
              value={splashAmplitudeMax}
              onValueChange={setSplashAmplitudeMax}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Splash Duration: {splashDurationMs}ms
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={600}
              maximumValue={1500}
              value={splashDurationMs}
              onValueChange={setSplashDurationMs}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Level Rise Duration: {levelRiseDurationMs}ms
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={300}
              maximumValue={800}
              value={levelRiseDurationMs}
              onValueChange={setLevelRiseDurationMs}
              minimumTrackTintColor={themeColors.primary}
              maximumTrackTintColor={themeColors.border}
            />
          </View>
        </View>
        
        {/* Toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Features
          </Text>
          
          <View style={styles.toggleRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Enable Tilt (Device Rotation)
            </Text>
            <Switch
              value={enableTilt}
              onValueChange={setEnableTilt}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={enableTilt ? themeColors.surface : themeColors.textSecondary}
            />
          </View>
          
          <View style={styles.toggleRow}>
            <Text style={[styles.controlLabel, { color: themeColors.text }]}>
              Reduce Motion
            </Text>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={reduceMotion ? themeColors.surface : themeColors.textSecondary}
            />
          </View>
        </View>
        
        {/* Reset Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={resetToDefault}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetButtonText, { color: themeColors.text }]}>
              🔄 Reset to Defaults
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Info */}
        <View style={styles.section}>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            💡 Try changing the progress slider or use quick test buttons to see splash animations!
          </Text>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            🎨 Adjust animation parameters to fine-tune the water effect.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  randomButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  randomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlRow: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
});
