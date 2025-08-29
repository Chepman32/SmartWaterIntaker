import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor: string;
  textColor: string;
  current: number;
  goal: number;
  unit: string;
}

export default function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  backgroundColor,
  textColor,
  current,
  goal,
  unit,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.currentText, { color: textColor }]}>
          {Math.round(current)}
        </Text>
        <Text style={[styles.unitText, { color: textColor }]}>{unit}</Text>
        <Text style={[styles.goalText, { color: textColor }]}>
          of {Math.round(goal)} {unit}
        </Text>
        <Text style={[styles.percentText, { color: textColor }]}>
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
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {
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