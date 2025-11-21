import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

type ReminderTime = {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
};

const defaultReminders: ReminderTime[] = [
  { id: '1', label: 'Morning Start', time: '08:00', enabled: true },
  { id: '2', label: 'Mid Morning', time: '10:30', enabled: true },
  { id: '3', label: 'Lunch Time', time: '12:30', enabled: true },
  { id: '4', label: 'Afternoon', time: '15:00', enabled: true },
  { id: '5', label: 'Evening', time: '18:00', enabled: true },
  { id: '6', label: 'Before Bed', time: '21:00', enabled: false },
];

export const RemindersScreen: React.FC = () => {

  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  
  const [reminders, setReminders] = useState<ReminderTime[]>(defaultReminders);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const toggleReminder = (id: string) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, enabled: !reminder.enabled }
          : reminder
      )
    );
  };
  
  const handleContinue = async () => {
    if (notificationsEnabled) {
      // TODO: Request notification permissions
      // TODO: Schedule notifications based on enabled reminders
      console.log('Setting up notifications:', reminders.filter(r => r.enabled));
    }

    // Navigate to the main app
    navigation.navigate('PermissionsScreen' as never);
  };

  const handleSkip = () => {
    navigation.navigate('PermissionsScreen' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const styles = getStyles(theme);
  const safeTop = Math.max(insets.top, 16);
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.topBar, { paddingTop: safeTop }]}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Stay Hydrated</Text>
          <Text style={styles.subtitle}>
            Set up gentle reminders to help you reach your daily goal.
          </Text>
        </View>
        
        <View style={styles.notificationToggle}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Enable Notifications</Text>
              <Text style={styles.toggleSubtitle}>
                Get reminded throughout the day
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.primary : theme.textSecondary}
            />
          </View>
        </View>
        
        {notificationsEnabled && (
          <View style={styles.remindersContainer}>
            <Text style={styles.sectionTitle}>Reminder Times</Text>
            <Text style={styles.sectionSubtitle}>
              Choose when you'd like to be reminded to drink water.
            </Text>
            
            <View style={styles.remindersList}>
              {reminders.map((reminder) => (
                <TouchableOpacity
                  key={reminder.id}
                  style={[
                    styles.reminderItem,
                    reminder.enabled && styles.reminderItemActive,
                  ]}
                  onPress={() => toggleReminder(reminder.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reminderInfo}>
                    <Text style={[
                      styles.reminderLabel,
                      reminder.enabled && styles.reminderLabelActive,
                    ]}>
                      {reminder.label}
                    </Text>
                    <Text style={[
                      styles.reminderTime,
                      reminder.enabled && styles.reminderTimeActive,
                    ]}>
                      {reminder.time}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    reminder.enabled && styles.checkboxActive,
                  ]}>
                    {reminder.enabled && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.smartRemindersInfo}>
              <Text style={styles.smartTitle}>🧠 Smart Reminders</Text>
              <Text style={styles.smartSubtitle}>
                We'll adjust reminder timing based on your usage patterns and skip notifications when you're already staying hydrated.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
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
          <Text style={styles.continueButtonText}>
            {notificationsEnabled ? 'Set Up Reminders' : 'Continue'}
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
  topBar: {
    paddingHorizontal: 24,
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
  },
  header: {
    paddingTop: 40,
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
  notificationToggle: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  remindersContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  remindersList: {
    gap: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reminderItemActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight || theme.primary + '10',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 2,
  },
  reminderLabelActive: {
    color: theme.text,
  },
  reminderTime: {
    fontSize: 14,
    color: theme.textSecondary,
    fontFamily: 'monospace',
  },
  reminderTimeActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  smartRemindersInfo: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  smartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  smartSubtitle: {
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
