import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Container } from '../../types/models';

type ContainersState = {
  items: Container[];
};

const initialState: ContainersState = {
  items: [
    {
      id: 'glass-250',
      name: 'Glass',
      sizeMl: 250,
      color: '#3B82F6',
      icon: '🥛',
      favorite: true,
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
      id: 'mug-300',
      name: 'Coffee Mug',
      sizeMl: 300,
      color: '#8B5CF6',
      icon: '☕',
      favorite: false,
    },
    {
      id: 'tumbler-400',
      name: 'Tumbler',
      sizeMl: 400,
      color: '#F59E0B',
      icon: '🥤',
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