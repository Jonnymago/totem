import React, { useEffect, useState } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/src/store/cartStore';
import { getProducts, subscribeToDbChanges } from '@/src/api/api';
import { useI18n } from '@/src/utils/i18n';
import { translateCustomerMenuText, useCustomerMenuGlossary } from '@/src/utils/customerMenuTranslation';

import { Text } from '@/src/components/LocalizedPrimitives';
export default function CartScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  useCustomerMenuGlossary();
  const menuText = (value?: string) => translateCustomerMenuText(value, lang);
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, setEditingIndex } = useCartStore();
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const checkAvailability = async () => {
    try {
      const allProds = await getProducts();
      const unavail = new Set<string>();
      allProds.forEach(p => {
        if (p.available === false) {
          unavail.add(p.id);
        }
      });
      setUnavailableIds(unavail);
    } catch (e) {
      console.warn('Error checking product availability:', e);
    }
  };

  useEffect(() => {
    checkAvailability();
    const unsubscribe = subscribeToDbChanges((type) => {
      if (type === 'products' || type === 'all') {
        checkAvailability();
      }
    });
    const interval = setInterval(() => {
      checkAvailability();
    }, 3000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleCheckout = () => {
    const hasSoldOut = items.some(it => unavailableIds.has(it.product_id));
    if (hasSoldOut) {
      Alert.alert(
        'Prodotti Esauriti',
        'Uno o più articoli nel tuo carrello non sono più disponibili. Rimuovili per poter procedere.'
      );
      return;
    }
    if (items.length > 0) router.push('/order-confirmation');
  };

  const handleEdit = async (index: number) => {
    const item = items[index];
    if (!item) return;
    if (unavailableIds.has(item.product_id)) {
      Alert.alert('Prodotto Esaurito', 'Questo articolo è attualmente esaurito e non può essere modificato.');
      return;
    }
    try {
      setEditingIndex(index);
      const products = await getProducts();
      const product = products.find((p) => p.id === item.product_id);
      if (!product || !product.category_id) {
        setEditingIndex(null);
        Alert.alert('Errore', 'Prodotto non trovato nel menu.');
        return;
      }
      router.push(`/products/${product.category_id}`);
    } catch (e) {
      setEditingIndex(null);
      Alert.alert('Errore', 'Impossibile aprire la modifica.');
    }
  };

  const renderItemDetails = (item: (typeof items)[0]) => {
    const lines: React.ReactNode[] = [];

    if (item.removed_ingredients?.length > 0) {
      lines.push(
        <Text key="removed" style={styles.tagRemoved}>
          - Senza {item.removed_ingredients.map(menuText).join(', ')}
        </Text>
      );
    }

    if (item.customizations?.length > 0) {
      lines.push(
        <Text key="custom" style={styles.tagCustom}>
          + {item.customizations.map(menuText).join(', ')}
        </Text>
      );
    }

    if (item.added_extras?.length > 0) {
      lines.push(
        <Text key="extras" style={styles.tagExtra}>
          + {item.added_extras.map((e: any) =>
            e.price > 0 ? `${menuText(e.name)} (€${Number(e.price).toFixed(2)})` : menuText(e.name)
          ).join(', ')}
        </Text>
      );
    }

    if (item.combo_lines && item.combo_lines.length > 0) {
      const byGroup: Record<string, string[]> = {};
      for (const line of item.combo_lines) {
        if (!byGroup[line.group]) byGroup[line.group] = [];
        byGroup[line.group].push(
          line.price_delta > 0
            ? `${menuText(line.name)} (+€${Number(line.price_delta).toFixed(2)})`
            : menuText(line.name)
        );
      }
      Object.entries(byGroup).forEach(([group, opts]) => {
        lines.push(
          <Text key={`combo-${group}`} style={styles.tagCombo}>
            {menuText(group)}: {opts.join(', ')}
          </Text>
        );
      });
    } else if (item.combo_selections) {
      Object.entries(item.combo_selections).forEach(([group, opts]) => {
        if (!opts || !(opts as string[]).length) return;
        lines.push(
          <Text key={`sel-${group}`} style={styles.tagCombo}>
            {menuText(group)}: {(opts as string[]).map(menuText).join(', ')}
          </Text>
        );
      });
    }

    if (item.notes) {
      lines.push(
        <Text key="notes" style={styles.tagNotes}>
          Note: {item.notes}
        </Text>
      );
    }

    return lines;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={40} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cart.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={100} color="#CCC" />
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/categories')}>
            <Text style={styles.shopButtonText}>{t('cart.start_order')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            {items.map((item, index) => {
              const isItemSoldOut = unavailableIds.has(item.product_id);
              return (
                <View
                  key={index}
                  style={[
                    styles.cartItem,
                    isItemSoldOut && styles.cartItemSoldOut
                  ]}
                >
                  <View style={styles.itemInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={[styles.itemName, isItemSoldOut && styles.itemNameSoldOut]}>
                        {menuText(item.product_name)}
                      </Text>
                      {isItemSoldOut && (
                        <View style={styles.soldOutBadge}>
                          <Text style={styles.soldOutBadgeText}>🔴 {t('products.sold_out')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.itemPrice, isItemSoldOut && styles.itemPriceSoldOut]}>
                      €{item.price.toFixed(2)} x {item.quantity}
                    </Text>
                    {isItemSoldOut && (
                      <Text style={styles.tagSoldOutAlert}>
                        ⚠️ {t('cart.unavailable_items')}
                      </Text>
                    )}
                    {renderItemDetails(item)}
                  </View>
                  <View style={styles.itemActions}>
                    {!isItemSoldOut ? (
                      <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(index)}>
                        <Ionicons name="create-outline" size={24} color="white" />
                        <Text style={styles.editButtonText}>{t('cart.edit')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}
                    <View style={styles.quantityControls}>
                      <TouchableOpacity style={styles.quantityBtn} onPress={() => updateQuantity(index, item.quantity - 1)}>
                        <Ionicons name="remove" size={24} color="white" />
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.quantityBtn, isItemSoldOut && { backgroundColor: '#CCC' }]}
                        disabled={isItemSoldOut}
                        onPress={() => updateQuantity(index, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => removeItem(index)}>
                      <Ionicons name="trash-outline" size={28} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <View>
                <Text style={styles.totalLabel}>{t('cart.total')} ({totalItems} {t('cart.items_count')})</Text>
                <Text style={styles.totalPrice}>€{totalPrice.toFixed(2)}</Text>
              </View>
              <TouchableOpacity testID="checkout-btn" style={styles.checkoutButton} onPress={handleCheckout}>
                <Text style={styles.checkoutButtonText}>{t('cart.checkout')}</Text>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    backgroundColor: '#111', paddingTop: Platform.OS === 'android' ? 44 : 50, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  headerBtnPlaceholder: { width: 72, height: 72 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 24, color: '#999', marginTop: 20, marginBottom: 30 },
  shopButton: { backgroundColor: '#FF6B6B', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  shopButtonText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  content: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 12 },
  cartItem: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
  cartItemSoldOut: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#FCA5A5' },
  itemInfo: { marginBottom: 12 },
  itemName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  itemNameSoldOut: { color: '#64748B' },
  itemPrice: { fontSize: 18, color: '#FF6B6B', fontWeight: '600', marginBottom: 6 },
  itemPriceSoldOut: { color: '#94A3B8' },
  soldOutBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  soldOutBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  tagSoldOutAlert: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  tagRemoved: { fontSize: 15, color: '#C62828', marginBottom: 2 },
  tagCustom: { fontSize: 15, color: '#1565C0', marginBottom: 2 },
  tagExtra: { fontSize: 15, color: '#2E7D32', marginBottom: 2 },
  tagCombo: { fontSize: 15, color: '#6A1B9A', marginBottom: 2 },
  tagNotes: { fontSize: 14, color: '#F9A825', fontStyle: 'italic', marginTop: 4 },
  itemActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#5C6BC0', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  editButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  quantityBtn: { backgroundColor: '#FF6B6B', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quantityValue: { fontSize: 22, fontWeight: 'bold', color: '#333', minWidth: 32, textAlign: 'center' },
  deleteButton: { padding: 8 },
  footer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'android' ? 64 : 28 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, color: '#666', marginBottom: 4 },
  totalPrice: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  checkoutButton: { backgroundColor: '#FF6B6B', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkoutButtonText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
});
