import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../state/store';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import { deleteEvent } from '../state/slices/intakeSlice';


const HistoryScreen: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useThemeColors();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { events, dailyGoalMl } = useSelector((state: RootState) => state.intake);
  const { profile } = useSelector((state: RootState) => state.settings);
  const unit = profile.unit;
  
  // Filter events for selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
    return eventDate === selectedDateStr;
  });
  
  // Calculate total intake for the day
  const totalIntake = dayEvents.reduce((sum, event) => sum + event.amountMl, 0);
  
  // Convert ml to display unit
  const convertAmount = (amountMl: number) => {
    if (unit === 'oz') {
      return Math.round(amountMl * 0.033814 * 10) / 10; // Convert to oz with 1 decimal
    }
    return amountMl;
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleDeleteEvent = (eventId: string) => {
    dispatch(deleteEvent(eventId));
  };
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };
  
  const isToday = selectedDateStr === new Date().toISOString().split('T')[0];
  
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      
      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => navigateDate('prev')}
        >
          <Text style={styles.dateButtonText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {isToday ? 'Today' : selectedDate.toLocaleDateString()}
          </Text>
          <Text style={styles.dateSubtext}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.dateButton, !isToday && styles.dateButtonDisabled]} 
          onPress={() => navigateDate('next')}
          disabled={isToday}
        >
          <Text style={[styles.dateButtonText, !isToday && styles.dateButtonTextDisabled]}>›</Text>
        </TouchableOpacity>
      </View>
      
      {/* Daily Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Intake</Text>
          <Text style={styles.summaryValue}>
            {convertAmount(totalIntake)} {unit}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Daily Goal</Text>
          <Text style={styles.summaryValue}>
            {convertAmount(dailyGoalMl)} {unit}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min((totalIntake / dailyGoalMl) * 100, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((totalIntake / dailyGoalMl) * 100)}% of goal
        </Text>
      </View>
      
      {/* Events List */}
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        {dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No water logged for this day</Text>
            <Text style={styles.emptyStateSubtext}>
              {isToday ? 'Start logging your water intake!' : 'No data available'}
            </Text>
          </View>
        ) : (
          dayEvents
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventAmount}>
                    {convertAmount(event.amountMl)} {unit}
                  </Text>
                  <Text style={styles.eventTime}>
                    {formatTime(event.timestamp)}
                  </Text>
                  {event.containerId && (
                    <Text style={styles.eventContainer}>
                      Container: {event.containerId}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteEvent(event.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonDisabled: {
    backgroundColor: theme.border,
  },
  dateButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  dateButtonTextDisabled: {
    color: theme.textSecondary,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  dateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  eventCard: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  eventTime: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  eventContainer: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.error || '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HistoryScreen;