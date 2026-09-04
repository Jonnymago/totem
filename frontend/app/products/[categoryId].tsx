import React, { useEffect, useState } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProductsByCategory, Product, ExtraAddition, ComboGroup, UiSection, ensureProductSections, subscribeToDbChanges } from '@/src/api/api';
import { useCartStore } from '@/src/store/cartStore';
import { useI18n } from '@/src/utils/i18n';
import { translateCustomerMenuText, useCustomerMenuGlossary } from '@/src/utils/customerMenuTranslation';
import { sanitizeImageUri } from '@/src/utils/imageUtils';
import { AdminHeaderLanguageFlag } from '@/src/components/AdminHeaderLanguageFlag';

import { Text } from '@/src/components/LocalizedPrimitives';
export default function ProductsScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  useCustomerMenuGlossary();
  const menuText = (value?: string) => translateCustomerMenuText(value, lang);
  const { categoryId } = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<ExtraAddition[]>([]);
  const [comboSelections, setComboSelections] = useState<{ [key: string]: string[] }>({});
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [quantity, setQuantity] = useState(1);

  const { width: winW, height: winH } = useWindowDimensions();
  const isLarge = Math.min(winW, winH) >= 500 || Math.max(winW, winH) >= 900;
  const addItem = useCartStore(state => state.addItem);
  const updateItem = useCartStore(state => state.updateItem);
  const editingIndex = useCartStore(state => state.editingIndex);
  const setEditingIndex = useCartStore(state => state.setEditingIndex);
  const cartList = useCartStore(state => state.items);
  const cartItems = useCartStore(state => state.getTotalItems());
  const isEditing = editingIndex !== null && editingIndex >= 0;

  useEffect(() => {
    loadProducts();
    const unsubscribe = subscribeToDbChanges((type) => {
      if (type === 'products' || type === 'all') {
        loadProducts();
      }
    });
    const interval = setInterval(() => {
      loadProducts();
    }, 2500);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [categoryId]);

  const loadProducts = async () => {
    try {
      const data = await getProductsByCategory(categoryId as string);
      setProducts(data);
      // Se arrivo dal carrello in modifica, apri il modal già compilato
      const idx = useCartStore.getState().editingIndex;
      const list = useCartStore.getState().items;
      if (idx !== null && idx >= 0 && list[idx]) {
        const cartItem = list[idx];
        const product = data.find((p) => p.id === cartItem.product_id);
        if (product && product.available !== false) {
          openProductModalForEdit(product, cartItem);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const openProductModal = (product: Product) => {
    if (product.available === false) return;
    // Nuova aggiunta: non in modifica
    if (useCartStore.getState().editingIndex !== null) {
      setEditingIndex(null);
    }
    setSelectedProduct(product);
    setRemovedIngredients([]);
    setAddedExtras([]);
    setComboSelections({});
    setSelectedCustomizations([]);
    setQuantity(1);
    const exp: { [key: string]: boolean } = {};
    ensureProductSections(product).filter(s => s.enabled && s.type === 'choice_group').forEach((s, i) => {
      exp[s.title] = i === 0;
    });
    setExpandedGroups(exp);
  };

  const openProductModalForEdit = (product: Product, cartItem: any) => {
    if (product.available === false) return;
    setSelectedProduct(product);
    setRemovedIngredients(cartItem.removed_ingredients || []);
    setAddedExtras(cartItem.added_extras || []);
    setComboSelections(cartItem.combo_selections ? { ...cartItem.combo_selections } : {});
    setSelectedCustomizations(cartItem.customizations || []);
    setQuantity(cartItem.quantity || 1);
    const exp: { [key: string]: boolean } = {};
    ensureProductSections(product).filter(s => s.enabled && s.type === 'choice_group').forEach((s, i) => {
      exp[s.title] = i === 0;
    });
    setExpandedGroups(exp);
  };

  const toggleGroupExpanded = (groupName: string) => {
    setExpandedGroups(prev => {
      const willOpen = !prev[groupName];
      const next: { [key: string]: boolean } = {};
      Object.keys(prev).forEach(k => { next[k] = false; });
      // anche gruppi non ancora in mappa
      if (selectedProduct?.combo_groups) {
        selectedProduct.combo_groups.forEach(g => { next[g.name] = false; });
      }
      next[groupName] = willOpen;
      return next;
    });
  };

  const toggleCustomization = (opt: string) => {
    setSelectedCustomizations(prev =>
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    );
  };

  const toggleRemoveIngredient = (ing: string) => {
    if (removedIngredients.includes(ing)) {
      setRemovedIngredients(removedIngredients.filter(i => i !== ing));
    } else {
      setRemovedIngredients([...removedIngredients, ing]);
    }
  };

  const toggleAddExtra = (extra: ExtraAddition) => {
    if (addedExtras.find(e => e.name === extra.name)) {
      setAddedExtras(addedExtras.filter(e => e.name !== extra.name));
    } else {
      setAddedExtras([...addedExtras, extra]);
    }
  };

  const toggleComboOption = (groupName: string, optionName: string, group: ComboGroup) => {
    const current = comboSelections[groupName] || [];
    if (current.includes(optionName)) {
      setComboSelections({
        ...comboSelections,
        [groupName]: current.filter(o => o !== optionName)
      });
    } else {
      if (group.max_selection === 1) {
        setComboSelections({
          ...comboSelections,
          [groupName]: [optionName]
        });
      } else if (current.length < group.max_selection) {
        setComboSelections({
          ...comboSelections,
          [groupName]: [...current, optionName]
        });
      }
    }
  };

  const calculatePrice = (): number => {
    if (!selectedProduct) return 0;
    let price = selectedProduct.price;
    addedExtras.forEach(e => price += e.price);
    const sections = ensureProductSections(selectedProduct).filter(s => s.enabled);
    Object.entries(comboSelections).forEach(([groupName, selectedOptions]) => {
      const section = sections.find(s => s.type === 'choice_group' && s.title === groupName)
        || null;
      const legacy = selectedProduct.combo_groups?.find(g => g.name === groupName);
      const opts = section?.options || legacy?.options || [];
      selectedOptions.forEach(optName => {
        const opt = opts.find(o => o.name === optName);
        if (opt) price += Number(opt.price_delta) || 0;
      });
    });
    return price * quantity;
  };

  const isComboValid = (): boolean => {
    if (!selectedProduct) return true;
    const sections = ensureProductSections(selectedProduct).filter(s => s.enabled && s.type === 'choice_group');
    if (!sections.length) {
      if (!selectedProduct.combo_groups?.length) return true;
      for (const group of selectedProduct.combo_groups) {
        const selected = comboSelections[group.name] || [];
        if (selected.length < group.min_selection) return false;
      }
      return true;
    }
    for (const section of sections) {
      const selected = comboSelections[section.title] || [];
      const min = section.min_selection ?? 0;
      if (selected.length < min) return false;
    }
    return true;
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    if (!isComboValid()) return;

    const unitPrice = calculatePrice() / quantity;

    const combo_lines: { group: string; name: string; price_delta: number }[] = [];
    const cleanSelections: { [key: string]: string[] } = {};
    const sections = ensureProductSections(selectedProduct).filter(s => s.enabled);
    Object.entries(comboSelections).forEach(([groupName, opts]) => {
      if (!opts || opts.length === 0) return;
      const section = sections.find(s => s.type === 'choice_group' && s.title === groupName);
      const group = selectedProduct.combo_groups?.find(g => g.name === groupName);
      const options = section?.options || group?.options || [];
      cleanSelections[groupName] = opts;
      opts.forEach(optName => {
        const opt = options.find(o => o.name === optName);
        combo_lines.push({
          group: groupName,
          name: optName,
          price_delta: opt?.price_delta || 0,
        });
      });
    });

    const payload = {
      product_id: selectedProduct.id!,
      product_name: selectedProduct.name,
      category_id: selectedProduct.category_id || (categoryId as string) || '',
      product_category_id: selectedProduct.category_id || (categoryId as string) || '',
      quantity,
      price: unitPrice,
      customizations: selectedCustomizations,
      notes: '',
      removed_ingredients: removedIngredients,
      added_extras: addedExtras,
      combo_selections: cleanSelections,
      combo_lines,
    };

    const idx = useCartStore.getState().editingIndex;
    if (idx !== null && idx >= 0) {
      updateItem(idx, payload);
      setSelectedProduct(null);
      router.replace('/cart');
      return;
    }

    addItem(payload);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, isLarge && styles.headerLarge]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, isLarge && styles.headerBtnLarge]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={isLarge ? 40 : 26} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isLarge ? { fontSize: 32 } : { fontSize: 20 }]}>
          {t('products.title')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AdminHeaderLanguageFlag
            variant="customer"
            mode="customer-session"
            isLarge={isLarge}
          />
          <TouchableOpacity
            testID="cart-btn"
            onPress={() => router.push('/cart')}
            style={[styles.headerBtn, isLarge && styles.headerBtnLarge]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="cart" size={isLarge ? 40 : 26} color="white" />
            {cartItems > 0 && (
              <View style={[styles.badge, isLarge && styles.badgeLarge]}>
                <Text style={[styles.badgeText, isLarge && { fontSize: 16 }]}>{cartItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {products.map((product) => {
          const isAvailable = product.available !== false;
          return (
            <TouchableOpacity
              key={product.id}
              testID={`product-${product.id}`}
              style={[
                styles.productCard,
                !isAvailable && styles.productCardDisabled
              ]}
              onPress={() => {
                if (isAvailable) {
                  openProductModal(product);
                }
              }}
              activeOpacity={isAvailable ? 0.7 : 1}
              disabled={!isAvailable}
            >
              {sanitizeImageUri(product.image) ? (
                <View style={styles.productImageContainer}>
                  <ExpoImage
                    source={{ uri: sanitizeImageUri(product.image)! }}
                    style={[
                      styles.productImage,
                      isLarge && styles.productImageLarge,
                      !isAvailable && styles.productImageDisabled
                    ]}
                    contentFit="cover"
                    transition={120}
                    cachePolicy="memory-disk"
                  />
                  {!isAvailable && (
                    <View style={styles.soldOutImageOverlay}>
                      <Text style={styles.soldOutImageOverlayText}>{t('products.sold_out').toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.productIcon, !isAvailable && styles.productIconDisabled]}>
                  <Ionicons
                    name={isAvailable ? "fast-food-outline" : "ban-outline"}
                    size={40}
                    color={isAvailable ? "#FF6B6B" : "#94A3B8"}
                  />
                </View>
              )}
              <View style={styles.productInfo}>
                <View style={styles.productNameRow}>
                  <Text style={[styles.productName, !isAvailable && styles.productNameDisabled]}>
                    {menuText(product.name)}
                  </Text>
                  {!isAvailable && (
                    <View style={styles.soldOutBadge}>
                      <Text style={styles.soldOutBadgeText}>🔴 {t('products.sold_out')}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.productDescription, !isAvailable && styles.productDescriptionDisabled]}
                  numberOfLines={2}
                >
                  {menuText(product.description)}
                </Text>
                {product.allergens && product.allergens.length > 0 && (
                  <Text style={[styles.allergens, !isAvailable && styles.allergensDisabled]}>
                    {t('products.allergens')}: {product.allergens.map(menuText).join(', ')}
                  </Text>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, !isAvailable && styles.priceDisabled]}>
                  €{product.price.toFixed(2)}
                </Text>
                {isAvailable ? (
                  <Ionicons name="add-circle" size={32} color="#FF6B6B" />
                ) : (
                  <View style={styles.soldOutButton}>
                    <Text style={styles.soldOutButtonText}>{t('products.sold_out')}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={selectedProduct !== null}
        animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
        transparent={true}
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{menuText(selectedProduct?.name)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedProduct(null);
                  if (isEditing) setEditingIndex(null);
                }}
                style={styles.headerBtn}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              {sanitizeImageUri(selectedProduct?.image) ? (
                <View style={[styles.modalImageWrap, isLarge && styles.modalImageWrapLarge]}>
                  <ExpoImage
                    source={{ uri: sanitizeImageUri(selectedProduct!.image)! }}
                    style={styles.modalImage}
                    contentFit="cover"
                    transition={120}
                    cachePolicy="memory-disk"
                  />
                </View>
              ) : null}

              <Text style={styles.modalDescription}>{menuText(selectedProduct?.description)}</Text>
              <Text style={styles.modalPrice}>€{selectedProduct?.price.toFixed(2)}</Text>

              {(selectedProduct ? ensureProductSections(selectedProduct).filter(s => s.enabled) : []).map((section) => {
                if (section.type === 'base_remove' && (section.items || []).length > 0) {
                  return (
                    <View key={section.id} style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="remove-circle-outline" size={18} color="#0288D1" /> {menuText(section.title)}
                      </Text>
                      <View style={styles.ingredientsGrid}>
                        {(section.items || []).map((ing) => {
                          const isRemoved = removedIngredients.includes(ing);
                          return (
                            <TouchableOpacity
                              key={ing}
                              style={[styles.ingredientChip, isRemoved && styles.ingredientChipRemoved]}
                              onPress={() => toggleRemoveIngredient(ing)}
                            >
                              <Text style={[styles.ingredientText, isRemoved && styles.ingredientTextRemoved]}>
                                {isRemoved ? '❌ ' : ''}{menuText(ing)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                }

                if (section.type === 'paid_extras' && (section.extras || []).length > 0) {
                  return (
                    <View key={section.id} style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="add-circle-outline" size={18} color="#060" /> {menuText(section.title)}
                      </Text>
                      {(section.extras || []).map((extra) => {
                        const isSelected = !!addedExtras.find(e => e.name === extra.name);
                        return (
                          <TouchableOpacity
                            key={extra.name}
                            style={[styles.extraOption, isSelected && styles.extraOptionSelected]}
                            onPress={() => toggleAddExtra(extra)}
                          >
                            <View style={styles.extraRow}>
                              <Ionicons
                                name={isSelected ? 'checkbox' : 'square-outline'}
                                size={22}
                                color={isSelected ? '#2E7D32' : '#999'}
                              />
                              <Text style={[styles.extraText, isSelected && styles.extraTextSelected]}>{menuText(extra.name)}</Text>
                            </View>
                            <Text style={styles.extraPrice}>+€{Number(extra.price).toFixed(2)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                }

                if (section.type === 'free_chips' && (section.chips || []).length > 0) {
                  return (
                    <View key={section.id} style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="water-outline" size={18} color="#FF6B6B" /> {menuText(section.title)}
                      </Text>
                      <View style={styles.ingredientsGrid}>
                        {(section.chips || []).map((opt) => {
                          const selected = selectedCustomizations.includes(opt);
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[styles.ingredientChip, selected && styles.extraOptionSelected]}
                              onPress={() => toggleCustomization(opt)}
                            >
                              <Text style={[styles.ingredientText, selected && styles.extraTextSelected]}>{menuText(opt)}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                }

                if (section.type === 'choice_group' && (section.options || []).length > 0) {
                  const group: ComboGroup = {
                    name: section.title,
                    min_selection: section.min_selection ?? 0,
                    max_selection: section.max_selection ?? 1,
                    options: section.options || [],
                  };
                  const isOpen = !!expandedGroups[group.name];
                  const selected = comboSelections[group.name] || [];
                  return (
                    <View key={section.id} style={styles.accordionSection}>
                      <TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() => toggleGroupExpanded(group.name)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sectionTitle}>{menuText(group.name)}</Text>
                          <Text style={styles.groupHint}>
                            Min {group.min_selection}, Max {group.max_selection}
                            {selected.length ? ` · ${selected.length} scelte` : ''}
                          </Text>
                        </View>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#666" />
                      </TouchableOpacity>
                      {isOpen && (
                        <View style={styles.accordionBody}>
                          {(group.options || []).map((opt) => {
                            const on = selected.includes(opt.name);
                            return (
                              <TouchableOpacity
                                key={opt.name}
                                style={[styles.extraOption, on && styles.extraOptionSelected]}
                                onPress={() => toggleComboOption(group.name, opt.name, group)}
                              >
                                <View style={styles.extraRow}>
                                  <Ionicons
                                    name={on ? 'checkbox' : 'square-outline'}
                                    size={22}
                                    color={on ? '#2E7D32' : '#999'}
                                  />
                                  <Text style={[styles.extraText, on && styles.extraTextSelected]}>{menuText(opt.name)}</Text>
                                </View>
                                {opt.price_delta ? (
                                  <Text style={styles.extraPrice}>
                                    {opt.price_delta > 0 ? '+' : ''}€{Number(opt.price_delta).toFixed(2)}
                                  </Text>
                                ) : (
                                  <Text style={styles.extraPrice}> </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                }
                return null;
              })}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('products.quantity')}</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={24} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.addButtonWrap}>
              <TouchableOpacity
                testID="add-to-cart-btn"
                style={[styles.addButton, !isComboValid() && styles.addButtonDisabled]}
                onPress={addToCart}
                disabled={!isComboValid()}
              >
                <Text style={styles.addButtonText}>
                  {isComboValid()
                    ? `${isEditing ? t('common.save') : t('products.add_to_cart')} - €${calculatePrice().toFixed(2)}`
                    : t('products.complete_selection')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: {
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? 44 : 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLarge: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerBtnLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFE66D',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLarge: {
    top: 4,
    right: 4,
    minWidth: 30,
    height: 30,
    borderRadius: 15,
  },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#FF6B6B' },
  content: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  productCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, gap: 16,
  },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#111' },
  productImageLarge: { width: 110, height: 110, borderRadius: 14 },
  productIcon: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  productInfo: { flex: 1 },
  productNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  comboBadge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  comboBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  productDescription: { fontSize: 14, color: '#666', marginBottom: 4 },
  allergens: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  priceContainer: { alignItems: 'center', gap: 4 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#FF6B6B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%',
    width: '100%', alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  modalBody: { paddingHorizontal: 20, paddingTop: 20 },
  modalBodyContent: { paddingBottom: 12 },
  modalImageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    maxHeight: 280,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  modalImageWrapLarge: {
    aspectRatio: 16 / 9,
    maxHeight: 360,
  },
  modalImage: { width: '100%', height: '100%' },
  modalDescription: { fontSize: 16, color: '#666', marginBottom: 12 },
  modalPrice: { fontSize: 28, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 24 },
  section: { marginBottom: 24 },
  accordionSection: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  accordionBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupHint: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  ingredientsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientChip: {
    backgroundColor: '#E1F5FE', borderWidth: 2, borderColor: '#4FC3F7',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  ingredientChipRemoved: { backgroundColor: '#FFEBEE', borderColor: '#c00' },
  ingredientText: { fontSize: 14, color: '#0277BD', fontWeight: '600' },
  ingredientTextRemoved: { color: '#c00', textDecorationLine: 'line-through' },
  extraOption: {
    backgroundColor: '#F8F9FA', padding: 14, borderRadius: 12,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  extraOptionSelected: { backgroundColor: '#F1F8E9', borderColor: '#4CAF50' },
  extraRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  extraText: { fontSize: 16, color: '#666' },
  extraTextSelected: { color: '#2E7D32', fontWeight: '600' },
  extraPrice: { fontSize: 14, color: '#FF6B6B', fontWeight: 'bold' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  quantityButton: {
    backgroundColor: '#FF6B6B', width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  quantityText: { fontSize: 28, fontWeight: 'bold', color: '#333', minWidth: 50, textAlign: 'center' },
  addButtonWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 64 : 28,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#FF6B6B', padding: 20, borderRadius: 16, alignItems: 'center',
  },
  addButtonDisabled: { backgroundColor: '#CCC' },
  addButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  productCardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    opacity: 0.65,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImageDisabled: {
    opacity: 0.5,
  },
  soldOutImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutImageOverlayText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  productIconDisabled: {
    backgroundColor: '#F1F5F9',
  },
  productNameDisabled: {
    color: '#64748B',
  },
  productDescriptionDisabled: {
    color: '#94A3B8',
  },
  allergensDisabled: {
    color: '#CBD5E1',
  },
  priceDisabled: {
    color: '#94A3B8',
  },
  soldOutBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  soldOutBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  soldOutButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  soldOutButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
});
