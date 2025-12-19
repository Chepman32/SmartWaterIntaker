// Shared TypeScript interfaces for core data models
export type Unit = 'ml' | 'oz';

export type MotivationType =
  | 'work'
  | 'brain'
  | 'fitness'
  | 'meditation'
  | 'health'
  | 'beauty'
  | 'other';

export interface UserProfile {
  unit: Unit;
  weightKg?: number;
  sex?: 'male' | 'female' | 'other';
  activityLevel: 'low' | 'medium' | 'high';
  climate: 'cool' | 'temperate' | 'hot';
  motivation?: MotivationType[];
  wakeUpTime?: string; // HH:mm format
  bedTime?: string; // HH:mm format
  workStartTime?: string; // HH:mm format
  workEndTime?: string; // HH:mm format
  onboardingCompleted?: boolean;
  notificationsEnabled?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DailyGoal {
  date: string; // YYYY-MM-DD
  baseMl: number;
  activityMultiplier: number;
  climateMultiplier: number;
  manualDelta: number; // can be negative
  computed: number; // final goal in ml
}

export interface IntakeEvent {
  id: string;
  timestamp: number;
  amountMl: number;
  source: 'chip' | 'container' | 'custom' | 'notification';
  containerId?: string;
  drinkTypeId?: string;
  note?: string;
}

export interface Container {
  id: string;
  name: string;
  sizeMl: number;
  color: string; // hex
  icon: string; // name
  favorite?: boolean;
}

export interface DrinkType {
  id: string;
  name: string;
  icon: string;
  image?: any; // Image source from require()
  color: string;
  description?: string;
}

export interface ReminderSchedule {
  id: string;
  startMinutes: number; // minutes from 00:00
  endMinutes: number;
  intervalMin: number;
  days: number[]; // 0-6
  quietStartMinutes?: number;
  quietEndMinutes?: number;
  enabled: boolean;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark' | 'pro1' | 'pro2' | 'pro3';
  haptics: boolean;
  sounds: boolean;
  language?: string;
  quickAddsMl: number[];
  alternateIcon?: string;
}
