import React from 'react';
import { useI18n, SupportedLanguage, SUPPORTED_LANGUAGES } from '../utils/i18n';

interface LanguageSelectorProps {
  compact?: boolean;
  mode?: 'persistent' | 'customer-session';
  className?: string;
  onSelect?: (lang: SupportedLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  mode = 'customer-session',
  className = '',
  onSelect,
}) => {
  const { lang: currentLang, setLanguage, setCustomerSessionLanguage } = useI18n();

  const handleSelect = (code: SupportedLanguage) => {
    if (mode === 'customer-session') {
      setCustomerSessionLanguage(code);
    } else {
      setLanguage(code);
    }
    if (onSelect) onSelect(code);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 shadow-lg ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((item) => {
        const isActive = currentLang === item.code;
        return (
          <button
            key={item.code}
            onClick={() => handleSelect(item.code)}
            title={item.nativeName}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
              isActive
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            } ${compact ? 'px-2 py-1' : ''}`}
          >
            <span className="text-base leading-none">{item.flag}</span>
            {!compact && <span className="uppercase text-[11px] font-extrabold">{item.code}</span>}
          </button>
        );
      })}
    </div>
  );
};
