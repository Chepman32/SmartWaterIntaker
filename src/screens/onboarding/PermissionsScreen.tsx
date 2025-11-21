import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

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
    description: 'Sync with Apple Health to track your hydration alongside other health metrics',
    icon: '❤️',
    required: false,
    granted: false,
  },
];

export const PermissionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  
  const [permissionStates, setPermissionStates] = useState<Permission[]>(permissions);
  
  const requestPermission = async (permissionId: string) => {
    // TODO: Implement actual permission requests
    switch (permissionId) {
      case 'notifications':
        // Request notification permissions
        console.log('Requesting notification permissions');
        break;
      case 'health':
        // Request HealthKit permissions
        console.log('Requesting HealthKit permissions');
        break;
    }
    
    // Simulate permission granted for demo
    setPermissionStates(prev => 
      prev.map(p => 
        p.id === permissionId 
          ? { ...p, granted: true }
          : p
      )
    );
  };
  
  const handleContinue = () => {
    // TODO: Save onboarding completion status
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' as never }],
    });
  };

  const handleSkipAll = () => {
    // Skip all permissions and go to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' as never }],
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };
  
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipAll} activeOpacity={0.7}>
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
          {permissionStates.map((permission) => (
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
                disabled={permission.granted}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.permissionButtonText,
                  permission.granted && styles.permissionButtonTextGranted,
                ]}>
                  {permission.granted ? 'Enabled ✓' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Privacy First</Text>
          <Text style={styles.infoText}>
            Your data stays on your device. We don't collect, store, or share any personal information. You can change these permissions anytime in Settings.
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

const getStyles = (theme: any) => StyleSheet.create({
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
