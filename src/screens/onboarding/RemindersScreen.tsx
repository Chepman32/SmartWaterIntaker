import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import NotificationService from '../../services/NotificationService';
import { updateProfile } from '../../state/slices/settingsSlice';
import { StorageService } from '../../services/storage';

type ReminderTime = {
  id: string;
  labelKey: string;
  time: string;
  enabled: boolean;
};

const defaultReminders: ReminderTime[] = [
  { id: '1', labelKey: 'morningStart', time: '08:00', enabled: true },
  { id: '2', labelKey: 'midMorning', time: '10:30', enabled: true },
  { id: '3', labelKey: 'lunchTime', time: '12:30', enabled: true },
  { id: '4', labelKey: 'afternoon', time: '15:00', enabled: true },
  { id: '5', labelKey: 'evening', time: '18:00', enabled: true },
  { id: '6', labelKey: 'beforeBed', time: '21:00', enabled: false },
];

export const RemindersScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const profile = useSelector((state: any) => state.settings.profile);
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [reminders, setReminders] = useState<ReminderTime[]>(defaultReminders);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [shouldAutoProceed, setShouldAutoProceed] = useState(false);

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissionOnMount();
  }, []);

  const requestNotificationPermissionOnMount = async () => {
    const result = await NotificationService.requestPermissions();
    if (result.granted) {
      setPermissionGranted(true);
      setNotificationsEnabled(true);
      setShouldAutoProceed(true);
    }
    // If denied/blocked: user proceeds manually with Begin button
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const result = await NotificationService.requestPermissions();
      if (result.granted) {
        setPermissionGranted(true);
        setNotificationsEnabled(true);
      } else if (!result.canAskAgain) {
        Alert.alert(
          t('notifications.permissionRequiredTitle'),
          t('notifications.permissionRequiredMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('notifications.settingsButton'),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        setNotificationsEnabled(false);
      } else {
        setNotificationsEnabled(false);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id
          ? { ...reminder, enabled: !reminder.enabled }
          : reminder,
      ),
    );
  };

  const handleContinue = async () => {
    if (notificationsEnabled) {
      // TODO: Schedule notifications based on enabled reminders
      console.log(
        'Setting up notifications:',
        reminders.filter(r => r.enabled),
      );
    }

    // Mark onboarding as completed and navigate to main app
    const updatedProfile = {
      ...profile,
      onboardingCompleted: true,
      notificationsEnabled: notificationsEnabled,
      updatedAt: Date.now(),
    };
    dispatch(updateProfile(updatedProfile));
    StorageService.setProfile(updatedProfile);

    (navigation as any).reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  // Auto-proceed to next screen when permission is granted on mount
  useEffect(() => {
    if (shouldAutoProceed) {
      handleContinue();
    }
  }, [shouldAutoProceed]);

  const handleBack = () => {
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.reminders.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.reminders.subtitle')}
          </Text>
        </View>

        <View style={styles.notificationToggle}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>
                {t('onboarding.reminders.enableNotifications')}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {t('onboarding.reminders.enableNotificationsDesc')}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={
                notificationsEnabled ? theme.primary : theme.textSecondary
              }
            />
          </View>
        </View>

        {notificationsEnabled && (
          <View style={styles.remindersContainer}>
            <Text style={styles.sectionTitle}>
              {t('onboarding.reminders.reminderTimes')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t('onboarding.reminders.reminderTimesDesc')}
            </Text>

            <View style={styles.remindersList}>
              {reminders.map(reminder => (
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
                    <Text
                      style={[
                        styles.reminderLabel,
                        reminder.enabled && styles.reminderLabelActive,
                      ]}
                    >
                      {t(`onboarding.reminders.${reminder.labelKey}`)}
                    </Text>
                    <Text
                      style={[
                        styles.reminderTime,
                        reminder.enabled && styles.reminderTimeActive,
                      ]}
                    >
                      {reminder.time}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      reminder.enabled && styles.checkboxActive,
                    ]}
                  >
                    {reminder.enabled && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.smartRemindersInfo}>
              <Text style={styles.smartTitle}>
                {t('onboarding.reminders.smartReminders')}
              </Text>
              <Text style={styles.smartSubtitle}>
                {t('onboarding.reminders.smartRemindersDesc')}
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
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {t('onboarding.permissions.getStarted')}
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
