import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createNumberOnlyOrder, Order, getSettings, Settings } from '@/src/api/api';
import { printCourtesyTicket } from '@/src/utils/printer';
import { useI18n } from '@/src/utils/i18n';

export default function TakeNumberScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showSuccess]);

  const initialize = async () => {
    try {
      const [newOrder, s] = await Promise.all([
        createNumberOnlyOrder(),
        getSettings()
      ]);
      setOrder(newOrder);
      setSettings(s);

      // Show success immediately — print does not block the UI
      setShowSuccess(true);
      setCountdown(8);
      setLoading(false);

      if (s.auto_print_courtesy) {
        void printCourtesyTicket(newOrder, s, s.printer_courtesy || undefined).catch((e) =>
          console.warn('Auto-print courtesy failed', e)
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const getFormattedDateTime = () => {
    const now = order?.created_at ? new Date(order.created_at) : new Date();
    return {
      date: now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>{t('take_number.loading')}</Text>
      </View>
    );
  }

  const { date, time } = getFormattedDateTime();

  return (
    <>
      <View style={styles.container}>
        <View style={styles.ticketContainer}>
          <View style={styles.ticket}>
            <View style={styles.ticketHeader}>
              {settings?.logo ? (
                <Image source={{ uri: settings.logo }} style={styles.logoImage} resizeMode="contain" />
              ) : (
                <Text style={styles.logo}>🍔</Text>
              )}
              <Text style={styles.restaurantName}>{settings?.restaurant_name || 'TOTEM RISTORANTE'}</Text>
              <Text style={styles.ticketSubtitle}>{t('take_number.ticket_title')}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{date}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.dateTimeText}>{time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.numberLabel}>{t('take_number.your_number')}</Text>
            <View style={styles.numberBox}>
              <Text style={styles.numberValue}>{order?.order_number}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#FF6B6B" />
              <Text style={styles.infoText}>{t('take_number.go_to_counter')}</Text>
            </View>
          </View>
        </View>
      </View>

      {showSuccess && order && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <View style={styles.overlayIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.overlayTitle}>{t('take_number.new_ticket')}</Text>
            <Text style={styles.overlayNumber}>#{order.order_number}</Text>
            <Text style={styles.overlayMessage}>
              {t('take_number.go_to_counter')}
            </Text>
            <View style={styles.countdownContainer}>
              <ActivityIndicator size="small" color="#FF6B6B" />
              <Text style={styles.countdownText}>
                {t('take_number.auto_return')} {countdown} {t('common.seconds')}
              </Text>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { fontSize: 18, color: '#666', marginTop: 16 },
  ticketContainer: { flex: 1, justifyContent: 'center' },
  ticket: {
    backgroundColor: 'white', borderRadius: 16, padding: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed',
  },
  ticketHeader: { alignItems: 'center', marginBottom: 16 },
  logo: { fontSize: 48, marginBottom: 8 },
  logoImage: { width: 100, height: 100, marginBottom: 8, borderRadius: 8 },
  restaurantName: { fontSize: 22, fontWeight: 'bold', letterSpacing: 2, color: '#333' },
  ticketSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  divider: { height: 1, borderBottomWidth: 2, borderBottomColor: '#E0E0E0', borderStyle: 'dashed', marginVertical: 16 },
  dateTimeContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTimeText: { fontSize: 16, color: '#666', fontWeight: '600' },
  numberLabel: { textAlign: 'center', fontSize: 20, color: '#666', marginBottom: 12 },
  numberBox: { borderWidth: 4, borderColor: '#FF6B6B', borderRadius: 16, padding: 20, alignItems: 'center', backgroundColor: '#FFF5F5' },
  numberValue: { fontSize: 96, fontWeight: 'bold', color: '#FF6B6B' },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', padding: 16, borderRadius: 12, gap: 12 },
  infoText: { flex: 1, fontSize: 14, color: '#333' },
  footer: { textAlign: 'center', fontSize: 14, color: '#666', marginTop: 16, fontStyle: 'italic' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  overlayContent: { backgroundColor: '#1a1a2e', borderRadius: 24, padding: 40, margin: 32, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  overlayIcon: { marginBottom: 16 },
  overlayTitle: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50', marginBottom: 16, textAlign: 'center' },
  overlayNumber: { fontSize: 64, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 20 },
  overlayMessage: { fontSize: 18, color: '#CCC', textAlign: 'center', lineHeight: 26, marginBottom: 24 },
  countdownContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countdownText: { fontSize: 16, color: '#999', fontStyle: 'italic' },
});
