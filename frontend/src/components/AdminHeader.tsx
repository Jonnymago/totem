import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/src/components/LocalizedPrimitives';
import { AdminHeaderLanguageFlag } from '@/src/components/AdminHeaderLanguageFlag';

export interface AdminHeaderBadge {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'primary' | 'danger';
}

export interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  counter?: number | string;
  badge?: AdminHeaderBadge;
  showBack?: boolean;
  onBack?: () => void;
  showTotemButton?: boolean;
  showLanguageFlag?: boolean;
  rightActions?: React.ReactNode;
  extraBottom?: React.ReactNode;
}

export default function AdminHeader({
  title,
  subtitle,
  emoji,
  counter,
  badge,
  showBack = false,
  onBack,
  showTotemButton = false,
  showLanguageFlag = true,
  rightActions,
  extraBottom,
}: AdminHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleGoToTotem = () => {
    router.replace('/');
  };

  const getBadgeStyle = (variant?: AdminHeaderBadge['variant']) => {
    switch (variant) {
      case 'success':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'warning':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'danger':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
      case 'primary':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  const badgeStyle = badge ? getBadgeStyle(badge.variant) : null;
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 14 : 20);

  const hasActions = Boolean(rightActions || showLanguageFlag || showTotemButton);

  return (
    <View style={[styles.wrapper, { paddingTop: topPadding }]}>
      <View style={styles.headerContainer}>
        {/* First Row: Back Button + Full Title, Emoji, Badges and Subtitle */}
        <View style={styles.titleContainer}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, isNarrow && styles.backButtonNarrow]}
              accessibilityLabel="Torna indietro"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={isNarrow ? 18 : 20} color="#1E293B" />
            </TouchableOpacity>
          )}

          <View style={styles.titleArea}>
            <View style={styles.titleRow}>
              {emoji ? <Text style={[styles.emojiText, isNarrow && { fontSize: 18 }]}>{emoji}</Text> : null}
              <Text
                style={[styles.titleText, isNarrow && styles.titleTextNarrow]}
                numberOfLines={2}
              >
                {title}
              </Text>

              {counter !== undefined && counter !== null && (
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>{counter}</Text>
                </View>
              )}

              {badge && badgeStyle && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: badgeStyle.bg,
                      borderColor: badgeStyle.border,
                    },
                  ]}
                >
                  <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                    {badge.text}
                  </Text>
                </View>
              )}
            </View>

            {subtitle ? (
              <Text style={styles.subtitleText} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Second Row: Action Buttons, Language Flag, and Totem Launcher under the title */}
        {hasActions && (
          <View style={[styles.actionsRow, isNarrow && styles.actionsRowNarrow]}>
            <View style={styles.actionsLeftGroup}>
              {rightActions}
            </View>

            <View style={styles.actionsRightGroup}>
              {showLanguageFlag && <AdminHeaderLanguageFlag />}

              {showTotemButton && (
                <TouchableOpacity
                  style={[styles.totemBtn, isNarrow && styles.totemBtnNarrow]}
                  onPress={handleGoToTotem}
                  accessibilityLabel="Avvia Schermata Cassa Totem"
                  activeOpacity={0.7}
                >
                  <Ionicons name="storefront-outline" size={isNarrow ? 15 : 16} color="#475569" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {extraBottom && <View style={styles.extraBottomContainer}>{extraBottom}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 10,
  },
  headerContainer: {
    flexDirection: 'column',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backButtonNarrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  titleArea: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  emojiText: {
    fontSize: 20,
    marginRight: 2,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  titleTextNarrow: {
    fontSize: 16,
    letterSpacing: -0.1,
  },
  counterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexShrink: 0,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
    width: '100%',
    flexWrap: 'wrap',
  },
  actionsRowNarrow: {
    paddingTop: 4,
    gap: 6,
  },
  actionsLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  actionsRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  totemBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  totemBtnNarrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  extraBottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
});
