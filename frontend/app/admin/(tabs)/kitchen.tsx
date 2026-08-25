import React, { useEffect, useState, useCallback } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllOrdersAdmin, updateOrderStatus, getSettings, subscribeToDbChanges, Order } from '@/src/api/api';
import { storage } from '@/src/utils/storage';
import { printKitchenTicket, printCourtesyTicket } from '@/src/utils/printer';

import { Text } from '@/src/components/LocalizedPrimitives';
export default function AdminDashboardScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');
  const [displayEnabled, setDisplayEnabled] = useState(true);

  useEffect(() => {
    checkAuth();
    const unsub = subscribeToDbChanges((type) => {
      if (type === 'orders' || type === 'all' || type === 'settings') {
        loadOrders();
      }
    });
    return () => unsub();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const checkAuth = async () => {
    const token = await storage.secureGet('admin_token', null);
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    // Check if kitchen display is enabled
    try {
      const settings = await getSettings();
      setDisplayEnabled(settings.kitchen_display_enabled !== false);
    } catch {}
    loadOrders();
  };

  const loadOrders = async () => {
    try {
      const data = await getAllOrdersAdmin();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleLogout = async () => {
    await storage.secureRemove('admin_token');
    router.replace('/');
  };

  const filteredOrders = orders.filter(order => order.status === activeTab);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': '#FFA500',
      'preparing': '#2196F3',
      'ready': '#4CAF50',
      'completed': '#9E9E9E'
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pending': 'In Attesa',
      'preparing': 'In Preparazione',
      'ready': 'Pronto',
      'completed': 'Completato'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!displayEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.push('/admin/settings')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Display Cucina</Text>
              <Text style={styles.headerSubtitle}>Disabilitato</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.totemBtnHeader}>
              <Ionicons name="storefront" size={18} color="white" />
              <Text style={styles.totemBtnHeaderText}>Totem</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.disabledContainer}>
          <Ionicons name="eye-off-outline" size={80} color="#999" />
          <Text style={styles.disabledTitle}>Display Cucina Disabilitato</Text>
          <Text style={styles.disabledText}>
            Per abilitarlo, vai su Impostazioni e attiva l'opzione "Display Cucina".
          </Text>
          <Text style={styles.disabledHint}>
            Le stampe per la cucina continuano a funzionare normalmente.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.push('/admin/settings')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Display Cucina</Text>
            <Text style={styles.headerSubtitle}>Gestione Ordini</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.totemBtnHeader}>
            <Ionicons name="storefront" size={18} color="white" />
            <Text style={styles.totemBtnHeaderText}>Totem</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            In Attesa
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: '#FFA500' }]}>
            <Text style={styles.tabBadgeText}>
              {orders.filter(o => o.status === 'pending').length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'preparing' && styles.tabActive]}
          onPress={() => setActiveTab('preparing')}
        >
          <Text style={[styles.tabText, activeTab === 'preparing' && styles.tabTextActive]}>
            In Preparazione
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: '#2196F3' }]}>
            <Text style={styles.tabBadgeText}>
              {orders.filter(o => o.status === 'preparing').length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ready' && styles.tabActive]}
          onPress={() => setActiveTab('ready')}
        >
          <Text style={[styles.tabText, activeTab === 'ready' && styles.tabTextActive]}>
            Pronti
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.tabBadgeText}>
              {orders.filter(o => o.status === 'ready').length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>Nessun ordine {getStatusLabel(activeTab).toLowerCase()}</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={[styles.orderCard, { borderLeftColor: getStatusColor(order.status) }]}>
              <View style={styles.orderHeader}>
                <View style={styles.orderNumberContainer}>
                  <Text style={styles.orderNumberLabel}>N°</Text>
                  <Text style={styles.orderNumberValue}>{order.order_number}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                {order.order_type === 'number_only' ? (
                  <View style={styles.voiceOrder}>
                    <Ionicons name="mic" size={24} color="#666" />
                    <Text style={styles.voiceOrderText}>Ordine a voce - cliente ordinerà in cassa</Text>
                  </View>
                ) : order.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                        <View style={styles.removedContainer}>
                          {item.removed_ingredients.map((ing, idx) => (
                            <Text key={idx} style={styles.removedText}>❌ SENZA {ing}</Text>
                          ))}
                        </View>
                      )}
                      {item.added_extras && item.added_extras.length > 0 && (
                        <View style={styles.addedContainer}>
                          {item.added_extras.map((extra, idx) => (
                            <Text key={idx} style={styles.addedText}>➕ {extra.name}</Text>
                          ))}
                        </View>
                      )}
                      {item.combo_selections && Object.keys(item.combo_selections).length > 0 && (
                        <View style={styles.comboContainer}>
                          {Object.entries(item.combo_selections).map(([group, options]) => (
                            <Text key={group} style={styles.comboText}>▸ {group}: {(options as string[]).join(', ')}</Text>
                          ))}
                        </View>
                      )}
                      {item.customizations && item.customizations.length > 0 && (
                        <View style={styles.customizations}>
                          {item.customizations.map((custom, idx) => (
                            <Text key={idx} style={styles.customization}>• {custom}</Text>
                          ))}
                        </View>
                      )}
                      {item.notes && (
                        <Text style={styles.itemNotes}>📝 Note: {item.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>
                  {order.order_type === 'number_only' ? 'Ordine a voce' : `Totale: €${order.total_price.toFixed(2)}`}
                </Text>
                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={[styles.printBtn]}
                    onPress={async () => {
                      try {
                        if (order.order_type === 'number_only' || order.items.length === 0) {
                          await printCourtesyTicket(order);
                        } else {
                          await printKitchenTicket(order);
                        }
                      } catch (e) { console.error(e); }
                    }}
                  >
                    <Ionicons name="print" size={18} color="white" />
                  </TouchableOpacity>
                  {order.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                      onPress={() => handleStatusUpdate(order.id!, 'preparing')}
                    >
                      <Text style={styles.actionButtonText}>Inizia</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'preparing' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                      onPress={() => handleStatusUpdate(order.id!, 'ready')}
                    >
                      <Text style={styles.actionButtonText}>Pronto</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'ready' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
                      onPress={() => handleStatusUpdate(order.id!, 'completed')}
                    >
                      <Text style={styles.actionButtonText}>Completa</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    backgroundColor: '#FFFFFF',
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
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  backButton: {
    padding: 6,
    marginRight: 4,
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  tabTextActive: {
    color: '#FF6B6B',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumberLabel: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  orderNumberValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderItems: {
    gap: 12,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 12,
  },
  itemQuantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    minWidth: 40,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customizations: {
    marginTop: 4,
    marginLeft: 8,
  },
  customization: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 14,
    color: '#FF6B6B',
    fontStyle: 'italic',
    marginTop: 4,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexWrap: 'wrap',
    gap: 10,
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  printBtn: {
    backgroundColor: '#607D8B',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  voiceOrderText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  removedContainer: {
    marginTop: 4,
  },
  removedText: {
    fontSize: 14,
    color: '#c00',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  addedContainer: {
    marginTop: 4,
  },
  addedText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  comboContainer: {
    marginTop: 4,
  },
  comboText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    marginBottom: 2,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  disabledTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  disabledHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
