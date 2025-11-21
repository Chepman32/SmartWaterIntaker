import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, ScrollView, Alert, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import { RootState } from '../state/store';
import { useNotifications } from '../hooks/useNotifications';
import {
  setSmartRemindersEnabled,
  upsertSchedule,
  toggleSchedule,
} from '../state/slices/remindersSlice';
import { ReminderSchedule } from '../types/models';

const NotificationsScreen: React.FC = () => {
  const dispatch = useDispatch();

  const theme = useThemeColors();
  
  const {
    schedules,
    notificationsEnabled,
    permissionsGranted,
    smartRemindersEnabled,
  } = useSelector((state: RootState) => state.reminders);
  
  const {
    requestPermissions,
    enableNotifications,
    disableNotifications,
  } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Create default schedules if none exist
  useEffect(() => {
    if (schedules.length === 0) {
      const defaultSchedules: ReminderSchedule[] = [
        {
          id: 'morning',
          startMinutes: 8 * 60, // 8:00 AM
          endMinutes: 8 * 60,
          intervalMin: 0,
          days: [1, 2, 3, 4, 5, 6, 0], // All days
          enabled: true,
        },
        {
          id: 'midmorning',
          startMinutes: 10 * 60 + 30, // 10:30 AM
          endMinutes: 10 * 60 + 30,
          intervalMin: 0,
          days: [1, 2, 3, 4, 5, 6, 0],
          enabled: true,
        },
        {
          id: 'lunch',
          startMinutes: 12 * 60 + 30, // 12:30 PM
          endMinutes: 12 * 60 + 30,
          intervalMin: 0,
          days: [1, 2, 3, 4, 5, 6, 0],
          enabled: true,
        },
        {
          id: 'afternoon',
          startMinutes: 15 * 60, // 3:00 PM
          endMinutes: 15 * 60,
          intervalMin: 0,
          days: [1, 2, 3, 4, 5, 6, 0],
          enabled: true,
        },
        {
          id: 'evening',
          startMinutes: 18 * 60, // 6:00 PM
          endMinutes: 18 * 60,
          intervalMin: 0,
          days: [1, 2, 3, 4, 5, 6, 0],
          enabled: true,
        },
        {
          id: 'bedtime',
          startMinutes: 21 * 60, // 9:00 PM
          endMinutes: 21 * 60,
          intervalMin: 0,
          days: [1, 2, 3, 4, 5, 6, 0],
          enabled: false,
        },
      ];
      
      defaultSchedules.forEach(schedule => {
        dispatch(upsertSchedule(schedule));
      });
    }
  }, [schedules.length, dispatch]);
  
  const handleToggleNotifications = async (enabled: boolean) => {
    setIsLoading(true);
    
    try {
      if (enabled) {
        if (!permissionsGranted) {
          const permissions = await requestPermissions();
          if (!permissions.granted) {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in your device settings to receive hydration reminders.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Settings', onPress: () => Linking.openSettings() },
              ]
            );
            setIsLoading(false);
            return;
          }
        }
        await enableNotifications();
      } else {
        await disableNotifications();
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleSmartReminders = (enabled: boolean) => {
    dispatch(setSmartRemindersEnabled(enabled));
  };
  
  const handleToggleSchedule = (scheduleId: string, enabled: boolean) => {
    dispatch(toggleSchedule({ id: scheduleId, enabled }));
  };
  
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };
  
  const getScheduleName = (scheduleId: string): string => {
    const names: Record<string, string> = {
      morning: 'Morning Start',
      midmorning: 'Mid Morning',
      lunch: 'Lunch Time',
      afternoon: 'Afternoon',
      evening: 'Evening',
      bedtime: 'Before Bed',
    };
    return names[scheduleId] || 'Custom Reminder';
  };
  
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            Stay on track with gentle reminders throughout the day.
          </Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Get reminded to drink water throughout the day
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isLoading}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.primary : theme.textSecondary}
            />
          </View>
        </View>
        
        {notificationsEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Times</Text>
              <Text style={styles.sectionDescription}>
                Choose when you'd like to receive notifications.
              </Text>
              
              <View style={styles.schedulesList}>
                {schedules.map((schedule) => (
                  <View key={schedule.id} style={styles.scheduleItem}>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleName}>
                        {getScheduleName(schedule.id)}
                      </Text>
                      <Text style={styles.scheduleTime}>
                        {formatTime(schedule.startMinutes)}
                      </Text>
                    </View>
                    
                    <Switch
                      value={schedule.enabled}
                      onValueChange={(enabled) => handleToggleSchedule(schedule.id, enabled)}
                      trackColor={{ false: theme.border, true: theme.primary + '40' }}
                      thumbColor={schedule.enabled ? theme.primary : theme.textSecondary}
                    />
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Smart Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Get additional reminders based on your hydration patterns
                  </Text>
                </View>
                <Switch
                  value={smartRemindersEnabled}
                  onValueChange={handleToggleSmartReminders}
                  trackColor={{ false: theme.border, true: theme.primary + '40' }}
                  thumbColor={smartRemindersEnabled ? theme.primary : theme.textSecondary}
                />
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>🧠 How Smart Reminders Work</Text>
              <Text style={styles.infoText}>
                Smart reminders analyze your drinking patterns and send notifications when you haven't had water for a while. They automatically adjust based on your progress toward your daily goal and won't disturb you when you're already staying hydrated.
              </Text>
            </View>
          </>
        )}
        
        {!permissionsGranted && (
          <View style={styles.warningSection}>
            <Text style={styles.warningTitle}>⚠️ Permissions Required</Text>
            <Text style={styles.warningText}>
              Notification permissions are required to send hydration reminders. You can enable them in your device settings.
            </Text>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  section: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  schedulesList: {
    gap: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 14,
    color: theme.textSecondary,
    fontFamily: 'monospace',
  },
  infoSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: theme.warning || '#FFF3CD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.warningText || '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: theme.warningText || '#856404',
    lineHeight: 20,
  },
});

export default NotificationsScreen;
