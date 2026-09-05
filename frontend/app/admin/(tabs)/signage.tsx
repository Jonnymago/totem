import { useI18n } from '@/src/utils/i18n';
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';

export default function SignageScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AdminHeader
        title={t(`Digital Signage (Vetrina TV)`)}
        subtitle={t(`Coming Soon — Funzionalità in sviluppo`)}
        emoji="📺"
        showBack={true}
        onBack={() => router.back()}
        showTotemButton={true}
      />

      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="tv-outline" size={48} color="#7C3AED" />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t(`IN FASE DI OTTIMIZZAZIONE · COMING SOON`)}</Text>
          </View>

          <Text style={styles.title}>{t(`Vetrina TV & Digital Signage`)}</Text>

          <Text style={styles.description}>{t(`
            Il modulo di trasmissione slide prodotti, carosello multimediale e video di sfondo su TV è attualmente disattivato per consentire un refactoring completo del motore grafico e della stabilità.
          `)}</Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#0284C7" style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>{t(`
              Puoi continuare ad utilizzare la schermata Contacoda TV per visualizzare i numeri d'ordine chiamati in tempo reale per i tuoi clienti.
            `)}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/admin/queue')}>
              <Ionicons name="megaphone-outline" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>{t(`Gestione Contacoda TV`)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={18} color="#475569" />
              <Text style={styles.secondaryBtnText}>{t(`Torna a Impostazioni`)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80%',
  },
  card: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 19,
  },
  actionRow: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  secondaryBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
});
