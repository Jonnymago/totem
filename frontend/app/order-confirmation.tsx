import React, { useState, useEffect, useRef } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/src/store/cartStore';
import { createOrder, Order, getSettings, Settings } from '@/src/api/api';
import { printCourtesyTicket, printKitchenTicket } from '@/src/utils/printer';
import { getCurrentLanguage, useI18n } from '@/src/utils/i18n';
import { translateCustomerMenuText, useCustomerMenuGlossary } from '@/src/utils/customerMenuTranslation';

import { Text } from '@/src/components/LocalizedPrimitives';
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function displayMenuText(value?: string): string {
  return translateCustomerMenuText(value, getCurrentLanguage());
}

function renderItemDetails(item: any) {
  const lines: React.ReactNode[] = [];

  if (item.removed_ingredients?.length > 0) {
    item.removed_ingredients.forEach((ing: string, idx: number) => {
      lines.push(
        <Text key={`r-${idx}`} style={styles.removedText}>- Senza {displayMenuText(ing)}</Text>
      );
    });
  }

  if (item.customizations?.length > 0) {
    lines.push(
      <Text key="custom" style={styles.customText}>+ {item.customizations.map(displayMenuText).join(', ')}</Text>
    );
  }

  if (item.added_extras?.length > 0) {
    item.added_extras.forEach((extra: any, idx: number) => {
      lines.push(
        <Text key={`e-${idx}`} style={styles.addedText}>
          + {displayMenuText(extra.name)}{extra.price > 0 ? ` (€${Number(extra.price).toFixed(2)})` : ''}
        </Text>
      );
    });
  }

  if (item.combo_lines && item.combo_lines.length > 0) {
    const byGroup: Record<string, string[]> = {};
    for (const line of item.combo_lines) {
      if (!byGroup[line.group]) byGroup[line.group] = [];
      byGroup[line.group].push(
        line.price_delta > 0
          ? `${displayMenuText(line.name)} (+€${Number(line.price_delta).toFixed(2)})`
          : displayMenuText(line.name)
      );
    }
    Object.entries(byGroup).forEach(([group, opts]) => {
      lines.push(
        <Text key={`c-${group}`} style={styles.comboText}>
          {displayMenuText(group)}: {opts.join(', ')}
        </Text>
      );
    });
  } else if (item.combo_selections) {
    Object.entries(item.combo_selections).forEach(([group, opts]) => {
      if (!opts || !(opts as string[]).length) return;
      lines.push(
        <Text key={`s-${group}`} style={styles.comboText}>
          {displayMenuText(group)}: {(opts as string[]).map(displayMenuText).join(', ')}
        </Text>
      );
    });
  }

  if (item.notes) {
    lines.push(<Text key="notes" style={styles.notes}>Note: {item.notes}</Text>);
  }

  return lines;
}

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { width: winW, height: winH } = useWindowDimensions();
  const isLarge = Math.min(winW, winH) >= 540 || Math.max(winW, winH) >= 880;
  const { t, resetCustomerSessionLanguage } = useI18n();
  useCustomerMenuGlossary();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [countdown, setCountdown] = useState(8);
  const [settings, setSettings] = useState<Settings | null>(null);
  const timerRef = useRef<any>(null);
  const totalPrice = getTotalPrice();

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (showSuccess && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            router.replace('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [showSuccess]);

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations,
        notes: item.notes,
        removed_ingredients: item.removed_ingredients,
        added_extras: item.added_extras,
        combo_selections: item.combo_selections,
        combo_lines: item.combo_lines,
      }));
      const order = await createOrder(orderItems, totalPrice);
      setConfirmedOrder(order);
      clearCart();
      setShowSuccess(true);
      setCountdown(8);
      setLoading(false);
      const s = settings || (await getSettings().catch(() => null));
      void (async () => {
        try {
          if (!s || s.auto_print_courtesy) {
            await printCourtesyTicket(order, s || undefined, s?.printer_courtesy || undefined);
          }
        } catch (e) { console.warn('Auto-print courtesy failed', e); }
        await sleep(4500);
        try {
          if (!s || s.auto_print_kitchen) {
            await printKitchenTicket(order, s?.printer_kitchen || undefined, s || undefined);
          }
        } catch (e) { console.warn('Auto-print kitchen failed', e); }
        finally { resetCustomerSessionLanguage(); }
      })();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(t('order_conf.error'));
      setLoading(false);
    }
  };

  return (
    <>
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
            {t('order_conf.title')}
          </Text>
          <View style={isLarge ? { width: 72 } : { width: 48 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>{t('order_conf.summary')}</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{item.quantity}x {displayMenuText(item.product_name)}</Text>
                <Text style={styles.itemTotal}>€{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              {renderItemDetails(item)}
            </View>
          ))}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabelBold}>{t('cart.total').toUpperCase()}</Text>
            <Text style={styles.totalValueBold}>€{totalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Ionicons name="cash-outline" size={36} color="#FF6B6B" />
            <Text style={styles.paymentText}>{t('order_conf.pay_at_counter')}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            testID="confirm-order-btn"
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirmOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>{t('order_conf.confirm_and_print')}</Text>
                <Ionicons name="print" size={26} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showSuccess && confirmedOrder && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.overlayTitle}>{t('order_conf.order_confirmed')}</Text>
            <Text style={styles.overlayNumber}>#{confirmedOrder.order_number}</Text>
            <Text style={styles.overlayMessage}>
              {t('order_conf.sent_to_kitchen')}
            </Text>
            <Text style={styles.countdownText}>
              {t('take_number.auto_return')} {countdown} {t('common.seconds')}
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerBtnLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  headerBtnPlaceholder: { width: 48, height: 48 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  orderItem: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 20, fontWeight: 'bold', color: '#FFF', flex: 1 },
  itemTotal: { fontSize: 20, fontWeight: 'bold', color: '#FF6B6B' },
  removedText: { fontSize: 15, color: '#FF6B6B', marginBottom: 2 },
  customText: { fontSize: 15, color: '#64B5F6', marginBottom: 2 },
  addedText: { fontSize: 15, color: '#4CAF50', marginBottom: 2 },
  comboText: { fontSize: 15, color: '#CE93D8', marginBottom: 2 },
  notes: { fontSize: 14, color: '#FFD700', fontStyle: 'italic', marginTop: 6 },
  totalSection: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 20, marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabelBold: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  totalValueBold: { fontSize: 26, fontWeight: 'bold', color: '#FF6B6B' },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 20, borderRadius: 12, marginTop: 24, gap: 12 },
  paymentText: { flex: 1, fontSize: 18, color: '#FFF', fontWeight: '600' },
  footer: { backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#333', paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'android' ? 64 : 28 },
  confirmButton: { backgroundColor: '#4CAF50', paddingVertical: 20, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmButtonDisabled: { backgroundColor: '#333' },
  confirmButtonText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  overlayContent: { backgroundColor: '#1a1a2e', borderRadius: 24, padding: 40, margin: 32, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  overlayTitle: { fontSize: 30, fontWeight: 'bold', color: '#4CAF50', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  overlayNumber: { fontSize: 56, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 20 },
  overlayMessage: { fontSize: 18, color: '#CCC', textAlign: 'center', lineHeight: 26, marginBottom: 24 },
  countdownText: { fontSize: 18, color: '#999', fontStyle: 'italic' },
});
