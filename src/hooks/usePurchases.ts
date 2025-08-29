import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { RootState } from '../state/store';
import {
  setPurchaseLoading,
  setPurchaseError,
  completePurchase,
  restorePurchases as restorePurchasesAction,
  clearPurchaseError,
  selectIsProUnlocked,
  selectPurchaseLoading,
  selectPurchaseError,
} from '../state/slices/purchasesSlice';
import purchaseService, { ProductId, PurchaseProduct } from '../services/PurchaseService';

export const usePurchases = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const isProUnlocked = useSelector(selectIsProUnlocked);
  const isLoading = useSelector(selectPurchaseLoading);
  const error = useSelector(selectPurchaseError);
  const purchases = useSelector((state: RootState) => state.purchases);
  
  // Initialize purchase service
  useEffect(() => {
    const initializePurchases = async () => {
      try {
        await purchaseService.initialize();
      } catch (error) {
        console.error('Failed to initialize purchase service:', error);
        dispatch(setPurchaseError('Failed to initialize purchase system'));
      }
    };
    
    initializePurchases();
    
    // Cleanup on unmount
    return () => {
      purchaseService.cleanup();
    };
  }, [dispatch]);
  
  // Get available products
  const getAvailableProducts = useCallback((): PurchaseProduct[] => {
    return purchaseService.getAvailableProducts();
  }, []);
  
  // Get specific product
  const getProduct = useCallback((productId: ProductId): PurchaseProduct | undefined => {
    return purchaseService.getProduct(productId);
  }, []);
  
  // Check if product is purchased
  const hasPurchased = useCallback((productId: ProductId): boolean => {
    return purchases.purchasedIds.includes(productId);
  }, [purchases.purchasedIds]);
  
  // Purchase a product
  const purchaseProduct = useCallback(async (productId: ProductId): Promise<boolean> => {
    dispatch(setPurchaseLoading(true));
    dispatch(clearPurchaseError());
    
    try {
      const transaction = await purchaseService.purchaseProduct(productId);
      
      // Dispatch success action
      dispatch(completePurchase({
        productId,
        receipt: transaction.transactionReceipt,
      }));
      
      // Show success message for tips
      if (productId.startsWith('tip_')) {
        Alert.alert(
          'Thank You!',
          'Your support means a lot to us. Thank you for the tip!',
          [{ text: 'You\'re Welcome!', style: 'default' }]
        );
      } else if (productId === 'hydration_pro_unlock') {
        Alert.alert(
          'Welcome to Pro!',
          'You now have access to all premium features. Enjoy!',
          [{ text: 'Awesome!', style: 'default' }]
        );
      }
      
      return true;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error.userCancelled) {
        // User cancelled, don't show error
        dispatch(setPurchaseLoading(false));
        return false;
      } else if (error.code === 'E_ALREADY_OWNED') {
        errorMessage = 'You already own this item.';
      } else if (error.code === 'E_USER_CANCELLED') {
        // User cancelled, don't show error
        dispatch(setPurchaseLoading(false));
        return false;
      }
      
      dispatch(setPurchaseError(errorMessage));
      
      Alert.alert(
        'Purchase Failed',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
      
      return false;
    }
  }, [dispatch]);
  
  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    dispatch(setPurchaseLoading(true));
    dispatch(clearPurchaseError());
    
    try {
      const restoredTransactions = await purchaseService.restorePurchases();
      
      const purchasedIds = restoredTransactions.map(t => t.productId as ProductId);
      const latestReceipt = restoredTransactions[restoredTransactions.length - 1]?.transactionReceipt;
      
      dispatch(restorePurchasesAction({
        purchasedIds,
        receipt: latestReceipt,
      }));
      
      if (purchasedIds.length > 0) {
        Alert.alert(
          'Purchases Restored',
          `Successfully restored ${purchasedIds.length} purchase(s).`,
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      
      const errorMessage = 'Failed to restore purchases. Please try again.';
      dispatch(setPurchaseError(errorMessage));
      
      Alert.alert(
        'Restore Failed',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
      
      return false;
    }
  }, [dispatch]);
  
  // Clear error
  const clearError = useCallback(() => {
    dispatch(clearPurchaseError());
  }, [dispatch]);
  
  // Check if specific features are available
  const canUseProFeatures = useCallback((): boolean => {
    return isProUnlocked;
  }, [isProUnlocked]);
  
  const canUseCustomThemes = useCallback((): boolean => {
    return isProUnlocked;
  }, [isProUnlocked]);
  
  const canUseAdvancedStats = useCallback((): boolean => {
    return isProUnlocked;
  }, [isProUnlocked]);
  
  const canExportData = useCallback((): boolean => {
    return isProUnlocked;
  }, [isProUnlocked]);
  
  return {
    // State
    isProUnlocked,
    isLoading,
    error,
    purchases,
    
    // Actions
    purchaseProduct,
    restorePurchases,
    clearError,
    
    // Queries
    getAvailableProducts,
    getProduct,
    hasPurchased,
    
    // Feature checks
    canUseProFeatures,
    canUseCustomThemes,
    canUseAdvancedStats,
    canExportData,
  };
};

export default usePurchases;