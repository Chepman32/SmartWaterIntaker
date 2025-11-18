import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { Colors } from '../constants/colors';
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

export default function StatisticsScreen() {
  const theme = useThemeColors();
  const [period, setPeriod] = useState<Period>('week');

  const { events, dailyGoalMl } = useSelector((state: RootState) => state.intake);
  const unit = useSelector((state: RootState) => state.settings.profile.unit);

  const convertAmount = (amountMl: number) => {
    if (unit === 'oz') {
      return Math.round(amountMl * 0.033814 * 10) / 10;
    }
    return amountMl;
  };

  const { buckets, maxMl, avgMl, bestMl, completionRate } = useMemo(() => {
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
    const maxMl = Math.max(1, ...totals);
    const sumMl = totals.reduce((s, v) => s + v, 0);
    const avgMl = sumMl / arr.length;
    const bestMl = Math.max(...totals);
    const completionRate = arr.length
      ? Math.round((arr.filter((b) => b.totalMl >= dailyGoalMl).length / arr.length) * 100)
      : 0;

    return { buckets: arr, maxMl, avgMl, bestMl, completionRate };
  }, [events, period, dailyGoalMl]);

  const styles = getStyles(theme);

  const chartHeight = 140;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
      </View>

      <View style={styles.periodToggle}>
        <ToggleButton label="7 Days" active={period === 'week'} onPress={() => setPeriod('week')} color={theme} />
        <ToggleButton label="30 Days" active={period === 'month'} onPress={() => setPeriod('month')} color={theme} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
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
          <View style={[styles.chart, { height: chartHeight }]}>
            {buckets.map((b, idx) => {
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
        </View>
      </ScrollView>
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
    header: {
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
  });


