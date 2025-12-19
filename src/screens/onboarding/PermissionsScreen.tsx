import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { Colors } from '../../constants/colors';
import { updateProfile } from '../../state/slices/settingsSlice';
import { StorageService } from '../../services/storage';
import NotificationService from '../../services/NotificationService';
import HealthService from '../../services/HealthService';

type Permission = {
  id: string;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  granted: boolean;
};

const permissions: Permission[] = [
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Get gentle reminders to stay hydrated throughout the day',
    icon: '🔔',
    required: false,
    granted: false,
  },
  {
    id: 'health',
    title: 'Health Data',
    description:
      'Sync with Apple Health to track your hydration alongside other health metrics',
    icon: '❤️',
    required: false,
    granted: false,
  },
];

export const PermissionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [permissionStates, setPermissionStates] =
    useState<Permission[]>(permissions);
  const [isRequesting, setIsRequesting] = useState<string | null>(null);

  // Check initial permission states on mount
  useEffect(() => {
    checkInitialPermissions();
  }, []);

  const checkInitialPermissions = async () => {
    try {
      const notificationStatus = await NotificationService.checkPermissions();
      if (notificationStatus.granted) {
        setPermissionStates(prev =>
          prev.map(p =>
            p.id === 'notifications' ? { ...p, granted: true } : p,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to check initial permissions:', error);
    }
  };

  const requestPermission = async (permissionId: string) => {
    setIsRequesting(permissionId);

    try {
      switch (permissionId) {
        case 'notifications':
          const notificationResult =
            await NotificationService.requestPermissions();
          if (notificationResult.granted) {
            setPermissionStates(prev =>
              prev.map(p =>
                p.id === permissionId ? { ...p, granted: true } : p,
              ),
            );
            // Save notification preference
            dispatch(updateProfile({ notificationsEnabled: true }));
          } else if (!notificationResult.canAskAgain) {
            Alert.alert(
              'Notifications Disabled',
              'Please enable notifications in your device settings to receive hydration reminders.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          }
          break;

        case 'health':
          if (Platform.OS !== 'ios') {
            Alert.alert(
              'Health Data',
              'Health data integration is currently only available on iOS.',
              [{ text: 'OK' }],
            );
            break;
          }

          const healthResult = await HealthService.requestPermissions();
          if (healthResult.granted) {
            setPermissionStates(prev =>
              prev.map(p =>
                p.id === permissionId ? { ...p, granted: true } : p,
              ),
            );
            dispatch(updateProfile({ healthKitEnabled: true }));
          } else {
            // HealthKit may not be available in simulator or permission denied
            Alert.alert(
              'Health Access',
              healthResult.error ||
                'Unable to access Health data. You can enable this later in Settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to request ${permissionId} permission:`, error);
      Alert.alert('Error', 'Failed to request permission. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsRequesting(null);
    }
  };

  const completeOnboarding = () => {
    // Mark onboarding as completed
    dispatch(updateProfile({ onboardingCompleted: true }));
    const currentProfile = StorageService.getProfile();
    if (currentProfile) {
      StorageService.setProfile({
        ...currentProfile,
        onboardingCompleted: true,
      });
    }
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' as never }],
    });
  };

  const handleContinue = () => {
    completeOnboarding();
  };

  const handleSkipAll = () => {
    completeOnboarding();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipAll}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Almost Ready!</Text>
          <Text style={styles.subtitle}>
            Enable these features to get the most out of your hydration journey.
          </Text>
        </View>

        <View style={styles.permissionsContainer}>
          {permissionStates.map(permission => (
            <View key={permission.id} style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <View style={styles.permissionIcon}>
                  <Text style={styles.iconText}>{permission.icon}</Text>
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.permissionDescription}>
                    {permission.description}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  permission.granted && styles.permissionButtonGranted,
                ]}
                onPress={() => requestPermission(permission.id)}
                disabled={permission.granted || isRequesting === permission.id}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.permissionButtonText,
                    permission.granted && styles.permissionButtonTextGranted,
                  ]}
                >
                  {isRequesting === permission.id
                    ? 'Enabling...'
                    : permission.granted
                    ? 'Enabled ✓'
                    : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Privacy First</Text>
          <Text style={styles.infoText}>
            Your data stays on your device. We don't collect, store, or share
            any personal information. You can change these permissions anytime
            in Settings.
          </Text>
        </View>
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
          <Text style={styles.continueButtonText}>Get Started</Text>
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
    permissionsContainer: {
      gap: 16,
      marginBottom: 32,
    },
    permissionCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
    },
    permissionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    permissionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primaryLight || theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    iconText: {
      fontSize: 24,
    },
    permissionInfo: {
      flex: 1,
    },
    permissionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    permissionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    permissionButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    permissionButtonGranted: {
      backgroundColor: theme.success || '#4CAF50',
    },
    permissionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    permissionButtonTextGranted: {
      color: 'white',
    },
    infoContainer: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
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
