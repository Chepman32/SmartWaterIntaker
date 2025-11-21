import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, AppState, AppStateStatus, Linking } from 'react-native';
import { RootState } from '../state/store';
import NotificationService, { ReminderNotification } from '../services/NotificationService';
import {
  setNotificationsEnabled,
  setPermissionsGranted,
  setLastReminderTime,
} from '../state/slices/remindersSlice';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const {
    schedules,
    notificationsEnabled,
    permissionsGranted,
    smartRemindersEnabled,
  } = useSelector((state: RootState) => state.reminders);
  
  const { todayTotalMl, dailyGoalMl, events } = useSelector((state: RootState) => state.intake);

  // Initialize notification service
  useEffect(() => {
    NotificationService.initialize();
  }, []);

  // Check permissions on app state change
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const permissions = await NotificationService.checkPermissions();
        dispatch(setPermissionsGranted(permissions.granted));
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check permissions on mount
    NotificationService.checkPermissions().then(permissions => {
      dispatch(setPermissionsGranted(permissions.granted));
    });

    return () => subscription?.remove();
  }, [dispatch]);

  // Schedule reminders when they change
  useEffect(() => {
    if (!notificationsEnabled || !permissionsGranted) return;

    const scheduleReminders = async () => {
      try {
        // Convert ReminderSchedule to ReminderNotification format
        const reminders: ReminderNotification[] = schedules.map(schedule => {
          const hour = Math.floor(schedule.startMinutes / 60);
          const minute = schedule.startMinutes % 60;
          
          return {
            id: schedule.id,
            title: getNotificationTitle(hour),
            body: getNotificationBody(hour),
            hour,
            minute,
            enabled: schedule.enabled,
          };
        });

        await NotificationService.scheduleMultipleReminders(reminders);
      } catch (error) {
        console.error('Failed to schedule reminders:', error);
      }
    };

    scheduleReminders();
  }, [schedules, notificationsEnabled, permissionsGranted]);

  // Smart reminders based on intake patterns
  useEffect(() => {
    if (!smartRemindersEnabled || !notificationsEnabled || !permissionsGranted) return;
    if (events.length === 0) return;

    const lastEvent = events[0]; // Events are sorted by most recent first
    const lastIntakeTime = new Date(lastEvent.timestamp);
    const now = new Date();
    const timeSinceLastIntake = now.getTime() - lastIntakeTime.getTime();
    const hoursWithoutWater = timeSinceLastIntake / (1000 * 60 * 60);

    // Schedule smart reminder if it's been more than 2 hours since last intake
    // and user hasn't reached their daily goal
    if (hoursWithoutWater >= 2 && todayTotalMl < dailyGoalMl) {
      NotificationService.scheduleSmartReminder(lastIntakeTime, dailyGoalMl, todayTotalMl);
      dispatch(setLastReminderTime(now.toISOString()));
    }
  }, [events, todayTotalMl, dailyGoalMl, smartRemindersEnabled, notificationsEnabled, permissionsGranted, dispatch]);

  const requestPermissions = useCallback(async () => {
    try {
      const permissions = await NotificationService.requestPermissions();
      dispatch(setPermissionsGranted(permissions.granted));
      
      if (permissions.granted) {
        dispatch(setNotificationsEnabled(true));
      }
      
      return permissions;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return { granted: false, canAskAgain: true };
    }
  }, [dispatch]);

  const promptEnableInSettings = useCallback(() => {
    Alert.alert(
      'Enable Notifications',
      'Notification permissions are blocked. Please enable them in your device settings to receive reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  }, []);

  const enableNotifications = useCallback(async () => {
    if (!permissionsGranted) {
      const permissions = await requestPermissions();
      if (!permissions.granted) {
        promptEnableInSettings();
        return false;
      }
    }
    
    dispatch(setNotificationsEnabled(true));
    return true;
  }, [permissionsGranted, requestPermissions, dispatch, promptEnableInSettings]);

  const disableNotifications = useCallback(async () => {
    dispatch(setNotificationsEnabled(false));
    await NotificationService.cancelAllReminders();
  }, [dispatch]);

  return {
    notificationsEnabled,
    permissionsGranted,
    smartRemindersEnabled,
    requestPermissions,
    enableNotifications,
    disableNotifications,
  };
};

// Helper functions for notification content
function getNotificationTitle(hour: number): string {
  if (hour >= 6 && hour < 12) {
    return 'Good Morning! 🌅';
  } else if (hour >= 12 && hour < 17) {
    return 'Afternoon Hydration 💧';
  } else if (hour >= 17 && hour < 21) {
    return 'Evening Reminder 🌆';
  } else {
    return 'Stay Hydrated! 💧';
  }
}

function getNotificationBody(hour: number): string {
  const messages = [
    'Time for a refreshing glass of water!',
    'Your body needs hydration right now.',
    'Stay healthy, stay hydrated!',
    'A quick water break will boost your energy.',
    'Don\'t forget to drink water!',
    'Keep up the great hydration habits!',
  ];
  
  // Use hour to get consistent message for same time
  return messages[hour % messages.length];
}
