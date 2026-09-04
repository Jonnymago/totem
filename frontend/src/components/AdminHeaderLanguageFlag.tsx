import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/LocalizedPrimitives';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  useI18n,
} from '@/src/utils/i18n';
import { getSettings, updateSettings } from '@/src/api/api';

interface AdminHeaderLanguageFlagProps {
  style?: any;
  variant?: 'admin' | 'customer' | 'dark';
  mode?: 'persistent' | 'customer-session';
  isLarge?: boolean;
}

export function AdminHeaderLanguageFlag({
  style,
  variant = 'admin',
  mode = 'persistent',
  isLarge = false,
}: AdminHeaderLanguageFlagProps) {
  const { lang, setLanguage, setCustomerSessionLanguage } = useI18n();
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentOption = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const isCustomer = variant === 'customer';
  const isDark = variant === 'dark';

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    if (code === lang) {
      setModalVisible(false);
      return;
    }
    setSaving(true);
    try {
      if (mode === 'customer-session') {
        setCustomerSessionLanguage(code);
      } else {
        await setLanguage(code);
        try {
          const currentSettings = await getSettings();
          await updateSettings({ ...currentSettings, language: code });
        } catch (err) {
          console.warn('Could not persist language to backend settings:', err);
        }
      }
    } finally {
      setSaving(false);
      setModalVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.flagBadge,
          isCustomer && styles.flagBadgeCustomer,
          isDark && styles.flagBadgeDark,
          isLarge && styles.flagBadgeLarge,
          style,
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Lingua attuale: ${currentOption.name}. Tocca per cambiare lingua.`}
        activeOpacity={0.7}
      >
        <Text style={[styles.flagEmoji, isLarge && { fontSize: 24 }]}>{currentOption.flag}</Text>
        <Text
          style={[
            styles.flagCode,
            isCustomer && styles.flagCodeCustomer,
            isDark && styles.flagCodeDark,
            isLarge && { fontSize: 16 },
          ]}
        >
          {currentOption.code.toUpperCase()}
        </Text>
        <Ionicons
          name="chevron-down"
          size={isLarge ? 16 : 12}
          color={isCustomer ? 'rgba(255,255,255,0.8)' : isDark ? '#94A3B8' : '#64748B'}
          style={styles.chevron}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalTitleEmoji}>🌍</Text>
                    <Text style={styles.modalTitle}>Seleziona Lingua</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                    accessibilityLabel="Chiudi"
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Cambia la lingua dell&apos;interfaccia amministrativa e del totem
                </Text>

                <View style={styles.langList}>
                  {SUPPORTED_LANGUAGES.map((option) => {
                    const isSelected = option.code === lang;
                    return (
                      <TouchableOpacity
                        key={option.code}
                        style={[styles.langItem, isSelected && styles.langItemActive]}
                        onPress={() => handleSelectLanguage(option.code)}
                        disabled={saving}
                        activeOpacity={0.7}
                      >
                        <View style={styles.langItemLeft}>
                          <Text style={styles.langItemFlag}>{option.flag}</Text>
                          <View>
                            <Text
                              style={[
                                styles.langItemName,
                                isSelected && styles.langItemNameActive,
                              ]}
                            >
                              {option.nativeName}
                            </Text>
                            <Text style={styles.langItemSub}>{option.name}</Text>
                          </View>
                        </View>
                        {isSelected ? (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </View>
                        ) : (
                          <Text style={styles.langItemCodeBadge}>
                            {option.code.toUpperCase()}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  flagBadgeCustomer: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 12,
  },
  flagBadgeDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderRadius: 8,
  },
  flagBadgeLarge: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  flagCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  flagCodeCustomer: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  flagCodeDark: {
    color: '#F1F5F9',
  },
  chevron: {
    marginLeft: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  langList: {
    gap: 8,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  langItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  langItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langItemFlag: {
    fontSize: 24,
  },
  langItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  langItemNameActive: {
    color: '#1D4ED8',
  },
  langItemSub: {
    fontSize: 12,
    color: '#64748B',
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langItemCodeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default AdminHeaderLanguageFlag;
