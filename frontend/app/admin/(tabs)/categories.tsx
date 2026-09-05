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
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  moveCategory,
  getAllProductsAdmin,
  Category,
  Product,
  subscribeToDbChanges,
} from '@/src/api/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { sanitizeImageUri } from '@/src/utils/imageUtils';
import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';

export default function CategoriesManagementScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { height: viewportHeight } = useWindowDimensions();
  const modalHeight = Math.max(360, Math.min(760, viewportHeight - 32));
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState('0');
  const [image, setImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
      const unsubscribe = subscribeToDbChanges((type) => {
        if (type === 'categories' || type === 'products' || type === 'all') {
          loadData();
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([getCategories(), getAllProductsAdmin()]);
      setCategories(cats);
      setProducts(prods);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert(t('Errore'), t('Impossibile caricare le categorie'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingCategory(null);
    setOrderIndex(String(categories.length + 1));
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name || '');
    setDescription(category.description || '');
    setOrderIndex(String((category.order_index ?? 0) + 1));
    setImage(sanitizeImageUri(category.image) || category.image || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      resetForm();
      setEditingCategory(null);
    }, 60);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setOrderIndex('1');
    setImage('');
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permesso negato',
          'Consenti l\'accesso alle foto nelle impostazioni del tablet per aggiungere immagini alle categorie.'
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
      console.error('pickImage category error', e);
      Alert.alert(t('Errore'), t('Impossibile aprire la galleria.'));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('Errore'), t('Inserisci il nome della categoria'));
      return;
    }

    const humanPosition = Number.parseInt(orderIndex, 10);
    const maximumPosition = editingCategory ? categories.length : categories.length + 1;
    if (!Number.isInteger(humanPosition) || humanPosition < 1 || humanPosition > maximumPosition) {
      Alert.alert(t('Posizione non valida'), `${t('Inserisci una posizione da 1 a')} ${maximumPosition}.`);
      return;
    }

    try {
      const categoryData = {
        name: name.trim(),
        description: description.trim(),
        order_index: humanPosition - 1,
        image: image || '',
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id!, categoryData);
      } else {
        await createCategory(categoryData);
      }

      closeModal();
      loadData();
      Alert.alert(t('Successo'), editingCategory ? t('Categoria aggiornata') : t('Categoria creata'));
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert(t('Errore'), t('Impossibile salvare la categoria'));
    }
  };

  const handleMoveCategory = async (category: Category, direction: 'up' | 'down') => {
    try {
      await moveCategory(category.id, direction);
      await loadData();
    } catch (error) {
      console.error('Error moving category:', error);
      Alert.alert(t('Errore'), t('Impossibile aggiornare la posizione della categoria'));
    }
  };

  const handleDelete = (category: Category) => {
    const count = products.filter((p) => p.category_id === category.id).length;
    Alert.alert(
      t(t('Conferma Eliminazione')),
      `${t('Vuoi eliminare la categoria')} "${category.name}"? ${
        count > 0
          ? `Attenzione: contiene ${count} prodotti collegati.`
          : 'Nessun prodotto collegato.'
      }`,
      [
        { text: t('Annulla'), style: 'cancel' },
        {
          text: t('Elimina'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id!);
              loadData();
              Alert.alert(t('Successo'), t('Categoria eliminata'));
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert(t('Errore'), t('Impossibile eliminare la categoria'));
            }
          },
        },
      ]
    );
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sorted = [...categories].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    if (!query) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>{t(`Caricamento categorie...`)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title={t(`Categorie`)}
        subtitle={t(`Organizzazione e reparti del menu`)}
        emoji="▦"
        counter={filteredCategories.length}
        showBack={false}
        showTotemButton={true}
        rightActions={
          <TouchableOpacity
            style={styles.headerPrimaryBtn}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.headerPrimaryBtnText}>{t(`Nuova Categoria`)}</Text>
          </TouchableOpacity>
        }
      />

      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t(`Cerca categoria...`)}
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

      {/* Category List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>{t(`▦`)}</Text>
            <Text style={styles.emptyTitle}>{t(`Nessuna categoria trovata`)}</Text>
            <Text style={styles.emptySubtitle}>{t(`
              Crea una nuova categoria per organizzare il menu del totem.
            `)}</Text>
          </View>
        ) : (
          filteredCategories.map((cat, visibleIndex) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            const isFirst = visibleIndex === 0;
            const isLast = visibleIndex === filteredCategories.length - 1;
            return (
              <View key={cat.id} style={styles.categoryCard}>
                <View style={styles.cardMainRow}>
                  {/* Thumbnail */}
                  <View style={styles.thumbnailBox}>
                    {sanitizeImageUri(cat.image) ? (
                      <ExpoImage
                        source={{ uri: sanitizeImageUri(cat.image)! }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                        transition={120}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text style={{ fontSize: 24 }}>{t(`▦`)}</Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.infoCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>{count} prodotti</Text>
                      </View>
                    </View>

                    {cat.description ? (
                      <Text style={styles.categoryDesc} numberOfLines={2}>
                        {cat.description}
                      </Text>
                    ) : null}

                    <View style={styles.orderBadge}>
                      <Ionicons name="swap-vertical-outline" size={12} color="#64748B" />
                      <Text style={styles.orderBadgeText}>Posizione: #{(cat.order_index ?? 0) + 1}</Text>
                      <TouchableOpacity
                        accessibilityLabel="Sposta categoria in alto"
                        onPress={() => { void handleMoveCategory(cat, 'up'); }}
                        style={[styles.orderArrowBtn, isFirst && styles.orderArrowBtnDisabled]}
                        disabled={isFirst}
                      >
                        <Ionicons name="chevron-up" size={16} color={isFirst ? '#CBD5E1' : '#2563EB'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel="Sposta categoria in basso"
                        onPress={() => { void handleMoveCategory(cat, 'down'); }}
                        style={[styles.orderArrowBtn, isLast && styles.orderArrowBtnDisabled]}
                        disabled={isLast}
                      >
                        <Ionicons name="chevron-down" size={16} color={isLast ? '#CBD5E1' : '#2563EB'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.cardFooterRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openEditModal(cat)}
                  >
                    <Ionicons name="pencil" size={16} color="#2563EB" />
                    <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t(`Modifica`)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#FECACA' }]}
                    onPress={() => handleDelete(cat)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>{t(`Elimina`)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: modalHeight }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Nome Categoria *`)}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t(`Es: Burger Speciali, Bevande...`)}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Descrizione`)}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t(`Descrizione sintetica per i clienti...`)}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Ordine di Visualizzazione (Priorità)`)}</Text>
                <TextInput
                  style={styles.input}
                  value={orderIndex}
                  onChangeText={setOrderIndex}
                  placeholder={`Da 1 a ${editingCategory ? categories.length : categories.length + 1}`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Foto Icona Categoria`)}</Text>
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
                      <Text style={{ fontSize: 24 }}>{t(`▦`)}</Text>
                    )}
                  </View>
                  <View style={styles.imagePickerActions}>
                    <TouchableOpacity
                      style={styles.imagePickerBtn}
                      onPress={pickImage}
                    >
                      <Ionicons name="image-outline" size={16} color="#1E293B" />
                      <Text style={styles.imagePickerBtnText}>{t(`Scegli Foto`)}</Text>
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
            </ScrollView>

            {/* Footer */}
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
                  {editingCategory ? 'Salva Modifiche' : 'Crea Categoria'}
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
    minWidth: 140,
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
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
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
  categoryCard: {
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
    width: 56,
    height: 56,
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
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  badgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  categoryDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 3,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  orderBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  orderArrowBtn: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderArrowBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    maxWidth: 500,
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
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
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
    height: 50,
    textAlignVertical: 'top',
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
});
