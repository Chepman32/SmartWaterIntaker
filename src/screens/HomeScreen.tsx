import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { Colors } from '../constants/colors';
import WaterRing from '../components/WaterRing';
import QuickAddChip from '../components/QuickAddChip';
import ContainerCarousel from '../components/ContainerCarousel';
import WaterLoggingBottomSheet from '../components/WaterLoggingBottomSheet';

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <Text style={[styles.title, { color: theme.text }]}>Today</Text>
        
        <View style={styles.progressContainer}>
          <WaterRing
            size={280}
            strokeWidth={12}
            progress={progress}
            valueMl={todayTotalMl}
            goalMl={dailyGoalMl}
            theme={isDark ? 'dark' : 'light'}
            idleAmplitude={6}
            idleFrequency={1.8}
            splashAmplitudeMax={18}
            splashDurationMs={900}
            levelRiseDurationMs={450}
          />
        </View>
        
        <View style={styles.quickAddContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Add</Text>
          <View style={styles.row}>
            <QuickAddChip amountMl={150} color={theme.surface} textColor={theme.text} />
            <QuickAddChip amountMl={250} color={theme.surface} textColor={theme.text} />
            <QuickAddChip amountMl={330} color={theme.surface} textColor={theme.text} />
            <QuickAddChip amountMl={500} color={theme.surface} textColor={theme.text} />
          </View>
        </View>
        
        <ContainerCarousel textColor={theme.text} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setIsBottomSheetVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      
      {/* Water Logging Bottom Sheet */}
      <WaterLoggingBottomSheet
        isVisible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
      />
    </View>
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
    paddingTop: 16,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  quickAddContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});