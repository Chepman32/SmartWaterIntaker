import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  data: (string | number)[];
  selectedIndex: number;
  onValueChange: (index: number, value: string | number) => void;
  width?: number;
  textColor?: string;
  selectedTextColor?: string;
  fontSize?: number;
  selectedFontSize?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
  data,
  selectedIndex,
  onValueChange,
  width = 80,
  textColor = '#94A3B8',
  selectedTextColor = '#1E293B',
  fontSize = 24,
  selectedFontSize = 32,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to initial position on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Update scroll position when selectedIndex changes externally
  useEffect(() => {
    if (!isUserScrolling.current && selectedIndex !== currentIndex) {
      setCurrentIndex(selectedIndex);
      scrollViewRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    },
    [data.length, currentIndex]
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

      isUserScrolling.current = false;
      setCurrentIndex(clampedIndex);

      if (clampedIndex !== selectedIndex) {
        onValueChange(clampedIndex, data[clampedIndex]);
      }
    },
    [data, selectedIndex, onValueChange]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  // Render item with visual feedback
  const renderItem = (item: string | number, index: number) => {
    const isSelected = index === currentIndex;
    const distance = Math.abs(index - currentIndex);

    // Calculate opacity and scale based on distance
    let opacity = 1;
    let scale = 1;
    if (distance === 1) {
      opacity = 0.6;
      scale = 0.9;
    } else if (distance === 2) {
      opacity = 0.3;
      scale = 0.85;
    } else if (distance > 2) {
      opacity = 0.15;
      scale = 0.8;
    }

    return (
      <View key={index} style={styles.itemContainer}>
        <Text
          style={[
            styles.itemText,
            {
              color: isSelected ? selectedTextColor : textColor,
              fontSize: isSelected ? selectedFontSize : fontSize,
              fontWeight: isSelected ? '600' : '400',
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          {item}
        </Text>
      </View>
    );
  };

  // Padding to center items
  const paddingVertical = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT;

  return (
    <View style={[styles.container, { width }]}>
      {/* Selection highlight bar */}
      <View style={styles.selectionBar} pointerEvents="none" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === 'ios' ? 'normal' : 'fast'}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical }}
        nestedScrollEnabled={true}
        bounces={true}
      >
        {data.map(renderItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    overflow: 'hidden',
  },
  selectionBar: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderRadius: 10,
    zIndex: 0,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'center',
  },
});

export default WheelPicker;
