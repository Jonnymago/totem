import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n, SUPPORTED_LANGUAGES, SupportedLanguage, GuideSection } from '@/src/utils/i18n';
import LanguageSelector from './LanguageSelector';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function GuideHelper() {
  const { lang, setLanguage, t, guideChapters } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>('ch1_overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'customer' | 'admin' | 'hardware'>('all');

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredChapters = guideChapters.filter((ch) => {
    // Filter by tab
    if (filterCategory === 'customer' && ch.id !== 'ch2_customer_flow' && ch.id !== 'ch1_overview') return false;
    if (filterCategory === 'admin' && ch.id !== 'ch3_menu_management' && ch.id !== 'ch4_kds_kitchen' && ch.id !== 'ch7_remote_web' && ch.id !== 'ch8_licensing') return false;
    if (filterCategory === 'hardware' && ch.id !== 'ch5_printers' && ch.id !== 'ch6_kiosk_lockdown') return false;

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = ch.title.toLowerCase().includes(q) || ch.subtitle.toLowerCase().includes(q);
    const matchParagraphs = ch.paragraphs.some((p) => p.toLowerCase().includes(q));
    const matchBullets = ch.bulletPoints?.some(
      (b) => b.title.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q)
    );
    return matchTitle || matchParagraphs || matchBullets;
  });

  return (
    <View style={styles.container}>
      {/* Header Box */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="book-outline" size={26} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>{t('guide.interactive_helper')}</Text>
              <Text style={styles.langBadge}>{lang.toUpperCase()}</Text>
            </View>
            <Text style={styles.title}>{t('guide.title')}</Text>
            <Text style={styles.subtitle}>{t('guide.subtitle')}</Text>
          </View>
        </View>

        {/* Multilingual Selector Bar */}
        <View style={styles.langSelectorRow}>
          <Text style={styles.langLabel}>🌐 {t('common.choose_language')}:</Text>
          <LanguageSelector theme="light" />
        </View>
      </View>

      {/* Search Bar & Filter Chips */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, filterCategory === 'all' && styles.chipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.chipText, filterCategory === 'all' && styles.chipTextActive]}>
              {t('guide.tab_all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterCategory === 'customer' && styles.chipActive]}
            onPress={() => setFilterCategory('customer')}
          >
            <Text style={[styles.chipText, filterCategory === 'customer' && styles.chipTextActive]}>
              {t('guide.tab_customer')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterCategory === 'admin' && styles.chipActive]}
            onPress={() => setFilterCategory('admin')}
          >
            <Text style={[styles.chipText, filterCategory === 'admin' && styles.chipTextActive]}>
              {t('guide.tab_admin')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterCategory === 'hardware' && styles.chipActive]}
            onPress={() => setFilterCategory('hardware')}
          >
            <Text style={[styles.chipText, filterCategory === 'hardware' && styles.chipTextActive]}>
              {t('guide.tab_hardware')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chapters Accordion List */}
      <View style={styles.chaptersList}>
        {filteredChapters.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>Nessun argomento trovato per la ricerca "{searchQuery}".</Text>
          </View>
        ) : (
          filteredChapters.map((ch, idx) => {
            const isExpanded = expandedId === ch.id;

            return (
              <View key={ch.id} style={[styles.chapterCard, isExpanded && styles.chapterCardActive]}>
                <TouchableOpacity
                  style={styles.chapterHeader}
                  onPress={() => toggleExpand(ch.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.chapterIconBox, isExpanded && styles.chapterIconBoxActive]}>
                    <Ionicons
                      name={ch.icon as any}
                      size={20}
                      color={isExpanded ? '#4F46E5' : '#64748B'}
                    />
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    {ch.badge && (
                      <View style={styles.chapterBadge}>
                        <Text style={styles.chapterBadgeText}>{ch.badge}</Text>
                      </View>
                    )}
                    <Text style={styles.chapterTitle}>{ch.title}</Text>
                    <Text style={styles.chapterSubtitle}>{ch.subtitle}</Text>
                  </View>

                  <Ionicons
                    name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                    size={22}
                    color={isExpanded ? '#4F46E5' : '#94A3B8'}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.chapterContent}>
                    {/* Paragraphs */}
                    {ch.paragraphs.map((p, pIdx) => (
                      <Text key={pIdx} style={styles.paragraphText}>
                        {p}
                      </Text>
                    ))}

                    {/* Bullet Points */}
                    {ch.bulletPoints && ch.bulletPoints.length > 0 && (
                      <View style={styles.bulletsBox}>
                        {ch.bulletPoints.map((bp, bIdx) => (
                          <View key={bIdx} style={styles.bulletRow}>
                            <View style={styles.bulletDot} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.bulletTitle}>{bp.title}</Text>
                              <Text style={styles.bulletDesc}>{bp.desc}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Pro Tip Box */}
                    {ch.tip && (
                      <View style={styles.tipBox}>
                        <Ionicons name="bulb-outline" size={18} color="#D97706" style={{ marginRight: 8 }} />
                        <Text style={styles.tipText}>{ch.tip}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Support & Quick Contact Footer */}
      <View style={styles.supportFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.supportTitle}>Hai bisogno di assistenza o configurazione personalizzata?</Text>
          <Text style={styles.supportDesc}>
            Contatta direttamente il team di sviluppo per supporto su hardware, stampanti ESC/POS o licenze B2B.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.supportBtn}
          onPress={() => Linking.openURL('mailto:priologiovanni82@gmail.com?subject=Supporto%20Guida%20Totem%20QuickBite')}
        >
          <Ionicons name="mail" size={16} color="white" />
          <Text style={styles.supportBtnText}>Scrivi al Supporto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langBadge: {
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: '#4F46E5',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: 'white',
  },
  chaptersList: {
    padding: 16,
    gap: 12,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  chapterCardActive: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAFAFE',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  chapterIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chapterIconBoxActive: {
    backgroundColor: '#EEF2FF',
  },
  chapterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  chapterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  chapterSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chapterContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  paragraphText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    marginTop: 6,
    marginRight: 10,
  },
  bulletTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  bulletDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 16,
  },
  supportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 12,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  supportDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  supportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});
