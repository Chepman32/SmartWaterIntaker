import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { Colors } from '../constants/colors';
import { useTheme, useThemeColors } from '../hooks/useThemeColors';
import WaterRing from '../components/WaterRing';

import ContainerCarousel from '../components/ContainerCarousel';

export default function HomeScreen() {
  const { theme, mode } = useTheme();
  const { width } = useWindowDimensions();
  
  const todayTotalMl = useSelector((state: RootState) => 
    state.intake.events
      .filter(event => {
        const today = new Date();
        const eventDate = new Date(event.timestamp);
        return eventDate.toDateString() === today.toDateString();
      })
      .reduce((total, event) => total + event.amountMl, 0)
  );
  
  const dailyGoalMl = useSelector((state: RootState) => state.intake.dailyGoalMl);
  const progress = Math.min(todayTotalMl / dailyGoalMl, 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Today</Text>
        
        <View style={styles.progressContainer}>
          <WaterRing
            size={Math.floor(width * 0.99)}
            strokeWidth={12}
            progress={progress}
            valueMl={todayTotalMl}
            goalMl={dailyGoalMl}
            theme={mode === 'dark' ? 'dark' : 'light'}
            idleAmplitude={6}
            idleFrequency={1.8}
            splashAmplitudeMax={18}
            splashDurationMs={900}
            levelRiseDurationMs={900}
          />
        </View>
        
        <ContainerCarousel textColor={theme.text} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    position: 'relative',
  },


});
