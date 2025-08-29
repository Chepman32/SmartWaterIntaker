import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PurchaseState } from '../../types/models';
import { ProductId } from '../../services/PurchaseService';

interface ExtendedPurchaseState extends PurchaseState {
  isLoading: boolean;
  error: string | null;
  lastRestoreDate: number | null;
}

const initialState: ExtendedPurchaseState = {
  proUnlocked: false,
  purchasedIds: [],
  lastReceipt: undefined,
  isLoading: false,
  error: null,
  lastRestoreDate: null,
};

const purchasesSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    // Loading states
    setPurchaseLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    
    setPurchaseError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    // Legacy actions (kept for compatibility)
    setProUnlocked(state, action: PayloadAction<boolean>) {
      state.proUnlocked = action.payload;
    },
    
    addPurchase(state, action: PayloadAction<string>) {
      if (!state.purchasedIds.includes(action.payload)) {
        state.purchasedIds.push(action.payload);
      }
    },
    
    // Enhanced purchase completion
    completePurchase(state, action: PayloadAction<{ productId: ProductId; receipt?: string }>) {
      const { productId, receipt } = action.payload;
      
      // Add to purchased IDs if not already present
      if (!state.purchasedIds.includes(productId)) {
        state.purchasedIds.push(productId);
      }
      
      // Handle Pro unlock
      if (productId === 'hydration_pro_unlock') {
        state.proUnlocked = true;
      }
      
      // Update receipt
      if (receipt) {
        state.lastReceipt = receipt;
      }
      
      state.isLoading = false;
      state.error = null;
    },
    
    // Restore purchases
    restorePurchases(state, action: PayloadAction<{ purchasedIds: ProductId[]; receipt?: string }>) {
      const { purchasedIds, receipt } = action.payload;
      
      state.purchasedIds = purchasedIds;
      state.proUnlocked = purchasedIds.includes('hydration_pro_unlock');
      
      if (receipt) {
        state.lastReceipt = receipt;
      }
      
      state.lastRestoreDate = Date.now();
      state.isLoading = false;
      state.error = null;
    },
    
    resetPurchases(state) {
      state.purchasedIds = [];
      state.proUnlocked = false;
      state.lastReceipt = undefined;
      state.isLoading = false;
      state.error = null;
      state.lastRestoreDate = null;
    },
    
    // Clear error
    clearPurchaseError(state) {
      state.error = null;
    },
  },
});

export const {
  setPurchaseLoading,
  setPurchaseError,
  setProUnlocked,
  addPurchase,
  completePurchase,
  restorePurchases,
  resetPurchases,
  clearPurchaseError,
} = purchasesSlice.actions;

export default purchasesSlice.reducer;

// Selectors
export const selectIsProUnlocked = (state: { purchases: ExtendedPurchaseState }) => state.purchases.proUnlocked;
export const selectPurchasedIds = (state: { purchases: ExtendedPurchaseState }) => state.purchases.purchasedIds;
export const selectPurchaseLoading = (state: { purchases: ExtendedPurchaseState }) => state.purchases.isLoading;
export const selectPurchaseError = (state: { purchases: ExtendedPurchaseState }) => state.purchases.error;
export const selectHasPurchased = (productId: ProductId) => (state: { purchases: ExtendedPurchaseState }) => 
  state.purchases.purchasedIds.includes(productId);