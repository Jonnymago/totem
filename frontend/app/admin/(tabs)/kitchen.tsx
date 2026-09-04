import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/utils/i18n';
import * as Clipboard from 'expo-clipboard';
import * as Network from 'expo-network';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAllOrdersAdmin,
  createOrder,
  updateOrderStatus,
  getSettings,
  updateSettings,
  getCategories,
  upsertDepartmentKds,
  deleteDepartmentKds,
  getRemoteAdminUrl,
  subscribeToDbChanges,
  Order,
  DepartmentKDS,
  Category,
} from '@/src/api/api';
import { printKitchenTicket, printCourtesyTicket } from '@/src/utils/printer';
import { Text, TextInput, InfoTip } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';
import { playKitchenChime } from '@/src/utils/audio';
import { getWifiIpv4Address } from '@/modules/kiosk-mode/src';
import { getLicenseInfo, isMultiLicense, LicenseInfo } from '@/src/utils/license';
import { getFastLocalIp } from '@/src/utils/lanScanner';

function isUsableLanIpv4(value: string): boolean {
  const ip = (value || '').trim();
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
  const octets = ip.split('.').map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return false;
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('169.254.')) return false;
  return true;
}

export default function KitchenOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Primary sub-menu: 'orders' | 'kds_depts'
  const [subSection, setSubSection] = useState<'orders' | 'kds_depts'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('pending');
  const [displayEnabled, setDisplayEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [departments, setDepartments] = useState<DepartmentKDS[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [kitchenSettings, setKitchenSettings] = useState<any>(null);
  const lastPendingCountRef = React.useRef<number>(-1);

  // KDS Department Configuration State
  const [localIp, setLocalIp] = useState('');
  const [newName, setNewName] = useState('');
  const [renameDraft, setRenameDraft] = useState<Record<string, string>>({});
  const [license, setLicense] = useState<LicenseInfo | null>(null);

  const unlimited = isMultiLicense(license);
  const maxKds = unlimited ? 99 : 5;
  const host = localIp || 'IP_TABLET';

  useEffect(() => {
    loadSettings();
    loadKdsNetworkData();
    const unsub = subscribeToDbChanges((type) => {
      if (type === 'orders' || type === 'all' || type === 'settings') {
        void loadOrders(true);
      }
      if (type === 'settings' || type === 'all') {
        void loadSettings();
      }
    });
    return () => unsub();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders(false);
      loadSettings();
      loadKdsNetworkData();
    }, [])
  );

  const loadKdsNetworkData = async () => {
    try {
      const [cats, fastIp, lic, s] = await Promise.all([
        getCategories().catch(() => [] as Category[]),
        getFastLocalIp(1200),
        getLicenseInfo().catch(() => null),
        getSettings().catch(() => ({} as any)),
      ]);
      setCategories(cats || []);
      setLicense(lic);
      const saved = (s.remote_ip_override || '').trim();
      const ipVal = isUsableLanIpv4(saved) ? saved : fastIp;
      setLocalIp(ipVal || '127.0.0.1');
    } catch {}
  };

  const loadSettings = async () => {
    try {
      const s = await getSettings();
      setDisplayEnabled(s.kitchen_display_enabled !== false);
      setDepartments(s.department_kds || []);
      setKitchenSettings(s);
      const drafts: Record<string, string> = {};
      (s.department_kds || []).forEach((d) => { drafts[d.id] = d.name; });
      setRenameDraft(drafts);
    } catch {}
  };

  const loadOrders = async (fromNotification: boolean = false) => {
    try {
      const data = await getAllOrdersAdmin();
      const pendingCount = data.filter((o) => (o.status || 'pending') === 'pending').length;
      
      if (
        soundEnabled &&
        lastPendingCountRef.current !== -1 &&
        pendingCount > lastPendingCountRef.current
      ) {
        playKitchenChime();
      }
      lastPendingCountRef.current = pendingCount;
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato dell\'ordine');
    }
  };

  const handlePrintKitchen = async (order: Order) => {
    try {
      await printKitchenTicket(order, undefined, kitchenSettings || await getSettings());
      Alert.alert('Stampa', 'Stampa comanda inviata con successo');
    } catch (error: any) {
      Alert.alert('Errore di stampa', error?.message || 'Verifica la connessione con la stampante');
    }
  };

  const handlePrintCourtesy = async (order: Order) => {
    try {
      await printCourtesyTicket(order, kitchenSettings || await getSettings());
      Alert.alert('Stampa', 'Ricevuta di cortesia stampata con successo');
    } catch (error: any) {
      Alert.alert('Errore di stampa', error?.message || 'Verifica la connessione con la stampante');
    }
  };

  const handleCreateTestOrder = async () => {
    try {
      setLoading(true);
      const testItems = [
        {
          product_id: 'test_prod_burger',
          product_name: 'Cheeseburger Classic (Test)',
          category_id: categories[0]?.id || 'cat_test',
          product_category_id: categories[0]?.id || 'cat_test',
          quantity: 1,
          price: 8.5,
          notes: 'Cottura media',
          removed_ingredients: ['Cipolla'],
        },
        {
          product_id: 'test_prod_fries',
          product_name: 'Patatine Fritte Maxi (Test)',
          category_id: categories[0]?.id || 'cat_test',
          product_category_id: categories[0]?.id || 'cat_test',
          quantity: 1,
          price: 3.5,
          notes: '',
        },
      ];
      await createOrder(testItems, 12.0, 'totem');
      await loadOrders(false);
      setActiveTab('pending');
      Alert.alert('🍔 Comanda Creata', 'Comanda di test generata con successo! È ora visibile sia in questo pannello che sul KDS LAN.');
    } catch (err: any) {
      Alert.alert('Errore', err?.message || 'Impossibile creare la comanda di test');
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async () => {
    if (!newName.trim()) return;
    if (departments.length >= maxKds) {
      Alert.alert(
        'Limite Licenza',
        'Il piano corrente consente 1 monitor cucina. Per KDS illimitati passa a Totem Multi.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Info Licenza', onPress: () => router.push('/admin/license') },
        ]
      );
      return;
    }
    try {
      await upsertDepartmentKds({ name: newName.trim(), assigned_category_ids: [] });
      setNewName('');
      await loadSettings();
    } catch (e: any) {
      Alert.alert('Errore', e?.message || 'Impossibile aggiungere il reparto');
    }
  };

  const saveRename = async (dept: DepartmentKDS) => {
    const name = (renameDraft[dept.id] || '').trim();
    if (!name || name === dept.name) return;
    try {
      await upsertDepartmentKds({ ...dept, name });
      await loadSettings();
    } catch (e: any) {
      Alert.alert('Errore', e?.message || 'Impossibile rinominare il reparto');
    }
  };

  const toggleCategory = async (dept: DepartmentKDS, catId: string) => {
    const cur = dept.assigned_category_ids || [];
    const next = cur.includes(catId) ? cur.filter((id) => id !== catId) : [...cur, catId];
    try {
      await upsertDepartmentKds({ ...dept, assigned_category_ids: next });
      await loadSettings();
    } catch (e: any) {
      Alert.alert('Errore', e?.message || 'Impossibile aggiornare le categorie');
    }
  };

  const removeDept = (dept: DepartmentKDS) => {
    Alert.alert('Elimina Reparto KDS', `Vuoi eliminare il reparto "${dept.name}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDepartmentKds(dept.id);
            await loadSettings();
          } catch (e: any) {
            Alert.alert('Errore', e?.message || 'Impossibile eliminare');
          }
        },
      },
    ]);
  };

  const copyUrl = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Link Copiato', `Indirizzo copiato negli appunti:\n${url}`);
  };

  const kdsUrl = (dept: DepartmentKDS) => {
    const catsParam = (dept.assigned_category_ids || []).join(',');
    return `http://${host}:3000/kitchen/?department=${encodeURIComponent(dept.id)}&name=${encodeURIComponent(dept.name)}&categories=${encodeURIComponent(catsParam)}`;
  };

  // Filter orders by department & status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Dept filter
      if (selectedDept !== 'all') {
        const dept = departments.find((d) => d.id === selectedDept);
        if (dept && dept.assigned_category_ids && dept.assigned_category_ids.length > 0) {
          const hasMatchingItem = order.items.some((it) => {
            const cid = String((it as any).category_id || (it as any).product_category_id || '').trim();
            if (!cid) return true;
            return dept.assigned_category_ids.includes(cid);
          });
          if (!hasMatchingItem) return false;
        }
      }
      // Status filter
      if (activeTab === 'all') return true;
      return (order.status || 'pending') === activeTab;
    });
  }, [orders, selectedDept, activeTab, departments]);

  const pendingCount = orders.filter((o) => (o.status || 'pending') === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Comande & KDS"
        subtitle={`${pendingCount} in attesa · ${preparingCount} in prep · ${readyCount} pronti`}
        emoji="🍳"
        showBack={false}
        showTotemButton={true}
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => loadOrders(false)}
              accessibilityLabel="Ricarica comande"
            >
              <Ionicons name="refresh" size={18} color="#0F766E" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
              onPress={handleCreateTestOrder}
              accessibilityLabel="Crea comanda di prova"
            >
              <Ionicons name="add-circle" size={18} color="#D97706" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, soundEnabled && styles.iconButtonActive]}
              onPress={() => setSoundEnabled(!soundEnabled)}
              accessibilityLabel="Attiva o disattiva audio"
            >
              <Ionicons
                name={soundEnabled ? 'volume-high' : 'volume-mute'}
                size={18}
                color={soundEnabled ? '#FF6B6B' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Main Sub-Navigation Bar */}
      <View style={styles.subMenuBar}>
        <TouchableOpacity
          style={[styles.subMenuTab, subSection === 'orders' && styles.subMenuTabActive]}
          onPress={() => setSubSection('orders')}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={subSection === 'orders' ? '#FF6B6B' : '#64748B'}
          />
          <Text style={[styles.subMenuText, subSection === 'orders' && styles.subMenuTextActive]}>
            📋 Comande & Cucina
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subMenuTab, subSection === 'kds_depts' && styles.subMenuTabActive]}
          onPress={() => setSubSection('kds_depts')}
        >
          <Ionicons
            name="git-network-outline"
            size={18}
            color={subSection === 'kds_depts' ? '#FF6B6B' : '#64748B'}
          />
          <Text style={[styles.subMenuText, subSection === 'kds_depts' && styles.subMenuTextActive]}>
            🏷️ Reparti KDS LAN
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: ORDERS LIST */}
      {subSection === 'orders' && (
        <View style={{ flex: 1 }}>
          {/* Department Filter Chips if any */}
          {departments.length > 0 && (
            <View style={styles.deptFilterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                <TouchableOpacity
                  style={[styles.deptChip, selectedDept === 'all' && styles.deptChipActive]}
                  onPress={() => setSelectedDept('all')}
                >
                  <Text style={[styles.deptChipText, selectedDept === 'all' && styles.deptChipTextActive]}>
                    Tutti i reparti
                  </Text>
                </TouchableOpacity>
                {departments.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.deptChip, selectedDept === d.id && styles.deptChipActive]}
                    onPress={() => setSelectedDept(d.id)}
                  >
                    <Text style={[styles.deptChipText, selectedDept === d.id && styles.deptChipTextActive]}>
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Status Filter Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.tabActiveAll]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActiveAll]}>
                Tutti ({orders.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending' && styles.tabActivePending]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActivePending]}>
                Attesa ({pendingCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'preparing' && styles.tabActivePrep]}
              onPress={() => setActiveTab('preparing')}
            >
              <Text style={[styles.tabText, activeTab === 'preparing' && styles.tabTextActivePrep]}>
                In Prep ({preparingCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ready' && styles.tabActiveReady]}
              onPress={() => setActiveTab('ready')}
            >
              <Text style={[styles.tabText, activeTab === 'ready' && styles.tabTextActiveReady]}>
                Pronti ({readyCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'completed' && styles.tabActiveCompleted]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActiveCompleted]}>
                Finiti
              </Text>
            </TouchableOpacity>
          </View>

          {/* Orders Scroll */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>{t('Nessuna comanda trovata')}</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all'
                  ? t('Nessun ordine presente in memoria. Invia una nuova ordinazione dal totem o genera una comanda di test rapida.')
                  : t('Nessun ordine trovato con il filtro selezionato. Premi "Tutti" o genera una comanda di prova.')}
              </Text>
              <View style={styles.emptyActionsRow}>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={handleCreateTestOrder}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>Crea Comanda di Prova</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emptyActionBtnSecondary}
                  onPress={() => {
                    setActiveTab('all');
                    void loadOrders(false);
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#334155" />
                  <Text style={styles.emptyActionBtnSecondaryText}>Mostra Tutti / Aggiorna</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
              {filteredOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <View style={styles.orderNumberBox}>
                      <Text style={styles.orderNumber}>
                        {order.order_prefix ? `${order.order_prefix}-` : ''}#{String(order.order_number || 0).padStart(2, '0')}
                      </Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {order.order_type === 'takeaway' ? '🥡 Asporto' : '🍽️ Al Tavolo'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.orderHeaderActions}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => handlePrintKitchen(order)}
                      >
                        <Ionicons name="print-outline" size={18} color="#475569" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => handlePrintCourtesy(order)}
                      >
                        <Ionicons name="receipt-outline" size={18} color="#475569" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Order Items */}
                  <View style={styles.orderItemsList}>
                    {order.items.map((item, idx) => {
                      const itemCatId = String((item as any).category_id || (item as any).product_category_id || '').trim();
                      const currentDept = departments.find((d) => d.id === selectedDept);
                      const isDeptItem = !currentDept || !currentDept.assigned_category_ids || currentDept.assigned_category_ids.length === 0 || !itemCatId || currentDept.assigned_category_ids.includes(itemCatId);
                      const isFilteredOut = selectedDept !== 'all' && !isDeptItem;

                      return (
                        <View key={idx} style={[styles.orderItemRow, isFilteredOut && { opacity: 0.38 }]}>
                          <Text style={[styles.itemQty, isFilteredOut && { color: '#94A3B8' }]}>{item.quantity}×</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, isFilteredOut && { color: '#94A3B8' }]}>
                              {item.product_name}
                              {isFilteredOut ? ' (altro reparto)' : ''}
                            </Text>
                            {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                              <Text style={styles.itemNoIngredient}>
                                Senza: {item.removed_ingredients.join(', ')}
                              </Text>
                            )}
                            {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
                          </View>
                          <Text style={[styles.itemPrice, isFilteredOut && { color: '#94A3B8' }]}>
                            €{(item.price * item.quantity).toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Status Action Buttons */}
                  <View style={styles.orderActionsRow}>
                    {(order.status || 'pending') === 'pending' && (
                      <TouchableOpacity
                        style={[styles.btnStatus, { backgroundColor: '#3B82F6' }]}
                        onPress={() => handleStatusUpdate(order.id, 'preparing')}
                      >
                        <Ionicons name="play" size={16} color="#fff" />
                        <Text style={styles.btnStatusText}>Inizia Preparazione</Text>
                      </TouchableOpacity>
                    )}
                    {order.status === 'preparing' && (
                      <TouchableOpacity
                        style={[styles.btnStatus, { backgroundColor: '#22C55E' }]}
                        onPress={() => handleStatusUpdate(order.id, 'ready')}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.btnStatusText}>Segna Pronto</Text>
                      </TouchableOpacity>
                    )}
                    {order.status === 'ready' && (
                      <TouchableOpacity
                        style={[styles.btnStatus, { backgroundColor: '#64748B' }]}
                        onPress={() => handleStatusUpdate(order.id, 'completed')}
                      >
                        <Ionicons name="checkbox" size={16} color="#fff" />
                        <Text style={styles.btnStatusText}>Completa & Consegna</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* VIEW 2: KDS DEPARTMENTS & LAN HUBS */}
      {subSection === 'kds_depts' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Main Master KDS Card */}
          <View style={styles.deptCard}>
            <View style={styles.deptCardHeader}>
              <View style={styles.deptIconBadge}>
                <Ionicons name="restaurant" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deptCardTitle}>KDS Master Principale (Tutte le comande)</Text>
                <Text style={styles.deptCardSubtitle}>Schermo completo per capocuoco o pass centrale</Text>
              </View>
            </View>
            <View style={styles.urlBox}>
              <Text style={styles.urlText}>http://{host}:3000/kitchen/</Text>
              <TouchableOpacity
                style={styles.urlCopyBtn}
                onPress={() => copyUrl(`http://${host}:3000/kitchen/`)}
              >
                <Ionicons name="copy-outline" size={16} color="#FF6B6B" />
                <Text style={styles.urlCopyText}>Copia</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add New Department Station */}
          <View style={styles.addDeptBox}>
            <Text style={styles.sectionHeading}>Aggiungi Stazione / Reparto KDS</Text>
            <Text style={styles.sectionSubtitle}>
              Es. "Friggitoria", "Griglia", "Pizzeria", "Bar / Bevande"
            </Text>
            <View style={styles.addDeptRow}>
              <TextInput
                style={styles.deptInput}
                placeholder="Nome reparto (es. Pizzeria)..."
                value={newName}
                onChangeText={setNewName}
              />
              <TouchableOpacity style={styles.btnAddDept} onPress={addDepartment}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.btnAddDeptText}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Configured Departments */}
          {departments.map((dept) => {
            const url = kdsUrl(dept);
            return (
              <View key={dept.id} style={styles.deptCard}>
                <View style={styles.deptCardHeader}>
                  <View style={[styles.deptIconBadge, { backgroundColor: '#3B82F6' }]}>
                    <Ionicons name="fast-food" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.renameInput}
                      value={renameDraft[dept.id] ?? dept.name}
                      onChangeText={(t) => setRenameDraft({ ...renameDraft, [dept.id]: t })}
                      onBlur={() => saveRename(dept)}
                    />
                    <Text style={styles.deptStationTag}>Stazione KDS #{dept.id.slice(0, 4)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeDept(dept)} style={styles.btnTrash}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Categories Assignment */}
                <Text style={styles.catsLabel}>Categorie instradate su questo KDS:</Text>
                <View style={styles.catsRow}>
                  {categories.map((cat) => {
                    const active = (dept.assigned_category_ids || []).includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catToggleChip, active && styles.catToggleChipActive]}
                        onPress={() => toggleCategory(dept, cat.id)}
                      >
                        <Text style={[styles.catToggleText, active && styles.catToggleTextActive]}>
                          {active ? '✓ ' : '+ '}
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* LAN URL */}
                <View style={styles.urlBox}>
                  <Text style={styles.urlText} numberOfLines={1}>
                    {url}
                  </Text>
                  <TouchableOpacity style={styles.urlCopyBtn} onPress={() => copyUrl(url)}>
                    <Ionicons name="copy-outline" size={16} color="#FF6B6B" />
                    <Text style={styles.urlCopyText}>Copia</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  iconButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  subMenuBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  subMenuTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  subMenuTabActive: {
    borderBottomColor: '#FF6B6B',
  },
  subMenuText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  subMenuTextActive: {
    color: '#FF6B6B',
  },
  deptFilterRow: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  deptChipActive: {
    backgroundColor: '#0F172A',
  },
  deptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  deptChipTextActive: {
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabActiveAll: { backgroundColor: '#E2E8F0' },
  tabActivePending: { backgroundColor: '#FEF08A' },
  tabActivePrep: { backgroundColor: '#BFDBFE' },
  tabActiveReady: { backgroundColor: '#BBF7D0' },
  tabActiveCompleted: { backgroundColor: '#E2E8F0' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActiveAll: { color: '#0F172A' },
  tabTextActivePending: { color: '#854D0E' },
  tabTextActivePrep: { color: '#1E40AF' },
  tabTextActiveReady: { color: '#166534' },
  tabTextActiveCompleted: { color: '#334155' },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 380,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnSecondaryText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  orderNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  orderHeaderActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  orderItemsList: {
    paddingVertical: 10,
    gap: 6,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemNoIngredient: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  itemNotes: {
    fontSize: 12,
    color: '#D97706',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btnStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnStatusText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  kdsBoardContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  kdsQuickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  kdsQuickBarTitle: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 13,
  },
  btnOpenBrowser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  btnOpenBrowserText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 12,
  },
  kdsColumnsRow: {
    flex: 1,
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  kdsColumn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  kdsColumnHeader: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  kdsColumnTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  kdsColumnScroll: {
    flex: 1,
    padding: 8,
  },
  kdsTicket: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  kdsTicketNum: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
  },
  kdsTicketType: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
  },
  kdsTicketItem: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginVertical: 1,
  },
  kdsTicketBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  kdsTicketBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  deptIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  deptCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  deptStationTag: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  renameInput: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  btnTrash: {
    padding: 8,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#475569',
  },
  urlCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  urlCopyText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 12,
  },
  addDeptBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  addDeptRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deptInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  btnAddDept: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnAddDeptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  catsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  catsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  catToggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catToggleChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  catToggleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  catToggleTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
