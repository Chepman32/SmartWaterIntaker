# WaterRing Component

An animated circular hydration indicator with liquid fill, wave animations, and splash effects built with React Native Reanimated 3 and react-native-svg.

## Features

- 🌊 **Liquid Fill**: Realistic water-like fill with wave animations
- 💫 **Continuous Motion**: Gentle wobble animation when idle
- 💥 **Splash Effects**: Dynamic splash animations on value increases
- 🎨 **Theme Support**: Light and dark theme variants
- ♿ **Accessibility**: Respects system reduce motion settings
- ⚡ **Performance**: 60 FPS animations using Reanimated worklets
- 🎛️ **Customizable**: Extensive animation tuning options

## Installation

The component requires these dependencies (already included in the project):
- `react-native-reanimated` (v3+)
- `react-native-svg`
- `react-native-worklets-core`

## Basic Usage

```tsx
import WaterRing from '../components/WaterRing';

function MyScreen() {
  const [progress, setProgress] = useState(0.3);
  const [valueMl, setValueMl] = useState(600);
  const goalMl = 2000;

  return (
    <WaterRing
      progress={progress}
      valueMl={valueMl}
      goalMl={goalMl}
      size={280}
      theme="light"
    />
  );
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `progress` | `number` | Progress value between 0 and 1 |
| `valueMl` | `number` | Current value in milliliters |
| `goalMl` | `number` | Goal value in milliliters |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `240` | Component size in pixels |
| `strokeWidth` | `number` | `14` | Ring thickness in pixels |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `enableTilt` | `boolean` | `false` | Enable device rotation slosh |
| `reduceMotion` | `boolean` | `false` | Honor OS reduce motion setting |

### Animation Tuning Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `idleAmplitude` | `number` | `6` | Idle wave amplitude (px @ size=240) |
| `idleFrequency` | `number` | `1.8` | Wave frequency cycles across width |
| `idlePeriodMs` | `number` | `4000` | Full wave cycle duration (ms) |
| `splashAmplitudeMax` | `number` | `18` | Maximum splash amplitude (px) |
| `splashDurationMs` | `number` | `900` | Splash animation duration (ms) |
| `levelRiseDurationMs` | `number` | `450` | Level change duration (ms) |

### Event Props

| Prop | Type | Description |
|------|------|-------------|
| `onAnimationEnd` | `() => void` | Called when level change animation completes |

## Animation Behavior

### Idle State
- Continuous gentle wobble with configurable amplitude and frequency
- Optional "breathing" effect that varies amplitude over time
- Smooth, looping animation using Reanimated's `withRepeat`

### Value Increase (Splash)
- **Level Rise**: Smooth animation to new water level
- **Wave Burst**: Transient amplitude increase with exponential decay
- **Slosh Tilt**: Temporary surface tilt for realistic liquid behavior
- **Debouncing**: Multiple rapid increases merge into single stronger splash

### Value Decrease
- Smooth level decrease without splash effects
- Amplitude gradually returns to idle state

### Reduced Motion
- Automatically detects system reduce motion setting
- Halves animation amplitudes and speeds when enabled
- Disables breathing effects and slosh tilt

## Performance Features

- **Worklet-based**: All animations run on UI thread
- **Efficient Path Generation**: ~80-100 points per wave, optimized for 60 FPS
- **Memory Efficient**: No allocations in animation worklets
- **Scalable**: Automatically scales animations based on component size

## Accessibility

- **Screen Reader**: Provides descriptive label with current value and goal
- **Reduce Motion**: Respects system accessibility settings
- **High Contrast**: Supports both light and dark themes

## Examples

### Basic Hydration Tracker

```tsx
<WaterRing
  progress={0.6}
  valueMl={1200}
  goalMl={2000}
  size={300}
  theme="light"
/>
```

### Custom Animation Settings

```tsx
<WaterRing
  progress={0.4}
  valueMl={800}
  goalMl={2000}
  idleAmplitude={8}
  idleFrequency={2.2}
  splashAmplitudeMax={24}
  splashDurationMs={1200}
  levelRiseDurationMs={600}
/>
```

### Dark Theme with Tilt

```tsx
<WaterRing
  progress={0.7}
  valueMl={1400}
  goalMl={2000}
  theme="dark"
  enableTilt={true}
  reduceMotion={false}
/>
```

### Event Handling

```tsx
<WaterRing
  progress={progress}
  valueMl={valueMl}
  goalMl={goalMl}
  onAnimationEnd={() => {
    console.log('Water level animation completed');
    // Trigger next action or update UI
  }}
/>
```

## Integration with Existing App

The component is designed to be a drop-in replacement for the existing `ProgressRing`:

```tsx
// Before
<ProgressRing
  progress={progress}
  size={280}
  strokeWidth={12}
  color={theme.primary}
  backgroundColor={theme.progressTrack}
  textColor={theme.text}
  current={todayTotalMl}
  goal={dailyGoalMl}
  unit="ml"
/>

// After
<WaterRing
  size={280}
  strokeWidth={12}
  progress={progress}
  valueMl={todayTotalMl}
  goalMl={dailyGoalMl}
  theme={isDark ? 'dark' : 'light'}
/>
```

## Demo Screen

A comprehensive demo screen is available at `src/screens/WaterRingDemoScreen.tsx` that showcases:
- All animation parameters with live controls
- Quick test buttons for different progress values
- Random splash generation
- Theme switching
- Performance monitoring

Access it via the "Demo" tab in the main navigation.

## Troubleshooting

### Common Issues

1. **Animations not working**: Ensure Reanimated 3 is properly configured
2. **Performance issues**: Check that `reduceMotion` is not enabled
3. **Visual artifacts**: Verify SVG clipping is working correctly

### Debug Mode

Enable console logging to see animation state changes:
```tsx
<WaterRing
  {...props}
  onAnimationEnd={() => console.log('Animation completed')}
/>
```

## Future Enhancements

- Device tilt integration for enhanced slosh effects
- Custom water textures and gradients
- Bubble and foam effects
- Sound effects for splash animations
- Skia-based advanced rendering
