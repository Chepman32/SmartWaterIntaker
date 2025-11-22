import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Svg, { Path, ClipPath, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  useAnimatedProps,
  Easing,
  useAnimatedSensor,
  SensorType,
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
  performance?: 'performance' | 'balanced' | 'high'; // detail vs fps trade-off
}

export type WaterRingRef = {
  setProgress: (p: number) => void;
  triggerSplash: (deltaFraction?: number) => void; // delta as fraction of goal (0..1)
};

function clamp(n: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, n));
}

const WaterRing = forwardRef<WaterRingRef, WaterRingProps>(function WaterRing({
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
  performance = 'performance',
}, ref) {
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
  const perf = performance ?? 'performance';
  const perfMultiplier = perf === 'high' ? 1.1 : perf === 'balanced' ? 1 : 0.8;
  const breathEnabled = !shouldReduceMotion && perf !== 'performance';
  const crestEnabled = perf !== 'performance';
  const bubblesMultiplier = perf === 'high' ? 1.2 : perf === 'balanced' ? 1 : 0.7;
  const scaledIdleAmplitude = (shouldReduceMotion ? idleAmplitude * 0.5 : idleAmplitude) * scaleFactor * perfMultiplier;
  const scaledSplashAmplitudeMax = (shouldReduceMotion ? splashAmplitudeMax * 0.5 : splashAmplitudeMax) * scaleFactor * perfMultiplier;
  const scaledIdlePeriodMs = shouldReduceMotion ? idlePeriodMs * 2 : idlePeriodMs;
  const scaledLevelRiseDurationMs = shouldReduceMotion ? levelRiseDurationMs * 2 : levelRiseDurationMs;
  const scaledSplashDurationMs = shouldReduceMotion ? splashDurationMs * 2 : splashDurationMs;
  
  // Animation state
  const phase = useSharedValue(0); // wave motion
  const breath = useSharedValue(0); // breathing of idle amplitude
  const baseLevel = useSharedValue(progress); // 0..1
  // Impulse envelope progress: 0 -> 1 over splashDurationMs
  const splashT = useSharedValue(1);
  const A_peak = useSharedValue(0);
  const S_peak = useSharedValue(0);
  const lastDeltaNorm = useSharedValue(0);
  // device tilt (roll) - use a slower interval when tilt is disabled to avoid wasted work
  // Optimized: 33ms (30Hz) is enough for smooth tilt effect, saves CPU
  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: enableTilt ? 33 : 120 });
  // global time for bubbles
  const bubblesTime = useSharedValue(0);

  // Precompute wave sample positions so we aren't doing heavy math/string building every frame
  // Optimized: Reduced sample count (18-32 instead of 26-54) - waves still look smooth
  const sampleCount = Math.min(32, Math.max(18, Math.round((22 + scaleFactor * 4) * perfMultiplier)));
  const waveSamples = React.useMemo(() => {
    const xs: number[] = [];
    const normalized: number[] = [];
    const kFront: number[] = [];
    const kBack: number[] = [];
    const kFrontBase = idleFrequency * Math.PI;
    const kBackBase = idleFrequency * 0.9 * Math.PI;

    for (let i = 0; i <= sampleCount; i++) {
      const x = (i / sampleCount) * size;
      const norm = (x - size / 2) / (size / 2);
      xs.push(x);
      normalized.push(norm);
      kFront.push(kFrontBase * norm);
      kBack.push(kBackBase * norm);
    }

    return { xs, normalized, kFront, kBack };
  }, [size, sampleCount, idleFrequency]);
  
  // Previous progress for detecting changes
  const prevProgress = useRef(progress);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIncrease = useRef(0); // accumulate delta fraction
  
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
    if (!breathEnabled) {
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 2400, easing: Easing.linear }),
      -1
    );
  }, [breathEnabled]);

  // Bubbles time driver (slow loop)
  useEffect(() => {
    const base = perf === 'high' ? 9000 : perf === 'balanced' ? 10000 : 12000;
    const dur = shouldReduceMotion ? base * 1.6 : base;
    bubblesTime.value = withRepeat(
      withTiming(2 * Math.PI, { duration: dur, easing: Easing.linear }),
      -1
    );
  }, [shouldReduceMotion, perf]);

  // Imperative API
  useImperativeHandle(ref, () => ({
    setProgress: (p: number) => {
      const clamped = clamp(p ?? 0, 0, 1);
      const delta = clamped - baseLevel.value;
      if (delta >= 0) {
        baseLevel.value = withTiming(clamped, {
          duration: scaledLevelRiseDurationMs,
          easing: Easing.out(Easing.cubic),
        }, (finished) => {
          if (finished && onAnimationEnd) onAnimationEnd();
        });
      } else {
        baseLevel.value = withTiming(clamped, {
          duration: scaledLevelRiseDurationMs,
          easing: Easing.out(Easing.cubic),
        }, (finished) => {
          if (finished && onAnimationEnd) onAnimationEnd();
        });
      }
    },
    triggerSplash: (deltaFraction?: number) => {
      // Restart envelope with new peak based on delta
      const d = clamp(deltaFraction ?? 0.05, 0, 1);
      const mappedLinear = 6 + ((scaledSplashAmplitudeMax - 6) * Math.min(d, 0.2)) / 0.2;
      const mapped = clamp(mappedLinear, 4, scaledSplashAmplitudeMax);
      // merge with remaining envelope strength
      const remaining = 1 - splashT.value; // 0..1 left
      const combined = clamp(mapped + lastDeltaNorm.value * remaining * scaledSplashAmplitudeMax, 0, scaledSplashAmplitudeMax);
      A_peak.value = combined;
      // slosh peak: up to 0.15 slope
      const sPeak = d >= 0.2 ? 0.15 : d * 0.75;
      S_peak.value = shouldReduceMotion ? 0 : sPeak;
      lastDeltaNorm.value = d;
      splashT.value = 0;
      splashT.value = withTiming(1, { duration: scaledSplashDurationMs, easing: Easing.linear });
    },
  }));
  
  // Handle progress changes
  useEffect(() => {
    const clampedNext = Math.max(0, Math.min(1, progress ?? 0));
    const delta = clampedNext - prevProgress.current;

    // Always animate base level to target
    baseLevel.value = withTiming(clampedNext, {
      duration: scaledLevelRiseDurationMs,
      easing: Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished && onAnimationEnd) {
        onAnimationEnd();
      }
    });

    if (delta > 0) {
      // Debounce/merge rapid increases within 120ms
      pendingIncrease.current += delta;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        const accumulated = pendingIncrease.current;
        pendingIncrease.current = 0;
        // Map to peak amplitude and slosh, restart envelope
        const d = Math.min(accumulated, 0.4); // bound merging to avoid excess
        const peakLinear = 6 + ((scaledSplashAmplitudeMax - 6) * Math.min(d, 0.2)) / 0.2;
        const peak = clamp(peakLinear, 4, scaledSplashAmplitudeMax);
        const sPeak = d >= 0.2 ? 0.15 : d * 0.75;
        A_peak.value = peak;
        S_peak.value = shouldReduceMotion ? 0 : sPeak;
        lastDeltaNorm.value = d;
        splashT.value = 0;
        splashT.value = withTiming(1, { duration: scaledSplashDurationMs, easing: Easing.linear });
      }, 120);
    }

    prevProgress.current = clampedNext;
  }, [progress, scaledLevelRiseDurationMs, scaledSplashDurationMs, scaledSplashAmplitudeMax, shouldReduceMotion]);
  
  // Animated wave paths for front and back layers
  // Optimized: Using array join instead of string concatenation (3-5x faster)
  const frontWavePath = useDerivedValue(() => {
    'worklet';
    const width = size;
    const height = size;
    const perspective = 0.35; // 0..1, reduces amplitude near edges for 3D look
    // Idle amplitude with subtle breathing
    const breathPhase = breathEnabled ? Math.sin(breath.value) : 0;
    const A_idle = scaledIdleAmplitude * (shouldReduceMotion ? 1 : (1 + 0.2 * breathPhase));
    // Splash impulse envelope
    const t = splashT.value * (scaledSplashDurationMs / 1000);
    const tau = (scaledSplashDurationMs / 1000) / 2.2;
    const f_splash = 2.2; // Hz
    const A_impulse = A_peak.value * Math.exp(-t / tau) * Math.cos(2 * Math.PI * f_splash * t);
    const A_total = Math.max(0, A_idle + A_impulse);
    // Slosh tilt impulse + optional device tilt
    const tau_s = 0.8; // seconds
    const f_slosh = 1.4; // Hz
    const slopeImpulse = shouldReduceMotion ? 0 : (S_peak.value * Math.exp(-(t) / tau_s) * Math.sin(2 * Math.PI * f_slosh * t));
    // Device roll to slope
    const roll = rotation.sensor.value ? rotation.sensor.value.roll : 0;
    const tiltSlope = enableTilt && !shouldReduceMotion ? clamp(roll * 0.08, -0.25, 0.25) : 0;
    const slopeTotal = clamp(slopeImpulse + tiltSlope, -0.25, 0.25);
    const waterLevel = height - (baseLevel.value * height);
    const slopeScale = slopeTotal * height / 2;
    const phaseShift = phase.value;

    // Use array and join for better performance (avoids repeated string allocations)
    const pathParts: string[] = new Array(sampleCount + 4);
    pathParts[0] = `M 0 ${height}`;

    for (let i = 0; i <= sampleCount; i++) {
      const normalizedX = waveSamples.normalized[i];
      const ampFactor = 1 - perspective * (normalizedX * normalizedX); // smaller at edges
      const waveY = waterLevel +
                   slopeScale * normalizedX +
                   (A_total * ampFactor) * Math.sin(waveSamples.kFront[i] + phaseShift);

      const clampedY = Math.max(0, Math.min(height, waveY));
      const x = waveSamples.xs[i];
      pathParts[i + 1] = i === 0 ? `M ${x} ${clampedY}` : `L ${x} ${clampedY}`;
    }

    // Close the path
    pathParts[sampleCount + 2] = `L ${width} ${height}`;
    pathParts[sampleCount + 3] = `L 0 ${height} Z`;

    return pathParts.join(' ');
  });
  
  const backWavePath = useDerivedValue(() => {
    'worklet';
    const width = size;
    const height = size;
    const perspective = 0.4;
    const breathPhase = breathEnabled ? Math.sin(breath.value + 0.6) : 0;
    const A_idle = scaledIdleAmplitude * 0.7 * (shouldReduceMotion ? 1 : (1 + 0.2 * breathPhase));
    const t = splashT.value * (scaledSplashDurationMs / 1000);
    const tau = (scaledSplashDurationMs / 1000) / 2.2;
    const f_splash = 2.2;
    const A_impulse = (A_peak.value * 0.6) * Math.exp(-t / tau) * Math.cos(2 * Math.PI * f_splash * t + 0.3);
    const A_total = Math.max(0, A_idle + A_impulse);
    const tau_s = 0.8;
    const f_slosh = 1.4;
    const slopeImpulse = shouldReduceMotion ? 0 : (S_peak.value * 0.7 * Math.exp(-(t) / tau_s) * Math.sin(2 * Math.PI * f_slosh * t + 0.2));
    const roll = rotation.sensor.value ? rotation.sensor.value.roll : 0;
    const tiltSlope = enableTilt && !shouldReduceMotion ? clamp(roll * 0.08, -0.25, 0.25) : 0;
    const slopeTotal = clamp(slopeImpulse + tiltSlope, -0.25, 0.25);
    const waterLevel = height - (baseLevel.value * height);
    const slopeScale = slopeTotal * 0.8 * height / 2;
    const phaseShift = phase.value + 0.3;

    // Use array and join for better performance
    const pathParts: string[] = new Array(sampleCount + 4);
    pathParts[0] = `M 0 ${height}`;

    for (let i = 0; i <= sampleCount; i++) {
      const normalizedX = waveSamples.normalized[i];
      const ampFactor = 1 - perspective * (normalizedX * normalizedX);
      const waveY = waterLevel +
                   slopeScale * normalizedX +
                   (A_total * ampFactor) * Math.sin(waveSamples.kBack[i] + phaseShift);

      const clampedY = Math.max(0, Math.min(height, waveY));
      const x = waveSamples.xs[i];
      pathParts[i + 1] = i === 0 ? `M ${x} ${clampedY}` : `L ${x} ${clampedY}`;
    }

    // Close the path
    pathParts[sampleCount + 2] = `L ${width} ${height}`;
    pathParts[sampleCount + 3] = `L 0 ${height} Z`;

    return pathParts.join(' ');
  });

  // Crest-only path for a subtle specular highlight (top of the front wave)
  const crestPath = useDerivedValue(() => {
    'worklet';
    if (!crestEnabled) return 'M0 0';
    const height = size;
    const perspective = 0.35;

    // Same amplitude and slope as front
    const breathPhase = breathEnabled ? Math.sin(breath.value) : 0;
    const A_idle = scaledIdleAmplitude * (shouldReduceMotion ? 1 : (1 + 0.2 * breathPhase));
    const t = splashT.value * (scaledSplashDurationMs / 1000);
    const tau = (scaledSplashDurationMs / 1000) / 2.2;
    const f_splash = 2.2;
    const A_impulse = A_peak.value * Math.exp(-t / tau) * Math.cos(2 * Math.PI * f_splash * t);
    const A_total = Math.max(0, A_idle + A_impulse);
    const tau_s = 0.8;
    const f_slosh = 1.4;
    const slopeImpulse = shouldReduceMotion ? 0 : (S_peak.value * Math.exp(-(t) / tau_s) * Math.sin(2 * Math.PI * f_slosh * t));
    const roll = rotation.sensor.value ? rotation.sensor.value.roll : 0;
    const tiltSlope = enableTilt && !shouldReduceMotion ? clamp(roll * 0.08, -0.25, 0.25) : 0;
    const slopeTotal = clamp(slopeImpulse + tiltSlope, -0.25, 0.25);
    const waterLevel = height - (baseLevel.value * height);
    const slopeScale = slopeTotal * height / 2;
    const phaseShift = phase.value;

    // Use array and join for better performance
    const pathParts: string[] = new Array(sampleCount + 1);
    for (let i = 0; i <= sampleCount; i++) {
      const normalizedX = waveSamples.normalized[i];
      const ampFactor = 1 - perspective * (normalizedX * normalizedX);
      const waveY = waterLevel + slopeScale * normalizedX + (A_total * ampFactor) * Math.sin(waveSamples.kFront[i] + phaseShift);
      const y = Math.max(0, Math.min(height, waveY - 1)); // slight upward offset for highlight
      const x = waveSamples.xs[i];
      pathParts[i] = i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }
    return pathParts.join(' ');
  });
  
  // Animated props for SVG paths
  const frontWaveAnimatedProps = useAnimatedProps(() => ({
    d: frontWavePath.value,
  }));
  
  const backWaveAnimatedProps = useAnimatedProps(() => ({
    d: backWavePath.value,
  }));
  const crestAnimatedProps = useAnimatedProps(() => ({
    d: crestPath.value,
  }));

  // Animated bubble props factory (each bubble is a small circle)
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const makeBubbleProps = (seed: { id: number; x: number; y: number; r: number; speed: number; drift: number; phase: number; }) =>
    useAnimatedProps(() => {
      'worklet';
      const width = size;
      const height = size;
      const waterLevel = height - (baseLevel.value * height);
      const bottom = height - strokeWidth * 0.9;
      const travel = Math.max(10, bottom - waterLevel - 6);
      // progress 0..1 per bubble based on global time + unique phase
      const t = (0.5 + (bubblesTime.value * seed.speed + seed.phase) / (2 * Math.PI)) % 1;
      const y = bottom - t * travel;
      // only show when under the surface
      const isVisible = y > waterLevel + 3;
      const drift = Math.sin(phase.value * 0.8 + seed.phase) * (4 * seed.drift * (width / 240)) * bubbleDriftScale;
      const cx = (0.18 + 0.64 * seed.x) * width + drift;
      const cy = y;
      const rr = Math.max(0.8, seed.r * (width / 240) * (0.7 + 0.6 * (1 - t)));
      return {
        cx,
        cy,
        r: rr,
        opacity: isVisible ? 0.12 + 0.25 * (t * t) : 0,
      } as any;
    });
  
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
  const bubbleDriftScale = perf === 'high' ? 1 : perf === 'balanced' ? 0.85 : 0.65;

  // Bubbles setup (lightweight, deterministic seeds)
  // Optimized: Fewer bubbles in performance mode (3-8 instead of 4-12)
  const bubbleCount = Math.max(3, Math.min(8, Math.round(6 * scaleFactor * bubblesMultiplier)));
  const bubbleSeeds = React.useMemo(() => {
    const rng = (seed: number) => () => {
      // LCG for deterministic pseudo-random
      seed = (1664525 * seed + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const r = rng(123456);
    return new Array(bubbleCount).fill(0).map((_, i) => ({
      id: i,
      x: r(), // 0..1
      y: r(), // 0..1
      r: 1.4 + r() * 2.6, // px @240
      speed: 0.18 + r() * 0.55,
      drift: 0.6 + r() * 1.2,
      phase: r() * Math.PI * 2,
    }));
  }, [bubbleCount]);
  
  // Accessibility label
  const accessibilityLabel = `Water level ${valueMl} milliliters, ${Math.round(progress * 100)} percent of goal ${goalMl} milliliters`;
  
  return (
    <View style={[styles.container, { width: size, height: size }]} accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <ClipPath id="waterClip">
            <Circle cx={center} cy={center} r={radius} />
          </ClipPath>
          <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.waterGradient[0]} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.waterGradient[1]} stopOpacity={1} />
          </LinearGradient>
          {/* Horizontal edge darkening for perspective */}
          <LinearGradient id="edgeVignette" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#000000" stopOpacity={0.08} />
            <Stop offset="30%" stopColor="#000000" stopOpacity={0.0} />
            <Stop offset="70%" stopColor="#000000" stopOpacity={0.0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.08} />
          </LinearGradient>
          {/* Glass rim gradient */}
          <LinearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.15} />
            <Stop offset="60%" stopColor="#1e4b6b" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#0b3350" stopOpacity={0.28} />
          </LinearGradient>
          {/* Top-left inner highlight (gloss) */}
          <LinearGradient id="glassHighlightGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Drop shadow (pseudo) */}
        <Circle
          cx={center}
          cy={center + 3 * scaleFactor}
          r={radius}
          stroke="#000000"
          strokeOpacity={0.08}
          strokeWidth={strokeWidth * 1.15}
          fill="none"
        />

        {/* Back wave layer (darker, more transparent) */}
        <AnimatedPath
          animatedProps={backWaveAnimatedProps}
          fill="url(#waterGrad)"
          opacity={0.6}
          clipPath="url(#waterClip)"
        />
        
        {/* Front wave layer */}
        <AnimatedPath
          animatedProps={frontWaveAnimatedProps}
          fill="url(#waterGrad)"
          clipPath="url(#waterClip)"
        />

        {/* Perspective edge darkening overlay within water */}
        <AnimatedPath
          animatedProps={frontWaveAnimatedProps}
          fill="url(#edgeVignette)"
          opacity={0.55}
          clipPath="url(#waterClip)"
        />

        {/* Subtle specular highlight on the front crest */}
        {crestEnabled && (
          <AnimatedPath
            animatedProps={crestAnimatedProps}
            stroke="#FFFFFF"
            strokeOpacity={0.25}
            strokeWidth={Math.max(1, 1.25 * scaleFactor)}
            fill="none"
            clipPath="url(#waterClip)"
          />
        )}

        {/* Rising bubbles */}
        {bubbleSeeds.map((b) => {
          const props = makeBubbleProps(b);
          return (
            <AnimatedCircle
              key={`b-${b.id}`}
              animatedProps={props}
              fill="#FFFFFF"
              clipPath="url(#waterClip)"
            />
          );
        })}

        {/* Ring on top to remain visible above water */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#rimGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Inner glass highlight */}
        <Circle
          cx={center - radius * 0.25}
          cy={center - radius * 0.3}
          r={radius * 0.9}
          fill="url(#glassHighlightGrad)"
          opacity={0.18}
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
});

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

export default WaterRing;
