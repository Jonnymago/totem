import React, { useState, useEffect, useCallback } from 'react';
import { View, Text as NativeText, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput as NativeTextInput, ScrollView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getGlobalGroups, createGlobalGroup, updateGlobalGroup, deleteGlobalGroup, GlobalOptionGroup, UiSectionType, ExtraAddition, ComboGroupOption } from '@/src/api/api';

import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
export default function GroupsManagementScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<GlobalOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GlobalOptionGroup | null>(null);

  // Form
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<UiSectionType>('free_chips');
  const [items, setItems] = useState('');
  const [extras, setExtras] = useState<ExtraAddition[]>([]);
  const [chips, setChips] = useState('');
  const [options, setOptions] = useState<ComboGroupOption[]>([]);
  const [minSelection, setMinSelection] = useState('0');
  const [maxSelection, setMaxSelection] = useState('1');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const data = await getGlobalGroups();
    setGroups(data);
    setLoading(false);
  };

  const openNewModal = () => {
    setEditingGroup(null);
    setName('');
    setTitle('');
    setType('free_chips');
    setItems('');
    setExtras([]);
    setChips('');
    setOptions([]);
    setMinSelection('0');
    setMaxSelection('1');
    setModalVisible(true);
  };

  const openEditModal = (g: GlobalOptionGroup) => {
    setEditingGroup(g);
    setName(g.name || '');
    setTitle(g.title || '');
    setType(g.type || 'free_chips');
    setItems(g.items?.join(', ') || '');
    setExtras(g.extras || []);
    setChips(g.chips?.join(', ') || '');
    setOptions(g.options || []);
    setMinSelection(String(g.min_selection ?? 0));
    setMaxSelection(String(g.max_selection ?? 1));
    setModalVisible(true);
  };

  const handleSave = async () => {
    const finalName = name.trim() || title.trim();
    const finalTitle = title.trim() || name.trim();
    if (!finalName && !finalTitle) {
      Alert.alert('Errore', 'Inserisci il nome o titolo del gruppo');
      return;
    }
    const groupData: Partial<GlobalOptionGroup> = {
      name: finalName,
      title: finalTitle,
      type,
      items: items.split(',').map(x => x.trim()).filter(Boolean),
      chips: chips.split(',').map(x => x.trim()).filter(Boolean),
      extras: extras.filter(e => e.name.trim()).map(e => ({ name: e.name.trim(), price: e.price })),
      options: options.filter(o => o.name.trim()).map(o => ({ name: o.name.trim(), price_delta: o.price_delta })),
      min_selection: parseInt(minSelection) || 0,
      max_selection: parseInt(maxSelection) || 1,
    };
    try {
      if (editingGroup) {
        await updateGlobalGroup(editingGroup.id, groupData);
      } else {
        await createGlobalGroup(groupData);
      }
      setModalVisible(false);
      loadData();
    } catch (e) {
      Alert.alert('Errore', 'Impossibile salvare il gruppo');
    }
  };

  const handleDelete = (g: GlobalOptionGroup) => {
    Alert.alert('Elimina', `Vuoi eliminare ${g.name}?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => {
        await deleteGlobalGroup(g.id);
        loadData();
      }}
    ]);
  };

  const renderTypeEditor = () => {
    if (type === 'base_remove') {
      return (
        <View>
          <Text style={styles.label}>Ingredienti (separati da virgola)</Text>
          <TextInput style={styles.input} value={items} onChangeText={setItems} placeholder="Es: Pomodoro, Lattuga" />
        </View>
      );
    }
    if (type === 'free_chips') {
      return (
        <View>
          <Text style={styles.label}>Elementi (separati da virgola)</Text>
          <TextInput style={styles.input} value={chips} onChangeText={setChips} placeholder="Es: Maionese, Ketchup" />
        </View>
      );
    }
    if (type === 'paid_extras') {
      return (
        <View>
          <Text style={styles.label}>Lista Extra (€)</Text>
          {extras.map((e, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput style={[styles.input, { flex: 2 }]} value={e.name} onChangeText={v => setExtras(ex => ex.map((x, idx) => idx === i ? { ...x, name: v } : x))} placeholder="Nome" />
              <TextInput style={[styles.input, { flex: 1 }]} value={String(e.price)} onChangeText={v => {
                  const cleaned = v.replace(',', '.').replace(/[^0-9.]/g, '');
                  const p = cleaned === '' || cleaned === '.' ? 0 : parseFloat(cleaned) || 0;
                  setExtras(ex => ex.map((x, idx) => idx === i ? { ...x, price: p } : x));
                }} keyboardType="numeric" />
              <TouchableOpacity onPress={() => setExtras(ex => ex.filter((_, idx) => idx !== i))} style={{ justifyContent: 'center', padding: 8 }}>
                <Ionicons name="trash" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => setExtras([...extras, { name: '', price: 0 }])} style={{ padding: 8, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600' }}>+ Aggiungi extra</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (type === 'choice_group') {
      return (
        <View>
          <Text style={styles.label}>Min selezioni / Max selezioni</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput style={[styles.input, { flex: 1 }]} value={minSelection} onChangeText={setMinSelection} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1 }]} value={maxSelection} onChangeText={setMaxSelection} keyboardType="numeric" />
          </View>
          <Text style={styles.label}>Opzioni</Text>
          {options.map((o, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput style={[styles.input, { flex: 2 }]} value={o.name} onChangeText={v => setOptions(opts => opts.map((x, idx) => idx === i ? { ...x, name: v } : x))} placeholder="Nome opzione" />
              <TextInput style={[styles.input, { flex: 1 }]} value={String(o.price_delta)} onChangeText={v => {
                  const cleaned = v.replace(',', '.').replace(/[^0-9.-]/g, '');
                  const p = cleaned === '' || cleaned === '.' || cleaned === '-' ? 0 : parseFloat(cleaned) || 0;
                  setOptions(opts => opts.map((x, idx) => idx === i ? { ...x, price_delta: p } : x));
                }} keyboardType="numeric" />
              <TouchableOpacity onPress={() => setOptions(opts => opts.filter((_, idx) => idx !== i))} style={{ justifyContent: 'center', padding: 8 }}>
                <Ionicons name="trash" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => setOptions([...options, { name: '', price_delta: 0 }])} style={{ padding: 8, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600' }}>+ Aggiungi opzione</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gruppi Extra Globali</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.totemBtnHeader}>
            <Ionicons name="storefront" size={18} color="white" />
            <Text style={styles.totemBtnHeaderText}>Totem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openNewModal}>
            <Ionicons name="add-circle" size={36} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={groups}
        keyExtractor={g => g.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={{ color: '#666', marginBottom: 4 }}>Titolo: {item.title}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>Tipo: {item.type}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={{ backgroundColor: '#2196F3', padding: 10, borderRadius: 8 }}>
                <Ionicons name="pencil" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ backgroundColor: '#FF4444', padding: 10, borderRadius: 8 }}>
                <Ionicons name="trash" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{editingGroup ? 'Modifica Gruppo' : 'Nuovo Gruppo'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} /></TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20, maxHeight: 500 }}>
              <Text style={styles.label}>Nome Interno (es: Salse Panini)</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />
              
              <Text style={styles.label}>Titolo per cliente (es: Scegli salse)</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} />
              
              <Text style={styles.label}>Tipo Sezione</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {[
                  { k: 'base_remove', v: 'Ingredienti base' },
                  { k: 'free_chips', v: 'Salse gratuite' },
                  { k: 'paid_extras', v: 'Extra a pagamento' },
                  { k: 'choice_group', v: 'Scelta obbligatoria' }
                ].map(t => (
                  <TouchableOpacity 
                    key={t.k} 
                    onPress={() => setType(t.k as any)}
                    style={{ padding: 10, borderRadius: 8, backgroundColor: type === t.k ? '#FF6B6B' : '#eee' }}
                  >
                    <Text style={{ color: type === t.k ? 'white' : '#333' }}>{t.v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {renderTypeEditor()}
              <View style={{ height: 40 }} />
            </ScrollView>
            <View style={{ flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderColor: '#eee' }}>
              <TouchableOpacity style={{ flex: 1, padding: 16, alignItems: 'center' }} onPress={() => setModalVisible(false)}>
                <Text>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 16, backgroundColor: '#FF6B6B', borderRadius: 8, alignItems: 'center' }} onPress={handleSave}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { backgroundColor: '#FF6B6B', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  addButton: { padding: 8 },
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
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 12, marginBottom: 4, color: '#333' },
  input: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' }
});
