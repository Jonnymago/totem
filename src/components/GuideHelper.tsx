import React, { useState } from 'react';
import { useI18n, SupportedLanguage } from '../utils/i18n';
import { GUIDE_CHAPTERS, GuideChapter } from '../utils/guideChapters';
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Utensils,
  Flame,
  Printer,
  Shield,
  Globe,
  Award,
  HelpCircle,
  Lightbulb,
  X,
} from 'lucide-react';

interface GuideHelperProps {
  embedded?: boolean;
}

export const GuideHelper: React.FC<GuideHelperProps> = ({ embedded = false }) => {
  const { lang, setLanguage, t, languages } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>('ch1_overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'customer' | 'admin' | 'hardware'>('all');

  const chapters: GuideChapter[] = GUIDE_CHAPTERS[lang] || GUIDE_CHAPTERS.it;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getChapterIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'users':
      case 'people':
        return <Users className="w-5 h-5" />;
      case 'utensils':
      case 'fast-food':
        return <Utensils className="w-5 h-5" />;
      case 'flame':
        return <Flame className="w-5 h-5" />;
      case 'printer':
      case 'print':
        return <Printer className="w-5 h-5" />;
      case 'shield':
      case 'shield-checkmark':
        return <Shield className="w-5 h-5" />;
      case 'globe':
        return <Globe className="w-5 h-5" />;
      case 'award':
      case 'ribbon':
        return <Award className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const filteredChapters = chapters.filter((ch) => {
    // Filter by category tab
    if (filterCategory === 'customer' && ch.id !== 'ch2_customer_flow' && ch.id !== 'ch1_overview') {
      return false;
    }
    if (
      filterCategory === 'admin' &&
      ch.id !== 'ch3_menu_management' &&
      ch.id !== 'ch4_kds_kitchen' &&
      ch.id !== 'ch7_remote_web' &&
      ch.id !== 'ch8_licensing'
    ) {
      return false;
    }
    if (filterCategory === 'hardware' && ch.id !== 'ch5_printers' && ch.id !== 'ch6_kiosk_lockdown') {
      return false;
    }

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
    <div className={`w-full ${embedded ? '' : 'p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto'}`}>
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1.5">
                <span>📖</span> Guida Operativa & Glossario
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Totem Operating Guide & Manual</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
                Istruzioni complete passo-passo per l'ecosistema Totem, display cucina KDS, stampanti ESC/POS e gestione remota.
              </p>
            </div>
          </div>

          {/* Language Picker in Header */}
          <div className="flex items-center gap-2 self-start sm:self-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            {languages.map((l) => (
              <button
                key={l.code}
                id={`guide-lang-${l.code}`}
                onClick={() => setLanguage(l.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  lang === l.code
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title={l.name}
              >
                <span className="mr-1">{l.flag}</span>
                <span className="uppercase">{l.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="guide-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca argomento o parola chiave..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            id="guide-filter-all"
            onClick={() => setFilterCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tutti i Capitoli ({chapters.length})
          </button>
          <button
            id="guide-filter-customer"
            onClick={() => setFilterCategory('customer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === 'customer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            👥 Esperienza Cliente
          </button>
          <button
            id="guide-filter-admin"
            onClick={() => setFilterCategory('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === 'admin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            ⚙️ Gestione Menù & KDS
          </button>
          <button
            id="guide-filter-hardware"
            onClick={() => setFilterCategory('hardware')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === 'hardware'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            🖨️ Hardware & Kiosk
          </button>
        </div>
      </div>

      {/* Chapters Accordion List */}
      <div className="space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Nessun capitolo trovato</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Nessun risultato corrisponde alla ricerca "{searchQuery}". Prova con un termine diverso.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
            >
              Reimposta filtri
            </button>
          </div>
        ) : (
          filteredChapters.map((ch) => {
            const isExpanded = expandedId === ch.id;

            return (
              <div
                key={ch.id}
                id={`guide-chapter-${ch.id}`}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Chapter Header Button */}
                <button
                  type="button"
                  onClick={() => toggleExpand(ch.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {getChapterIcon(ch.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {ch.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {ch.badge}
                          </span>
                        )}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {ch.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{ch.subtitle}</p>
                    </div>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isExpanded ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Chapter Expanded Body */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                    {/* Paragraphs */}
                    <div className="space-y-2 mb-4">
                      {ch.paragraphs.map((p, idx) => (
                        <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* Bullet Points */}
                    {ch.bulletPoints && ch.bulletPoints.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
                        {ch.bulletPoints.map((bp, bidx) => (
                          <div
                            key={bidx}
                            className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs"
                          >
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                              {bp.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{bp.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pro Tip Box */}
                    {ch.tip && (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900 mt-3">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm leading-relaxed">{ch.tip}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
