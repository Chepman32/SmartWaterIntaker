import { DrinkType } from '../types/models';

export const DRINK_TYPES: DrinkType[] = [
  {
    id: 'water',
    name: 'Water',
    icon: '💧',
    image: require('../../assets/images/water.png'),
    color: '#3B82F6',
    description: 'Pure hydration',
  },
  {
    id: 'tea',
    name: 'Tea',
    icon: '🍵',
    image: require('../../assets/images/tea.png'),
    color: '#22C55E',
    description: 'Relaxing infusion',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    icon: '☕',
    image: require('../../assets/images/coffee.png'),
    color: '#F97316',
    description: 'Energy boost',
  },
  {
    id: 'juice',
    name: 'Juice',
    icon: '🧃',
    image: require('../../assets/images/juice.png'),
    color: '#EAB308',
    description: 'Fruit powered',
  },
  {
    id: 'soda',
    name: 'Soda',
    icon: '🥤',
    image: require('../../assets/images/soda.png'),
    color: '#EC4899',
    description: 'Treat yourself',
  },
  {
    id: 'smoothie',
    name: 'Smoothie',
    icon: '🥛',
    image: require('../../assets/images/smoothie.png'),
    color: '#A855F7',
    description: 'Fresh blend',
  },
];
