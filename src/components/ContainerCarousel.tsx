import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { RootState } from '../state/store';
import { logIntakeEvent } from '../state/slices/intakeSlice';
import { IntakeEvent } from '../types/models';

interface ContainerCarouselProps {
  textColor: string;
}

export default function ContainerCarousel({ textColor }: ContainerCarouselProps) {
  const dispatch = useDispatch();
  const containers = useSelector((state: RootState) => state.containers.items);
  const favoriteContainers = containers.filter((c: any) => c.favorite);
  const hapticsEnabled = useSelector((state: RootState) => state.settings.settings.haptics);

  const handleContainerPress = (container: any) => {
    dispatch(logIntakeEvent({
      amountMl: container.sizeMl,
      source: 'container',
      containerId: container.id,
      note: `${container.name} (${container.sizeMl}ml)`,
    }));
    if (hapticsEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  };

  if (favoriteContainers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: textColor }]}>
          Add favorite containers to see them here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Favorites</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {favoriteContainers.map((container) => (
          <TouchableOpacity
            key={container.id}
            style={[
              styles.containerItem,
              { backgroundColor: container.color + '20', borderColor: container.color }
            ]}
            onPress={() => handleContainerPress(container)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: container.color }]}>
              <Text style={styles.iconText}>{container.icon}</Text>
            </View>
            <Text style={[styles.containerName, { color: textColor }]} numberOfLines={1}>
              {container.name}
            </Text>
            <Text style={[styles.containerSize, { color: textColor }]}>
              {container.sizeMl}ml
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  containerItem: {
    width: 200,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  containerName: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  containerSize: {
    fontSize: 22,
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
