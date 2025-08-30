import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import { usePurchases } from '../hooks/usePurchases';
import { PRODUCT_IDS, ProductId } from '../services/PurchaseService';

const PurchaseScreen: React.FC = () => {
  const theme = useThemeColors();
  
  const {
    isProUnlocked,
    isLoading,
    error,
    purchaseProduct,
    restorePurchases,
    clearError,
    getAvailableProducts,
    hasPurchased,
  } = usePurchases();
  
  const products = getAvailableProducts();
  
  const handlePurchase = async (productId: ProductId) => {
    const success = await purchaseProduct(productId);
    if (success) {
      // Purchase completed successfully
      console.log('Purchase completed:', productId);
    }
  };
  
  const handleRestore = async () => {
    Alert.alert(
      'Restore Purchases',
      'This will restore any previous purchases made with this Apple ID.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          style: 'default',
          onPress: () => restorePurchases()
        },
      ]
    );
  };
  
  const getProductIcon = (productId: ProductId): string => {
    switch (productId) {
      case PRODUCT_IDS.PRO_UNLOCK:
        return 'star';
      case PRODUCT_IDS.TIP_SMALL:
        return 'cafe';
      case PRODUCT_IDS.TIP_MEDIUM:
        return 'heart';
      case PRODUCT_IDS.TIP_LARGE:
        return 'heart-circle';
      default:
        return 'gift';
    }
  };
  
  const getProductColor = (productId: ProductId): string => {
    switch (productId) {
      case PRODUCT_IDS.PRO_UNLOCK:
        return '#FFD700'; // Gold
      case PRODUCT_IDS.TIP_SMALL:
        return '#8E8E93'; // Gray
      case PRODUCT_IDS.TIP_MEDIUM:
        return '#007AFF'; // Blue
      case PRODUCT_IDS.TIP_LARGE:
        return '#FF3B30'; // Red
      default:
        return theme.primary;
    }
  };
  
  const renderProduct = (product: any) => {
    const isPurchased = hasPurchased(product.productId as ProductId);
    const isProProduct = product.productId === PRODUCT_IDS.PRO_UNLOCK;
    const isTip = product.productId.startsWith('tip_');
    
    return (
      <View key={product.productId} style={[styles.productCard, { backgroundColor: theme.card }]}>
        <View style={styles.productHeader}>
          <View style={[
            styles.productIcon, 
            { backgroundColor: getProductColor(product.productId) + '20' }
          ]}>
            <Icon 
              name={getProductIcon(product.productId)} 
              size={24} 
              color={getProductColor(product.productId)} 
            />
          </View>
          
          <View style={styles.productInfo}>
            <Text style={[styles.productTitle, { color: theme.text }]}>
              {product.title}
            </Text>
            <Text style={[styles.productDescription, { color: theme.textSecondary }]}>
              {product.description}
            </Text>
          </View>
          
          <View style={styles.productPrice}>
            <Text style={[styles.priceText, { color: theme.text }]}>
              {product.localizedPrice}
            </Text>
          </View>
        </View>
        
        {isPurchased && (
          <View style={styles.purchasedBadge}>
            <Icon name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.purchasedText}>Purchased</Text>
          </View>
        )}
        
        {!isPurchased && (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: getProductColor(product.productId) },
              isLoading && styles.purchaseButtonDisabled
            ]}
            onPress={() => handlePurchase(product.productId)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {isProProduct ? 'Unlock Pro' : isTip ? 'Send Tip' : 'Purchase'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const styles = getStyles(theme);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Purchases</Text>
        {isProUnlocked && (
          <View style={styles.proBadge}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.proText}>Pro</Text>
          </View>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pro Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <Text style={styles.sectionDescription}>
            Unlock advanced features and support development
          </Text>
          
          {products
            .filter(p => p.productId === PRODUCT_IDS.PRO_UNLOCK)
            .map(renderProduct)
          }
        </View>
        
        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support the Developer</Text>
          <Text style={styles.sectionDescription}>
            Show your appreciation with a tip
          </Text>
          
          {products
            .filter(p => p.productId.startsWith('tip_'))
            .map(renderProduct)
          }
        </View>
        
        {/* Restore Button */}
        <TouchableOpacity 
          style={[styles.restoreButton, { borderColor: theme.border }]}
          onPress={handleRestore}
          disabled={isLoading}
        >
          <Icon name="refresh" size={20} color={theme.textSecondary} />
          <Text style={[styles.restoreButtonText, { color: theme.textSecondary }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Purchases are tied to your Apple ID and will sync across all your devices.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: '#FF3B30' + '20',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
  },
  errorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  errorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  productPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  purchasedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
    marginLeft: 6,
  },
  purchaseButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PurchaseScreen;