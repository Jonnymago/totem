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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getGlobalGroups,
  createGlobalGroup,
  updateGlobalGroup,
  deleteGlobalGroup,
  moveGlobalGroup,
  GlobalOptionGroup,
  UiSectionType,
  subscribeToDbChanges,
} from '@/src/api/api';
import { Text, TextInput } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';

function splitCsv(value: string): string[] {
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function moveAtIndex<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export default function GlobalGroupsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions();
  const modalHeight = Math.max(420, Math.min(820, viewportHeight - 32));
  const isNarrowViewport = viewportWidth < 460;
  const [groups, setGroups] = useState<GlobalOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GlobalOptionGroup | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<UiSectionType>('base_remove');
  const [itemsText, setItemsText] = useState('');
  const [chipsText, setChipsText] = useState('');
  const [extras, setExtras] = useState<Array<{ name: string; price: number }>>([]);
  const [options, setOptions] = useState<Array<{ name: string; price_delta: number }>>([]);
  const [minSelection, setMinSelection] = useState('0');
  const [maxSelection, setMaxSelection] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadGroups();
      const unsubscribe = subscribeToDbChanges((t) => {
        if (t === 'groups' || t === 'all') {
          loadGroups();
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const loadGroups = async () => {
    try {
      const data = await getGlobalGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading global groups:', error);
      Alert.alert(t('Errore'), t('Impossibile caricare gli ingredienti'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingGroup(null);
    setModalVisible(true);
  };

  const openEditModal = (group: GlobalOptionGroup) => {
    setEditingGroup(group);
    setName(group.name || '');
    setDescription(group.description || '');
    setType(group.type || 'base_remove');
    setItemsText((group.items || []).join(', '));
    setChipsText((group.chips || []).join(', '));
    setExtras(group.extras || []);
    setOptions(group.options || []);
    setMinSelection(String(group.min_selection ?? 0));
    setMaxSelection(String(group.max_selection ?? 1));
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('base_remove');
    setItemsText('');
    setChipsText('');
    setExtras([]);
    setOptions([]);
    setMinSelection('0');
    setMaxSelection('1');
  };

  const moveCsvEntry = (
    value: string,
    setValue: (next: string) => void,
    index: number,
    direction: 'up' | 'down'
  ) => {
    setValue(moveAtIndex(splitCsv(value), index, direction).join(', '));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('Campi Mancanti'), t('Inserisci il nome della raccolta ingredienti'));
      return;
    }

    try {
      const groupData: Partial<GlobalOptionGroup> = {
        name: name.trim(),
        description: description.trim(),
        type,
      };

      if (type === 'base_remove') {
        groupData.items = itemsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (type === 'free_chips') {
        groupData.chips = chipsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (type === 'paid_extras') {
        groupData.extras = extras
          .filter((e) => e.name.trim())
          .map((e) => ({
            name: e.name.trim(),
            price: Number(e.price) || 0,
          }));
      } else if (type === 'choice_group') {
        groupData.options = options
          .filter((o) => o.name.trim())
          .map((o) => ({
            name: o.name.trim(),
            price_delta: Number(o.price_delta) || 0,
          }));
        groupData.min_selection = Math.max(0, parseInt(minSelection) || 0);
        groupData.max_selection = Math.max(0, parseInt(maxSelection) || 1);
      }

      if (editingGroup) {
        await updateGlobalGroup(editingGroup.id, groupData);
      } else {
        await createGlobalGroup(groupData as any);
      }

      setModalVisible(false);
      loadGroups();
      Alert.alert(t('Successo'), editingGroup ? t('Ingredienti aggiornati') : t('Ingredienti creati'));
    } catch (error) {
      console.error('Error saving global group:', error);
      Alert.alert(t('Errore'), t('Impossibile salvare gli ingredienti'));
    }
  };

  const handleMoveGroup = async (group: GlobalOptionGroup, direction: 'up' | 'down') => {
    try {
      await moveGlobalGroup(group.id, direction);
      await loadGroups();
    } catch (error) {
      console.error('Error moving global group:', error);
      Alert.alert(t('Errore'), t('Impossibile aggiornare la posizione degli ingredienti'));
    }
  };

  const handleDelete = (group: GlobalOptionGroup) => {
    Alert.alert(t(t('Conferma Eliminazione')), `${t('Vuoi eliminare gli ingredienti')} \"${group.name}\"?`, [
      { text: t('Annulla'), style: 'cancel' },
      {
        text: t('Elimina'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGlobalGroup(group.id);
            loadGroups();
            Alert.alert(t('Successo'), t('Ingredienti eliminati'));
          } catch (error) {
            console.error('Error deleting group:', error);
            Alert.alert(t('Errore'), t('Impossibile eliminare gli ingredienti'));
          }
        },
      },
    ]);
  };

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        (g.description && g.description.toLowerCase().includes(query))
    );
  }, [groups, searchQuery]);

  const getTypeLabel = (t: UiSectionType) => {
    switch (t) {
      case 'base_remove':
        return { label: 'Ingredienti Base', color: '#16A34A', bg: '#DCFCE7' };
      case 'paid_extras':
        return { label: 'Extra a Pagamento', color: '#9333EA', bg: '#F3E8FF' };
      case 'free_chips':
        return { label: 'Salse / Scelte', color: '#2563EB', bg: '#EFF6FF' };
      case 'choice_group':
        return { label: 'Gruppo a Scelta', color: '#D97706', bg: '#FEF3C7' };
      default:
        return { label: t, color: '#475569', bg: '#F1F5F9' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>{t(`Caricamento ingredienti...`)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title={t(`Ingredienti & Varianti`)}
        subtitle={t(`Libreria di ingredienti, salse, extra e scelte riutilizzabili`)}
        emoji="📚"
        counter={filteredGroups.length}
        showBack={false}
        showTotemButton={true}
        rightActions={
          <TouchableOpacity
            style={styles.headerPrimaryBtn}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.headerPrimaryBtnText}>{t(`Nuovi Ingredienti`)}</Text>
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t(`Cerca ingredienti, salse o extra...`)}
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

      {/* Groups List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>{t(`📚`)}</Text>
            <Text style={styles.emptyTitle}>{t(`Nessun ingrediente configurato`)}</Text>
            <Text style={styles.emptySubtitle}>{t(`
              Crea raccolte di salse, ingredienti o extra per collegarle facilmente a tutti i panini e piatti.
            `)}</Text>
          </View>
        ) : (
          filteredGroups.map((group, visibleIndex) => {
            const badge = getTypeLabel(group.type);
            const isFirst = visibleIndex === 0;
            const isLast = visibleIndex === filteredGroups.length - 1;
            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={[styles.cardHeaderRow, isNarrowViewport && styles.cardHeaderRowNarrow]}>
                  <View style={[styles.groupTitleBlock, isNarrowViewport && styles.groupTitleBlockNarrow]}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description ? (
                      <Text style={styles.groupDesc}>{group.description}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: badge.bg }, isNarrowViewport && styles.typeBadgeNarrow]}>
                    <Text style={[styles.typeBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <View style={[styles.orderActions, isNarrowViewport && styles.orderActionsNarrow]}>
                    <TouchableOpacity
                      accessibilityLabel="Sposta ingredienti in alto"
                      onPress={() => { void handleMoveGroup(group, 'up'); }}
                      style={[styles.orderArrowBtn, isFirst && styles.orderArrowBtnDisabled]}
                      disabled={isFirst}
                    >
                      <Ionicons name="chevron-up" size={16} color={isFirst ? '#CBD5E1' : '#2563EB'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel="Sposta ingredienti in basso"
                      onPress={() => { void handleMoveGroup(group, 'down'); }}
                      style={[styles.orderArrowBtn, isLast && styles.orderArrowBtnDisabled]}
                      disabled={isLast}
                    >
                      <Ionicons name="chevron-down" size={16} color={isLast ? '#CBD5E1' : '#2563EB'} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Items Preview */}
                <View style={styles.itemsPreviewContainer}>
                  {group.type === 'base_remove' && (
                    <Text style={styles.itemsPreviewText}>
                      Ingredienti: {(group.items || []).join(', ') || 'Nessuno'}
                    </Text>
                  )}
                  {group.type === 'free_chips' && (
                    <Text style={styles.itemsPreviewText}>
                      Opzioni: {(group.chips || []).join(', ') || 'Nessuna'}
                    </Text>
                  )}
                  {group.type === 'paid_extras' && (
                    <Text style={styles.itemsPreviewText}>
                      Extra: {(group.extras || []).map((e) => `${e.name} (+€${Number(e.price).toFixed(2)})`).join(', ') || 'Nessuno'}
                    </Text>
                  )}
                  {group.type === 'choice_group' && (
                    <Text style={styles.itemsPreviewText}>
                      Scelte (min {group.min_selection ?? 0} - max {group.max_selection ?? 1}):{' '}
                      {(group.options || []).map((o) => `${o.name} (${Number(o.price_delta) >= 0 ? '+' : ''}€${Number(o.price_delta).toFixed(2)})`).join(', ') || 'Nessuna'}
                    </Text>
                  )}
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooterRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openEditModal(group)}
                  >
                    <Ionicons name="pencil" size={16} color="#2563EB" />
                    <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t(`Modifica`)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#FECACA' }]}
                    onPress={() => handleDelete(group)}
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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: modalHeight }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGroup ? 'Modifica Ingredienti' : 'Nuovi Ingredienti'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
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
                <Text style={styles.formLabel}>{t(`Nome raccolta ingredienti *`)}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t(`Es: Ingredienti Standard Burger, Salse Speciali...`)}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Descrizione`)}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t(`Note interne o descrizione...`)}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Group Type Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t(`Tipo di ingredienti`)}</Text>
                <View style={styles.typeSelectorRow}>
                  {[
                    { id: 'base_remove', label: 'Ingredienti Base' },
                    { id: 'paid_extras', label: 'Extra a Pagamento' },
                    { id: 'free_chips', label: 'Salse / Scelte' },
                    { id: 'choice_group', label: 'Gruppo a Scelta' },
                  ].map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.typeSelectPill,
                        type === t.id && styles.typeSelectPillActive,
                      ]}
                      onPress={() => setType(t.id as UiSectionType)}
                    >
                      <Text
                        style={[
                          styles.typeSelectPillText,
                          type === t.id && styles.typeSelectPillTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dynamic Type Inputs */}
              {type === 'base_remove' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t(`
                    Lista Ingredienti Base (separati da virgola):
                  `)}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={itemsText}
                    onChangeText={setItemsText}
                    placeholder={t(`Pomodoro, Lattuga, Cheddar, Bacon, Cipolla`)}
                    placeholderTextColor="#94A3B8"
                    multiline
                  />
                  {splitCsv(itemsText).length > 0 ? (
                    <View style={styles.inlineOrderList}>
                      <Text style={styles.orderHint}>{t(`Ordine visualizzato al cliente`)}</Text>
                      {splitCsv(itemsText).map((item, idx, allItems) => (
                        <View key={`${item}-${idx}`} style={styles.inlineOrderRow}>
                          <Text style={styles.inlineOrderLabel}>{idx + 1}. {item}</Text>
                          <View style={styles.orderActions}>
                            <TouchableOpacity
                              accessibilityLabel="Sposta ingrediente in alto"
                              disabled={idx === 0}
                              onPress={() => moveCsvEntry(itemsText, setItemsText, idx, 'up')}
                              style={[styles.orderArrowBtn, idx === 0 && styles.orderArrowBtnDisabled]}
                            >
                              <Ionicons name="chevron-up" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              accessibilityLabel="Sposta ingrediente in basso"
                              disabled={idx === allItems.length - 1}
                              onPress={() => moveCsvEntry(itemsText, setItemsText, idx, 'down')}
                              style={[styles.orderArrowBtn, idx === allItems.length - 1 && styles.orderArrowBtnDisabled]}
                            >
                              <Ionicons name="chevron-down" size={16} color="#2563EB" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}

              {type === 'free_chips' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t(`
                    Lista Opzioni / Salse Gratuite (separate da virgola):
                  `)}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={chipsText}
                    onChangeText={setChipsText}
                    placeholder={t(`Maionese, Ketchup, Barbecue, Senape, Salsa Piccante`)}
                    placeholderTextColor="#94A3B8"
                    multiline
                  />
                  {splitCsv(chipsText).length > 0 ? (
                    <View style={styles.inlineOrderList}>
                      <Text style={styles.orderHint}>{t(`Ordine visualizzato al cliente`)}</Text>
                      {splitCsv(chipsText).map((chip, idx, allChips) => (
                        <View key={`${chip}-${idx}`} style={styles.inlineOrderRow}>
                          <Text style={styles.inlineOrderLabel}>{idx + 1}. {chip}</Text>
                          <View style={styles.orderActions}>
                            <TouchableOpacity
                              accessibilityLabel="Sposta opzione in alto"
                              disabled={idx === 0}
                              onPress={() => moveCsvEntry(chipsText, setChipsText, idx, 'up')}
                              style={[styles.orderArrowBtn, idx === 0 && styles.orderArrowBtnDisabled]}
                            >
                              <Ionicons name="chevron-up" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              accessibilityLabel="Sposta opzione in basso"
                              disabled={idx === allChips.length - 1}
                              onPress={() => moveCsvEntry(chipsText, setChipsText, idx, 'down')}
                              style={[styles.orderArrowBtn, idx === allChips.length - 1 && styles.orderArrowBtnDisabled]}
                            >
                              <Ionicons name="chevron-down" size={16} color="#2563EB" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}

              {type === 'paid_extras' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t(`Lista Extra a Pagamento:`)}</Text>
                  {extras.map((ext, idx) => (
                    <View key={idx} style={styles.extraItemRow}>
                      <TextInput
                        style={[styles.input, { flex: 2 }]}
                        value={ext.name}
                        onChangeText={(v) => {
                          const list = [...extras];
                          list[idx] = { ...list[idx], name: v };
                          setExtras(list);
                        }}
                        placeholder={t(`Nome (es. Formaggio Extra)`)}
                        placeholderTextColor="#94A3B8"
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={String(ext.price || '')}
                        onChangeText={(v) => {
                          const list = [...extras];
                          list[idx] = {
                            ...list[idx],
                            price: parseFloat(v.replace(',', '.')) || 0,
                          };
                          setExtras(list);
                        }}
                        placeholder={t(`€ 1.50`)}
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                      />
                      <View style={styles.orderActions}>
                        <TouchableOpacity
                          accessibilityLabel="Sposta extra in alto"
                          disabled={idx === 0}
                          onPress={() => setExtras(moveAtIndex(extras, idx, 'up'))}
                          style={[styles.orderArrowBtn, idx === 0 && styles.orderArrowBtnDisabled]}
                        >
                          <Ionicons name="chevron-up" size={16} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityLabel="Sposta extra in basso"
                          disabled={idx === extras.length - 1}
                          onPress={() => setExtras(moveAtIndex(extras, idx, 'down'))}
                          style={[styles.orderArrowBtn, idx === extras.length - 1 && styles.orderArrowBtnDisabled]}
                        >
                          <Ionicons name="chevron-down" size={16} color="#2563EB" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        accessibilityLabel="Elimina extra"
                        onPress={() => setExtras(extras.filter((_, i) => i !== idx))}
                        style={styles.trashMiniBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addMiniBtn}
                    onPress={() => setExtras([...extras, { name: '', price: 1.0 }])}
                  >
                    <Text style={styles.addMiniBtnText}>{t(`+ Aggiungi Voce Extra`)}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {type === 'choice_group' && (
                <View style={styles.formGroup}>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>{t(`Min Scelte:`)}</Text>
                      <TextInput
                        style={styles.input}
                        value={minSelection}
                        onChangeText={setMinSelection}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>{t(`Max Scelte:`)}</Text>
                      <TextInput
                        style={styles.input}
                        value={maxSelection}
                        onChangeText={setMaxSelection}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <Text style={styles.formLabel}>{t(`Opzioni a Scelta:`)}</Text>
                  {options.map((opt, idx) => (
                    <View key={idx} style={styles.extraItemRow}>
                      <TextInput
                        style={[styles.input, { flex: 2 }]}
                        value={opt.name}
                        onChangeText={(v) => {
                          const list = [...options];
                          list[idx] = { ...list[idx], name: v };
                          setOptions(list);
                        }}
                        placeholder={t(`Es. Patatine Grandi`)}
                        placeholderTextColor="#94A3B8"
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={String(opt.price_delta || '')}
                        onChangeText={(v) => {
                          const list = [...options];
                          list[idx] = {
                            ...list[idx],
                            price_delta: parseFloat(v.replace(',', '.')) || 0,
                          };
                          setOptions(list);
                        }}
                        placeholder={t(`+ € 0.00`)}
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                      />
                      <View style={styles.orderActions}>
                        <TouchableOpacity
                          accessibilityLabel="Sposta opzione in alto"
                          disabled={idx === 0}
                          onPress={() => setOptions(moveAtIndex(options, idx, 'up'))}
                          style={[styles.orderArrowBtn, idx === 0 && styles.orderArrowBtnDisabled]}
                        >
                          <Ionicons name="chevron-up" size={16} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityLabel="Sposta opzione in basso"
                          disabled={idx === options.length - 1}
                          onPress={() => setOptions(moveAtIndex(options, idx, 'down'))}
                          style={[styles.orderArrowBtn, idx === options.length - 1 && styles.orderArrowBtnDisabled]}
                        >
                          <Ionicons name="chevron-down" size={16} color="#2563EB" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        accessibilityLabel="Elimina opzione"
                        onPress={() => setOptions(options.filter((_, i) => i !== idx))}
                        style={styles.trashMiniBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addMiniBtn}
                    onPress={() => setOptions([...options, { name: '', price_delta: 0 }])}
                  >
                    <Text style={styles.addMiniBtnText}>{t(`+ Aggiungi Opzione`)}</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                  {editingGroup ? 'Salva Modifiche' : 'Crea Gruppo'}
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
  groupCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardHeaderRowNarrow: {
    flexWrap: 'wrap',
  },
  groupTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  groupTitleBlockNarrow: {
    flexBasis: '100%',
    width: '100%',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  groupDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeNarrow: {
    marginTop: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 6,
  },
  orderActionsNarrow: {
    marginLeft: 0,
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
    opacity: 0.35,
  },
  inlineOrderList: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 8,
    gap: 4,
  },
  orderHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  inlineOrderRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingLeft: 4,
  },
  inlineOrderLabel: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
  },
  itemsPreviewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemsPreviewText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
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
    maxWidth: 550,
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
    height: 60,
    textAlignVertical: 'top',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeSelectPillActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  typeSelectPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeSelectPillTextActive: {
    color: '#FFFFFF',
  },
  extraItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  trashMiniBtn: {
    padding: 6,
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
});
