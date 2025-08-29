import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Svg, { Path, ClipPath, Circle, Defs } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  runOnUI,
  useAnimatedProps,
  interpolate,
  Easing,
} from 'react-native-reanimated';


const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface WaterRingProps {
  size?: number;                 // px, default 240
  strokeWidth?: number;          // ring thickness, default 14
  progress: number;              // 0..1, derived from value/goal
  valueMl: number;               // displayed numeric value
  goalMl: number;                // displayed goal value
  theme?: 'light' | 'dark';      // colors
  enableTilt?: boolean;          // use device rotation for subtle slosh, default false
  // Motion tuning (all optional)
  idleAmplitude?: number;        // px at size=240, default 6
  idleFrequency?: number;        // cycles across width, default 1.8
  idlePeriodMs?: number;         // full phase loop, default 4000
  splashAmplitudeMax?: number;   // px, default 18
  splashDurationMs?: number;     // total envelope, default 900
  levelRiseDurationMs?: number;  // default 450
  reduceMotion?: boolean;        // honor OS setting; if true, lowers amplitudes/speeds
  onAnimationEnd?: () => void;   // fired after level change completes
}

export default function WaterRing({
  size = 240,
  strokeWidth = 14,
  progress,
  valueMl,
  goalMl,
  theme = 'light',
  enableTilt = false,
  idleAmplitude = 6,
  idleFrequency = 1.8,
  idlePeriodMs = 4000,
  splashAmplitudeMax = 18,
  splashDurationMs = 900,
  levelRiseDurationMs = 450,
  reduceMotion = false,
  onAnimationEnd,
}: WaterRingProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  // Check for system reduce motion setting
  const [isSystemReduceMotion, setIsSystemReduceMotion] = React.useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsSystemReduceMotion);
  }, []);
  
  const shouldReduceMotion = reduceMotion || isSystemReduceMotion;
  
  // Scale amplitudes and speeds based on size and reduce motion
  const scaleFactor = size / 240;
  const scaledIdleAmplitude = shouldReduceMotion ? idleAmplitude * 0.5 * scaleFactor : idleAmplitude * scaleFactor;
  const scaledSplashAmplitudeMax = shouldReduceMotion ? splashAmplitudeMax * 0.5 * scaleFactor : splashAmplitudeMax * scaleFactor;
  const scaledIdlePeriodMs = shouldReduceMotion ? idlePeriodMs * 2 : idlePeriodMs;
  const scaledLevelRiseDurationMs = shouldReduceMotion ? levelRiseDurationMs * 2 : levelRiseDurationMs;
  const scaledSplashDurationMs = shouldReduceMotion ? splashDurationMs * 2 : splashDurationMs;
  
  // Animation state
  const phase = useSharedValue(0);
  const amplitude = useSharedValue(scaledIdleAmplitude);
  const slope = useSharedValue(0);
  const baseLevel = useSharedValue(progress);
  const splashActive = useSharedValue(false);
  const splashStartTime = useSharedValue(0);
  
  // Previous progress for detecting changes
  const prevProgress = useRef(progress);
  
  // Idle wave animation
  useEffect(() => {
    phase.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: scaledIdlePeriodMs,
        easing: Easing.linear,
      }),
      -1
    );
  }, [scaledIdlePeriodMs]);
  
  // Optional breathing effect for idle amplitude
  useEffect(() => {
    if (!shouldReduceMotion) {
      amplitude.value = withRepeat(
        withSequence(
          withTiming(scaledIdleAmplitude * 1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(scaledIdleAmplitude * 0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    }
  }, [shouldReduceMotion, scaledIdleAmplitude]);
  
  // Handle progress changes
  useEffect(() => {
    const delta = progress - prevProgress.current;
    
    if (delta > 0 && !splashActive.value) {
      // Trigger splash animation
      splashActive.value = true;
      splashStartTime.value = Date.now();
      
      // Calculate splash parameters based on delta
      const normalizedDelta = Math.min(delta, 0.2); // Cap at 20% of goal
      const splashPeak = Math.max(4, Math.min(
        interpolate(normalizedDelta, [0, 0.2], [6, scaledSplashAmplitudeMax]),
        scaledSplashAmplitudeMax
      ));
      
      // Level rise animation
      baseLevel.value = withTiming(progress, {
        duration: scaledLevelRiseDurationMs,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished && onAnimationEnd) {
          onAnimationEnd();
        }
      });
      
      // Splash amplitude burst
      amplitude.value = withSequence(
        withTiming(splashPeak, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(scaledIdleAmplitude, { duration: scaledSplashDurationMs - 150, easing: Easing.out(Easing.cubic) })
      );
      
      // Slosh tilt animation
      const sloshPeak = normalizedDelta >= 0.2 ? 0.15 : normalizedDelta * 0.75;
      slope.value = withSequence(
        withTiming(sloshPeak, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(-sloshPeak * 0.3, { duration: 300, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
      );
      
      // Reset splash state after animation
      setTimeout(() => {
        splashActive.value = false;
      }, scaledSplashDurationMs);
      
    } else if (delta < 0) {
      // Decrease - no splash, just animate level down
      baseLevel.value = withTiming(progress, {
        duration: scaledLevelRiseDurationMs,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished && onAnimationEnd) {
          onAnimationEnd();
        }
      });
      
      // Ease amplitude back to idle
      amplitude.value = withTiming(scaledIdleAmplitude, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
    
    prevProgress.current = progress;
  }, [progress, scaledLevelRiseDurationMs, scaledSplashDurationMs, scaledIdleAmplitude, scaledSplashAmplitudeMax]);
  
  // Animated wave paths for front and back layers
  const frontWavePath = useDerivedValue(() => {
    'worklet';
    const width = size;
    const height = size;
    const numPoints = 80;
    
    let path = `M 0 ${height}`;
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const normalizedX = (x - width / 2) / (width / 2); // -1 to 1
      
      // Wave function: y = waterLevel + slope * x + amplitude * sin(frequency * x + phase)
      // waterLevel should be from bottom (height) to top (0), so we invert the progress
      const waterLevel = height - (baseLevel.value * height);
      const waveY = waterLevel + 
                   slope.value * normalizedX * height / 2 +
                   amplitude.value * Math.sin(idleFrequency * Math.PI * normalizedX + phase.value);
      
      const clampedY = Math.max(0, Math.min(height, waveY));
      
      if (i === 0) {
        path += ` M ${x} ${clampedY}`;
      } else {
        path += ` L ${x} ${clampedY}`;
      }
    }
    
    // Close the path
    path += ` L ${width} ${height} L 0 ${height} Z`;
    
    return path;
  });
  
  const backWavePath = useDerivedValue(() => {
    'worklet';
    const width = size;
    const height = size;
    const numPoints = 80;
    
    let path = `M 0 ${height}`;
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const normalizedX = (x - width / 2) / (width / 2); // -1 to 1
      
      // Wave function: y = waterLevel + slope * x + amplitude * sin(frequency * x + phase)
      // waterLevel should be from bottom (height) to top (0), so we invert the progress
      const waterLevel = height - (baseLevel.value * height);
      const waveY = waterLevel + 
                   slope.value * 0.8 * normalizedX * height / 2 +
                   amplitude.value * 0.7 * Math.sin(idleFrequency * Math.PI * normalizedX + phase.value + 0.3);
      
      const clampedY = Math.max(0, Math.min(height, waveY));
      
      if (i === 0) {
        path += ` M ${x} ${clampedY}`;
      } else {
        path += ` L ${x} ${clampedY}`;
      }
    }
    
    // Close the path
    path += ` L ${width} ${height} L 0 ${height} Z`;
    
    return path;
  });
  
  // Animated props for SVG paths
  const frontWaveAnimatedProps = useAnimatedProps(() => ({
    d: frontWavePath.value,
  }));
  
  const backWaveAnimatedProps = useAnimatedProps(() => ({
    d: backWavePath.value,
  }));
  
  // Theme colors
  const getThemeColors = () => {
    if (theme === 'dark') {
      return {
        background: '#1E293B',
        waterGradient: ['#38BDF8', '#0284C7'],
        ring: '#475569',
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
      };
    }
    return {
      background: '#FFFFFF',
      waterGradient: ['#0EA5E9', '#0284C7'],
      ring: '#E2E8F0',
      text: '#1E293B',
      textSecondary: '#64748B',
    };
  };
  
  const colors = getThemeColors();
  
  // Accessibility label
  const accessibilityLabel = `Water level ${valueMl} milliliters, ${Math.round(progress * 100)} percent of goal ${goalMl} milliliters`;
  
  return (
    <View style={[styles.container, { width: size, height: size }]} accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <ClipPath id="waterClip">
            <Circle cx={center} cy={center} r={radius} />
          </ClipPath>
        </Defs>
        
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.ring}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Back wave layer (darker, more transparent) */}
        <AnimatedPath
          animatedProps={backWaveAnimatedProps}
          fill={colors.waterGradient[1]}
          opacity={0.6}
          clipPath="url(#waterClip)"
        />
        
        {/* Front wave layer */}
        <AnimatedPath
          animatedProps={frontWaveAnimatedProps}
          fill={colors.waterGradient[0]}
          clipPath="url(#waterClip)"
        />
      </Svg>
      
      {/* Text overlay */}
      <View style={styles.textContainer}>
        <Text style={[styles.valueText, { color: colors.text }]}>
          {Math.round(valueMl)}
        </Text>
        <Text style={[styles.unitText, { color: colors.text }]}>
          ml
        </Text>
        <Text style={[styles.goalText, { color: colors.textSecondary }]}>
          of {Math.round(goalMl)} ml
        </Text>
        <Text style={[styles.percentText, { color: colors.textSecondary }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  valueText: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: -4,
  },
  goalText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  percentText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
