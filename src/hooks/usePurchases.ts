// Stub hook - all features are free and unlocked
export const usePurchases = () => {
  return {
    // State - always unlocked
    isProUnlocked: true,
    isLoading: false,
    error: null,
    purchases: { proUnlocked: true, purchasedIds: [] },

    // Actions - no-ops
    purchaseProduct: async () => true,
    restorePurchases: async () => true,
    clearError: () => {},

    // Queries
    getAvailableProducts: () => [],
    getProduct: () => undefined,
    hasPurchased: () => true,

    // Feature checks - all unlocked
    canUseProFeatures: () => true,
    canUseCustomThemes: () => true,
    canUseAdvancedStats: () => true,
    canExportData: () => true,
  };
};

export default usePurchases;
