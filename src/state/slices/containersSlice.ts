import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Container } from '../../types/models';

type ContainersState = {
  items: Container[];
};

const initialState: ContainersState = {
  items: [
    {
      id: 'cup-170',
      name: 'Cup',
      sizeMl: 170,
      color: '#EC4899',
      icon: '☕',
      favorite: true,
    },
    {
      id: 'glass-250',
      name: 'Glass',
      sizeMl: 250,
      color: '#3B82F6',
      icon: '🥛',
      favorite: true,
    },
    {
      id: 'mug-300',
      name: 'Coffee Mug',
      sizeMl: 300,
      color: '#8B5CF6',
      icon: '☕',
      favorite: false,
    },
    {
      id: 'bottle-500',
      name: 'Water Bottle',
      sizeMl: 500,
      color: '#10B981',
      icon: '🍼',
      favorite: true,
    },
    {
      id: 'tumbler-700',
      name: 'Tumbler',
      sizeMl: 700,
      color: '#F59E0B',
      icon: '🥤',
      favorite: true,
    },
    {
      id: 'pitcher-1000',
      name: 'Pitcher',
      sizeMl: 1000,
      color: '#06B6D4',
      icon: '🧃',
      favorite: true,
    },
  ],
};

const containersSlice = createSlice({
  name: 'containers',
  initialState,
  reducers: {
    addContainer(state, action: PayloadAction<Container>) {
      state.items.push(action.payload);
    },
    updateContainer(state, action: PayloadAction<Container>) {
      const index = state.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteContainer(state, action: PayloadAction<string>) {
      state.items = state.items.filter(c => c.id !== action.payload);
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const container = state.items.find(c => c.id === action.payload);
      if (container) {
        container.favorite = !container.favorite;
      }
    },
  },
});

export const { addContainer, updateContainer, deleteContainer, toggleFavorite } = containersSlice.actions;
export default containersSlice.reducer;