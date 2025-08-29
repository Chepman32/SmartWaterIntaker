// Algorithms for goal calculation and suggestions

export function roundToNearest50(value: number) {
  return Math.round(value / 50) * 50;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function computeBaseGoalMl(weightKg?: number) {
  const base = weightKg ? weightKg * 30 : 2000;
  return roundToNearest50(base);
}

export function activityMultiplier(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'low':
      return 1;
    case 'medium':
      return 1.1;
    case 'high':
      return 1.25;
  }
}

export function climateMultiplier(level: 'cool' | 'temperate' | 'hot') {
  switch (level) {
    case 'cool':
      return 0.95;
    case 'temperate':
      return 1;
    case 'hot':
      return 1.1;
  }
}

export function computeDailyGoalMl(
  weightKg: number | undefined,
  activity: 'low' | 'medium' | 'high',
  climate: 'cool' | 'temperate' | 'hot',
  manualDelta: number,
) {
  const base = computeBaseGoalMl(weightKg);
  const total = base * activityMultiplier(activity) * climateMultiplier(climate) + manualDelta;
  return clamp(Math.round(total), 1200, 5000);
}

export function suggestedSipMl(
  goalMl: number,
  sumTodayMl: number,
  remainingTimeFraction: number,
) {
  const remaining = Math.max(0, goalMl - sumTodayMl);
  const raw = remaining * 0.4 * remainingTimeFraction;
  return clamp(Math.round(raw), 100, 750);
}