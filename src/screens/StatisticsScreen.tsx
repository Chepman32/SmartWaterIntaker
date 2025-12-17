import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
  LayoutChangeEvent,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated as RNAnimated,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { RootState } from '../state/store';
import { useThemeColors } from '../hooks/useThemeColors';
import DrinkTypeCarousel from '../components/DrinkTypeCarousel';
import { DrinkType } from '../types/models';
import { logIntakeEvent } from '../state/slices/intakeSlice';

type Period = 'week' | 'month';

function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(date: Date, locale?: string) {
  return date.toLocaleDateString(locale || undefined, { weekday: 'short' });
}

function formatDateLabel(date: Date, locale?: string) {
  const month = date.toLocaleDateString(locale || undefined, {
    month: 'short',
  });
  return `${month} ${date.getDate()}`;
}

function formatMonthYear(date: Date, locale?: string) {
  return date.toLocaleDateString(locale || undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function isFutureDate(date: Date) {
  const today = getStartOfDay(new Date());
  return date > today;
}

function interpolateColor(
  startColor: string,
  endColor: string,
  factor: number,
) {
  // Parse hex colors
  const parseHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const start = parseHex(startColor);
  const end = parseHex(endColor);

  const r = Math.round(start.r + (end.r - start.r) * factor);
  const g = Math.round(start.g + (end.g - start.g) * factor);
  const b = Math.round(start.b + (end.b - start.b) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getContrastColor(bgColor: string) {
  // Parse hex color
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark for light backgrounds
  return luminance > 0.5 ? '#1E293B' : '#FFFFFF';
}

const DAYS_IN_WEEK = 7;
const CARD_HORIZONTAL_MARGIN = 16; // Matches styles.card marginHorizontal
const CARD_HORIZONTAL_PADDING = 16; // Matches styles.card padding
const CALENDAR_CELL_GAP = 8;

const MODAL_CAROUSEL_HEIGHT = 260;

export default function StatisticsScreen() {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language;
  const theme = useThemeColors();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Container images
  const cupImage = require('../../assets/images/cup.png');
  const glassImage = require('../../assets/images/Glass.png');
  const bottleImage = require('../../assets/images/bottle.png');
  const tumblerImage = require('../../assets/images/tumbler.png');
  const pitcherImage = require('../../assets/images/pitcher.png');

  const [period, setPeriod] = useState<Period>('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { width: windowWidth } = useWindowDimensions();
  const [calendarContainerWidth, setCalendarContainerWidth] = useState<
    number | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalVisible, setIsDayModalVisible] = useState(false);
  const [isAddWaterModalVisible, setIsAddWaterModalVisible] = useState(false);
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType | null>(
    null,
  );
  const dayOverlayOpacity = useRef(new RNAnimated.Value(0)).current;
  const dayModalTranslate = useRef(new RNAnimated.Value(20)).current;
  const dayModalScale = useRef(new RNAnimated.Value(0.96)).current;
  const addWaterSlide = useRef(new RNAnimated.Value(320)).current;
  const addWaterOpacity = useRef(new RNAnimated.Value(0)).current;
  const carouselAnim = useRef(new RNAnimated.Value(0)).current;
  const progressBarWidth = useRef(new RNAnimated.Value(0)).current;
  const isFirstProgressAnimation = useRef(true);

  const { events, dailyGoalMl } = useSelector(
    (state: RootState) => state.intake,
  );
  const unit = useSelector((state: RootState) => state.settings.profile.unit);
  const unitLabel = unit === 'oz' ? t('common.oz') : t('common.ml');
  const containers = useSelector((state: RootState) => state.containers.items);
  const favoriteContainers = containers.filter(c => c.favorite);

  const convertAmount = (amountMl: number) => {
    if (unit === 'oz') {
      return Math.round(amountMl * 0.033814 * 10) / 10;
    }
    return amountMl;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectedDateKey = useMemo(() => {
    if (!selectedDate) return null;
    return getLocalDateString(getStartOfDay(selectedDate));
  }, [selectedDate]);

  const dayEvents = useMemo(() => {
    if (!selectedDateKey) return [];

    return events
      .filter(event => {
        const eventDate = getLocalDateString(new Date(event.timestamp));
        return eventDate === selectedDateKey;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [events, selectedDateKey]);

  const totalIntakeForDay = useMemo(
    () => dayEvents.reduce((sum, event) => sum + event.amountMl, 0),
    [dayEvents],
  );
  const progressPercent =
    dailyGoalMl > 0 ? Math.round((totalIntakeForDay / dailyGoalMl) * 100) : 0;

  useEffect(() => {
    if (isDayModalVisible && progressPercent >= 0) {
      if (isFirstProgressAnimation.current) {
        const timer = setTimeout(() => {
          RNAnimated.timing(progressBarWidth, {
            toValue: Math.min(progressPercent, 100),
            duration: 1200,
            useNativeDriver: false,
          }).start();
          isFirstProgressAnimation.current = false;
        }, 300);
        return () => clearTimeout(timer);
      } else {
        RNAnimated.timing(progressBarWidth, {
          toValue: Math.min(progressPercent, 100),
          duration: 800,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [progressPercent, progressBarWidth, isDayModalVisible]);

  const selectedDateLabel = useMemo(
    () =>
      selectedDate
        ? selectedDate.toLocaleDateString(currentLocale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })
        : '',
    [selectedDate, currentLocale],
  );

  const getCellColors = (totalMl: number, isFuture: boolean) => {
    if (isFuture) {
      return {
        backgroundColor: '#E2E8F0',
        textColor: '#94A3B8',
      };
    }

    // Calculate saturation based on percentage of daily goal
    const percentage = Math.min(totalMl / dailyGoalMl, 1);

    // Color range from very light blue to primary blue
    const lightBlue = '#E0F2FE';
    const primaryBlue = theme.primary;

    const backgroundColor = interpolateColor(
      lightBlue,
      primaryBlue,
      percentage,
    );
    const textColor = getContrastColor(backgroundColor);

    return { backgroundColor, textColor };
  };

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(selectedMonth.getMonth() + 1);

    // Don't go beyond current month
    if (
      nextMonth <= currentMonth ||
      nextMonth.getMonth() === currentMonth.getMonth()
    ) {
      setSelectedMonth(nextMonth);
    }
  }, [selectedMonth]);

  const canGoNext = useCallback(() => {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(selectedMonth.getMonth() + 1);
    return (
      nextMonth <= currentMonth ||
      nextMonth.getMonth() === currentMonth.getMonth()
    );
  }, [selectedMonth]);

  const openDayModal = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setIsDayModalVisible(true);
      dayOverlayOpacity.setValue(0);
      dayModalTranslate.setValue(20);
      dayModalScale.setValue(0.96);
      progressBarWidth.setValue(0);
      isFirstProgressAnimation.current = true;
      RNAnimated.parallel([
        RNAnimated.timing(dayOverlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        RNAnimated.timing(dayModalTranslate, {
          toValue: 0,
          duration: 230,
          useNativeDriver: true,
        }),
        RNAnimated.timing(dayModalScale, {
          toValue: 1,
          duration: 230,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [dayModalScale, dayModalTranslate, dayOverlayOpacity, progressBarWidth],
  );

  const closeDayModal = useCallback(() => {
    RNAnimated.parallel([
      RNAnimated.timing(dayOverlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      RNAnimated.timing(dayModalTranslate, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(dayModalScale, {
        toValue: 0.96,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsDayModalVisible(false);
        setIsAddWaterModalVisible(false);
        setSelectedDrinkType(null);
        addWaterSlide.setValue(320);
        addWaterOpacity.setValue(0);
      }
    });
  }, [
    addWaterOpacity,
    addWaterSlide,
    dayModalScale,
    dayModalTranslate,
    dayOverlayOpacity,
  ]);

  const openAddWaterModal = useCallback(() => {
    setSelectedDrinkType(null);
    carouselAnim.setValue(0);
    setIsAddWaterModalVisible(true);
    addWaterOpacity.setValue(0);
    addWaterSlide.setValue(320);
    RNAnimated.parallel([
      RNAnimated.timing(addWaterOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      RNAnimated.spring(addWaterSlide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }),
    ]).start();
  }, [addWaterOpacity, addWaterSlide, carouselAnim]);

  const closeAddWaterModal = useCallback(() => {
    RNAnimated.parallel([
      RNAnimated.timing(addWaterOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      RNAnimated.timing(addWaterSlide, {
        toValue: 320,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsAddWaterModalVisible(false);
        setSelectedDrinkType(null);
        carouselAnim.setValue(0);
      }
    });
  }, [addWaterOpacity, addWaterSlide, carouselAnim]);

  const handleCalendarCellPress = useCallback(
    (date: Date | null) => {
      if (!date) return;
      openDayModal(date);
    },
    [openDayModal],
  );

  const handleAddWaterPress = useCallback(() => {
    openAddWaterModal();
  }, [openAddWaterModal]);

  const handleDrinkTypeSelect = useCallback(
    (type: DrinkType) => {
      setSelectedDrinkType(type);
      RNAnimated.timing(carouselAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [carouselAnim],
  );

  const handleChangeDrinkType = useCallback(() => {
    RNAnimated.timing(carouselAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedDrinkType(null));
  }, [carouselAnim]);

  // Use a ref to always have the latest selectedDate value
  const selectedDateRef = useRef<Date | null>(selectedDate);
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const handleContainerSelect = useCallback(
    (container: any) => {
      // Use ref to get the latest selectedDate value to avoid stale closure issues
      const currentSelectedDate = selectedDateRef.current;
      const dateForEntry = currentSelectedDate
        ? new Date(currentSelectedDate)
        : new Date();
      dateForEntry.setHours(
        new Date().getHours(),
        new Date().getMinutes(),
        new Date().getSeconds(),
        0,
      );

      const notePrefix = selectedDrinkType
        ? `${selectedDrinkType.name} - `
        : '';

      dispatch(
        logIntakeEvent({
          amountMl: container.sizeMl,
          source: 'container',
          containerId: container.id,
          timestamp: dateForEntry.getTime(),
          drinkTypeId: selectedDrinkType?.id,
          note: `${notePrefix}${container.name} (${container.sizeMl}ml)`,
        }),
      );

      closeAddWaterModal();
    },
    [closeAddWaterModal, dispatch, selectedDrinkType],
  );

  const estimatedCalendarWidth = useMemo(() => {
    const totalHorizontalInset =
      CARD_HORIZONTAL_MARGIN * 2 + CARD_HORIZONTAL_PADDING * 2;
    return Math.max(windowWidth - totalHorizontalInset, 0);
  }, [windowWidth]);

  const effectiveCalendarWidth =
    calendarContainerWidth ?? estimatedCalendarWidth;

  const calendarCellSize = useMemo(() => {
    const availableWidth = Math.max(effectiveCalendarWidth, 0);
    const totalGapWidth = CALENDAR_CELL_GAP * (DAYS_IN_WEEK - 1);
    const usableWidth = availableWidth - totalGapWidth;
    const computedSize = usableWidth / DAYS_IN_WEEK;
    if (!Number.isFinite(computedSize) || computedSize <= 0) {
      const fallbackSize = availableWidth / DAYS_IN_WEEK;
      return fallbackSize > 0 ? fallbackSize : 0;
    }
    return computedSize;
  }, [effectiveCalendarWidth]);

  const handleCalendarLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      if (
        width > 0 &&
        (calendarContainerWidth === null ||
          Math.abs(width - calendarContainerWidth) > 0.5)
      ) {
        setCalendarContainerWidth(width);
      }
    },
    [calendarContainerWidth],
  );

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Check if we can navigate to next month
  const canGoToNextMonth = useMemo(() => canGoNext(), [canGoNext]);

  // Reset animation when month changes
  useEffect(() => {
    translateX.value = 0;
    opacity.value = withTiming(1, { duration: 200 });
  }, [selectedMonth, translateX, opacity]);

  // Swipe gesture for month navigation
  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate(event => {
          translateX.value = event.translationX;
        })
        .onEnd(event => {
          const SWIPE_THRESHOLD = 50;

          if (event.translationX > SWIPE_THRESHOLD) {
            // Swipe right - go to previous month
            opacity.value = withTiming(0, { duration: 150 });
            translateX.value = withTiming(
              windowWidth,
              { duration: 200 },
              () => {
                runOnJS(goToPreviousMonth)();
              },
            );
          } else if (
            event.translationX < -SWIPE_THRESHOLD &&
            canGoToNextMonth
          ) {
            // Swipe left - go to next month
            opacity.value = withTiming(0, { duration: 150 });
            translateX.value = withTiming(
              -windowWidth,
              { duration: 200 },
              () => {
                runOnJS(goToNextMonth)();
              },
            );
          } else {
            // Reset if threshold not met
            translateX.value = withTiming(0, { duration: 200 });
          }
        }),
    [
      canGoToNextMonth,
      windowWidth,
      translateX,
      opacity,
      goToPreviousMonth,
      goToNextMonth,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  // Calendar data for month view
  const calendarData = useMemo(() => {
    if (period !== 'month') return null;

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // Get first day of the month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    const startDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday = 0

    // Create a map of all events for this month
    const dailyIntake = new Map<string, number>();

    for (const e of events) {
      const d = new Date(e.timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = getLocalDateString(d);
        dailyIntake.set(key, (dailyIntake.get(key) || 0) + e.amountMl);
      }
    }

    // Build calendar grid (6 weeks x 7 days)
    const grid: Array<{
      date: Date | null;
      dayNumber: number | null;
      totalMl: number;
      isFuture: boolean;
      isCurrentMonth: boolean;
    }> = [];

    // Fill in empty cells before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({
        date: null,
        dayNumber: null,
        totalMl: 0,
        isFuture: false,
        isCurrentMonth: false,
      });
    }

    // Fill in the days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const key = getLocalDateString(date);
      const totalMl = dailyIntake.get(key) || 0;
      const future = isFutureDate(date);

      grid.push({
        date,
        dayNumber: day,
        totalMl,
        isFuture: future,
        isCurrentMonth: true,
      });
    }

    // Fill remaining cells to complete the grid (42 cells total = 6 weeks)
    while (grid.length < 42) {
      grid.push({
        date: null,
        dayNumber: null,
        totalMl: 0,
        isFuture: false,
        isCurrentMonth: false,
      });
    }

    return grid;
  }, [events, selectedMonth, period]);

  const { buckets, avgMl, bestMl, completionRate } = useMemo(() => {
    const today = getStartOfDay(new Date());
    const days = period === 'week' ? 7 : 30;
    const bucketMap = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = getLocalDateString(d);
      bucketMap.set(key, 0);
    }

    for (const e of events) {
      const d = new Date(e.timestamp);
      const key = getLocalDateString(d);
      if (bucketMap.has(key)) {
        bucketMap.set(key, (bucketMap.get(key) || 0) + e.amountMl);
      }
    }

    const arr: { key: string; date: Date; totalMl: number }[] = [];
    bucketMap.forEach((v, k) => {
      const [y, m, day] = k.split('-').map(Number);
      arr.push({ key: k, date: new Date(y, m - 1, day), totalMl: v });
    });
    arr.sort((a, b) => a.date.getTime() - b.date.getTime());

    const totals = arr.map(b => b.totalMl);
    const sumMl = totals.reduce((s, v) => s + v, 0);
    const statsAvgMl = sumMl / arr.length;
    const statsBestMl = Math.max(...totals);
    const statsCompletionRate = arr.length
      ? Math.round(
          (arr.filter(b => b.totalMl >= dailyGoalMl).length / arr.length) * 100,
        )
      : 0;

    return {
      buckets: arr,
      avgMl: statsAvgMl,
      bestMl: statsBestMl,
      completionRate: statsCompletionRate,
    };
  }, [events, period, dailyGoalMl]);

  const styles = getStyles(theme);

  const chartHeight = 140;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.periodToggle}>
        <ToggleButton
          label={t('statistics.toggleWeek')}
          active={period === 'week'}
          onPress={() => setPeriod('week')}
          color={theme}
        />
        <ToggleButton
          label={t('statistics.toggleMonth')}
          active={period === 'month'}
          onPress={() => setPeriod('month')}
          color={theme}
        />
      </View>

      <View style={{ paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('statistics.overview')}</Text>
          <View style={styles.metricsRow}>
            <Metric
              label={t('statistics.average')}
              value={`${convertAmount(avgMl).toFixed(
                unit === 'oz' ? 1 : 0,
              )} ${unitLabel}`}
              theme={theme}
            />
            <Metric
              label={t('statistics.bestDay')}
              value={`${convertAmount(bestMl).toFixed(
                unit === 'oz' ? 1 : 0,
              )} ${unitLabel}`}
              theme={theme}
            />
            <Metric
              label={t('statistics.goalHit')}
              value={`${completionRate}%`}
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('statistics.dailyIntake')}</Text>

          {period === 'month' && calendarData ? (
            <>
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  onPress={goToPreviousMonth}
                  style={styles.navButton}
                >
                  <Text style={styles.navButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                  {formatMonthYear(selectedMonth, currentLocale)}
                </Text>
                <TouchableOpacity
                  onPress={goToNextMonth}
                  style={styles.navButton}
                  disabled={!canGoNext()}
                >
                  <Text
                    style={[
                      styles.navButtonText,
                      !canGoNext() && styles.navButtonDisabled,
                    ]}
                  >
                    →
                  </Text>
                </TouchableOpacity>
              </View>

              <GestureDetector gesture={swipeGesture}>
                <Animated.View style={animatedStyle}>
                  <View
                    onLayout={handleCalendarLayout}
                    style={{ width: '100%' }}
                  >
                    {/* Day Headers */}
                    <View style={styles.calendarHeader}>
                      {[
                        t('statistics.monday'),
                        t('statistics.tuesday'),
                        t('statistics.wednesday'),
                        t('statistics.thursday'),
                        t('statistics.friday'),
                        t('statistics.saturday'),
                        t('statistics.sunday'),
                      ].map(day => (
                        <View key={day} style={styles.dayHeader}>
                          <Text style={styles.dayHeaderText}>{day}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                      {calendarData.map((cell, index) => {
                        const baseCellStyle = [
                          styles.calendarCell,
                          {
                            width: calendarCellSize,
                            height: calendarCellSize,
                          },
                        ];

                        if (!cell.isCurrentMonth) {
                          // Empty cell
                          return (
                            <View
                              key={`empty-${index}`}
                              style={baseCellStyle}
                            />
                          );
                        }

                        const { backgroundColor, textColor } = getCellColors(
                          cell.totalMl,
                          cell.isFuture,
                        );
                        const displayAmount = cell.isFuture
                          ? ''
                          : `${convertAmount(
                              cell.totalMl,
                            ).toLocaleString()} ${unitLabel}`;

                        return (
                          <TouchableOpacity
                            key={index}
                            style={[...baseCellStyle, { backgroundColor }]}
                            activeOpacity={0.85}
                            onPress={() => handleCalendarCellPress(cell.date)}
                          >
                            <Text
                              style={[
                                styles.cellDayNumber,
                                { color: textColor },
                              ]}
                            >
                              {cell.dayNumber}
                            </Text>
                            {!cell.isFuture && (
                              <Text
                                style={[
                                  styles.cellAmount,
                                  { color: textColor },
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {displayAmount}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </Animated.View>
              </GestureDetector>
            </>
          ) : (
            <>
              {/* Week View - Bar Chart */}
              <View style={[styles.chart, { height: chartHeight }]}>
                {buckets.map(b => {
                  const h = Math.max(
                    4,
                    Math.round((b.totalMl / dailyGoalMl) * (chartHeight - 24)),
                  );
                  const isToday =
                    getStartOfDay(new Date()).getTime() ===
                    getStartOfDay(b.date).getTime();
                  return (
                    <View key={b.key} style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: h,
                            backgroundColor: isToday
                              ? theme.primary
                              : theme.progressFill,
                            opacity: isToday ? 1 : 0.7,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>
                        {period === 'week'
                          ? formatDayLabel(b.date, currentLocale)
                          : formatDateLabel(b.date, currentLocale)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.legendRow}>
                <Text style={styles.legendText}>{t('statistics.goal')}</Text>
                <Text style={styles.legendText}>
                  {convertAmount(dailyGoalMl)} {unitLabel}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Modal
        visible={isDayModalVisible && !!selectedDate}
        animationType="none"
        transparent
        onRequestClose={closeDayModal}
      >
        <RNAnimated.View
          style={[styles.modalOverlay, { opacity: dayOverlayOpacity }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeDayModal}
          />
          <TouchableWithoutFeedback onPress={() => {}}>
            <RNAnimated.View
              style={[
                styles.dayModalCard,
                {
                  backgroundColor: theme.card,
                  transform: [
                    { translateY: dayModalTranslate },
                    { scale: dayModalScale },
                  ],
                },
              ]}
            >
              <View style={styles.dayModalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {t('statistics.dailyDetails')}
                  </Text>
                  {!!selectedDateLabel && (
                    <Text style={styles.modalSubtitle}>
                      {selectedDateLabel}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeDayModal}
                >
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.modalSummaryCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.modalSummaryRow}>
                  <Text
                    style={[
                      styles.modalSummaryLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {t('statistics.totalIntake')}
                  </Text>
                  <Text
                    style={[styles.modalSummaryValue, { color: theme.text }]}
                  >
                    {convertAmount(totalIntakeForDay)} {unitLabel}
                  </Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text
                    style={[
                      styles.modalSummaryLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {t('statistics.dailyGoal')}
                  </Text>
                  <Text
                    style={[styles.modalSummaryValue, { color: theme.text }]}
                  >
                    {convertAmount(dailyGoalMl)} {unitLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.modalProgressBar,
                    { backgroundColor: theme.border },
                  ]}
                >
                  <RNAnimated.View
                    style={[
                      styles.modalProgressFill,
                      {
                        width: progressBarWidth.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.modalProgressText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {progressPercent}
                  {t('common.ofGoal')}
                </Text>
              </View>

              {dayEvents.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Text
                    style={[
                      styles.modalEmptyTitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {t('statistics.noWaterLogged')}
                  </Text>
                  <Text
                    style={[
                      styles.modalEmptySubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {t('statistics.noDataAvailable')}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.modalAddButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleAddWaterPress}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalAddButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.modalEventsContainer}>
                  <ScrollView
                    style={styles.modalEventsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {dayEvents.map(event => (
                      <View
                        key={event.id}
                        style={[
                          styles.modalEventCard,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <View style={styles.modalEventRow}>
                          <Text
                            style={[
                              styles.modalEventAmount,
                              { color: theme.text },
                            ]}
                          >
                            {convertAmount(event.amountMl)} {unitLabel}
                          </Text>
                          <Text
                            style={[
                              styles.modalEventTime,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {formatTime(event.timestamp)}
                          </Text>
                        </View>
                        {event.note ? (
                          <Text
                            style={[
                              styles.modalEventNote,
                              { color: theme.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {event.note}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </ScrollView>
                  <View style={styles.modalAddButtonRow}>
                    <TouchableOpacity
                      style={[
                        styles.modalAddButtonFloating,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={handleAddWaterPress}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modalAddButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </RNAnimated.View>
          </TouchableWithoutFeedback>
          {isAddWaterModalVisible && (
            <RNAnimated.View
              style={[styles.inlineAddContainer, { opacity: addWaterOpacity }]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                style={styles.inlineAddBackdrop}
                activeOpacity={1}
                onPress={closeAddWaterModal}
              />
              <RNAnimated.View
                style={[
                  styles.addModalContent,
                  {
                    backgroundColor: theme.background,
                    paddingBottom: Math.max(insets.bottom, 20) + tabBarHeight,
                    transform: [{ translateY: addWaterSlide }],
                  },
                ]}
              >
                <View style={styles.addModalHeader}>
                  <Text style={[styles.addModalTitle, { color: theme.text }]}>
                    {t('statistics.addWaterIntake')}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.modalCloseButton,
                      { backgroundColor: theme.border },
                    ]}
                    onPress={closeAddWaterModal}
                  >
                    <Text
                      style={[styles.modalCloseText, { color: theme.text }]}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalCarouselSwitcher}>
                  <RNAnimated.View
                    style={[
                      styles.modalCarouselInner,
                      {
                        transform: [
                          {
                            translateY: carouselAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -MODAL_CAROUSEL_HEIGHT],
                            }),
                          },
                        ],
                      },
                    ]}
                    pointerEvents={selectedDrinkType ? 'none' : 'auto'}
                  >
                    <DrinkTypeCarousel
                      textColor={theme.text}
                      subtitleColor={theme.textSecondary}
                      onSelect={handleDrinkTypeSelect}
                      selectedDrinkTypeId={selectedDrinkType?.id}
                    />
                  </RNAnimated.View>

                  <RNAnimated.View
                    style={[
                      styles.modalCarouselInner,
                      {
                        transform: [
                          {
                            translateY: carouselAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [MODAL_CAROUSEL_HEIGHT, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                    pointerEvents={selectedDrinkType ? 'auto' : 'none'}
                  >
                    {selectedDrinkType && (
                      <View style={styles.selectedDrinkHeader}>
                        <View>
                          <Text
                            style={[
                              styles.selectedDrinkLabel,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {t('statistics.selectedDrink')}
                          </Text>
                          <Text
                            style={[
                              styles.selectedDrinkName,
                              { color: selectedDrinkType.color },
                            ]}
                          >
                            {selectedDrinkType.name}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={handleChangeDrinkType}>
                          <Text
                            style={[
                              styles.changeTypeText,
                              { color: selectedDrinkType.color },
                            ]}
                          >
                            {t('common.change')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.modalScrollContent}
                    >
                      {favoriteContainers.map(container => (
                        <TouchableOpacity
                          key={container.id}
                          style={[
                            styles.modalContainerItem,
                            {
                              backgroundColor: container.color + '20',
                              borderColor: container.color,
                            },
                          ]}
                          onPress={() => handleContainerSelect(container)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.modalIconContainer,
                              { backgroundColor: container.color },
                            ]}
                          >
                            {container.id?.startsWith('cup') ||
                            container.name === 'Cup' ? (
                              <Image
                                source={cupImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('glass') ||
                              container.name === 'Glass' ? (
                              <Image
                                source={glassImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('bottle') ||
                              container.name === 'Bottle' ||
                              container.name === 'Water Bottle' ? (
                              <Image
                                source={bottleImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('tumbler') ||
                              container.name === 'Tumbler' ? (
                              <Image
                                source={tumblerImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : container.id?.startsWith('pitcher') ||
                              container.name === 'Pitcher' ? (
                              <Image
                                source={pitcherImage}
                                style={styles.modalIconImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <Text style={styles.modalIconText}>
                                {container.icon}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.modalContainerName,
                              { color: theme.text },
                            ]}
                            numberOfLines={1}
                          >
                            {container.name}
                          </Text>
                          <Text
                            style={[
                              styles.modalContainerSize,
                              { color: theme.text },
                            ]}
                          >
                            {container.sizeMl}
                            {t('common.ml')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </RNAnimated.View>
                </View>
              </RNAnimated.View>
            </RNAnimated.View>
          )}
        </RNAnimated.View>
      </Modal>
    </SafeAreaView>
  );
}

function ToggleButton({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: active ? color.primary : color.card,
        borderWidth: active ? 0 : 1,
        borderColor: color.border,
        marginHorizontal: 4,
      }}
    >
      <Text style={{ color: active ? '#fff' : color.text, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Metric({
  label,
  value,
  theme,
}: {
  label: string;
  value: string | number;
  theme: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        backgroundColor: theme.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        marginRight: 10,
      }}
    >
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: theme.text,
          fontSize: 18,
          fontWeight: '700',
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    periodToggle: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    card: {
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    metricsRow: {
      flexDirection: 'row',
    },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
      marginTop: 8,
    },
    barWrapper: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 2,
    },
    bar: {
      width: '60%',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      backgroundColor: theme.primary,
    },
    barLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      marginTop: 6,
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    legendText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    // Calendar styles
    monthNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    navButton: {
      padding: 8,
      minWidth: 40,
      alignItems: 'center',
    },
    navButtonText: {
      fontSize: 24,
      color: theme.text,
      fontWeight: '600',
    },
    navButtonDisabled: {
      opacity: 0.3,
    },
    monthLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    calendarHeader: {
      flexDirection: 'row',
      marginBottom: 8,
      columnGap: CALENDAR_CELL_GAP,
    },
    dayHeader: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    dayHeaderText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      columnGap: CALENDAR_CELL_GAP,
      rowGap: CALENDAR_CELL_GAP,
    },
    calendarCell: {
      borderRadius: 12,
      padding: 6,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
    },
    cellDayNumber: {
      fontSize: 14,
      fontWeight: '600',
    },
    cellAmount: {
      fontSize: 10,
      fontWeight: '500',
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    inlineAddContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      zIndex: 2,
    },
    inlineAddBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    dayModalCard: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 16,
      padding: 16,
    },
    dayModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    modalSubtitle: {
      fontSize: 14,
      marginTop: 4,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 22,
    },
    modalSummaryCard: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginTop: 12,
      marginBottom: 16,
    },
    modalSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    modalSummaryLabel: {
      fontSize: 14,
    },
    modalSummaryValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    modalProgressBar: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 6,
    },
    modalProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    modalProgressText: {
      fontSize: 12,
      marginTop: 6,
      textAlign: 'center',
    },
    modalEmptyState: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    modalEmptyTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalEmptySubtitle: {
      fontSize: 14,
      marginTop: 6,
    },
    modalAddButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalAddButtonText: {
      color: '#fff',
      fontSize: 30,
      fontWeight: '600',
      lineHeight: 32,
    },
    modalEventsContainer: {},
    modalEventsList: {
      maxHeight: 220,
      marginTop: 4,
    },
    modalAddButtonRow: {
      alignItems: 'center',
      marginTop: 16,
    },
    modalAddButtonFloating: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalEventCard: {
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 10,
    },
    modalEventRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalEventAmount: {
      fontSize: 16,
      fontWeight: '700',
    },
    modalEventTime: {
      fontSize: 12,
    },
    modalEventNote: {
      marginTop: 6,
      fontSize: 12,
    },
    addModalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
      paddingTop: 16,
    },
    addModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    addModalTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    selectedDrinkHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    selectedDrinkLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    selectedDrinkName: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 4,
    },
    changeTypeText: {
      fontSize: 14,
      fontWeight: '500',
    },
    modalScrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 12,
    },
    modalContainerItem: {
      width: 160,
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    modalIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    modalIconText: {
      fontSize: 36,
    },
    modalIconImage: {
      width: 48,
      height: 48,
    },
    modalCarouselSwitcher: {
      height: MODAL_CAROUSEL_HEIGHT,
      position: 'relative',
      overflow: 'hidden',
    },
    modalCarouselInner: {
      position: 'absolute',
      width: '100%',
      top: 0,
    },
    modalContainerName: {
      fontSize: 18,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 4,
    },
    modalContainerSize: {
      fontSize: 16,
      opacity: 0.7,
      textAlign: 'center',
    },
  });
