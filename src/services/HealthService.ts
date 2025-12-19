import { Platform } from 'react-native';

export interface HealthPermissionStatus {
  granted: boolean;
  error?: string;
}

// Lazy load AppleHealthKit to prevent crashes if native module isn't linked
let AppleHealthKit: any = null;
let HEALTH_PERMISSIONS: any = null;

const loadHealthKit = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  if (AppleHealthKit !== null) return true;

  try {
    AppleHealthKit = require('react-native-health').default;
    HEALTH_PERMISSIONS = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.Water],
        write: [AppleHealthKit.Constants.Permissions.Water],
      },
    };
    return true;
  } catch (error) {
    console.warn('Failed to load react-native-health:', error);
    return false;
  }
};

class HealthService {
  private static instance: HealthService;
  private isInitialized = false;
  private isModuleAvailable = false;

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  constructor() {
    this.isModuleAvailable = loadHealthKit();
  }

  async initialize(): Promise<boolean> {
    if (!this.isModuleAvailable) return false;
    if (this.isInitialized) return true;

    return new Promise(resolve => {
      AppleHealthKit.isAvailable((err: any, available: boolean) => {
        if (err || !available) {
          resolve(false);
          return;
        }
        this.isInitialized = true;
        resolve(true);
      });
    });
  }

  async requestPermissions(): Promise<HealthPermissionStatus> {
    if (!this.isModuleAvailable) {
      return { granted: false, error: 'HealthKit module not available' };
    }

    const isAvailable = await this.initialize();
    if (!isAvailable) {
      return {
        granted: false,
        error: 'HealthKit is not available on this device',
      };
    }

    return new Promise(resolve => {
      AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, (err: string) => {
        if (err) {
          resolve({ granted: false, error: err });
          return;
        }
        resolve({ granted: true });
      });
    });
  }

  async saveWaterIntake(amountMl: number, date?: Date): Promise<boolean> {
    if (!this.isModuleAvailable || !this.isInitialized) return false;

    const options = {
      value: amountMl / 1000,
      date: (date || new Date()).toISOString(),
      unit: AppleHealthKit.Constants.Units.liter,
    };

    return new Promise(resolve => {
      AppleHealthKit.saveWater(options, (err: string) => {
        resolve(!err);
      });
    });
  }

  async getWaterIntakeForDate(date: Date): Promise<number> {
    if (!this.isModuleAvailable || !this.isInitialized) return 0;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return new Promise(resolve => {
      AppleHealthKit.getWaterSamples(
        { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        (err: string, results: any[]) => {
          if (err) {
            resolve(0);
            return;
          }
          const totalLiters = results.reduce(
            (sum, s) => sum + (s.value || 0),
            0,
          );
          resolve(totalLiters * 1000);
        },
      );
    });
  }

  isAvailableOnPlatform(): boolean {
    return Platform.OS === 'ios' && this.isModuleAvailable;
  }
}

export default HealthService.getInstance();
