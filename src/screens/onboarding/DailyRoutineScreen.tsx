import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from '../../state/slices/settingsSlice';
import { Colors } from '../../constants/colors';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

export const DailyRoutineScreen: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [wakeUpTime, setWakeUpTime] = useState(new Date());
  const [bedTime, setBedTime] = useState(new Date());
  const [hasWorkSchedule, setHasWorkSchedule] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(new Date());
  const [workEndTime, setWorkEndTime] = useState(new Date());

  const [showWakeUpPicker, setShowWakeUpPicker] = useState(false);
  const [showBedTimePicker, setShowBedTimePicker] = useState(false);
  const [showWorkStartPicker, setShowWorkStartPicker] = useState(false);
  const [showWorkEndPicker, setShowWorkEndPicker] = useState(false);

  const wakeUpPickerAnim = useRef(new Animated.Value(0)).current;
  const bedTimePickerAnim = useRef(new Animated.Value(0)).current;
  const workStartPickerAnim = useRef(new Animated.Value(0)).current;
  const workEndPickerAnim = useRef(new Animated.Value(0)).current;

  // Set default times
  React.useEffect(() => {
    const defaultWakeUp = new Date();
    defaultWakeUp.setHours(8, 0, 0, 0);
    setWakeUpTime(defaultWakeUp);

    const defaultBedTime = new Date();
    defaultBedTime.setHours(22, 0, 0, 0);
    setBedTime(defaultBedTime);

    const defaultWorkStart = new Date();
    defaultWorkStart.setHours(9, 0, 0, 0);
    setWorkStartTime(defaultWorkStart);

    const defaultWorkEnd = new Date();
    defaultWorkEnd.setHours(17, 0, 0, 0);
    setWorkEndTime(defaultWorkEnd);
  }, []);

  // Animate wake up picker
  useEffect(() => {
    Animated.timing(wakeUpPickerAnim, {
      toValue: showWakeUpPicker ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showWakeUpPicker]);

  // Animate bed time picker
  useEffect(() => {
    Animated.timing(bedTimePickerAnim, {
      toValue: showBedTimePicker ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showBedTimePicker]);

  // Animate work start picker
  useEffect(() => {
    Animated.timing(workStartPickerAnim, {
      toValue: showWorkStartPicker ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showWorkStartPicker]);

  // Animate work end picker
  useEffect(() => {
    Animated.timing(workEndPickerAnim, {
      toValue: showWorkEndPicker ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showWorkEndPicker]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTimeToHHMM = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleWakeUpChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowWakeUpPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setWakeUpTime(selectedDate);
    }
  };

  const handleBedTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowBedTimePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setBedTime(selectedDate);
    }
  };

  const handleWorkStartChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowWorkStartPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setWorkStartTime(selectedDate);
    }
  };

  const handleWorkEndChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowWorkEndPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setWorkEndTime(selectedDate);
    }
  };

  const closeAllPickers = () => {
    setShowWakeUpPicker(false);
    setShowBedTimePicker(false);
    setShowWorkStartPicker(false);
    setShowWorkEndPicker(false);
  };

  const toggleWakeUpPicker = () => {
    const willOpen = !showWakeUpPicker;
    closeAllPickers();
    setShowWakeUpPicker(willOpen);
  };

  const toggleBedTimePicker = () => {
    const willOpen = !showBedTimePicker;
    closeAllPickers();
    setShowBedTimePicker(willOpen);
  };

  const toggleWorkStartPicker = () => {
    const willOpen = !showWorkStartPicker;
    closeAllPickers();
    setShowWorkStartPicker(willOpen);
  };

  const toggleWorkEndPicker = () => {
    const willOpen = !showWorkEndPicker;
    closeAllPickers();
    setShowWorkEndPicker(willOpen);
  };

  const handleWorkScheduleToggle = (value: boolean) => {
    closeAllPickers();
    setHasWorkSchedule(value);
  };

  const handleContinue = () => {
    closeAllPickers();
    const profileUpdate: any = {
      wakeUpTime: formatTimeToHHMM(wakeUpTime),
      bedTime: formatTimeToHHMM(bedTime),
    };

    if (hasWorkSchedule) {
      profileUpdate.workStartTime = formatTimeToHHMM(workStartTime);
      profileUpdate.workEndTime = formatTimeToHHMM(workEndTime);
    }

    dispatch(updateProfile(profileUpdate));
    navigation.navigate('WeightActivityScreen' as never);
  };

  const handleBack = () => {
    closeAllPickers();
    navigation.goBack();
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={closeAllPickers}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.dailyRoutine.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.dailyRoutine.subtitle')}
          </Text>
        </View>

        {/* Wake Up Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('onboarding.dailyRoutine.wakeUpTime')}
          </Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={toggleWakeUpPicker}
            activeOpacity={0.7}
          >
            <Text style={styles.timeLabel}>
              {t('onboarding.dailyRoutine.wakeUpLabel')}
            </Text>
            <Text style={styles.timeValue}>{formatTime(wakeUpTime)}</Text>
          </TouchableOpacity>
          {(showWakeUpPicker || wakeUpPickerAnim._value > 0) && (
            <Animated.View
              style={{
                opacity: wakeUpPickerAnim,
                maxHeight: wakeUpPickerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={wakeUpTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleWakeUpChange}
              />
            </Animated.View>
          )}
        </View>

        {/* Bed Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('onboarding.dailyRoutine.bedTime')}
          </Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={toggleBedTimePicker}
            activeOpacity={0.7}
          >
            <Text style={styles.timeLabel}>
              {t('onboarding.dailyRoutine.bedTimeLabel')}
            </Text>
            <Text style={styles.timeValue}>{formatTime(bedTime)}</Text>
          </TouchableOpacity>
          {(showBedTimePicker || bedTimePickerAnim._value > 0) && (
            <Animated.View
              style={{
                opacity: bedTimePickerAnim,
                maxHeight: bedTimePickerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
                overflow: 'hidden',
              }}
            >
              <DateTimePicker
                value={bedTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleBedTimeChange}
              />
            </Animated.View>
          )}
        </View>

        {/* Work Schedule Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>
                {t('onboarding.dailyRoutine.workSchedule')}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {t('onboarding.dailyRoutine.workScheduleDesc')}
              </Text>
            </View>
            <Switch
              value={hasWorkSchedule}
              onValueChange={handleWorkScheduleToggle}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={hasWorkSchedule ? theme.primary : theme.textSecondary}
            />
          </View>
        </View>

        {/* Work Schedule Times */}
        {hasWorkSchedule && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('onboarding.dailyRoutine.workStartTime')}
              </Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={toggleWorkStartPicker}
                activeOpacity={0.7}
              >
                <Text style={styles.timeLabel}>
                  {t('onboarding.dailyRoutine.workStartLabel')}
                </Text>
                <Text style={styles.timeValue}>
                  {formatTime(workStartTime)}
                </Text>
              </TouchableOpacity>
              {(showWorkStartPicker || workStartPickerAnim._value > 0) && (
                <Animated.View
                  style={{
                    opacity: workStartPickerAnim,
                    maxHeight: workStartPickerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 300],
                    }),
                    overflow: 'hidden',
                  }}
                >
                  <DateTimePicker
                    value={workStartTime}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleWorkStartChange}
                  />
                </Animated.View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('onboarding.dailyRoutine.workEndTime')}
              </Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={toggleWorkEndPicker}
                activeOpacity={0.7}
              >
                <Text style={styles.timeLabel}>
                  {t('onboarding.dailyRoutine.workEndLabel')}
                </Text>
                <Text style={styles.timeValue}>{formatTime(workEndTime)}</Text>
              </TouchableOpacity>
              {(showWorkEndPicker || workEndPickerAnim._value > 0) && (
                <Animated.View
                  style={{
                    opacity: workEndPickerAnim,
                    maxHeight: workEndPickerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 300],
                    }),
                    overflow: 'hidden',
                  }}
                >
                  <DateTimePicker
                    value={workEndTime}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleWorkEndChange}
                  />
                </Animated.View>
              )}
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {t('onboarding.dailyRoutine.smartScheduling')}
          </Text>
          <Text style={styles.infoText}>
            {t('onboarding.dailyRoutine.smartSchedulingDesc')}
          </Text>
        </View>
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
          <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    timeButton: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeLabel: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    timeValue: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.primary,
      fontFamily: 'monospace',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
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
    infoCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      marginTop: 8,
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
