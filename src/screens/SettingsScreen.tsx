import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import { RootState } from '../state/store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { setTheme, setHaptics, setSounds } from '../state/slices/settingsSlice';
import { usePurchases } from '../hooks/usePurchases';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  disabled?: boolean;
  proFeature?: boolean;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const dispatch = useDispatch();
  const theme = useThemeColors();
  
  const { settings, profile } = useSelector((state: RootState) => state.settings);
  const { isProUnlocked } = usePurchases();
  
  const settingsItems: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage reminder settings',
      icon: 'notifications',
      type: 'navigation',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      id: 'theme',
      title: 'Dark Mode',
      subtitle: 'Toggle dark/light theme',
      icon: 'moon',
      type: 'toggle',
      value: settings.theme === 'dark',
      onToggle: (value) => dispatch(setTheme(value ? 'dark' : 'light')),
    },
    {
      id: 'haptics',
      title: 'Haptic Feedback',
      subtitle: 'Vibration on interactions',
      icon: 'phone-portrait',
      type: 'toggle',
      value: settings.haptics,
      onToggle: (value) => dispatch(setHaptics(value)),
    },
    {
      id: 'sounds',
      title: 'Sound Effects',
      subtitle: 'Audio feedback',
      icon: 'volume-high',
      type: 'toggle',
      value: settings.sounds,
      onToggle: (value) => dispatch(setSounds(value)),
    },
  ];
  
  const proItems: SettingItem[] = [
    {
      id: 'purchase',
      title: isProUnlocked ? 'Manage Purchases' : 'Upgrade to Pro',
      subtitle: isProUnlocked ? 'View your purchases' : 'Unlock premium features',
      icon: isProUnlocked ? 'star' : 'diamond',
      type: 'navigation',
      onPress: () => navigation.navigate('Purchase'),
    },
  ];
  
  const aboutItems: SettingItem[] = [
    {
      id: 'version',
      title: 'Version',
      subtitle: '1.0.0',
      icon: 'information-circle',
      type: 'action',
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: 'Get help and send feedback',
      icon: 'help-circle',
      type: 'action',
      onPress: () => {
        // TODO: Open support/feedback
        console.log('Open support');
      },
    },
  ];
  
  const renderSettingItem = (item: SettingItem) => {
    const isProFeature = item.proFeature && !isProUnlocked;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          { backgroundColor: theme.card },
          isProFeature && styles.settingItemDisabled,
        ]}
        onPress={item.onPress}
        disabled={item.disabled || (item.type === 'toggle') || isProFeature}
        activeOpacity={0.7}
      >
        <View style={styles.settingItemLeft}>
          <View style={[
            styles.settingIcon,
            { backgroundColor: theme.primary + '20' }
          ]}>
            <Icon 
              name={item.icon} 
              size={20} 
              color={isProFeature ? theme.textSecondary : theme.primary} 
            />
          </View>
          
          <View style={styles.settingInfo}>
            <Text style={[
              styles.settingTitle,
              { color: isProFeature ? theme.textSecondary : theme.text }
            ]}>
              {item.title}
              {item.proFeature && !isProUnlocked && (
                <Text style={styles.proLabel}> PRO</Text>
              )}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.settingItemRight}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value || false}
              onValueChange={item.onToggle}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={item.value ? theme.primary : theme.textSecondary}
              disabled={isProFeature}
            />
          )}
          
          {item.type === 'navigation' && (
            <Icon 
              name="chevron-forward" 
              size={20} 
              color={theme.textSecondary} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      <View style={styles.sectionContent}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );
  
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        {isProUnlocked && (
          <View style={styles.proBadge}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.proText}>Pro</Text>
          </View>
        )}
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileTitle, { color: theme.text }]}>Profile</Text>
            <Text style={[styles.profileDetail, { color: theme.textSecondary }]}>Unit: {profile.unit}</Text>
            <Text style={[styles.profileDetail, { color: theme.textSecondary }]}>Activity: {profile.activityLevel}</Text>
            <Text style={[styles.profileDetail, { color: theme.textSecondary }]}>Climate: {profile.climate}</Text>
          </View>
        </View>
        
        {/* Settings Sections */}
        {renderSection('Preferences', settingsItems)}
        {renderSection('Premium', proItems)}
        {renderSection('About', aboutItems)}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Stay hydrated! 💧
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  proLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  settingItemRight: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SettingsScreen;