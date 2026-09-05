import { useI18n } from '@/src/utils/i18n';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getGlobalGroups,
  Product,
  Category,
  GlobalOptionGroup,
  UiSection,
  UiSectionType,
  ensureProductSections,
  syncLegacyFromSections,
  newSectionId,
  subscribeToDbChanges,
  updateGlossaryTranslations,
  moveProduct,
} from '@/src/api/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { sanitizeImageUri } from '@/src/utils/imageUtils';
import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';

const STANDARD_ALLERGENS = [
  'Glutine',
  'Crostacei',
  'Uova',
  'Pesce',
  'Arachidi',
  'Soia',
  'Latte',
  'Frutta a guscio',
  'Sedano',
  'Senape',
  'Sesamo',
  'Solfiti',
  'Lupini',
  'Molluschi',
];

export default function ProductsManagementScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions();
  const modalHeight = Math.max(420, Math.min(820, viewportHeight - 32));
  const isNarrowViewport = viewportWidth < 460;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalGroups, setGlobalGroups] = useState<GlobalOptionGroup[]>([]);
  const [selectedGlobalGroupIds, setSelectedGlobalGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [updatingGlossary, setUpdatingGlossary] = useState(false);
  const [glossaryFeedback, setGlossaryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [available, setAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [image, setImage] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [uiSections, setUiSections] = useState<UiSection[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const unsubscribe = subscribeToDbChanges((type) => {
        if (type === 'products' || type === 'categories' || type === 'all') {
          loadData();
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const loadData = async () => {
    try {
      const [productsData, categoriesData, globalGroupsData] = await Promise.all([
        getAllProductsAdmin(),
        getCategories(),
        getGlobalGroups(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setGlobalGroups(globalGroupsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('Errore'), t('Impossibile caricare i dati dei prodotti'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGlossary = async () => {
    setUpdatingGlossary(true);
    setGlossaryFeedback(null);
    try {
      const result = await updateGlossaryTranslations();
      setGlossaryFeedback({
        type: 'success',
        message: `Glossario aggiornato: ${result.count} termini pronti in 5 lingue.`,
      });
    } catch (error: any) {
      console.error('Aggiornamento glossario non riuscito:', error);
      setGlossaryFeedback({
        type: 'error',
        message: error?.message || 'Impossibile aggiornare le traduzioni locali. Riprova.',
      });
    } finally {
      setUpdatingGlossary(false);
    }
  };

  const openCreateModal = async () => {
    resetForm();
    setEditingProduct(null);
    setCategoryId(categories[0]?.id || '');
    setIsFeatured(false);
    setModalVisible(true);
    try {
      const [gData, cData] = await Promise.all([getGlobalGroups(), getCategories()]);
      setGlobalGroups(gData);
      setCategories(cData);
    } catch (e) {}
  };

  const handleDuplicate = (product: Product) => {
    setEditingProduct(null);
    setName((product.name || '') + ' (copia)');
    setDescription(product.description || '');
    setPrice(String(product.price ?? ''));
    setCategoryId(product.category_id || '');
    setAvailable(product.available !== false);
    setIsFeatured(Boolean(product.is_featured));
    setImage(sanitizeImageUri(product.image) || product.image || '');
    setSelectedAllergens(product.allergens || []);
    setUiSections(
      ensureProductSections(product, false).map((s) => ({ ...s, id: newSectionId() }))
    );
    setSelectedGlobalGroupIds(product.global_group_ids || []);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(String(product.price ?? ''));
    setCategoryId(product.category_id || '');
    setAvailable(product.available !== false);
    setIsFeatured(Boolean(product.is_featured));
    setImage(sanitizeImageUri(product.image) || product.image || '');
    setSelectedAllergens(product.allergens || []);
    setUiSections(ensureProductSections(product, false));
    setSelectedGlobalGroupIds(product.global_group_ids || []);
    setModalVisible(true);
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const nextFeatured = !product.is_featured;
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: nextFeatured } : p))
      );
      await updateProduct(product.id, { is_featured: nextFeatured });
    } catch (e) {
      console.error('handleToggleFeatured error:', e);
      Alert.alert(t('Errore'), t('Impossibile aggiornare la preferenza per la promo screensaver.'));
      loadData();
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      resetForm();
      setEditingProduct(null);
    }, 60);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId('');
    setAvailable(true);
    setIsFeatured(false);
    setImage('');
    setSelectedAllergens([]);
    setUiSections([]);
    setSelectedGlobalGroupIds([]);
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const toggleGlobalGroup = (groupId: string) => {
    setSelectedGlobalGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const sortSections = (list: UiSection[]) =>
    [...list].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }));

  const addSection = (type: UiSectionType) => {
    const defaults: Record<UiSectionType, Partial<UiSection>> = {
      base_remove: { title: 'Ingredienti Base', items: [] },
      paid_extras: { title: 'Aggiungi Extra', extras: [] },
      free_chips: { title: 'Salse & Scelte', chips: [] },
      choice_group: { title: 'Gruppo a scelta', min_selection: 0, max_selection: 1, options: [] },
    };
    setUiSections((prev) =>
      sortSections([
        ...prev,
        {
          id: newSectionId(),
          type,
          title: defaults[type].title || 'Sezione',
          enabled: true,
          order: prev.length,
          ...defaults[type],
        } as UiSection,
      ])
    );
  };

  const updateSection = (id: string, patch: Partial<UiSection>) => {
    setUiSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id: string) => {
    setUiSections((prev) => sortSections(prev.filter((s) => s.id !== id)));
  };

  const moveArrayItem = <T,>(items: T[], index: number, direction: 'up' | 'down'): T[] => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return items;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setUiSections((prev) => {
      const ordered = sortSections(prev);
      const index = ordered.findIndex((section) => section.id === id);
      return sortSections(moveArrayItem(ordered, index, direction));
    });
  };

  const moveSectionStringItem = (id: string, field: 'items' | 'chips', index: number, direction: 'up' | 'down') => {
    setUiSections((prev) => prev.map((section) => {
      if (section.id !== id) return section;
      const values = field === 'items' ? (section.items || []) : (section.chips || []);
      return { ...section, [field]: moveArrayItem(values, index, direction) } as UiSection;
    }));
  };

  const moveSectionChoice = (id: string, field: 'extras' | 'options', index: number, direction: 'up' | 'down') => {
    setUiSections((prev) => prev.map((section) => {
      if (section.id !== id) return section;
      if (field === 'extras') {
        return { ...section, extras: moveArrayItem(section.extras || [], index, direction) };
      }
      return { ...section, options: moveArrayItem(section.options || [], index, direction) };
    }));
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permesso negato',
          'Consenti l\'accesso alle foto nelle impostazioni del tablet.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const mime = asset.mimeType || 'image/jpeg';
      let cleanUri = '';
      if (asset.base64) {
        cleanUri = `data:${mime};base64,${asset.base64}`;
      } else if (asset.uri) {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!base64) throw new Error('Immagine selezionata senza contenuto');
        cleanUri = `data:${mime};base64,${base64}`;
      }
      setImage(sanitizeImageUri(cleanUri) || cleanUri);
    } catch (e) {
      console.error('pickImage error', e);
      Alert.alert(t('Errore'), t('Impossibile aprire la galleria.'));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !categoryId) {
      Alert.alert(t('Campi Mancanti'), t('Inserisci nome, prezzo e seleziona una categoria.'));
      return;
    }

    try {
      const ordered = sortSections(uiSections).map((s) => ({
        ...s,
        title: (s.title || '').trim() || 'Sezione',
        items: (s.items || []).map((x) => x.trim()).filter(Boolean),
        chips: (s.chips || []).map((x) => x.trim()).filter(Boolean),
        extras: (s.extras || [])
          .filter((e) => e?.name?.trim())
          .map((e) => ({
            name: e.name.trim(),
            price: Number(e.price) || 0,
          })),
        options: (s.options || [])
          .map((o) => ({
            name: (o.name || '').trim(),
            price_delta:
              parseFloat(String(o.price_delta ?? 0).toString().replace(',', '.')) || 0,
          }))
          .filter((o) => o.name),
        min_selection: Math.max(0, Number(s.min_selection) || 0),
        max_selection: Math.max(0, Number(s.max_selection) || 1) || 1,
      }));

      const legacy = syncLegacyFromSections(ordered);
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(String(price || '0').replace(',', '.')) || 0,
        category_id: categoryId,
        available,
        is_featured: isFeatured,
        image: image || '',
        allergens: selectedAllergens,
        ui_sections: ordered,
        global_group_ids: selectedGlobalGroupIds,
        ...legacy,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id!, productData);
      } else {
        await createProduct(productData);
      }

      closeModal();
      loadData();
      Alert.alert('Successo', editingProduct ? 'Prodotto aggiornato' : 'Prodotto creato');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert(t('Errore'), t('Impossibile salvare il prodotto'));
    }
  };

  const handleMoveProduct = async (product: Product, direction: 'up' | 'down') => {
    try {
      await moveProduct(product.id!, direction);
      await loadData();
    } catch (error) {
      console.error('Errore riordino prodotto:', error);
      Alert.alert(t('Errore'), t('Impossibile aggiornare la posizione del prodotto.'));
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(t('Conferma Eliminazione'), `Vuoi eliminare "${product.name}"?`, [
      { text: t('Annulla'), style: 'cancel' },
      {
        text: t('Elimina'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product.id!);
            loadData();
            Alert.alert(t('Successo'), t('Prodotto eliminato'));
          } catch (error) {
            console.error('Error deleting product:', error);
            Alert.alert(t('Errore'), t('Impossibile eliminare il prodotto'));
          }
        },
      },
    ]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategoryId === 'all' || p.category_id === selectedCategoryId;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.allergens && p.allergens.some((a) => a.toLowerCase().includes(query)));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const getCategoryName = (catId: string) => {
    const category = categories.find((c) => c.id === catId);
    return category ? category.name : 'Nessuna';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>{t(`Caricamento prodotti...`)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title={t(`Prodotti`)}
        subtitle={t(`Gestione catalogo e personalizzazioni`)}
        emoji="🍔"
        counter={filteredProducts.length}
        showBack={false}
        showTotemButton={true}
        rightActions={
          <>
            <TouchableOpacity
              style={styles.headerSecondaryBtn}
              onPress={handleUpdateGlossary}
              disabled={updatingGlossary}
            >
              {updatingGlossary ? (
                <ActivityIndicator size="small" color="#1E293B" />
              ) : (
                <Ionicons name="globe-outline" size={15} color="#1E293B" />
              )}
              <Text style={styles.headerSecondaryBtnText}>{t(`Traduzioni`)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerPrimaryBtn}
              onPress={openCreateModal}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.headerPrimaryBtnText}>{t(`Nuovo`)}</Text>
            </TouchableOpacity>
          </>
        }
      />

      {glossaryFeedback ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.glossaryFeedback,
            glossaryFeedback.type === 'success' ? styles.glossaryFeedbackSuccess : styles.glossaryFeedbackError,
          ]}
        >
          <Ionicons
            name={glossaryFeedback.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={18}
            color={glossaryFeedback.type === 'success' ? '#15803D' : '#B91C1C'}
          />
          <Text style={styles.glossaryFeedbackText}>{glossaryFeedback.message}</Text>
          <TouchableOpacity accessibilityLabel="Chiudi esito traduzioni" onPress={() => setGlossaryFeedback(null)}>
            <Ionicons name="close" size={18} color="#475569" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t(`Cerca prodotto, ingrediente o allergene...`)}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedCategoryId === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedCategoryId('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedCategoryId === 'all' && styles.filterPillTextActive,
              ]}
            >
              Tutti ({products.length})
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            const active = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
            <Text style={styles.emptyTitle}>{t(`Nessun prodotto trovato`)}</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Prova a cercare con altri termini o rimuovi i filtri.'
                : 'Crea il tuo primo prodotto per iniziare.'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => {
            const isAvail = product.available !== false;
            const categoryProducts = products
              .filter((candidate) => candidate.category_id === product.category_id)
              .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));
            const productIndex = categoryProducts.findIndex((candidate) => candidate.id === product.id);
            const isFirstInCategory = productIndex <= 0;
            const isLastInCategory = productIndex === categoryProducts.length - 1;
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.cardMainRow}>
                  {/* Thumbnail */}
                  <View style={styles.thumbnailBox}>
                    {sanitizeImageUri(product.image) ? (
                      <ExpoImage
                        source={{ uri: sanitizeImageUri(product.image)! }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                        transition={120}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={{ fontSize: 24 }}>{product.product_type === 'combo' ? '🍱' : '🍔'}</Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.productInfoCol}>
                    <View style={styles.productTitleRow}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <View style={styles.pricePill}>
                        <Text style={styles.pricePillText}>€{product.price.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View style={styles.tagRow}>
                      <View style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>
                          {getCategoryName(product.category_id)}
                        </Text>
                      </View>
                    </View>

                    {product.description ? (
                      <Text style={styles.productDesc} numberOfLines={2}>
                        {product.description}
                      </Text>
                    ) : null}

                    {product.allergens && product.allergens.length > 0 ? (
                      <View style={styles.allergensRow}>
                        <Ionicons name="warning-outline" size={12} color="#D97706" />
                        <Text style={styles.allergensText} numberOfLines={1}>
                          {product.allergens.join(', ')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Footer Actions */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.cardFooterStatusRow}>
                    {/* Availability Switch */}
                    <TouchableOpacity
                      style={[
                        styles.availToggleBtn,
                        { backgroundColor: isAvail ? '#DCFCE7' : '#FEE2E2' },
                      ]}
                      onPress={async () => {
                        try {
                          await updateProduct(product.id!, { available: !isAvail });
                          loadData();
                        } catch (e) {
                          Alert.alert(t('Errore'), t('Impossibile aggiornare la disponibilità'));
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.availDot,
                          { backgroundColor: isAvail ? '#16A34A' : '#DC2626' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.availToggleText,
                          { color: isAvail ? '#15803D' : '#B91C1C' },
                        ]}
                      >
                        {isAvail ? 'Disponibile' : 'Esaurito'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.productOrderControls}>
                      <View style={styles.productOrderLabel}>
                        <Ionicons name="swap-vertical-outline" size={13} color="#64748B" />
                        <Text style={styles.productOrderText}>Posizione #{productIndex + 1}</Text>
                      </View>
                      <View style={styles.productOrderButtons}>
                        <TouchableOpacity
                          accessibilityLabel="Sposta prodotto in alto"
                          onPress={() => { void handleMoveProduct(product, 'up'); }}
                          style={[styles.productOrderArrowBtn, isFirstInCategory && styles.productOrderArrowBtnDisabled]}
                          disabled={isFirstInCategory}
                        >
                          <Ionicons name="chevron-up" size={16} color={isFirstInCategory ? '#CBD5E1' : '#2563EB'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityLabel="Sposta prodotto in basso"
                          onPress={() => { void handleMoveProduct(product, 'down'); }}
                          style={[styles.productOrderArrowBtn, isLastInCategory && styles.productOrderArrowBtnDisabled]}
                          disabled={isLastInCategory}
                        >
                          <Ionicons name="chevron-down" size={16} color={isLastInCategory ? '#CBD5E1' : '#2563EB'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Actions buttons */}
                  <View style={styles.actionButtonsRow}>
                    {/* Featured / Promo Star Toggle */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        styles.promoActionBtn,
                        product.is_featured && styles.promoActionBtnActive,
                      ]}
                      onPress={() => handleToggleFeatured(product)}
                      accessibilityLabel="Seleziona per promo salvaschermo"
                    >
                      <Ionicons
                        name={product.is_featured ? 'star' : 'star-outline'}
                        size={14}
                        color={product.is_featured ? '#D97706' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          product.is_featured && styles.promoActionBtnTextActive,
                        ]}
                      >
                        {product.is_featured ? 'In Promo' : 'Promo'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDuplicate(product)}
                    >
                      <Ionicons name="copy-outline" size={16} color="#475569" />
                      <Text style={styles.actionBtnText}>{t(`Duplica`)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openEditModal(product)}
                    >
                      <Ionicons name="pencil" size={16} color="#2563EB" />
                      <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t(`Modifica`)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#FECACA' }]}
                      onPress={() => handleDelete(product)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal for Create / Edit */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: modalHeight }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nome */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Nome Prodotto *`)}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t(`Es: Double Bacon Burger`)}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Descrizione */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Descrizione`)}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t(`Descrizione dettagliata del piatto o ingredienti...`)}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Prezzo e Categoria */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>{t(`Prezzo (€) *`)}</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder={t(`9.50`)}
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1.5 }]}>
                  <Text style={styles.formLabel}>{t(`Categoria *`)}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {categories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.catSelectChip,
                          categoryId === c.id && styles.catSelectChipActive,
                        ]}
                        onPress={() => setCategoryId(c.id)}
                      >
                        <Text
                          style={[
                            styles.catSelectChipText,
                            categoryId === c.id && styles.catSelectChipTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Immagine */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Foto Prodotto`)}</Text>
                <View style={styles.imagePickerRow}>
                  <View style={styles.imagePreviewBox}>
                    {sanitizeImageUri(image) ? (
                      <ExpoImage
                        source={{ uri: sanitizeImageUri(image)! }}
                        style={styles.imagePreview}
                        contentFit="cover"
                        transition={120}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={{ fontSize: 24 }}>📷</Text>
                    )}
                  </View>
                  <View style={styles.imagePickerActions}>
                    <TouchableOpacity
                      style={styles.imagePickerBtn}
                      onPress={pickImage}
                    >
                      <Ionicons name="image-outline" size={16} color="#1E293B" />
                      <Text style={styles.imagePickerBtnText}>{t(`Scegli Immagine`)}</Text>
                    </TouchableOpacity>
                    {image ? (
                      <TouchableOpacity
                        style={styles.imageRemoveBtn}
                        onPress={() => setImage('')}
                      >
                        <Text style={styles.imageRemoveBtnText}>{t(`Rimuovi`)}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Salvaschermo / Screensaver Preferiti Switch */}
              <View style={styles.formGroup}>
                <View style={styles.featuredFormBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={[styles.featuredIconWrap, isFeatured && styles.featuredIconWrapActive]}>
                      <Ionicons
                        name={isFeatured ? 'star' : 'star-outline'}
                        size={20}
                        color={isFeatured ? '#D97706' : '#64748B'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featuredFormTitle}>{t(`Mostra in Promo Salvaschermo ⭐`)}</Text>
                      <Text style={styles.featuredFormDesc}>{t(`
                        Quando il totem è inattivo, questo panino/prodotto ruoterà tra le promozioni animate.
                      `)}</Text>
                    </View>
                  </View>
                  <Switch
                    value={isFeatured}
                    onValueChange={setIsFeatured}
                    trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
                    thumbColor={isFeatured ? '#D97706' : '#94A3B8'}
                  />
                </View>
              </View>

              {/* Allergeni Chips */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Allergeni Presenti`)}</Text>
                <View style={styles.allergensGrid}>
                  {STANDARD_ALLERGENS.map((alg) => {
                    const selected = selectedAllergens.includes(alg);
                    return (
                      <TouchableOpacity
                        key={alg}
                        style={[styles.allergenChip, selected && styles.allergenChipActive]}
                        onPress={() => toggleAllergen(alg)}
                      >
                        <Text
                          style={[
                            styles.allergenChipText,
                            selected && styles.allergenChipTextActive,
                          ]}
                        >
                          {selected ? '✓ ' : ''}{alg}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Gruppi di Opzioni Globali Collegati */}
              {globalGroups.length > 0 ? (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>{t(`📚 Gruppi Globali Collegati`)}</Text>
                  <Text style={styles.sectionCardSub}>{t(`
                    Collega librerie di ingredienti o extra globali a questo prodotto.
                  `)}</Text>
                  <View style={styles.globalGroupsList}>
                    {globalGroups.map((g) => {
                      const linked = selectedGlobalGroupIds.includes(g.id);
                      return (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.globalGroupItem,
                            linked && styles.globalGroupItemActive,
                          ]}
                          onPress={() => toggleGlobalGroup(g.id)}
                        >
                          <Ionicons
                            name={linked ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={linked ? '#FF6B6B' : '#94A3B8'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.globalGroupItemName}>{g.name}</Text>
                            <Text style={styles.globalGroupItemType}>
                              {g.type === 'base_remove'
                                ? 'Ingredienti Base'
                                : g.type === 'paid_extras'
                                ? 'Extra a Pagamento'
                                : g.type === 'choice_group'
                                ? 'Gruppo a Scelta'
                                : 'Salse / Chips'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Sezioni di Personalizzazione Dinamiche */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>{t(`⚙️ Sezioni Personalizzate Prodotto`)}</Text>
                </View>
                <Text style={styles.sectionCardSub}>{t(`
                  Aggiungi personalizzazioni specifiche esclusive per questo singolo prodotto.
                `)}</Text>

                {/* Add section buttons */}
                <View style={styles.addSectionButtonsRow}>
                  <TouchableOpacity
                    style={styles.addSectionPill}
                    onPress={() => addSection('base_remove')}
                  >
                    <Text style={styles.addSectionPillText}>{t(`+ Ingredienti Base`)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addSectionPill}
                    onPress={() => addSection('paid_extras')}
                  >
                    <Text style={styles.addSectionPillText}>{t(`+ Extra a Pagamento`)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addSectionPill}
                    onPress={() => addSection('free_chips')}
                  >
                    <Text style={styles.addSectionPillText}>{t(`+ Salse / Chips`)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addSectionPill}
                    onPress={() => addSection('choice_group')}
                  >
                    <Text style={styles.addSectionPillText}>{t(`+ Gruppo a Scelta`)}</Text>
                  </TouchableOpacity>
                </View>

                {/* Render UI Sections */}
                {uiSections.map((sec) => (
                  <View key={sec.id} style={styles.uiSectionBox}>
                    <View style={styles.uiSectionHeader}>
                      <TextInput
                        style={styles.uiSectionTitleInput}
                        value={sec.title}
                        onChangeText={(t) => updateSection(sec.id, { title: t })}
                        placeholder={t(`Titolo Sezione`)}
                      />
                      <TouchableOpacity
                        accessibilityLabel="Sposta sezione in alto"
                        onPress={() => moveSection(sec.id, 'up')}
                        style={styles.orderMiniBtn}
                      >
                        <Ionicons name="chevron-up" size={16} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel="Sposta sezione in basso"
                        onPress={() => moveSection(sec.id, 'down')}
                        style={styles.orderMiniBtn}
                      >
                        <Ionicons name="chevron-down" size={16} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeSection(sec.id)}
                        style={styles.uiSectionDeleteBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Section Type Editors */}
                    {sec.type === 'base_remove' && (
                      <View>
                        <Text style={styles.subLabel}>{t(`
                          Ingredienti da poter rimuovere (separati da virgola):
                        `)}</Text>
                        <TextInput
                          style={styles.input}
                          value={sec.items?.join(', ') || ''}
                          onChangeText={(t) =>
                            updateSection(sec.id, {
                              items: t.split(',').map((x) => x.trim()).filter(Boolean),
                            })
                          }
                          placeholder={t(`Pomodoro, Lattuga, Cipolla, Maionese`)}
                        />
                        {(sec.items || []).map((item, idx) => (
                          <View key={`${sec.id}-item-${idx}`} style={styles.itemOrderRow}>
                            <Text style={styles.itemOrderText}>{idx + 1}. {item}</Text>
                            <TouchableOpacity
                              accessibilityLabel="Sposta ingrediente in alto"
                              onPress={() => moveSectionStringItem(sec.id, 'items', idx, 'up')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-up" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              accessibilityLabel="Sposta ingrediente in basso"
                              onPress={() => moveSectionStringItem(sec.id, 'items', idx, 'down')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-down" size={16} color="#2563EB" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {sec.type === 'free_chips' && (
                      <View>
                        <Text style={styles.subLabel}>{t(`
                          Opzioni selezionabili gratuite (separate da virgola):
                        `)}</Text>
                        <TextInput
                          style={styles.input}
                          value={sec.chips?.join(', ') || ''}
                          onChangeText={(t) =>
                            updateSection(sec.id, {
                              chips: t.split(',').map((x) => x.trim()).filter(Boolean),
                            })
                          }
                          placeholder={t(`Maionese, Ketchup, Barbecue, Senape`)}
                        />
                        {(sec.chips || []).map((chip, idx) => (
                          <View key={`${sec.id}-chip-${idx}`} style={styles.itemOrderRow}>
                            <Text style={styles.itemOrderText}>{idx + 1}. {chip}</Text>
                            <TouchableOpacity
                              accessibilityLabel="Sposta opzione in alto"
                              onPress={() => moveSectionStringItem(sec.id, 'chips', idx, 'up')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-up" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              accessibilityLabel="Sposta opzione in basso"
                              onPress={() => moveSectionStringItem(sec.id, 'chips', idx, 'down')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-down" size={16} color="#2563EB" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {sec.type === 'paid_extras' && (
                      <View>
                        <Text style={styles.subLabel}>{t(`Lista Extra a Pagamento:`)}</Text>
                        {(sec.extras || []).map((ext, idx) => (
                          <View key={idx} style={styles.extraItemRow}>
                            <TextInput
                              style={[styles.input, { flex: 2 }]}
                              value={ext.name}
                              onChangeText={(v) => {
                                const list = [...(sec.extras || [])];
                                list[idx] = { ...list[idx], name: v };
                                updateSection(sec.id, { extras: list });
                              }}
                              placeholder={t(`Nome extra (es. Bacon)`)}
                            />
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              value={String(ext.price || '')}
                              onChangeText={(v) => {
                                const cleaned = v.replace(',', '.');
                                const list = [...(sec.extras || [])];
                                list[idx] = {
                                  ...list[idx],
                                  price: parseFloat(cleaned) || 0,
                                };
                                updateSection(sec.id, { extras: list });
                              }}
                              placeholder={t(`€ 1.50`)}
                              keyboardType="numeric"
                            />
                            <TouchableOpacity
                              accessibilityLabel="Sposta extra in alto"
                              onPress={() => moveSectionChoice(sec.id, 'extras', idx, 'up')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-up" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              accessibilityLabel="Sposta extra in basso"
                              onPress={() => moveSectionChoice(sec.id, 'extras', idx, 'down')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-down" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                const list = (sec.extras || []).filter((_, i) => i !== idx);
                                updateSection(sec.id, { extras: list });
                              }}
                              style={styles.trashMiniBtn}
                            >
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        <TouchableOpacity
                          style={styles.addMiniBtn}
                          onPress={() =>
                            updateSection(sec.id, {
                              extras: [...(sec.extras || []), { name: '', price: 1.0 }],
                            })
                          }
                        >
                          <Text style={styles.addMiniBtnText}>{t(`+ Aggiungi Voce Extra`)}</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {sec.type === 'choice_group' && (
                      <View>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.subLabel}>{t(`Min Scelte:`)}</Text>
                            <TextInput
                              style={styles.input}
                              value={String(sec.min_selection ?? 0)}
                              onChangeText={(v) =>
                                updateSection(sec.id, { min_selection: parseInt(v) || 0 })
                              }
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.subLabel}>{t(`Max Scelte:`)}</Text>
                            <TextInput
                              style={styles.input}
                              value={String(sec.max_selection ?? 1)}
                              onChangeText={(v) =>
                                updateSection(sec.id, { max_selection: parseInt(v) || 1 })
                              }
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                        <Text style={styles.subLabel}>{t(`Opzioni a Scelta (con delta prezzo):`)}</Text>
                        {(sec.options || []).map((opt, idx) => (
                          <View key={idx} style={styles.extraItemRow}>
                            <TextInput
                              style={[styles.input, { flex: 2 }]}
                              value={opt.name}
                              onChangeText={(v) => {
                                const list = [...(sec.options || [])];
                                list[idx] = { ...list[idx], name: v };
                                updateSection(sec.id, { options: list });
                              }}
                              placeholder={t(`Es. Pane Senza Glutine`)}
                            />
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              value={String(opt.price_delta || '')}
                              onChangeText={(v) => {
                                const cleaned = v.replace(',', '.');
                                const list = [...(sec.options || [])];
                                list[idx] = {
                                  ...list[idx],
                                  price_delta: parseFloat(cleaned) || 0,
                                };
                                updateSection(sec.id, { options: list });
                              }}
                              placeholder={t(`+ € 0.00`)}
                              keyboardType="numeric"
                            />
                            <TouchableOpacity
                              accessibilityLabel="Sposta opzione in alto"
                              onPress={() => moveSectionChoice(sec.id, 'options', idx, 'up')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-up" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              accessibilityLabel="Sposta opzione in basso"
                              onPress={() => moveSectionChoice(sec.id, 'options', idx, 'down')}
                              style={styles.orderMiniBtn}
                            >
                              <Ionicons name="chevron-down" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                const list = (sec.options || []).filter((_, i) => i !== idx);
                                updateSection(sec.id, { options: list });
                              }}
                              style={styles.trashMiniBtn}
                            >
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        <TouchableOpacity
                          style={styles.addMiniBtn}
                          onPress={() =>
                            updateSection(sec.id, {
                              options: [...(sec.options || []), { name: '', price_delta: 0 }],
                            })
                          }
                        >
                          <Text style={styles.addMiniBtnText}>{t(`+ Aggiungi Opzione`)}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>{t(`Annulla`)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSave}
              >
                <Text style={styles.modalSaveBtnText}>
                  {editingProduct ? 'Salva Modifiche' : 'Crea Prodotto'}
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'android' ? 24 : 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 160,
  },
  headerTitleColNarrow: {
    width: '100%',
    flexBasis: '100%',
  },
  headerEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  counterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  headerActionsNarrow: {
    width: '100%',
  },
  headerSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerTotemBtn: {
    padding: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  glossaryFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
  },
  glossaryFeedbackSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  glossaryFeedbackError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  glossaryFeedbackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    height: '100%',
  },
  filterBar: {
    paddingBottom: 6,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  productInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  pricePill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  productDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  allergensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  allergensText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
    flex: 1,
  },
  cardFooterRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  cardFooterStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  availToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productOrderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  productOrderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  productOrderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  productOrderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  productOrderArrowBtn: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productOrderArrowBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 18,
    gap: 12,
  },
  formGroup: {
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  catSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catSelectChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  catSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  catSelectChipTextActive: {
    color: '#FFFFFF',
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePreviewBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imagePickerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  imageRemoveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  imageRemoveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  allergensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergenChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allergenChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  allergenChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  allergenChipTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  globalGroupsList: {
    gap: 6,
  },
  globalGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    borderRadius: 8,
  },
  globalGroupItemActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  globalGroupItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  globalGroupItemType: {
    fontSize: 10,
    color: '#64748B',
  },
  addSectionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  addSectionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addSectionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  uiSectionBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  uiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  uiSectionTitleInput: {
    flex: 1,
    fontWeight: '700',
    fontSize: 12,
    color: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 2,
  },
  uiSectionDeleteBtn: {
    padding: 4,
  },
  extraItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  itemOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  itemOrderText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
  },
  trashMiniBtn: {
    padding: 6,
  },
  orderMiniBtn: {
    width: 28,
    height: 32,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMiniBtn: {
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    marginTop: 4,
  },
  addMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
  },
  modalSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  promoActionBtn: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  promoActionBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  promoActionBtnTextActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  featuredToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  featuredToggleBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  featuredToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  featuredToggleTextActive: {
    color: '#B45309',
  },
  featuredFormBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  featuredIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredIconWrapActive: {
    backgroundColor: '#FEF3C7',
  },
  featuredFormTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  featuredFormDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
});
