import React, { useEffect, useState, useCallback } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput as NativeTextInput, Alert, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getGlobalGroups, GlobalOptionGroup, getAllProductsAdmin, createProduct, updateProduct, deleteProduct, getCategories, Product, Category, ComboGroup, UiSection, UiSectionType, ensureProductSections, syncLegacyFromSections, newSectionId, subscribeToDbChanges } from '@/src/api/api';
import * as ImagePicker from 'expo-image-picker';

import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
export default function ProductsManagementScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalGroups, setGlobalGroups] = useState<GlobalOptionGroup[]>([]);
  const [selectedGlobalGroupIds, setSelectedGlobalGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState('');
  const [allergens, setAllergens] = useState('');
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
        getGlobalGroups()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setGlobalGroups(globalGroupsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    resetForm();
    setEditingProduct(null);
    setModalVisible(true);
    try {
      const [gData, cData] = await Promise.all([getGlobalGroups(), getCategories()]);
      setGlobalGroups(gData);
      setCategories(cData);
    } catch (e) {}
  };

  const handleDuplicate = async (product: Product) => {
    setEditingProduct(null);
    setName((product.name || '') + ' (copia)');
    setDescription(product.description || '');
    setPrice(String(product.price ?? ''));
    setCategoryId(product.category_id || '');
    setAvailable(product.available !== false);
    setImage(product.image || '');
    setAllergens(product.allergens?.join(', ') || '');
    setUiSections(ensureProductSections(product, false).map(s => ({ ...s, id: newSectionId() })));
    setSelectedGlobalGroupIds(product.global_group_ids || []);
    setModalVisible(true);
    try {
      const [gData, cData] = await Promise.all([getGlobalGroups(), getCategories()]);
      setGlobalGroups(gData);
      setCategories(cData);
    } catch (e) {}
  };

  const openEditModal = async (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategoryId(product.category_id);
    setAvailable(product.available);
    setImage(product.image || '');
    setAllergens(product.allergens?.join(', ') || '');
    setUiSections(ensureProductSections(product, false));
    setSelectedGlobalGroupIds(product.global_group_ids || []);
    setModalVisible(true);
    try {
      const [gData, cData] = await Promise.all([getGlobalGroups(), getCategories()]);
      setGlobalGroups(gData);
      setCategories(cData);
    } catch (e) {}
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId('');
    setAvailable(true);
    setImage('');
    setAllergens('');
    setUiSections([]);
    setSelectedGlobalGroupIds([]);
  };


  const sortSections = (list: UiSection[]) =>
    [...list].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }));

  const addSection = (type: UiSectionType) => {
    const defaults: Record<UiSectionType, Partial<UiSection>> = {
      base_remove: { title: 'Ingredienti Base', items: [] },
      paid_extras: { title: 'Aggiungi Extra', extras: [] },
      free_chips: { title: 'Salse', chips: [] },
      choice_group: { title: 'Gruppo a scelta', min_selection: 0, max_selection: 1, options: [] },
    };
    setUiSections(prev => sortSections([
      ...prev,
      {
        id: newSectionId(),
        type,
        title: defaults[type].title || 'Sezione',
        enabled: true,
        order: prev.length,
        ...defaults[type],
      } as UiSection,
    ]));
  };

  const updateSection = (id: string, patch: Partial<UiSection>) => {
    setUiSections(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id: string) => {
    setUiSections(prev => sortSections(prev.filter(s => s.id !== id)));
  };

  /** Sposta sezione su (-1) o giù (+1). Riassegna sempre order 0..n dopo lo swap. */
  const moveSection = (id: string, dir: -1 | 1) => {
    setUiSections(prev => {
      const list = sortSections(prev);
      const i = list.findIndex(s => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return prev;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  /** Lista separata da virgola: non filtra i segmenti vuoti mentre si digita (evita salti cursore). */
  const setSectionListText = (id: string, field: 'items' | 'chips', text: string) => {
    const arr = text.split(',').map(x => x.trimStart());
    updateSection(id, { [field]: arr } as any);
  };

  /** Extra nome:prezzo. Mantiene segmenti incompleti mentre si digita. */
  const setExtrasText = (id: string, text: string) => {
    const extras = text.split(',').map(part => {
      const colon = part.indexOf(':');
      if (colon === -1) {
        return { name: part.trimStart(), price: 0 };
      }
      const n = part.slice(0, colon);
      const p = part.slice(colon + 1);
      const cleaned = String(p || '0').replace(',', '.').replace(/[^0-9.]/g, '');
      return {
        name: n.trimStart(),
        price: cleaned === '' || cleaned === '.' ? 0 : parseFloat(cleaned) || 0,
      };
    });
    updateSection(id, { extras });
  };

  const addChoiceOption = (id: string) => {
    setUiSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, options: [...(s.options || []), { name: '', price_delta: 0 }] };
    }));
  };

  const updateChoiceOption = (id: string, oi: number, name: string, priceText: string) => {
    const cleaned = priceText.replace(',', '.').replace(/[^0-9.]/g, '');
    const price_delta = cleaned === '' || cleaned === '.' ? 0 : parseFloat(cleaned) || 0;
    setUiSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      const options = [...(s.options || [])];
      options[oi] = { name, price_delta };
      return { ...s, options };
    }));
  };

  const removeChoiceOption = (id: string, oi: number) => {
    setUiSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, options: (s.options || []).filter((_, i) => i !== oi) };
    }));
  };


  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permesso negato',
          "Consenti l'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini ai prodotti."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.35,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) {
        Alert.alert('Errore', 'Nessuna immagine selezionata');
        return;
      }

      if (asset.base64) {
        const mime = asset.mimeType || 'image/jpeg';
        setImage(`data:${mime};base64,${asset.base64}`);
      } else if (asset.uri) {
        setImage(asset.uri);
      } else {
        Alert.alert('Errore', "Impossibile leggere l'immagine selezionata");
      }
    } catch (e) {
      console.error('pickImage product error', e);
      Alert.alert('Errore', 'Impossibile aprire la galleria. Controlla i permessi foto.');
    }
  };

  const handleSave = async () => {
    if (!name || !description || !price || !categoryId) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    try {
      const ordered = sortSections(uiSections).map(s => ({
        ...s,
        title: (s.title || '').trim() || 'Sezione',
        items: (s.items || []).map(x => x.trim()).filter(Boolean),
        chips: (s.chips || []).map(x => x.trim()).filter(Boolean),
        extras: (s.extras || []).filter(e => e?.name?.trim()).map(e => ({
          name: e.name.trim(),
          price: Number(e.price) || 0,
        })),
        options: (s.options || [])
          .map(o => ({
            name: (o.name || '').trim(),
            price_delta: parseFloat(String(o.price_delta ?? 0).toString().replace(',', '.')) || 0,
          }))
          .filter(o => o.name),
        min_selection: Math.max(0, Number(s.min_selection) || 0),
        max_selection: Math.max(0, Number(s.max_selection) || 1) || 1,
      }));
      const legacy = syncLegacyFromSections(ordered);
      const productData = {
        name,
        description,
        price: parseFloat(String(price || '0').replace(',', '.')) || 0,
        category_id: categoryId,
        available,
        image: image || '',
        allergens: allergens.split(',').map(a => a.trim()).filter(a => a),
        ui_sections: ordered,
        global_group_ids: selectedGlobalGroupIds,
        ...legacy,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id!, productData);
      } else {
        await createProduct(productData);
      }

      setModalVisible(false);
      loadData();
      Alert.alert('Successo', editingProduct ? 'Prodotto aggiornato' : 'Prodotto creato');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Errore', 'Impossibile salvare il prodotto');
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Conferma Eliminazione',
      `Vuoi eliminare "${product.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id!);
              loadData();
              Alert.alert('Successo', 'Prodotto eliminato');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Errore', 'Impossibile eliminare il prodotto');
            }
          }
        }
      ]
    );
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestione Prodotti</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Totale: {products.length} prodotti</Text>
        
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              {product.image ? (
                <Image
                  source={{ uri: product.image }}
                  style={styles.productThumbnail}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productCategory}>{getCategoryName(product.category_id)}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
              </View>
              <View style={styles.productActions}>
                <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => openEditModal(product)} style={styles.editButton}>
                    <Ionicons name="pencil" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDuplicate(product)} style={[styles.editButton, { backgroundColor: '#607D8B' }]}>
                    <Ionicons name="copy-outline" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(product)} style={styles.deleteButton}>
                    <Ionicons name="trash" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.productFooter}>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await updateProduct(product.id, { available: product.available === false ? true : false });
                    loadData();
                  } catch (e) {
                    Alert.alert('Errore', 'Impossibile aggiornare la disponibilità');
                  }
                }}
                activeOpacity={0.7}
                style={[styles.statusBadge, { backgroundColor: product.available !== false ? '#4CAF50' : '#EF4444' }]}
              >
                <Text style={styles.statusText}>{product.available !== false ? '🟢 Disponibile' : '🔴 Esaurito'}</Text>
              </TouchableOpacity>
              {product.product_type === 'combo' && (
                <View style={[styles.statusBadge, { backgroundColor: '#FF6B6B', marginLeft: 8 }]}>
                  <Text style={styles.statusText}>COMBO</Text>
                </View>
              )}
              {product.allergens && product.allergens.length > 0 && (
                <Text style={styles.allergens}>Allergeni: {product.allergens.join(', ')}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal for Create/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Es: Hamburger Classico"
              />

              <Text style={styles.label}>Descrizione *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descrizione del prodotto"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Prezzo (€) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="8.50"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Categoria *</Text>
              <View style={styles.categoryButtons}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      categoryId === cat.id && styles.categoryButtonActive
                    ]}
                    onPress={() => setCategoryId(cat.id!)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      categoryId === cat.id && styles.categoryButtonTextActive
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>


              <View style={{ marginTop: 12, marginBottom: 16 }}>
                <Text style={styles.label}>Gruppi Opzionali Globali</Text>
                <Text style={styles.hintSmall}>
                  Seleziona i gruppi globali (salse, ingredienti, extra o scelte) da collegare a questo prodotto.
                </Text>
                {globalGroups.length === 0 ? (
                  <View style={{ backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8, marginTop: 6 }}>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      Nessun gruppo globale configurato. Creane uno nella scheda "Gruppi" per collegarlo rapidamente qui.
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {globalGroups.map(g => {
                      const isSelected = selectedGlobalGroupIds.includes(g.id);
                      return (
                        <TouchableOpacity
                          key={g.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: isSelected ? '#10B981' : '#E2E8F0',
                            backgroundColor: isSelected ? '#DEF7EC' : '#FFFFFF',
                          }}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedGlobalGroupIds(prev => prev.filter(id => id !== g.id));
                            } else {
                              setSelectedGlobalGroupIds(prev => [...prev, g.id]);
                            }
                          }}
                        >
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={18}
                            color={isSelected ? '#03543F' : '#64748B'}
                          />
                          <Text style={{
                            fontSize: 13,
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? '#03543F' : '#1E293B'
                          }}>
                            {g.name || g.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
              <Text style={styles.label}>Personalizzazioni sul totem</Text>
              <Text style={styles.hintSmall}>
                Aggiungi sezioni, rinomina, attiva/disattiva e sposta su/giù per decidere l'ordine sul totem.
              </Text>

              {sortSections(uiSections).map((section) => (
                <View key={section.id} style={[styles.comboGroupCard, !section.enabled && { opacity: 0.55 }]}>
                  <View style={styles.comboGroupHeader}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      value={section.title}
                      onChangeText={(txt) => updateSection(section.id, { title: txt })}
                      placeholder="Nome sezione (es: Creme, Salse, Extra...)"
                    />
                    <TouchableOpacity
                      onPress={() => moveSection(section.id, -1)}
                      style={styles.orderBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="arrow-up" size={20} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveSection(section.id, 1)}
                      style={styles.orderBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="arrow-down" size={20} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateSection(section.id, { enabled: !section.enabled })}
                      style={[styles.enableBtn, section.enabled && styles.enableBtnOn]}
                    >
                      <Text style={styles.enableBtnText}>{section.enabled ? 'ON' : 'OFF'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeSection(section.id)} style={styles.comboDeleteBtn}>
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.miniLabel}>
                    {section.type === 'base_remove'
                      ? 'Tipo: ingredienti da togliere'
                      : section.type === 'paid_extras'
                        ? 'Tipo: extra a pagamento'
                        : section.type === 'free_chips'
                          ? 'Tipo: scelte gratuite (salse/creme...)'
                          : 'Tipo: gruppo a scelta (min/max + prezzo)'}
                  </Text>

                  {section.type === 'base_remove' && (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={(section.items || []).join(', ')}
                      onChangeText={(txt) => setSectionListText(section.id, 'items', txt)}
                      placeholder="Pane, Carne, Lattuga, Pomodoro"
                      multiline
                    />
                  )}
                  {section.type === 'paid_extras' && (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={(section.extras || []).map(e => `${e.name}:${e.price}`).join(', ')}
                      onChangeText={(txt) => setExtrasText(section.id, txt)}
                      placeholder="Extra Formaggio:1, Bacon:1.5"
                      multiline
                    />
                  )}
                  {section.type === 'free_chips' && (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={(section.chips || []).join(', ')}
                      onChangeText={(txt) => setSectionListText(section.id, 'chips', txt)}
                      placeholder="Ketchup, Maionese, Crema tartufo..."
                      multiline
                    />
                  )}
                  {section.type === 'choice_group' && (
                    <View>
                      <View style={styles.minMaxRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Min</Text>
                          <TextInput
                            style={styles.input}
                            value={String(section.min_selection ?? 0)}
                            onChangeText={(txt) =>
                              updateSection(section.id, {
                                min_selection: parseInt(txt.replace(/[^0-9]/g, '') || '0', 10) || 0,
                              })
                            }
                            keyboardType="number-pad"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Max</Text>
                          <TextInput
                            style={styles.input}
                            value={String(section.max_selection ?? 1)}
                            onChangeText={(txt) =>
                              updateSection(section.id, {
                                max_selection: parseInt(txt.replace(/[^0-9]/g, '') || '1', 10) || 1,
                              })
                            }
                            keyboardType="number-pad"
                          />
                        </View>
                      </View>
                      <Text style={styles.miniLabel}>Opzioni (nome + sovrapprezzo €)</Text>
                      {(section.options || []).map((opt, oi) => (
                        <View key={oi} style={styles.optionRow}>
                          <TextInput
                            style={[styles.input, { flex: 2, marginBottom: 0 }]}
                            value={opt.name}
                            onChangeText={(txt) =>
                              updateChoiceOption(section.id, oi, txt, String(opt.price_delta ?? 0))
                            }
                            placeholder="Es: Patatine"
                          />
                          <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            value={String(opt.price_delta ?? 0)}
                            onChangeText={(txt) => updateChoiceOption(section.id, oi, opt.name, txt)}
                            keyboardType="decimal-pad"
                            placeholder="0.50"
                          />
                          <TouchableOpacity onPress={() => removeChoiceOption(section.id, oi)} style={styles.optDeleteBtn}>
                            <Ionicons name="close" size={18} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addOptBtn} onPress={() => addChoiceOption(section.id)}>
                        <Ionicons name="add" size={18} color="#FF6B6B" />
                        <Text style={styles.addOptText}>Aggiungi opzione</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              <Text style={[styles.miniLabel, { marginTop: 8 }]}>Aggiungi sezione</Text>
              <View style={styles.addSectionRow}>
                <TouchableOpacity style={styles.addSectionBtn} onPress={() => addSection('base_remove')}>
                  <Text style={styles.addSectionText}>+ Ingredienti</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addSectionBtn} onPress={() => addSection('paid_extras')}>
                  <Text style={styles.addSectionText}>+ Extra €</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addSectionBtn} onPress={() => addSection('free_chips')}>
                  <Text style={styles.addSectionText}>+ Salse/Creme</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addSectionBtn} onPress={() => addSection('choice_group')}>
                  <Text style={styles.addSectionText}>+ Gruppo scelta</Text>
                </TouchableOpacity>
              </View>

              {/* GRUPPI EXTRA GLOBALI COLLEGATI */}
              <View style={{ marginTop: 12, marginBottom: 8, padding: 12, backgroundColor: '#F0F7FF', borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369A1', marginBottom: 4 }}>
                  📚 Gruppi Extra Globali ({selectedGlobalGroupIds.length} collegati)
                </Text>
                <Text style={{ fontSize: 12, color: '#0284C7', marginBottom: 10 }}>
                  I gruppi selezionati vengono aggiunti automaticamente a questo prodotto al momento dell'ordine.
                </Text>
                {globalGroups && globalGroups.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {globalGroups.map(g => {
                      const isSelected = selectedGlobalGroupIds.includes(g.id);
                      return (
                        <TouchableOpacity
                          key={g.id}
                          onPress={() => {
                            setSelectedGlobalGroupIds(prev =>
                              isSelected ? prev.filter(x => x !== g.id) : [...prev, g.id]
                            );
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: isSelected ? '#0284C7' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: isSelected ? '#0284C7' : '#CBD5E1',
                          }}
                        >
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={18}
                            color={isSelected ? '#FFFFFF' : '#64748B'}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '600',
                              color: isSelected ? '#FFFFFF' : '#334155',
                            }}
                          >
                            {g.title || g.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                    Nessun gruppo globale configurato. Creane uno nella sezione Gruppi.
                  </Text>
                )}
              </View>

              <Text style={styles.label}>Allergeni (separati da virgola)</Text>
              <TextInput
                style={styles.input}
                value={allergens}
                onChangeText={setAllergens}
                placeholder="glutine, lattosio, uova"
              />

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Disponibile</Text>
                <TouchableOpacity
                  style={[styles.switch, available && styles.switchActive]}
                  onPress={() => setAvailable(!available)}
                >
                  <View style={[styles.switchThumb, available && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Immagine (opzionale)</Text>
              {image ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage('')}>
                    <Ionicons name="trash" size={18} color="white" />
                    <Text style={styles.removeImageText}>Rimuovi</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#FF6B6B" />
                <Text style={styles.imageButtonText}>
                  {image ? 'Cambia Immagine' : 'Aggiungi Immagine'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Salva</Text>
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    padding: 8,
    borderRadius: 8,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  allergens: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  categoryButtonActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switch: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCC',
    padding: 4,
  },
  switchActive: {
    backgroundColor: '#4CAF50',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  imagePreviewWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeImageText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  imageButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  typeBtnActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  typeBtnTextActive: {
    color: '#FF6B6B',
  },
  hintSmall: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18,
  },
  orderBtn: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#EEE',
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  enableBtn: {
    paddingHorizontal: 10, height: 40, borderRadius: 8, backgroundColor: '#BDBDBD',
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  enableBtnOn: { backgroundColor: '#43A047' },
  enableBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  addSectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  addSectionBtn: {
    backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  addSectionText: { color: 'white', fontWeight: '700', fontSize: 13 },
  comboEditor: {
    marginBottom: 16,
  },
  comboGroupCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  comboGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  comboDeleteBtn: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minMaxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optDeleteBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addOptText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 14,
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  addGroupText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
