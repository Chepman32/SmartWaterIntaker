import { Platform } from 'react-native';
import {
  checkNotifications,
  requestNotifications,
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

export interface ReminderNotification {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // TODO: Initialize react-native-push-notification or @react-native-async-storage/async-storage
      // For now, we'll use a mock implementation
      console.log('NotificationService initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
    }
  }

  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await requestNotifications(['alert', 'sound', 'badge']);
        const granted = status === 'granted' || (status as any) === 'provisional';
        const canAskAgain = status !== 'blocked';
        return { granted, canAskAgain };
      }

      // Android
      if ((Platform.Version as number) >= 33) {
        const status = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        const granted = status === RESULTS.GRANTED;
        const canAskAgain = status !== RESULTS.BLOCKED;
        return { granted, canAskAgain };
      }
      // Below Android 13 does not require runtime permission
      return { granted: true, canAskAgain: true };
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return { granted: false, canAskAgain: true };
    }
  }

  async checkPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await checkNotifications();
        const granted = status === 'granted' || (status as any) === 'provisional';
        const canAskAgain = status !== 'blocked';
        return { granted, canAskAgain };
      }
      if ((Platform.Version as number) >= 33) {
        const status = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        const granted = status === RESULTS.GRANTED;
        const canAskAgain = status !== RESULTS.BLOCKED;
        return { granted, canAskAgain };
      }
      return { granted: true, canAskAgain: true };
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return { granted: false, canAskAgain: true };
    }
  }

  async scheduleReminder(reminder: ReminderNotification): Promise<void> {
    if (!reminder.enabled) return;

    try {
      // TODO: Schedule actual local notification
      console.log(`Scheduling reminder: ${reminder.title} at ${reminder.hour}:${reminder.minute}`);
      
      // Mock scheduling logic
      const notificationId = `reminder_${reminder.id}`;
      const scheduledDate = new Date();
      scheduledDate.setHours(reminder.hour, reminder.minute, 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (scheduledDate.getTime() <= Date.now()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }
      
      console.log(`Notification ${notificationId} scheduled for ${scheduledDate.toISOString()}`);
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }

  async scheduleMultipleReminders(reminders: ReminderNotification[]): Promise<void> {
    try {
      // Cancel existing reminders first
      await this.cancelAllReminders();
      
      // Schedule new reminders
      const enabledReminders = reminders.filter(r => r.enabled);
      for (const reminder of enabledReminders) {
        await this.scheduleReminder(reminder);
      }
      
      console.log(`Scheduled ${enabledReminders.length} reminders`);
    } catch (error) {
      console.error('Failed to schedule multiple reminders:', error);
    }
  }

  async cancelReminder(reminderId: string): Promise<void> {
    try {
      // TODO: Cancel actual notification
      const notificationId = `reminder_${reminderId}`;
      console.log(`Cancelling reminder: ${notificationId}`);
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
    }
  }

  async cancelAllReminders(): Promise<void> {
    try {
      // TODO: Cancel all scheduled notifications
      console.log('Cancelling all reminders');
    } catch (error) {
      console.error('Failed to cancel all reminders:', error);
    }
  }

  async scheduleSmartReminder(lastIntakeTime: Date, dailyGoalMl: number, currentIntakeMl: number): Promise<void> {
    try {
      const now = new Date();
      const timeSinceLastIntake = now.getTime() - lastIntakeTime.getTime();
      const hoursWithoutWater = timeSinceLastIntake / (1000 * 60 * 60);
      
      // Don't send smart reminders if user drank water recently (< 1 hour)
      if (hoursWithoutWater < 1) return;
      
      // Calculate progress percentage
      const progressPercent = (currentIntakeMl / dailyGoalMl) * 100;
      
      let title = 'Stay Hydrated! 💧';
      let body = 'Time for some water!';
      
      // Customize message based on progress and time
      if (progressPercent < 25) {
        body = "Let's start the day with some water!";
      } else if (progressPercent < 50) {
        body = "You're making good progress! Keep it up.";
      } else if (progressPercent < 75) {
        body = "Almost there! A few more sips to reach your goal.";
      } else if (progressPercent < 100) {
        body = "So close to your goal! One more glass should do it.";
      } else {
        // Don't send reminders if goal is already reached
        return;
      }
      
      // Schedule immediate notification (smart reminder)
      console.log(`Scheduling smart reminder: ${title} - ${body}`);
      
      // TODO: Schedule immediate local notification
    } catch (error) {
      console.error('Failed to schedule smart reminder:', error);
    }
  }

  generateDefaultReminders(): ReminderNotification[] {
    return [
      {
        id: 'morning',
        title: 'Good Morning! 🌅',
        body: 'Start your day with a refreshing glass of water!',
        hour: 8,
        minute: 0,
        enabled: true,
      },
      {
        id: 'midmorning',
        title: 'Mid-Morning Hydration 💧',
        body: 'Time for a water break!',
        hour: 10,
        minute: 30,
        enabled: true,
      },
      {
        id: 'lunch',
        title: 'Lunch Time Reminder 🍽️',
        body: 'Don\'t forget to drink water with your meal!',
        hour: 12,
        minute: 30,
        enabled: true,
      },
      {
        id: 'afternoon',
        title: 'Afternoon Boost ⚡',
        body: 'Beat the afternoon slump with some water!',
        hour: 15,
        minute: 0,
        enabled: true,
      },
      {
        id: 'evening',
        title: 'Evening Hydration 🌆',
        body: 'Keep up the good work! Time for more water.',
        hour: 18,
        minute: 0,
        enabled: true,
      },
      {
        id: 'bedtime',
        title: 'Before Bed 🌙',
        body: 'One last glass before you rest!',
        hour: 21,
        minute: 0,
        enabled: false,
      },
    ];
  }
}

export default NotificationService.getInstance();