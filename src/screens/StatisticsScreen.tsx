import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { useThemeColors } from '../hooks/useThemeColors';

type Period = 'week' | 'month';

function getStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDateLabel(date: Date) {
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  return `${month} ${date.getDate()}`;
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function isFutureDate(date: Date) {
  const today = getStartOfDay(new Date());
  return date > today;
}

function interpolateColor(startColor: string, endColor: string, factor: number) {
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

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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

export default function StatisticsScreen() {
  const theme = useThemeColors();
  const [period, setPeriod] = useState<Period>('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { width: windowWidth } = useWindowDimensions();

  const { events, dailyGoalMl } = useSelector((state: RootState) => state.intake);
  const unit = useSelector((state: RootState) => state.settings.profile.unit);

  const convertAmount = (amountMl: number) => {
    if (unit === 'oz') {
      return Math.round(amountMl * 0.033814 * 10) / 10;
    }
    return amountMl;
  };

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

    const backgroundColor = interpolateColor(lightBlue, primaryBlue, percentage);
    const textColor = getContrastColor(backgroundColor);

    return { backgroundColor, textColor };
  };

  const goToPreviousMonth = () => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(selectedMonth.getMonth() + 1);

    // Don't go beyond current month
    if (nextMonth <= currentMonth || nextMonth.getMonth() === currentMonth.getMonth()) {
      setSelectedMonth(nextMonth);
    }
  };

  const canGoNext = () => {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(selectedMonth.getMonth() + 1);
    return nextMonth <= currentMonth || nextMonth.getMonth() === currentMonth.getMonth();
  };

  const calendarCellSize = useMemo(() => {
    const totalHorizontalInset = CARD_HORIZONTAL_MARGIN * 2 + CARD_HORIZONTAL_PADDING * 2;
    const availableWidth = Math.max(windowWidth - totalHorizontalInset, 0);
    const totalGapWidth = CALENDAR_CELL_GAP * (DAYS_IN_WEEK - 1);
    const usableWidth = availableWidth - totalGapWidth;
    const computedSize = usableWidth / DAYS_IN_WEEK;
    if (!Number.isFinite(computedSize) || computedSize <= 0) {
      const fallbackSize = availableWidth / DAYS_IN_WEEK;
      return fallbackSize > 0 ? fallbackSize : 0;
    }
    return computedSize;
  }, [windowWidth]);

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
        const key = d.toISOString().split('T')[0];
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
      grid.push({ date: null, dayNumber: null, totalMl: 0, isFuture: false, isCurrentMonth: false });
    }

    // Fill in the days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const key = date.toISOString().split('T')[0];
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
      grid.push({ date: null, dayNumber: null, totalMl: 0, isFuture: false, isCurrentMonth: false });
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
      const key = d.toISOString().split('T')[0];
      bucketMap.set(key, 0);
    }

    for (const e of events) {
      const d = new Date(e.timestamp);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        .toISOString()
        .split('T')[0];
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

    const totals = arr.map((b) => b.totalMl);
    const sumMl = totals.reduce((s, v) => s + v, 0);
    const statsAvgMl = sumMl / arr.length;
    const statsBestMl = Math.max(...totals);
    const statsCompletionRate = arr.length
      ? Math.round((arr.filter((b) => b.totalMl >= dailyGoalMl).length / arr.length) * 100)
      : 0;

    return { buckets: arr, avgMl: statsAvgMl, bestMl: statsBestMl, completionRate: statsCompletionRate };
  }, [events, period, dailyGoalMl]);

  const styles = getStyles(theme);

  const chartHeight = 140;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.periodToggle}>
        <ToggleButton label="7 Days" active={period === 'week'} onPress={() => setPeriod('week')} color={theme} />
        <ToggleButton label="30 Days" active={period === 'month'} onPress={() => setPeriod('month')} color={theme} />
      </View>

      <View style={{ paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.metricsRow}>
            <Metric label="Average" value={`${convertAmount(avgMl).toFixed(unit === 'oz' ? 1 : 0)} ${unit}`} theme={theme} />
            <Metric label="Best Day" value={`${convertAmount(bestMl).toFixed(unit === 'oz' ? 1 : 0)} ${unit}`} theme={theme} />
            <Metric label="Goal Hit" value={`${completionRate}%`} theme={theme} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Intake</Text>

          {period === 'month' && calendarData ? (
            <>
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                  <Text style={styles.navButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{formatMonthYear(selectedMonth)}</Text>
                <TouchableOpacity
                  onPress={goToNextMonth}
                  style={styles.navButton}
                  disabled={!canGoNext()}
                >
                  <Text style={[styles.navButtonText, !canGoNext() && styles.navButtonDisabled]}>→</Text>
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.calendarHeader}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <View key={day} style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarData.map((cell, index) => {
                  const isRowEnd = (index + 1) % DAYS_IN_WEEK === 0;
                  const baseCellStyle = [
                    styles.calendarCell,
                    {
                      width: calendarCellSize,
                      height: calendarCellSize,
                      marginRight: isRowEnd ? 0 : CALENDAR_CELL_GAP,
                    },
                  ];

                  if (!cell.isCurrentMonth) {
                    // Empty cell
                    return <View key={`empty-${index}`} style={baseCellStyle} />;
                  }

                  const { backgroundColor, textColor } = getCellColors(cell.totalMl, cell.isFuture);
                  const displayAmount = cell.isFuture ? '' : `${convertAmount(cell.totalMl).toLocaleString()} ${unit}`;

                  return (
                    <View key={index} style={[...baseCellStyle, { backgroundColor }]}>
                      <Text style={[styles.cellDayNumber, { color: textColor }]}>
                        {cell.dayNumber}
                      </Text>
                      {!cell.isFuture && (
                        <Text
                          style={[styles.cellAmount, { color: textColor }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {displayAmount}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              {/* Week View - Bar Chart */}
              <View style={[styles.chart, { height: chartHeight }]}>
                {buckets.map((b) => {
                  const h = Math.max(4, Math.round((b.totalMl / dailyGoalMl) * (chartHeight - 24)));
                  const isToday = getStartOfDay(new Date()).getTime() === getStartOfDay(b.date).getTime();
                  return (
                    <View key={b.key} style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: h,
                            backgroundColor: isToday ? theme.primary : theme.progressFill,
                            opacity: isToday ? 1 : 0.7,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>
                        {period === 'week' ? formatDayLabel(b.date) : formatDateLabel(b.date)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.legendRow}>
                <Text style={styles.legendText}>Goal</Text>
                <Text style={styles.legendText}>{convertAmount(dailyGoalMl)} {unit}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ToggleButton({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color: any }) {
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
      <Text style={{ color: active ? '#fff' : color.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Metric({ label, value, theme }: { label: string; value: string | number; theme: any }) {
  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.border, marginRight: 10 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 2 }}>{value}</Text>
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
    },
    calendarCell: {
      borderRadius: 12,
      padding: 6,
      marginBottom: 8,
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
  });
