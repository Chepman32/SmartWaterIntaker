import { IntakeEvent, ReminderSchedule, UserProfile } from '../types/models';
import {
  activityMultiplier,
  clamp,
  climateMultiplier,
  computeBaseGoalMl,
  suggestedSipMl,
} from './algorithms';

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_WAKE_MINUTES = 7 * 60; // 7:00 AM
const DEFAULT_BED_MINUTES = 23 * 60; // 11:00 PM
const QUIET_BUFFER_MINUTES = 120; // do not nudge within 2h of bedtime

export type SmartNotificationTone = 'urgent' | 'coach' | 'trend' | 'success' | 'system';

export interface ReminderSettingsSnapshot {
  notificationsEnabled: boolean;
  permissionsGranted: boolean;
  smartRemindersEnabled: boolean;
  schedules: ReminderSchedule[];
  lastReminderTime?: string;
}

export interface SmartNotificationItem {
  id: string;
  title: string;
  body: string;
  tone: SmartNotificationTone;
  priority: number;
  icon: string;
  recommendations?: string[];
  suggestedAmountMl?: number;
  suggestedTimeLabel?: string;
  tags?: string[];
}

export interface SmartNotificationSummary {
  hydrationScore: number;
  statusLabel: string;
  contextLabel: string;
  progressPercent: number;
  expectedPercent: number;
  shortfallMl: number;
  remainingMl: number;
  recommendedSipMl: number;
  nextActionTime: Date;
  longestDryStreakHours: number;
  minutesUntilQuiet: number;
  avg7Day: number;
  trendDelta: number;
}

export interface SmartNotificationResult {
  summary: SmartNotificationSummary;
  notifications: SmartNotificationItem[];
}

export interface SmartNotificationInput {
  now?: Date;
  events: IntakeEvent[];
  dailyGoalMl: number;
  todayTotalMl: number;
  profile: UserProfile;
  reminders: ReminderSettingsSnapshot;
  t?: any; // Translation function
}

type DayPart = 'morning' | 'midday' | 'afternoon' | 'evening';

interface HydrationWindowMeta {
  wakeMinutes: number;
  bedMinutes: number;
  quietMinutes: number;
  activeMinutes: number;
  minutesIntoActive: number;
  minutesUntilQuiet: number;
  isQuietNow: boolean;
}

interface DailyStat {
  dateKey: string;
  totalMl: number;
  dayOfWeek: number;
}

interface PartDistribution {
  share: Record<DayPart, number>;
}

interface HourlyBuckets {
  counts: number[];
  volumes: number[];
}

interface HydrationTrend {
  avgLast7: number;
  avgPrev7: number;
  delta: number;
  hitRate: number;
  currentStreak: number;
}

interface WeekendSplit {
  weekdayAvg: number;
  weekendAvg: number;
}

interface ReminderHealth {
  remindersPerDay: number;
  ignoredLastReminder: boolean;
  hoursSinceReminder: number;
}

function formatVolume(amountMl: number, unit: 'ml' | 'oz', precisionOverride?: number, t?: any) {
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
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatDurationHours(hours: number) {
  if (!Number.isFinite(hours) || hours === Infinity) {
    return 'a while';
  }
  const wholeHours = Math.floor(hours);
  let minutes = Math.round((hours - wholeHours) * 60);
  let adjustedHours = wholeHours;
  if (minutes === 60) {
    adjustedHours += 1;
    minutes = 0;
  }
  if (adjustedHours <= 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${adjustedHours}h`;
  }
  return `${adjustedHours}h ${minutes}m`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function computeDailyTotals(events: IntakeEvent[], days: number, now: Date): DailyStat[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const totals = new Map<string, DailyStat>();
  events.forEach((event) => {
    const eventDate = new Date(event.timestamp);
    if (eventDate < start || eventDate > now) return;
    eventDate.setHours(0, 0, 0, 0);
    const key = formatDateKey(eventDate);
    const existing = totals.get(key);
    const totalMl = (existing?.totalMl ?? 0) + event.amountMl;
    totals.set(key, {
      dateKey: key,
      totalMl,
      dayOfWeek: eventDate.getDay(),
    });
  });

  const stats: DailyStat[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = formatDateKey(date);
    stats.push(
      totals.get(key) ?? {
        dateKey: key,
        totalMl: 0,
        dayOfWeek: date.getDay(),
      }
    );
  }
  return stats;
}

function computeHourlyBuckets(events: IntakeEvent[], now: Date, lookbackDays: number): HourlyBuckets {
  const threshold = now.getTime() - lookbackDays * 24 * 60 * 60 * 1000;
  const counts = Array.from({ length: 24 }, () => 0);
  const volumes = Array.from({ length: 24 }, () => 0);

  events.forEach((event) => {
    if (event.timestamp < threshold) return;
    const date = new Date(event.timestamp);
    const hour = date.getHours();
    counts[hour] += 1;
    volumes[hour] += event.amountMl;
  });

  return { counts, volumes };
}
function computePartDistribution(events: IntakeEvent[], now: Date, lookbackDays: number): PartDistribution {
  const threshold = now.getTime() - lookbackDays * 24 * 60 * 60 * 1000;
  const totals: Record<DayPart, number> = {
    morning: 0,
    midday: 0,
    afternoon: 0,
    evening: 0,
  };

  events.forEach((event) => {
    if (event.timestamp < threshold) return;
    const date = new Date(event.timestamp);
    const hour = date.getHours();
    let part: DayPart = 'morning';
    if (hour >= 11 && hour < 14) part = 'midday';
    else if (hour >= 14 && hour < 18) part = 'afternoon';
    else if (hour >= 18) part = 'evening';
    totals[part] += event.amountMl;
  });

  const sum = Object.values(totals).reduce((acc, value) => acc + value, 0);
  const share = Object.fromEntries(
    (Object.entries(totals) as [DayPart, number][]).map(([part, value]) => [part, sum ? value / sum : 0])
  ) as Record<DayPart, number>;

  return { share };
}

function computeLongestDryStreak(events: IntakeEvent[], now: Date, lookbackHours: number) {
  const threshold = now.getTime() - lookbackHours * 60 * 60 * 1000;
  const relevant = events
    .filter((event) => event.timestamp >= threshold)
    .sort((a, b) => a.timestamp - b.timestamp);

  let lastTimestamp = threshold;
  let longest = now.getTime() - threshold;

  relevant.forEach((event) => {
    const gap = event.timestamp - lastTimestamp;
    if (gap > longest) longest = gap;
    lastTimestamp = event.timestamp;
  });

  const finalGap = now.getTime() - lastTimestamp;
  longest = Math.max(longest, finalGap);

  return longest / (60 * 60 * 1000);
}

function inferDailyWindow(events: IntakeEvent[], now: Date): HydrationWindowMeta {
  const lookbackDays = 21;
  const threshold = now.getTime() - lookbackDays * 24 * 60 * 60 * 1000;
  const perDay = new Map<string, { earliest: number; latest: number }>();

  events.forEach((event) => {
    if (event.timestamp < threshold) return;
    const date = new Date(event.timestamp);
    const key = formatDateKey(date);
    const minutes = minutesSinceMidnight(date);
    const entry = perDay.get(key) ?? { earliest: minutes, latest: minutes };
    entry.earliest = Math.min(entry.earliest, minutes);
    entry.latest = Math.max(entry.latest, minutes);
    perDay.set(key, entry);
  });

  const earliestList = Array.from(perDay.values()).map((entry) => entry.earliest);
  const latestList = Array.from(perDay.values()).map((entry) => entry.latest);

  const wakeMinutes = clamp(Math.round(average(earliestList)) || DEFAULT_WAKE_MINUTES, 5 * 60, 10 * 60);
  let bedMinutes = clamp(Math.round(average(latestList)) || DEFAULT_BED_MINUTES, 19 * 60, 24 * 60);
  if (bedMinutes <= wakeMinutes + 8 * 60) {
    bedMinutes = wakeMinutes + 8 * 60;
  }
  if (bedMinutes - wakeMinutes < 12 * 60) {
    bedMinutes = Math.min(MINUTES_IN_DAY - 1, wakeMinutes + 12 * 60);
  }

  const quietMinutes = Math.max(wakeMinutes, bedMinutes - QUIET_BUFFER_MINUTES);
  const nowMinutes = minutesSinceMidnight(now);
  const minutesIntoActive = clamp(nowMinutes - wakeMinutes, 0, Math.max(1, quietMinutes - wakeMinutes));
  const activeMinutes = Math.max(quietMinutes - wakeMinutes, 1);
  const minutesUntilQuiet = clamp(quietMinutes - nowMinutes, 0, quietMinutes);
  const isQuietNow = nowMinutes >= quietMinutes;

  return {
    wakeMinutes,
    bedMinutes,
    quietMinutes,
    activeMinutes,
    minutesIntoActive,
    minutesUntilQuiet,
    isQuietNow,
  };
}

function computeExpectedIntake(todayTotal: number, dailyGoalMl: number, window: HydrationWindowMeta) {
  const progressPercent = dailyGoalMl ? (todayTotal / dailyGoalMl) * 100 : 0;
  const expectedFraction = window.activeMinutes
    ? clamp(window.minutesIntoActive / window.activeMinutes, 0, 1)
    : 0;
  const expectedMl = dailyGoalMl * expectedFraction;
  const expectedPercent = expectedFraction * 100;
  return { progressPercent, expectedMl, expectedPercent };
}

function computeTrend(stats: DailyStat[], dailyGoalMl: number, now: Date): HydrationTrend {
  const last14 = stats.slice(-14);
  const last7 = last14.slice(-7);
  const prev7 = stats.slice(Math.max(0, stats.length - 14), Math.max(0, stats.length - 7));
  const avgLast7 = average(last7.map((d) => d.totalMl));
  const avgPrev7 = average(prev7.map((d) => d.totalMl));
  const delta = avgLast7 - avgPrev7;

  const todayKey = formatDateKey(now);
  const evaluableDays = stats.filter((d) => d.dateKey !== todayKey);
  const hitRateBase = evaluableDays.length || 1;
  const hitRate =
    evaluableDays.filter((d) => d.totalMl >= dailyGoalMl).length / hitRateBase;

  let currentStreak = 0;
  for (let i = evaluableDays.length - 1; i >= 0; i--) {
    if (evaluableDays[i].totalMl >= dailyGoalMl) currentStreak += 1;
    else break;
  }

  return { avgLast7, avgPrev7, delta, hitRate, currentStreak };
}

function computeWeekendSplit(stats: DailyStat[]): WeekendSplit {
  const weekend = stats.filter((d) => d.dayOfWeek === 0 || d.dayOfWeek === 6);
  const weekday = stats.filter((d) => d.dayOfWeek > 0 && d.dayOfWeek < 6);
  return {
    weekendAvg: average(weekend.map((d) => d.totalMl)),
    weekdayAvg: average(weekday.map((d) => d.totalMl)),
  };
}

function computeReminderHealth(reminders: ReminderSettingsSnapshot, now: Date): ReminderHealth {
  const remindersPerDay = reminders.schedules
    .filter((schedule) => schedule.enabled)
    .reduce((acc, schedule) => {
      const minutes = Math.max(schedule.endMinutes - schedule.startMinutes, schedule.intervalMin);
      const count = Math.max(Math.floor(minutes / schedule.intervalMin), 1);
      return acc + count;
    }, 0);

  let ignoredLastReminder = false;
  let hoursSinceReminder = 0;
  if (reminders.lastReminderTime) {
    const lastReminderDate = new Date(reminders.lastReminderTime);
    hoursSinceReminder = (now.getTime() - lastReminderDate.getTime()) / (60 * 60 * 1000);
  }

  return { remindersPerDay, ignoredLastReminder, hoursSinceReminder };
}

function findPeakHour(buckets: HourlyBuckets, start: number, end: number) {
  const safeStart = Math.max(0, Math.min(23, Math.floor(start)));
  const safeEnd = Math.max(safeStart, Math.min(23, Math.floor(end)));
  let bestHour = safeStart;
  let bestScore = -Infinity;
  for (let h = safeStart; h <= safeEnd; h++) {
    const score = buckets.counts[h] * 2 + buckets.volumes[h];
    if (score > bestScore) {
      bestScore = score;
      bestHour = h;
    }
  }
  return bestHour;
}

function findQuietHour(buckets: HourlyBuckets, start: number, end: number) {
  const safeStart = Math.max(0, Math.min(23, Math.floor(start)));
  const safeEnd = Math.max(safeStart, Math.min(23, Math.floor(end)));
  let quietHour = safeStart;
  let quietScore = Infinity;
  for (let h = safeStart; h <= safeEnd; h++) {
    const score = buckets.counts[h] * 2 + buckets.volumes[h];
    if (score < quietScore) {
      quietScore = score;
      quietHour = h;
    }
  }
  return quietHour;
}

export function generateSmartNotifications(input: SmartNotificationInput): SmartNotificationResult {
  const now = input.now ?? new Date();
  const { events, dailyGoalMl, todayTotalMl, profile, reminders, t } = input;
  const userUnit = profile.unit ?? 'ml';
  const formatAmount = (value: number, precision?: number) => formatVolume(value, userUnit, precision, t);
  const lastEvent = events[0];
  const lastDrinkDate = lastEvent ? new Date(lastEvent.timestamp) : null;
  const hoursSinceLastDrink = lastDrinkDate
    ? (now.getTime() - lastDrinkDate.getTime()) / (60 * 60 * 1000)
    : Infinity;

  const windowMeta = inferDailyWindow(events, now);
  const stats = computeDailyTotals(events, 21, now);
  const trend = computeTrend(stats, dailyGoalMl, now);
  const weekendSplit = computeWeekendSplit(stats.slice(-14));
  const hourlyBuckets = computeHourlyBuckets(events, now, 30);
  const partDistribution = computePartDistribution(events, now, 14);
  const longestDryStreakHours = computeLongestDryStreak(events, now, 72);
  const reminderHealth = computeReminderHealth(reminders, now);

  if (reminders.lastReminderTime && lastDrinkDate) {
    const lastReminderDate = new Date(reminders.lastReminderTime);
    if (lastDrinkDate.getTime() > lastReminderDate.getTime()) {
      reminderHealth.ignoredLastReminder = false;
    } else {
      reminderHealth.hoursSinceReminder =
        (now.getTime() - lastReminderDate.getTime()) / (60 * 60 * 1000);
      reminderHealth.ignoredLastReminder = true;
    }
  } else if (reminders.lastReminderTime && !lastDrinkDate) {
    reminderHealth.ignoredLastReminder = true;
  }

  const { progressPercent, expectedMl, expectedPercent } = computeExpectedIntake(
    todayTotalMl,
    dailyGoalMl,
    windowMeta
  );

  const shortfallMl = Math.max(0, expectedMl - todayTotalMl);
  const remainingMl = Math.max(0, dailyGoalMl - todayTotalMl);
  const behindPercent = dailyGoalMl ? (shortfallMl / dailyGoalMl) * 100 : 0;
  const remainingFraction = windowMeta.activeMinutes
    ? Math.max(windowMeta.activeMinutes - windowMeta.minutesIntoActive, 0) / windowMeta.activeMinutes
    : 0.3;

  const recommendedSipMl = suggestedSipMl(dailyGoalMl, todayTotalMl, remainingFraction || 0.3);

  const climateBonus = profile.climate === 'hot' ? 1.2 : profile.climate === 'temperate' ? 0.6 : 0;
  const activityBonus = profile.activityLevel === 'high' ? 1 : profile.activityLevel === 'medium' ? 0.5 : 0;

  const hydrationScore = clamp(
    100 -
      clamp(behindPercent * 0.65, 0, 60) -
      clamp(Math.max(0, hoursSinceLastDrink - 1) * 7, 0, 30) +
      clamp(trend.delta / 10, -10, 15) +
      clamp(trend.currentStreak * 2, 0, 10) -
      clamp(longestDryStreakHours - 6, 0, 12) +
      (windowMeta.isQuietNow ? -10 : 0) +
      climateBonus +
      activityBonus,
    5,
    100
  );

  const thirstScore = clamp(10 - hydrationScore / 10, 0, 10);

  const urgencyIntervalMinutes = clamp(
    120 - behindPercent * 0.8 - (hoursSinceLastDrink > 2 ? 30 : 0) - climateBonus * 10,
    25,
    140
  );

  const nextActionTime = windowMeta.isQuietNow
    ? new Date(now.getTime() + Math.max(windowMeta.minutesUntilQuiet, 30) * 60 * 1000)
    : thirstScore >= 6 || hoursSinceLastDrink >= 2.5
    ? now
    : new Date(now.getTime() + urgencyIntervalMinutes * 60 * 1000);

  const summary: SmartNotificationSummary = {
    hydrationScore,
    statusLabel:
      hydrationScore >= 80
        ? (t ? t('ai.statusExcellent') : 'Excellent momentum')
        : hydrationScore >= 60
        ? (t ? t('ai.statusOnTrack') : 'Mostly on track')
        : hydrationScore >= 40
        ? (t ? t('ai.statusNeedsAttention') : 'Needs attention')
        : (t ? t('ai.statusCritical') : 'Critical gap'),
    contextLabel:
      behindPercent <= 5
        ? (t ? t('ai.contextOnPace') : 'Right on pace')
        : behindPercent <= 15
        ? (t ? t('ai.contextSlightlyBehind') : 'Slightly behind schedule')
        : behindPercent <= 35
        ? (t ? t('ai.contextFallingBehind') : 'Falling behind')
        : (t ? t('ai.contextSeverelyBehind') : 'Severely behind pace'),
    progressPercent: progressPercent,
    expectedPercent,
    shortfallMl,
    remainingMl,
    recommendedSipMl,
    nextActionTime,
    longestDryStreakHours,
    minutesUntilQuiet: windowMeta.minutesUntilQuiet,
    avg7Day: trend.avgLast7,
    trendDelta: trend.delta,
  };

  const notifications: SmartNotificationItem[] = [];

  const formattedShortfallPercent = Math.round(behindPercent);
  const drinkGapBody = lastDrinkDate
    ? (t
        ? t('ai.notif.urgentGapBody', {
            duration: formatDurationHours(hoursSinceLastDrink),
            lastAmount: formatAmount(lastEvent?.amountMl ?? 0),
            percent: formattedShortfallPercent,
          })
        : `It's been ${formatDurationHours(hoursSinceLastDrink)} since your last ${formatAmount(
            lastEvent?.amountMl ?? 0
          )} and you're ${formattedShortfallPercent}% behind the pace for this hour.`)
    : (t
        ? t('ai.notif.urgentGapBodyNoLog')
        : 'No drinks logged yet today. Starting with a full glass now will set the tone for the rest of the day.');

  if (
    hoursSinceLastDrink >= 2.5 ||
    thirstScore >= 6 ||
    (behindPercent >= 20 && !windowMeta.isQuietNow)
  ) {
    notifications.push({
      id: 'urgent-gap',
      title: windowMeta.isQuietNow
        ? (t ? t('ai.notif.urgentGapTitleQuiet') : 'Finish strong before lights out')
        : (t ? t('ai.notif.urgentGapTitle') : 'Hydration gap detected'),
      body: windowMeta.isQuietNow
        ? (t
            ? t('ai.notif.urgentGapBodyQuiet', { remaining: formatAmount(remainingMl) })
            : `Bedtime quiet hours start soon. You're still ${formatAmount(
                remainingMl
              )} away from goal. Take one steady glass now to avoid late-night thirst.`)
        : drinkGapBody,
      tone: 'urgent',
      icon: '⚡️',
      priority: 100,
      suggestedAmountMl: recommendedSipMl,
      suggestedTimeLabel: windowMeta.isQuietNow
        ? (t ? t('ai.notif.urgentGapSuggestNext10') : 'Next 10 min')
        : (t ? t('ai.notif.urgentGapSuggestNow') : 'Now'),
      recommendations: [
        t
          ? t('ai.notif.urgentGapRec1', { amount: formatAmount(recommendedSipMl) })
          : `Drink ${formatAmount(recommendedSipMl)} immediately.`,
        windowMeta.minutesUntilQuiet < 120
          ? (t
              ? t('ai.notif.urgentGapRec2Sleep')
              : 'Wrap hydration at least 1.5h before bed to protect your sleep.')
          : (t ? t('ai.notif.urgentGapRec2') : 'Stack a second glass in ~45 min if you can.'),
      ],
      tags: ['Just-In-Time', 'Urgent'],
    });
  }

  if (remainingMl > 0 && windowMeta.minutesUntilQuiet > 30) {
    const hoursLeft = windowMeta.minutesUntilQuiet / 60;
    const neededPerHour = Math.ceil(remainingMl / Math.max(hoursLeft, 1));
    const planLabel =
      hoursLeft <= 1.5
        ? (t ? t('ai.notif.strategyTimeAboutHour') : 'only about an hour')
        : `${hoursLeft.toFixed(1)}h`;
    notifications.push({
      id: 'strategic-plan',
      title: t ? t('ai.notif.strategyTitle') : 'Catch-up strategy',
      body: t
        ? t('ai.notif.strategyBody', {
            remaining: formatAmount(remainingMl),
            timeLeft: planLabel,
            perHour: formatAmount(neededPerHour),
          })
        : `You still need ${formatAmount(
            remainingMl
          )} with ${planLabel} before quiet hours. Sip roughly ${formatAmount(neededPerHour)} each hour to land comfortably.`,
      tone: 'coach',
      icon: '🧠',
      priority: 85,
      suggestedAmountMl: neededPerHour,
      suggestedTimeLabel: t
        ? t('ai.notif.strategySuggestLabel', { amount: formatAmount(neededPerHour) })
        : `${formatAmount(neededPerHour)} / hour`,
      recommendations: [
        t
          ? t('ai.notif.strategyRec1')
          : 'Pair the next reminder with an existing habit (meetings, meals, or commute).',
        t
          ? t('ai.notif.strategyRec2')
          : 'Prep a full bottle now so it is within reach during your focus blocks.',
      ],
      tags: ['Plan', 'Goal'],
    });
  }

  if (trend.delta <= -100 || trend.hitRate < 0.55) {
    notifications.push({
      id: 'trend-drop',
      title: t ? t('ai.notif.trendDropTitle') : 'Momentum slipped this week',
      body: t
        ? t('ai.notif.trendDropBody', {
            avg7: formatAmount(trend.avgLast7),
            avgPrev: formatAmount(trend.avgPrev7),
            hitRate: (trend.hitRate * 100).toFixed(0),
          })
        : `7-day intake averaged ${formatAmount(trend.avgLast7)} vs ${formatAmount(
            trend.avgPrev7
          )} previously. Goal days: ${(trend.hitRate * 100).toFixed(0)}%.`,
      tone: 'trend',
      icon: '📉',
      priority: 80,
      recommendations: [
        trend.hitRate < 0.4
          ? (t
              ? t('ai.notif.trendDropRec1Low', { amount: formatAmount(250) })
              : `Drop the daily target by ~${formatAmount(250)} temporarily to rebuild confidence, then scale back up.`)
          : (t
              ? t('ai.notif.trendDropRec1')
              : 'Schedule one more reminder in your driest block tomorrow to rebuild rhythm.'),
        t
          ? t('ai.notif.trendDropRec2')
          : 'Log even small sips. Consistent data helps the AI learn your cadence.',
      ],
      tags: ['Trend', 'Weekly'],
    });
  } else if (trend.delta > 120) {
    notifications.push({
      id: 'trend-up',
      title: t ? t('ai.notif.trendUpTitle') : 'Hot streak detected 🔥',
      body: t
        ? t('ai.notif.trendUpBody', {
            delta: formatAmount(trend.delta),
            streak: trend.currentStreak,
          })
        : `Average intake climbed by ${formatAmount(trend.delta)} over last week. Keep the streak (${trend.currentStreak}d) alive with one more glass.`,
      tone: 'success',
      icon: '🎯',
      priority: 60,
      recommendations: [
        t
          ? t('ai.notif.trendUpRec1', { amount: formatAmount(150) })
          : `Consider nudging your goal up by ~${formatAmount(150)} to match your new baseline.`,
        t ? t('ai.notif.trendUpRec2') : 'Keep morning hydration consistent to lock in this streak.',
      ],
      tags: ['Trend', 'Positive'],
    });
  }

  if (Math.abs(weekendSplit.weekendAvg - weekendSplit.weekdayAvg) >= 200) {
    const weekendLower = weekendSplit.weekendAvg < weekendSplit.weekdayAvg;
    notifications.push({
      id: 'weekend-gap',
      title: weekendLower
        ? (t ? t('ai.notif.weekendGapTitleLower') : 'Weekend hydration dips')
        : (t ? t('ai.notif.weekendGapTitleHigher') : 'Weekdays are lagging'),
      body: weekendLower
        ? (t
            ? t('ai.notif.weekendGapBodyLower', {
                weekendAvg: formatAmount(weekendSplit.weekendAvg),
                weekdayAvg: formatAmount(weekendSplit.weekdayAvg),
              })
            : `Weekends average ${formatAmount(weekendSplit.weekendAvg)} vs ${formatAmount(
                weekendSplit.weekdayAvg
              )} on weekdays. Looser routines likely the culprit.`)
        : (t
            ? t('ai.notif.weekendGapBodyHigher', {
                weekdayAvg: formatAmount(weekendSplit.weekdayAvg),
              })
            : `Weekdays average ${formatAmount(
                weekendSplit.weekdayAvg
              )}, below your weekend baseline. Meetings might be blocking water breaks.`),
      tone: 'coach',
      icon: '📅',
      priority: 55,
      recommendations: [
        weekendLower
          ? (t
              ? t('ai.notif.weekendGapRec1Weekend')
              : 'Schedule a mid-morning reminder specifically for Saturday/Sunday.')
          : (t
              ? t('ai.notif.weekendGapRec1Weekday')
              : 'Pre-fill a bottle before your workday starts to avoid desk droughts.'),
        t
          ? t('ai.notif.weekendGapRec2')
          : 'Add a widget or complication for quick weekend logging.',
      ],
      tags: ['Routine'],
    });
  }

  const morningShare = partDistribution.share.morning;
  if (morningShare < 0.2 && todayTotalMl / Math.max(dailyGoalMl, 1) < 0.4) {
    notifications.push({
      id: 'morning-priming',
      title: t ? t('ai.notif.morningTitle') : 'Boost the morning baseline',
      body: t
        ? t('ai.notif.morningBody', { amount: formatAmount(250) })
        : `Less than 20% of your intake typically happens before lunch. Starting with a ${formatAmount(
            250
          )} glass in the first hour after wake improves adherence dramatically.`,
      tone: 'coach',
      icon: '☀️',
      priority: 65,
      recommendations: [
        t
          ? t('ai.notif.morningRec1')
          : 'Leave water on your nightstand so it is the first thing you reach for.',
        t ? t('ai.notif.morningRec2') : 'Anchor a reminder to your breakfast or coffee ritual.',
      ],
      tags: ['Morning'],
    });
  }

  const eveningShare = partDistribution.share.evening;
  if (eveningShare > 0.45) {
    notifications.push({
      id: 'late-evening',
      title: t ? t('ai.notif.eveningTitle') : 'Heavy evening intake',
      body: t
        ? t('ai.notif.eveningBody')
        : 'Nearly half of your hydration happens after 6 PM. Front-load the day to avoid late-night bathroom trips.',
      tone: 'coach',
      icon: '🌙',
      priority: 50,
      recommendations: [
        t ? t('ai.notif.eveningRec1') : 'Shift one reminder to mid-afternoon.',
        t
          ? t('ai.notif.eveningRec2')
          : 'Drink a glass immediately after each calendar meeting wraps.',
      ],
      tags: ['Evening'],
    });
  }

  const recommendedGoalMl =
    profile.weightKg !== undefined
      ? Math.round(
          computeBaseGoalMl(profile.weightKg) * activityMultiplier(profile.activityLevel) * climateMultiplier(profile.climate)
        )
      : undefined;

  if (recommendedGoalMl) {
    const delta = recommendedGoalMl - dailyGoalMl;
    if (delta >= 400) {
      notifications.push({
        id: 'goal-too-low',
        title: t ? t('ai.notif.goalLowTitle') : 'Goal may be conservative',
        body: t
          ? t('ai.notif.goalLowBody', {
              recommended: formatAmount(recommendedGoalMl),
              current: formatAmount(dailyGoalMl),
            })
          : `Based on your weight and activity, ${formatAmount(
              recommendedGoalMl
            )} is a better fit than the current ${formatAmount(dailyGoalMl)} target.`,
        tone: 'trend',
        icon: '📈',
        priority: 45,
        recommendations: [
          t
            ? t('ai.notif.goalLowRec1', { amount: formatAmount(150) })
            : `Gradually raise the goal by ${formatAmount(150)} every few days instead of a huge jump.`,
          t
            ? t('ai.notif.goalLowRec2')
            : 'Re-run the goal calculator inside Settings ▸ Profile to refresh inputs.',
        ],
        tags: ['Goal'],
      });
    } else if (delta <= -400) {
      notifications.push({
        id: 'goal-too-high',
        title: t ? t('ai.notif.goalHighTitle') : 'Goal may be aggressive',
        body: t
          ? t('ai.notif.goalHighBody', {
              recommended: formatAmount(recommendedGoalMl),
              current: formatAmount(dailyGoalMl),
            })
          : `Your profile suggests ${formatAmount(
              recommendedGoalMl
            )} daily. Consider dialing back from ${formatAmount(dailyGoalMl)} to reduce burnout.`,
        tone: 'coach',
        icon: '🧘‍♂️',
        priority: 45,
        recommendations: [
          t
            ? t('ai.notif.goalHighRec1', { amount: formatAmount(250) })
            : `Use auto-adjust: lower by ${formatAmount(250)} for a week, then reassess.`,
          t
            ? t('ai.notif.goalHighRec2')
            : 'Celebrate partial wins—consistency matters more than perfection.',
        ],
        tags: ['Goal'],
      });
    }
  }

  const startHour = Math.floor(windowMeta.wakeMinutes / 60);
  const endHour = Math.floor(windowMeta.quietMinutes / 60);
  const peakHour = findPeakHour(hourlyBuckets, startHour, endHour);
  const quietHour = findQuietHour(hourlyBuckets, startHour, endHour);
  const nowHour = now.getHours();
  const hadDrinkThisHour = events.some((event) => {
    const date = new Date(event.timestamp);
    return isSameDay(date, now) && date.getHours() === nowHour;
  });

  if (!hadDrinkThisHour && Math.abs(nowHour - peakHour) <= 1 && !windowMeta.isQuietNow) {
    notifications.push({
      id: 'missed-routine',
      title: t ? t('ai.notif.habitTitle') : 'Missed your typical sip window',
      body: t
        ? t('ai.notif.habitBody', { hourLabel: formatHourLabel(peakHour) })
        : `You almost always drink around ${formatHourLabel(peakHour)}, but there is no log today. Take advantage of that habit loop.`,
      tone: 'coach',
      icon: '⏱️',
      priority: 70,
      recommendations: [
        t
          ? t('ai.notif.habitRec1')
          : 'Keep a bottle visible in that environment (desk, kitchen, gym bag).',
        t
          ? t('ai.notif.habitRec2')
          : 'Add a widget to capture the drink with one tap when the habit window arrives.',
      ],
      tags: ['Habit'],
    });
  }

  if (reminderHealth.remindersPerDay < 4 && reminders.notificationsEnabled) {
    notifications.push({
      id: 'schedule-light',
      title: t ? t('ai.notif.reminderThinTitle') : 'Reminder schedule is thin',
      body: t
        ? t('ai.notif.reminderThinBody', { count: reminderHealth.remindersPerDay })
        : `Only ${reminderHealth.remindersPerDay} reminders fire per day. Add at least one per major day part so the AI can course-correct sooner.`,
      tone: 'system',
      icon: '🔔',
      priority: 48,
      recommendations: [
        t
          ? t('ai.notif.reminderThinRec1')
          : 'Set specific quiet hours (e.g., during meetings) instead of turning reminders off entirely.',
        t
          ? t('ai.notif.reminderThinRec2')
          : 'Enable smart reminders so the system can nudge you dynamically.',
      ],
      tags: ['Notifications'],
    });
  }

  if (!reminders.notificationsEnabled || !reminders.permissionsGranted) {
    notifications.push({
      id: 'notifications-off',
      title: t ? t('ai.notif.notifsOffTitle') : 'Notifications are disabled',
      body: t
        ? t('ai.notif.notifsOffBody')
        : 'Enable hydration notifications so the AI coach can execute just-in-time nudges.',
      tone: 'system',
      icon: '🚫',
      priority: 95,
      recommendations: [
        t
          ? t('ai.notif.notifsOffRec1')
          : 'Go to Settings ▸ Notifications and grant permission.',
        t ? t('ai.notif.notifsOffRec2') : 'Customize quiet hours instead of disabling everything.',
      ],
      tags: ['System'],
    });
  } else if (!reminders.smartRemindersEnabled) {
    notifications.push({
      id: 'smart-off',
      title: t ? t('ai.notif.smartOffTitle') : 'Smart reminders paused',
      body: t
        ? t('ai.notif.smartOffBody')
        : 'Rule-based reminders are on, but adaptive AI nudges are disabled. Turn them back on to leverage your historical data.',
      tone: 'system',
      icon: '🤖',
      priority: 60,
      recommendations: [
        t
          ? t('ai.notif.smartOffRec1')
          : 'Enable Smart Reminders to let the algorithm respond to long dry spells.',
      ],
      tags: ['System'],
    });
  }

  if (reminderHealth.ignoredLastReminder && reminderHealth.hoursSinceReminder > 1.5) {
    notifications.push({
      id: 'ignored-reminder',
      title: t ? t('ai.notif.ignoredTitle') : 'Last reminder went unanswered',
      body: t
        ? t('ai.notif.ignoredBody', { duration: formatDurationHours(reminderHealth.hoursSinceReminder) })
        : `A notification fired ${formatDurationHours(reminderHealth.hoursSinceReminder)} ago without a log. Consider snoozing when you are busy so we learn your quiet blocks.`,
      tone: 'coach',
      icon: '📳',
      priority: 58,
      recommendations: [
        t
          ? t('ai.notif.ignoredRec1')
          : 'Use "Remind me in 15 min" instead of dismissing to keep timing aligned.',
        t
          ? t('ai.notif.ignoredRec2')
          : 'Log even partial drinks after acknowledging a reminder.',
      ],
      tags: ['Feedback'],
    });
  }

  const quietHourLabel = formatHourLabel(quietHour);
  if (quietHour !== peakHour && hourlyBuckets.counts[quietHour] === 0) {
    notifications.push({
      id: 'opportunity-hour',
      title: t ? t('ai.notif.opportunityTitle') : 'Opportunity window identified',
      body: t
        ? t('ai.notif.opportunityBody', { hourLabel: quietHourLabel })
        : `The ${quietHourLabel} hour rarely sees any water. Scheduling a check-in there would smooth your curve.`,
      tone: 'trend',
      icon: '📊',
      priority: 40,
      recommendations: [
        t
          ? t('ai.notif.opportunityRec1', { hourLabel: quietHourLabel })
          : `Add a reminder at ${quietHourLabel} with a smaller sip goal.`,
        t
          ? t('ai.notif.opportunityRec2')
          : 'Keep chilled water ready around that time so friction is low.',
      ],
      tags: ['Habit'],
    });
  }

  if (!notifications.length) {
    notifications.push({
      id: 'all-clear',
      title: t ? t('ai.notif.allClearTitle') : 'Hydration plan locked in',
      body: t
        ? t('ai.notif.allClearBody')
        : 'No interventions needed right now. Keep logging drinks so the AI can continue to learn your cadence.',
      tone: 'success',
      icon: '✅',
      priority: 10,
    });
  }

  notifications.sort((a, b) => b.priority - a.priority);

  return { summary, notifications };
}

function formatHourLabel(hour: number) {
  const date = new Date();
  date.setHours(hour);
  date.setMinutes(0, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric' });
}
