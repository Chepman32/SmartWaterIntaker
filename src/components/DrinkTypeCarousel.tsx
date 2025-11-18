import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { DRINK_TYPES } from '../constants/drinkTypes';
import { DrinkType } from '../types/models';

type DrinkTypeCarouselProps = {
  textColor: string;
  subtitleColor?: string;
  onSelect: (type: DrinkType) => void;
  selectedDrinkTypeId?: string | null;
  title?: string;
};

export default function DrinkTypeCarousel({
  textColor,
  subtitleColor = '#94A3B8',
  onSelect,
  selectedDrinkTypeId,
  title = 'Drink Types',
}: DrinkTypeCarouselProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DRINK_TYPES.map((type) => {
          const isSelected = type.id === selectedDrinkTypeId;
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.card,
                {
                  backgroundColor: type.color + '20',
                  borderColor: isSelected ? type.color : 'transparent',
                },
              ]}
              onPress={() => onSelect(type)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconContainer, { backgroundColor: type.color }]}>
                {type.image ? (
                  <Image source={type.image} style={styles.iconImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.iconText}>{type.icon}</Text>
                )}
              </View>
              <Text style={[styles.name, { color: textColor }]}>{type.name}</Text>
              {type.description && (
                <Text style={[styles.description, { color: subtitleColor }]}>
                  {type.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
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
  card: {
    width: 160,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  iconImage: {
    width: 36,
    height: 36,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
});
