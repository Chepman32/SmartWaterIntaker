import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../state/store';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  generateSmartNotifications,
  SmartNotificationItem,
  SmartNotificationTone,
} from '../utils/smartNotifications';

type Unit = 'ml' | 'oz';

const toneColors: Record<SmartNotificationTone, string> = {
  urgent: '#F87171',
  coach: '#38BDF8',
  trend: '#A78BFA',
  success: '#34D399',
  system: '#FBBF24',
};

const formatGapDuration = (hours: number, t?: any) => {
  if (!Number.isFinite(hours)) return '—';
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  const h = t ? t('common.hours') : 'h';
  const min = t ? t('common.minutes') : 'min';
  const m = t ? t('common.minutesShort') : 'm';
  if (whole <= 0) return `${minutes} ${min}`;
  if (minutes === 0) return `${whole}${h}`;
  return `${whole}${h} ${minutes}${m}`;
};

const formatVolume = (
  amountMl: number,
  unit: Unit,
  precisionOverride?: number,
  t?: any,
) => {
  if (unit === 'oz') {
    const ounces = amountMl * 0.033814;
    const precision = precisionOverride ?? (ounces >= 10 ? 0 : 1);
    const value = Number(ounces.toFixed(precision));
    return `${value} ${t ? t('common.oz') : 'oz'}`;
  }
  const precision = precisionOverride ?? 0;
  if (precision > 0) {
    const value = Number(amountMl.toFixed(precision));
    return `${value} ${t ? t('common.ml') : 'ml'}`;
  }
  return `${Math.round(amountMl)} ${t ? t('common.ml') : 'ml'}`;
};

const AIScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useThemeColors();
  const { events, dailyGoalMl, todayTotalMl } = useSelector(
    (state: RootState) => state.intake,
  );
  const profile = useSelector((state: RootState) => state.settings.profile);
  const reminders = useSelector((state: RootState) => state.reminders);
  const unit: Unit = profile.unit ?? 'ml';
  const unitLabel = unit === 'oz' ? t('common.oz') : t('common.ml');

  const reminderSnapshot = useMemo(
    () => ({
      notificationsEnabled: reminders.notificationsEnabled,
      permissionsGranted: reminders.permissionsGranted,
      smartRemindersEnabled: reminders.smartRemindersEnabled,
      schedules: reminders.schedules,
      lastReminderTime: reminders.lastReminderTime,
    }),
    [
      reminders.notificationsEnabled,
      reminders.permissionsGranted,
      reminders.smartRemindersEnabled,
      reminders.schedules,
      reminders.lastReminderTime,
    ],
  );

  const { summary, notifications } = useMemo(
    () =>
      generateSmartNotifications({
        events,
        dailyGoalMl,
        todayTotalMl,
        profile,
        reminders: reminderSnapshot,
        t,
      }),
    [events, dailyGoalMl, todayTotalMl, profile, reminderSnapshot, t],
  );

  const nextActionLabel = summary.nextActionTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const remainingQuietLabel =
    summary.minutesUntilQuiet > 0
      ? `${(summary.minutesUntilQuiet / 60).toFixed(1)}h ${t(
          'ai.hoursUntilQuiet',
        )}`
      : t('ai.quietHoursActive');

  const statCards = [
    {
      label: t('ai.statToday'),
      value: formatVolume(todayTotalMl, unit, undefined, t),
      meta: `${t('ai.statGoal')} ${formatVolume(
        dailyGoalMl,
        unit,
        undefined,
        t,
      )}`,
    },
    {
      label: t('ai.statRemaining'),
      value: formatVolume(summary.remainingMl, unit, undefined, t),
      meta: remainingQuietLabel,
    },
    {
      label: t('ai.statLongestDryStreak'),
      value: formatGapDuration(summary.longestDryStreakHours, t),
      meta: t('ai.statLast72h'),
    },
    {
      label: t('ai.stat7DayAvg'),
      value: formatVolume(summary.avg7Day, unit, undefined, t),
      meta: `${summary.trendDelta >= 0 ? '+' : ''}${formatVolume(
        summary.trendDelta,
        unit,
        undefined,
        t,
      )} ${t('ai.statVsPrev')}`,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.heroHeader}>
            <View>
              <Text style={[styles.heroTitle, { color: theme.text }]}>
                {t('ai.title')}
              </Text>
              <Text
                style={[styles.heroSubtitle, { color: theme.textSecondary }]}
              >
                {summary.statusLabel}
              </Text>
            </View>
            <View style={[styles.scoreBubble, { borderColor: theme.border }]}>
              <Text style={[styles.scoreValue, { color: theme.text }]}>
                {Math.round(summary.hydrationScore)}
              </Text>
              <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                {t('ai.score')}
              </Text>
            </View>
          </View>

          <Text style={[styles.contextLabel, { color: theme.textSecondary }]}>
            {summary.contextLabel}
          </Text>

          <View
            style={[
              styles.progressWrapper,
              { backgroundColor: theme.progressTrack },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(summary.progressPercent, 100)}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <View
              style={[
                styles.expectedMarker,
                {
                  left: `${Math.min(summary.expectedPercent, 100)}%`,
                  borderColor: theme.secondary,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressText, { color: theme.text }]}>
              {t('ai.actualPercent')} {Math.round(summary.progressPercent)}%
            </Text>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {t('ai.expectedPercent')} {Math.round(summary.expectedPercent)}%
            </Text>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                {t('ai.nextAction')}
              </Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {nextActionLabel}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                {t('ai.suggestedSip')}
              </Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {formatVolume(summary.recommendedSipMl, unit, undefined, t)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statGrid}>
          {statCards.map(card => (
            <View
              key={card.label}
              style={[
                styles.statCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {card.label}
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {card.value}
              </Text>
              <Text style={[styles.statMeta, { color: theme.textSecondary }]}>
                {card.meta}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('ai.smartNotifications')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          {t('ai.smartNotificationsDesc')}
        </Text>

        <View style={styles.notificationsList}>
          {notifications.map(notification => (
            <NotificationCard
              key={notification.id}
              item={notification}
              unit={unit}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                card: theme.card,
                border: theme.border,
              }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

type NotificationCardProps = {
  item: SmartNotificationItem;
  unit: Unit;
  theme: {
    text: string;
    textSecondary: string;
    card: string;
    border: string;
  };
};

const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  unit,
  theme,
}) => {
  const { t } = useTranslation();
  const accent = toneColors[item.tone];
  const suggestion =
    item.suggestedAmountMl !== undefined
      ? formatVolume(item.suggestedAmountMl, unit, undefined, t)
      : item.suggestedTimeLabel;

  return (
    <View
      style={[
        styles.notificationCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.notificationHeader}>
        <Text style={[styles.notificationIcon, { color: accent }]}>
          {item.icon}
        </Text>
        <View style={styles.notificationHeaderText}>
          <Text style={[styles.notificationTitle, { color: theme.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationTone, { color: accent }]}>
            {item.tone}
          </Text>
        </View>
      </View>
      <Text style={[styles.notificationBody, { color: theme.textSecondary }]}>
        {item.body}
      </Text>

      {suggestion ? (
        <View style={[styles.suggestionPill, { borderColor: accent }]}>
          <Text style={[styles.suggestionText, { color: accent }]}>
            {suggestion}
          </Text>
        </View>
      ) : null}

      {item.recommendations?.length ? (
        <View style={styles.recommendations}>
          {item.recommendations.map((rec, index) => (
            <View
              key={`${item.id}-rec-${index}`}
              style={styles.recommendationRow}
            >
              <View style={[styles.bullet, { backgroundColor: accent }]} />
              <Text style={[styles.recommendationText, { color: theme.text }]}>
                {rec}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {item.tags?.length ? (
        <View style={styles.tagRow}>
          {item.tags.map(tag => (
            <View
              key={`${item.id}-${tag}`}
              style={[styles.tagChip, { backgroundColor: `${accent}25` }]}
            >
              <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 16,
  },
  scoreBubble: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  contextLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressWrapper: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
  },
  expectedMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 18,
    borderWidth: 1,
    borderRadius: 1,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    flexBasis: '48%',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  notificationsList: {
    marginBottom: 40,
  },
  notificationCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  notificationHeaderText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationTone: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  suggestionPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recommendations: {
    marginBottom: 10,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AIScreen;
