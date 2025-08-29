// Types for purchase products and transactions
export interface PurchaseProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
  type: 'consumable' | 'non_consumable' | 'subscription';
}

export interface PurchaseTransaction {
  transactionId: string;
  productId: string;
  transactionDate: string;
  transactionReceipt: string;
  purchaseToken?: string; // Android
}

export interface PurchaseError {
  code: string;
  message: string;
  userCancelled?: boolean;
}

// Product IDs - these should match your App Store Connect / Google Play Console setup
export const PRODUCT_IDS = {
  PRO_UNLOCK: 'hydration_pro_unlock',
  TIP_SMALL: 'tip_small',
  TIP_MEDIUM: 'tip_medium',
  TIP_LARGE: 'tip_large',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

class PurchaseService {
  private isInitialized = false;
  private availableProducts: PurchaseProduct[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  /**
   * Initialize the purchase service
   * This should be called early in the app lifecycle
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // TODO: Initialize react-native-iap
      // await RNIap.initConnection();
      
      // Set up purchase listeners
      this.setupPurchaseListeners();
      
      // Load available products
      await this.loadProducts();
      
      this.isInitialized = true;
      console.log('PurchaseService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PurchaseService:', error);
      throw error;
    }
  }

  /**
   * Clean up the purchase service
   */
  async cleanup(): Promise<void> {
    try {
      // Remove listeners
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      // TODO: End connection
      // await RNIap.endConnection();
      
      this.isInitialized = false;
      console.log('PurchaseService cleaned up');
    } catch (error) {
      console.error('Error cleaning up PurchaseService:', error);
    }
  }

  /**
   * Load available products from the store
   */
  private async loadProducts(): Promise<void> {
    try {
      // TODO: Load products using react-native-iap
      // const productIds = Object.values(PRODUCT_IDS);
      // const products = await RNIap.getProducts(productIds);
      
      // Mock products for development
      this.availableProducts = [
        {
          productId: PRODUCT_IDS.PRO_UNLOCK,
          title: 'Hydration Pro',
          description: 'Unlock all premium features including advanced analytics, custom themes, and more.',
          price: '4.99',
          localizedPrice: '$4.99',
          currency: 'USD',
          type: 'non_consumable',
        },
        {
          productId: PRODUCT_IDS.TIP_SMALL,
          title: 'Small Tip',
          description: 'Support the developer with a small tip.',
          price: '0.99',
          localizedPrice: '$0.99',
          currency: 'USD',
          type: 'consumable',
        },
        {
          productId: PRODUCT_IDS.TIP_MEDIUM,
          title: 'Medium Tip',
          description: 'Support the developer with a medium tip.',
          price: '2.99',
          localizedPrice: '$2.99',
          currency: 'USD',
          type: 'consumable',
        },
        {
          productId: PRODUCT_IDS.TIP_LARGE,
          title: 'Large Tip',
          description: 'Support the developer with a large tip.',
          price: '4.99',
          localizedPrice: '$4.99',
          currency: 'USD',
          type: 'consumable',
        },
      ];
      
      console.log(`Loaded ${this.availableProducts.length} products`);
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  }

  /**
   * Set up listeners for purchase updates and errors
   */
  private setupPurchaseListeners(): void {
    // TODO: Set up react-native-iap listeners
    /*
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      (purchase: Purchase) => {
        this.handlePurchaseUpdate(purchase);
      }
    );

    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: PurchaseError) => {
        this.handlePurchaseError(error);
      }
    );
    */
  }

  /**
   * Handle successful purchase updates
   */
  private async handlePurchaseUpdate(purchase: any): Promise<void> {
    try {
      console.log('Purchase update received:', purchase);
      
      // Verify the purchase with your backend if needed
      const isValid = await this.verifyPurchase(purchase);
      
      if (isValid) {
        // Acknowledge the purchase
        // await RNIap.finishTransaction(purchase);
        
        // Update local state
        await this.processPurchase(purchase);
      }
    } catch (error) {
      console.error('Error handling purchase update:', error);
    }
  }

  /**
   * Handle purchase errors
   */
  private handlePurchaseError(error: PurchaseError): void {
    console.error('Purchase error:', error);
    
    if (error.userCancelled) {
      console.log('User cancelled the purchase');
    } else {
      console.error('Purchase failed:', error.message);
    }
  }

  /**
   * Verify a purchase (implement your own verification logic)
   */
  private async verifyPurchase(_purchase: any): Promise<boolean> {
    // TODO: Implement purchase verification
    // This could involve validating the receipt with Apple/Google
    // or with your own backend server
    
    // For now, assume all purchases are valid
    return true;
  }

  /**
   * Process a verified purchase
   */
  private async processPurchase(_purchase: any): Promise<void> {
    // TODO: Update Redux store with purchase information
    // This would typically involve dispatching actions to update
    // the purchase state in your Redux store
    
    console.log('Processing purchase:', _purchase.productId);
  }

  /**
   * Get all available products
   */
  getAvailableProducts(): PurchaseProduct[] {
    return this.availableProducts;
  }

  /**
   * Get a specific product by ID
   */
  getProduct(productId: ProductId): PurchaseProduct | undefined {
    return this.availableProducts.find(product => product.productId === productId);
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: ProductId): Promise<PurchaseTransaction> {
    if (!this.isInitialized) {
      throw new Error('PurchaseService not initialized');
    }

    try {
      console.log('Attempting to purchase:', productId);
      
      // TODO: Implement actual purchase
      // const purchase = await RNIap.requestPurchase(productId);
      
      // Mock purchase for development
      const mockTransaction: PurchaseTransaction = {
        transactionId: `mock_${Date.now()}`,
        productId,
        transactionDate: new Date().toISOString(),
        transactionReceipt: 'mock_receipt_data',
      };
      
      return mockTransaction;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseTransaction[]> {
    if (!this.isInitialized) {
      throw new Error('PurchaseService not initialized');
    }

    try {
      console.log('Restoring purchases...');
      
      // TODO: Implement actual restore
      // const purchases = await RNIap.getAvailablePurchases();
      
      // Mock restored purchases for development
      const mockPurchases: PurchaseTransaction[] = [];
      
      return mockPurchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Check if a product has been purchased
   */
  async isPurchased(productId: ProductId): Promise<boolean> {
    try {
      const restoredPurchases = await this.restorePurchases();
      return restoredPurchases.some(purchase => purchase.productId === productId);
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();
export default purchaseService;