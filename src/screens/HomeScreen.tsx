import React, { useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { useTheme } from '../hooks/useThemeColors';
import WaterRing from '../components/WaterRing';

import ContainerCarousel from '../components/ContainerCarousel';
import DrinkTypeCarousel from '../components/DrinkTypeCarousel';
import { Container, DrinkType } from '../types/models';
import { logIntakeEvent } from '../state/slices/intakeSlice';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const CAROUSEL_HEIGHT = 260;

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { theme, mode } = useTheme();
  const { width } = useWindowDimensions();
  const carouselAnim = useRef(new Animated.Value(0)).current;
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType | null>(
    null,
  );
  const hapticsEnabled = useSelector(
    (state: RootState) => state.settings.settings.haptics,
  );

  const todayTotalMl = useSelector((state: RootState) =>
    state.intake.events
      .filter(event => {
        const today = new Date();
        const eventDate = new Date(event.timestamp);
        return eventDate.toDateString() === today.toDateString();
      })
      .reduce((total, event) => total + event.amountMl, 0),
  );

  const dailyGoalMl = useSelector(
    (state: RootState) => state.intake.dailyGoalMl,
  );
  const progress = Math.min(todayTotalMl / dailyGoalMl, 1);

  const animateTo = (value: number, onComplete?: () => void) => {
    Animated.timing(carouselAnim, {
      toValue: value,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (value === 0) {
        setSelectedDrinkType(null);
      }
      onComplete?.();
    });
  };

  const handleDrinkTypeSelect = (type: DrinkType) => {
    setSelectedDrinkType(type);
    animateTo(1);
  };

  const handleResetDrinkType = () => {
    animateTo(0);
  };

  const handleContainerSelect = (container: Container) => {
    const notePrefix = selectedDrinkType ? `${selectedDrinkType.name} - ` : '';
    dispatch(
      logIntakeEvent({
        amountMl: container.sizeMl,
        source: 'container',
        containerId: container.id,
        drinkTypeId: selectedDrinkType?.id,
        note: `${notePrefix}${container.name} (${container.sizeMl}ml)`,
      }),
    );

    if (hapticsEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  };

  const translateDrink = carouselAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -CAROUSEL_HEIGHT],
  });

  const translateContainers = carouselAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CAROUSEL_HEIGHT, 0],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.progressContainer}>
        <WaterRing
          size={Math.floor(width * 0.99)}
          strokeWidth={12}
          progress={progress}
          valueMl={todayTotalMl}
          goalMl={dailyGoalMl}
          theme={mode === 'dark' ? 'dark' : 'light'}
          idleAmplitude={6}
          idleFrequency={1.8}
          splashAmplitudeMax={18}
          splashDurationMs={900}
          levelRiseDurationMs={900}
        />
      </View>

      <View style={styles.carouselSwitcher}>
        <Animated.View
          style={{
            width,
            position: 'absolute',
            transform: [{ translateY: translateDrink }],
          }}
          pointerEvents={selectedDrinkType ? 'none' : 'auto'}
        >
          <DrinkTypeCarousel
            textColor={theme.text}
            subtitleColor={theme.textSecondary}
            onSelect={handleDrinkTypeSelect}
            selectedDrinkTypeId={selectedDrinkType?.id}
          />
        </Animated.View>

        <Animated.View
          style={{
            width,
            position: 'absolute',
            transform: [{ translateY: translateContainers }],
          }}
          pointerEvents={selectedDrinkType ? 'auto' : 'none'}
        >
          <ContainerCarousel
            textColor={theme.text}
            selectedDrinkType={selectedDrinkType}
            onContainerSelect={handleContainerSelect}
            onChangeDrinkType={handleResetDrinkType}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
    position: 'relative',
  },

  carouselSwitcher: {
    height: CAROUSEL_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 8,
  },
});
