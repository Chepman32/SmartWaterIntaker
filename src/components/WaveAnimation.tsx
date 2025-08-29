import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, ClipPath, Circle } from 'react-native-svg';

interface WaveAnimationProps {
  progress: number; // 0-1
  size: number;
  color: string;
}

export default function WaveAnimation({ progress, size, color }: WaveAnimationProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const radius = size / 2;
  const waveHeight = size * (1 - progress);
  
  // Create wave path
  const createWavePath = (offset: number) => {
    const amplitude = 8;
    const frequency = 0.02;
    const points = [];
    
    for (let x = 0; x <= size; x += 2) {
      const y = waveHeight + amplitude * Math.sin(frequency * x + offset);
      points.push(`${x},${y}`);
    }
    
    return `M0,${waveHeight} L${points.join(' L')} L${size},${size} L0,${size} Z`;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <ClipPath id="circleClip">
            <Circle cx={radius} cy={radius} r={radius - 10} />
          </ClipPath>
        </Defs>
        <Animated.View>
          {animatedValue && (
            <Path
              d={createWavePath(0)}
              fill={color}
              opacity={0.8}
              clipPath="url(#circleClip)"
            />
          )}
        </Animated.View>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  svg: {
    position: 'absolute',
  },
});