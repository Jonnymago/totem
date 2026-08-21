import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useI18n, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/src/utils/i18n';

interface LanguageSelectorProps {
  compact?: boolean;
  theme?: 'dark' | 'light';
  onSelect?: (lang: SupportedLanguage) => void;
}

export default function LanguageSelector({ compact = false, theme = 'dark', onSelect }: LanguageSelectorProps) {
  const { lang: currentLang, setLanguage } = useI18n();

  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {SUPPORTED_LANGUAGES.map((item) => {
        const isActive = currentLang === item.code;
        return (
          <TouchableOpacity
            key={item.code}
            style={[
              styles.langButton,
              compact && styles.langButtonCompact,
              isActive && (isDark ? styles.langButtonActiveDark : styles.langButtonActiveLight),
            ]}
            onPress={() => {
              setLanguage(item.code);
              if (onSelect) onSelect(item.code);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.flagText, compact && styles.flagTextCompact]}>{item.flag}</Text>
            {!compact && (
              <Text
                style={[
                  styles.langCodeText,
                  isDark ? styles.langCodeTextDark : styles.langCodeTextLight,
                  isActive && styles.langCodeTextActive,
                ]}
              >
                {item.code.toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  containerLight: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    gap: 6,
  },
  langButtonCompact: {
    paddingVertical: 5,
    paddingHorizontal: 7,
    gap: 0,
  },
  langButtonActiveDark: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  langButtonActiveLight: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  flagText: {
    fontSize: 18,
  },
  flagTextCompact: {
    fontSize: 16,
  },
  langCodeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  langCodeTextDark: {
    color: '#E2E8F0',
  },
  langCodeTextLight: {
    color: '#475569',
  },
  langCodeTextActive: {
    color: 'white',
  },
});
