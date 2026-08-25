import React, { useEffect, useState, useCallback } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput as NativeTextInput, Alert, Image, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, createCategory, updateCategory, deleteCategory, Category, subscribeToDbChanges } from '@/src/api/api';
import * as ImagePicker from 'expo-image-picker';

import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
export default function CategoriesManagementScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState('0');
  const [image, setImage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      const unsubscribe = subscribeToDbChanges((type) => {
        if (type === 'categories' || type === 'all') {
          loadCategories();
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Errore', 'Impossibile caricare le categorie');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingCategory(null);
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
    setOrderIndex(category.order_index.toString());
    setImage(category.image || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setOrderIndex('0');
    setImage('');
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permesso negato',
          'Consenti l\'accesso alle foto nelle impostazioni Android/FydeOS per aggiungere immagini alle categorie.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        // niente ritaglio: su FydeOS/Android container often fails with allowsEditing
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
        // fallback senza base64 (alcuni device)
        setImage(asset.uri);
      } else {
        Alert.alert('Errore', 'Impossibile leggere l\'immagine selezionata');
      }
    } catch (e) {
      console.error('pickImage category error', e);
      Alert.alert('Errore', 'Impossibile aprire la galleria. Controlla i permessi foto.');
    }
  };

  const handleSave = async () => {
    if (!name || !description) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    try {
      const categoryData = {
        name,
        description,
        order_index: parseInt(orderIndex) || 0,
        image: image || ''
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id!, categoryData);
      } else {
        await createCategory(categoryData);
      }

      setModalVisible(false);
      loadCategories();
      Alert.alert('Successo', editingCategory ? 'Categoria aggiornata' : 'Categoria creata');
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Errore', 'Impossibile salvare la categoria');
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Conferma Eliminazione',
      `Vuoi eliminare la categoria "${category.name}"? Tutti i prodotti associati rimarranno ma non saranno più visibili.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id!);
              loadCategories();
              Alert.alert('Successo', 'Categoria eliminata');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Errore', 'Impossibile eliminare la categoria');
            }
          }
        }
      ]
    );
  };

  const getCategoryIcon = (name: string) => {
    const icons: { [key: string]: any } = {
      'Panini': 'fast-food',
      'Pizze': 'pizza',
      'Insalate': 'leaf',
      'Bevande': 'beer',
      'Dolci': 'ice-cream'
    };
    return icons[name] || 'restaurant';
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
        <Text style={styles.headerTitle}>Gestione Categorie</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.totemBtnHeader}>
            <Ionicons name="storefront" size={18} color="white" />
            <Text style={styles.totemBtnHeaderText}>Totem</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Totale: {categories.length} categorie</Text>
        
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryIconContainer}>
              {category.image ? (
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name={getCategoryIcon(category.name)} size={32} color="#FF6B6B" />
              )}
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              <Text style={styles.categoryOrder}>Ordine: {category.order_index}</Text>
            </View>
            <View style={styles.categoryActions}>
              <TouchableOpacity onPress={() => openEditModal(category)} style={styles.editButton}>
                <Ionicons name="pencil" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(category)} style={styles.deleteButton}>
                <Ionicons name="trash" size={20} color="white" />
              </TouchableOpacity>
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
                {editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Es: Panini"
              />

              <Text style={styles.label}>Descrizione *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descrizione della categoria"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Ordine visualizzazione</Text>
              <TextInput
                style={styles.input}
                value={orderIndex}
                onChangeText={setOrderIndex}
                placeholder="0"
                keyboardType="number-pad"
              />

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

              <Text style={styles.hint}>
                Le categorie vengono ordinate per indice crescente. 0 = prima categoria.
              </Text>
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
  totemBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  totemBtnHeaderText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
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
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE4E4',
  },
  categoryThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryOrder: {
    fontSize: 12,
    color: '#999',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    padding: 10,
    borderRadius: 8,
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
    maxHeight: '80%',
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
  hint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 16,
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
