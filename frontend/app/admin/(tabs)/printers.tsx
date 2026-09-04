import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getSettings,
  getCategories,
  upsertPrinterDevice,
  deletePrinterDevice,
  updateSettings,
  getReceiptLayout,
  updateReceiptLayout,
  ReceiptLayoutConfig,
  ReceiptCustomLine,
  ReceiptTranslationsMap,
  Category,
  PrinterDevice,
} from '@/src/api/api';
import {
  getPairedPrinters,
  testPrintTicket,
  getStoredPrinterConfig,
  savePrinterConfig,
  generateCourtesyTicketText,
  generateKitchenTicketText,
  PairedPrinter,
  PaperWidthMm,
} from '@/src/utils/printer';
import { getLicenseInfo, isMultiLicense, LicenseInfo } from '@/src/utils/license';
import { Text, TextInput, InfoTip } from '@/src/components/LocalizedPrimitives';
import AdminHeader from '@/src/components/AdminHeader';

export interface ReceiptBlockMeta {
  id: string;
  name: string;
  defaultOn: boolean;
  customizable: boolean;
  desc: string;
  hint: string;
  example: string;
}

const DEFAULT_BLOCKS: ReceiptBlockMeta[] = [
  {
    id: 'header_title',
    name: 'Nome Attività (Intestazione)',
    defaultOn: true,
    customizable: true,
    desc: 'Stampa il nome del ristorante, pizzeria o marchio in cima allo scontrino a caratteri grandi.',
    hint: 'Modificabile direttamente nel campo testo sopra o in Impostazioni Locale.',
    example: 'BURGER FAST FOOD',
  },
  {
    id: 'header_subtitle',
    name: 'Indirizzo e Recapiti',
    defaultOn: true,
    customizable: true,
    desc: 'Indirizzo fisico, città, CAP e numero di telefono dell\'attività commerciale.',
    hint: 'Modificabile nel campo testo sopra o in Impostazioni Locale.',
    example: 'Via Roma 12, Milano - Tel. 02 1234567',
  },
  {
    id: 'tax_id',
    name: 'Partita IVA / Dati Fiscali',
    defaultOn: true,
    customizable: true,
    desc: 'Codice fiscale o Partita IVA dell\'esercente per conformità e identificazione.',
    hint: 'Modificabile nel campo testo sopra o in Impostazioni Locale.',
    example: 'P.IVA: IT12345678901',
  },
  {
    id: 'courtesy_banner',
    name: 'Dicitura Scontrino di Cortesia',
    defaultOn: true,
    customizable: true,
    desc: 'Banner che chiarisce al cliente che si tratta di un promemoria ordine non fiscale.',
    hint: 'Traduzione e testo personalizzabili nel tab "Traduzioni" (es. SCONTRINO DI CORTESIA).',
    example: '*** SCONTRINO DI CORTESIA ***',
  },
  {
    id: 'sep_1',
    name: 'Linea Separatore Intestazione',
    defaultOn: true,
    customizable: false,
    desc: 'Riga tratteggiata di divisione tra l\'intestazione dell\'attività e i dettagli dell\'ordine.',
    hint: 'Generata graficamente dal motore di stampa termica (stile regolabile in Formato Carta).',
    example: '--------------------------------',
  },
  {
    id: 'date_time',
    name: 'Data e Ora Emissione',
    defaultOn: true,
    customizable: false,
    desc: 'Data solare e orario al secondo calcolati automaticamente all\'invio della comanda.',
    hint: 'Generato automaticamente dal sistema del Totem al momento del checkout.',
    example: 'Data: 03/09/2026  14:32:05',
  },
  {
    id: 'order_type',
    name: 'Tipo Servizio (Asporto / Tavolo)',
    defaultOn: true,
    customizable: false,
    desc: 'Modalità di consumo selezionata dal cliente (Consumazione sul Posto, Asporto o Al Tavolo).',
    hint: 'Rilevato in automatico dalla scelta effettuata dal cliente al Totem.',
    example: 'MODALITA: ASPORTO',
  },
  {
    id: 'order_num',
    name: 'Numero Comanda In Evidenza (#)',
    defaultOn: true,
    customizable: false,
    desc: 'Numero progressivo univoco stampato in evidenza per la chiamata a cassa o banco ritiro.',
    hint: 'Assegnato in sequenza automatica giornaliera con prefisso totem opzionale.',
    example: '#42',
  },
  {
    id: 'sep_2',
    name: 'Linea Separatore Prodotti',
    defaultOn: true,
    customizable: false,
    desc: 'Riga orizzontale che separa i metadati dell\'ordine dalla tabella dei piatti ordinati.',
    hint: 'Generata automaticamente. Può essere nascosta tramite lo switch dedicato.',
    example: '--------------------------------',
  },
  {
    id: 'items',
    name: 'Tabella Piatti, Prezzi & Note',
    defaultOn: true,
    customizable: false,
    desc: 'Elenco completo dei prodotti acquistati con quantità, prezzo unitario, varianti e ingredienti rimossi (senza).',
    hint: 'Generato fedelmente dal carrello dell\'ordine composto dal cliente.',
    example: '2x Classic Burger BBQ     12.00 €\n   - SENZA Cipolla\n1x Patatine Fritte Maxi    2.50 €',
  },
  {
    id: 'sep_3',
    name: 'Linea Separatore Totale',
    defaultOn: true,
    customizable: false,
    desc: 'Separatore grafico che anticipa il totale economico finale.',
    hint: 'Generata automaticamente.',
    example: '--------------------------------',
  },
  {
    id: 'subtotal',
    name: 'Subtotale Economico',
    defaultOn: false,
    customizable: false,
    desc: 'Importo parziale prima di sconti o promozioni. Disattivato di default.',
    hint: 'Calcolato in tempo reale dal totale degli articoli.',
    example: 'SUBTOTALE:                14.50 €',
  },
  {
    id: 'total',
    name: 'Totale Complessivo & Cassa',
    defaultOn: true,
    customizable: true,
    desc: 'Totale complessivo in euro da pagare e istruzione per recarsi alla cassa.',
    hint: 'L\'importo è calcolato dal sistema. La scritta "-> PAGA ALLA CASSA <-" è modificabile nel tab "Traduzioni".',
    example: 'TOTALE:                   14.50 €\n-> PAGA ALLA CASSA <-',
  },
  {
    id: 'custom_lines',
    name: 'Righe Personalizzate (Wi-Fi, Info)',
    defaultOn: true,
    customizable: true,
    desc: 'Testi promozionali o informativi liberi (es. password Wi-Fi, Instagram, orari, messaggi per clienti).',
    hint: 'Completamente personalizzabili con testo e allineamento (SX/Centro/DX) nel tab "Righe Custom".',
    example: 'Wi-Fi Clienti: TotemGuest\nSeguici su IG @fastfood_totem',
  },
  {
    id: 'sep_4',
    name: 'Linea Separatore Chiusura',
    defaultOn: true,
    customizable: false,
    desc: 'Riga divisoria prima del commiato finale e delle note legali.',
    hint: 'Generata automaticamente.',
    example: '--------------------------------',
  },
  {
    id: 'footer_message',
    name: 'Messaggio Ringraziamento Finale',
    defaultOn: true,
    customizable: true,
    desc: 'Frase di saluto e ringraziamento rivolta al cliente a fine scontrino.',
    hint: 'Modificabile nel campo testo sopra e nelle rispettive lingue nel tab "Traduzioni".',
    example: 'Grazie per la visita!\nArrivederci a presto!',
  },
  {
    id: 'footer_non_fiscal',
    name: 'Dicitura Legale Non Fiscale',
    defaultOn: true,
    customizable: true,
    desc: 'Avvertenza legale che informa che il promemoria non sostituisce lo scontrino fiscale / fattura.',
    hint: 'Modificabile nel campo testo sopra o nelle lingue nel tab "Traduzioni".',
    example: 'DOCUMENTO NON FISCALE',
  },
];

const DEFAULT_TRANSLATIONS: Record<string, ReceiptTranslationsMap> = {
  it: {
    courtesy: 'SCONTRINO DI CORTESIA',
    order_num: 'NUMERO ORDINE',
    total: 'TOTALE',
    subtotal: 'SUBTOTALE',
    pay_at_cash: '-> PAGA ALLA CASSA <-',
    thanks: 'Grazie per la visita!\nArrivederci!',
    non_fiscal: 'DOCUMENTO NON FISCALE',
    table: 'AL TAVOLO',
    takeaway: 'ASPORTO',
    dine_in: 'CONSUMAZIONE SUL POSTO',
    without: 'SENZA: ',
    notes: 'NOTE: ',
    tax_id_label: 'P.IVA',
  },
  en: {
    courtesy: 'COURTESY RECEIPT',
    order_num: 'ORDER NUMBER',
    total: 'TOTAL',
    subtotal: 'SUBTOTAL',
    pay_at_cash: '-> PAY AT CASHIER <-',
    thanks: 'Thank you for your visit!\nSee you soon!',
    non_fiscal: 'NON-FISCAL RECEIPT',
    table: 'TABLE',
    takeaway: 'TAKEAWAY',
    dine_in: 'DINE IN',
    without: 'NO: ',
    notes: 'NOTES: ',
    tax_id_label: 'VAT ID',
  },
  fr: {
    courtesy: 'TICKET DE COURTOISIE',
    order_num: 'NUMERO DE COMMANDE',
    total: 'TOTAL',
    subtotal: 'SOUS-TOTAL',
    pay_at_cash: '-> PAYER EN CAISSE <-',
    thanks: 'Merci de votre visite !\nA bientôt !',
    non_fiscal: 'DOCUMENT NON FISCAL',
    table: 'A TABLE',
    takeaway: 'A EMPORTER',
    dine_in: 'SUR PLACE',
    without: 'SANS: ',
    notes: 'NOTES: ',
    tax_id_label: 'TVA',
  },
  de: {
    courtesy: 'KASSENBELEG',
    order_num: 'BESTELLNUMMER',
    total: 'GESAMT',
    subtotal: 'ZWISCHENSUMME',
    pay_at_cash: '-> AN DER KASSE BEZAHLEN <-',
    thanks: 'Vielen Dank für Ihren Besuch!\nAuf Wiedersehen!',
    non_fiscal: 'NICHT-STEUERLICHER BELEG',
    table: 'TISCH',
    takeaway: 'ZUM MITNEHMEN',
    dine_in: 'HIER ESSEN',
    without: 'OHNE: ',
    notes: 'HINWEIS: ',
    tax_id_label: 'UST-ID',
  },
  es: {
    courtesy: 'TICKET DE CORTESIA',
    order_num: 'NUMERO DE PEDIDO',
    total: 'TOTAL',
    subtotal: 'SUBTOTAL',
    pay_at_cash: '-> PAGAR EN CAJA <-',
    thanks: '¡Gracias por su visita!\n¡Hasta pronto!',
    non_fiscal: 'DOCUMENTO NO FISCAL',
    table: 'MESA',
    takeaway: 'PARA LLEVAR',
    dine_in: 'EN LOCAL',
    without: 'SIN: ',
    notes: 'NOTAS: ',
    tax_id_label: 'NIF/CIF',
  },
};

export default function PrintersScreen() {
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  const isTablet = winW >= 768;

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [found, setFound] = useState<PairedPrinter[]>([]);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Cucina');
  const [newAddr, setNewAddr] = useState('');
  const [renameDraft, setRenameDraft] = useState<Record<string, string>>({});
  const [autoPrintCourtesy, setAutoPrintCourtesy] = useState(true);
  const [autoPrintKitchen, setAutoPrintKitchen] = useState(true);
  const [paperWidthMm, setPaperWidthMm] = useState<PaperWidthMm>(58);

  // Receipt Layout Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<'blocks' | 'custom_lines' | 'translations' | 'style'>('blocks');
  const [savingLayout, setSavingLayout] = useState(false);
  const [activeTranslationLang, setActiveTranslationLang] = useState<string>('it');
  const [expandedBlockInfo, setExpandedBlockInfo] = useState<string | null>(null);
  const [showBlocksGuide, setShowBlocksGuide] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  const [receiptConfig, setReceiptConfig] = useState<ReceiptLayoutConfig>({
    language: 'auto',
    paper_width_mm: 58,
    header_title: 'BURGER FAST FOOD',
    header_subtitle: 'Via Roma 12, Milano',
    header_tax_id: 'IT12345678901',
    show_order_number_big: true,
    show_order_type: true,
    show_date_time: true,
    show_subtotal: false,
    show_tax_summary: true,
    item_notes_enabled: true,
    footer_message: 'Grazie per la visita!\nArrivederci!',
    footer_non_fiscal_note: 'DOCUMENTO NON FISCALE',
    separator_style: 'dashes',
    blocks_order: DEFAULT_BLOCKS.map((b) => b.id),
    custom_lines: [
      { id: 'cl_1', text: 'Wi-Fi Clienti: TotemGuest (Pass: 1234)', align: 'center', bold: false },
    ],
    translations: DEFAULT_TRANSLATIONS,
  });

  const unlimited = isMultiLicense(license);
  const maxPrinters = unlimited ? 99 : 2;

  const load = useCallback(async () => {
    try {
      const [settings, cats, lic, storedConfig, receiptLayout] = await Promise.all([
        getSettings(),
        getCategories().catch(() => [] as Category[]),
        getLicenseInfo().catch(() => null),
        getStoredPrinterConfig().catch(() => null),
        getReceiptLayout().catch(() => null),
      ]);
      setPrinters(settings.printers || []);
      setCategories(cats || []);
      setLicense(lic);
      setAutoPrintCourtesy(settings.auto_print_courtesy !== false);
      setAutoPrintKitchen(settings.auto_print_kitchen !== false);
      if (storedConfig?.paper_width_mm) setPaperWidthMm(storedConfig.paper_width_mm);
      if (receiptLayout) {
        setReceiptConfig((prev) => ({
          ...prev,
          ...receiptLayout,
          blocks_order: receiptLayout.blocks_order && receiptLayout.blocks_order.length > 0
            ? receiptLayout.blocks_order
            : prev.blocks_order,
          custom_lines: receiptLayout.custom_lines || prev.custom_lines,
          translations: {
            ...DEFAULT_TRANSLATIONS,
            ...(receiptLayout.translations || {}),
          },
        }));
      }
      const drafts: Record<string, string> = {};
      (settings.printers || []).forEach((p) => { drafts[p.id] = p.name; });
      setRenameDraft(drafts);
    } catch (e) {
      console.warn('printers load', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const ensureCapacity = () => {
    if (printers.length >= maxPrinters) {
      Alert.alert(
        'Limite Totem Mono',
        'Il piano Totem Mono include fino a 2 stampanti. Passa a Totem Multi (19,99 €/mese) per stampanti illimitate.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Vedi licenza', onPress: () => router.push('/admin/license') },
        ]
      );
      return false;
    }
    return true;
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      const devices = await getPairedPrinters();
      setFound(devices || []);
      if (!devices?.length) {
        Alert.alert(
          'Nessuna stampante rilevata',
          'Assicurati che la stampante sia accesa e associata al tablet nelle Impostazioni Bluetooth di Android prima di avviare la ricerca.'
        );
      }
    } catch (e: any) {
      Alert.alert('Ricerca non riuscita', e?.message || 'Impossibile cercare i dispositivi Bluetooth.');
    } finally {
      setScanning(false);
    }
  };

  const addFromScan = async (device: PairedPrinter) => {
    if (!ensureCapacity()) return;
    const addr = device.address || device.id;
    const already = printers.some((p) => p.address === addr);
    if (already) {
      Alert.alert('Già presente', 'Questa stampante è già stata aggiunta. Puoi rinominarla nell\'elenco sotto.');
      return;
    }
    const saved = await upsertPrinterDevice({
      name: device.name || 'Stampante Bluetooth',
      department: 'Cucina',
      interface_type: 'bluetooth',
      address: addr,
      print_kitchen: true,
      enabled: true,
      assigned_category_ids: [],
    });
    setPrinters((list) => [...list.filter((x) => x.id !== saved.id), saved]);
    setRenameDraft((d) => ({ ...d, [saved.id]: saved.name }));
  };

  const addManual = async () => {
    if (!newName.trim()) {
      Alert.alert('Nome obbligatorio', 'Inserisci un nome per la stampante.');
      return;
    }
    if (!ensureCapacity()) return;
    const addr = newAddr.trim();
    const saved = await upsertPrinterDevice({
      name: newName.trim(),
      department: newDept.trim() || 'Cucina',
      interface_type: addr.includes(':9100') || /^\d+\.\d+\.\d+\.\d+/.test(addr) ? 'tcp_raw' : 'bluetooth',
      address: addr,
      print_kitchen: true,
      enabled: true,
      assigned_category_ids: [],
    });
    setPrinters((list) => [...list.filter((x) => x.id !== saved.id), saved]);
    setRenameDraft((d) => ({ ...d, [saved.id]: saved.name }));
    setNewName('');
    setNewAddr('');
  };

  const saveRename = async (printer: PrinterDevice) => {
    const name = (renameDraft[printer.id] || '').trim();
    if (!name) return;
    const saved = await upsertPrinterDevice({ ...printer, name });
    setPrinters((list) => list.map((x) => (x.id === saved.id ? saved : x)));
  };

  const toggleRole = async (printer: PrinterDevice, role: 'courtesy' | 'kitchen' | 'enabled') => {
    const patch =
      role === 'courtesy'
        ? { print_courtesy: !printer.print_courtesy }
        : role === 'kitchen'
          ? { print_kitchen: !printer.print_kitchen }
          : { enabled: !printer.enabled };
    const saved = await upsertPrinterDevice({ ...printer, ...patch });
    setPrinters((list) => list.map((x) => (x.id === saved.id ? saved : x)));
  };

  const toggleCategory = async (printer: PrinterDevice, categoryId: string) => {
    const on = (printer.assigned_category_ids || []).includes(categoryId);
    const nextIds = on
      ? (printer.assigned_category_ids || []).filter((id) => id !== categoryId)
      : [...(printer.assigned_category_ids || []), categoryId];
    const saved = await upsertPrinterDevice({ ...printer, assigned_category_ids: nextIds });
    setPrinters((list) => list.map((x) => (x.id === saved.id ? saved : x)));
  };

  const saveReceiptLayoutHandler = async () => {
    try {
      setSavingLayout(true);
      await updateReceiptLayout(receiptConfig);
      Alert.alert('✅ Salvato', 'Layout scontrino, traduzioni e righe personalizzate salvati con successo!');
      setEditorOpen(false);
    } catch (e: any) {
      Alert.alert('Errore', e?.message || 'Impossibile salvare il layout scontrino');
    } finally {
      setSavingLayout(false);
    }
  };

  // Block Reordering & Toggle handlers
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const currentOrder = [...(receiptConfig.blocks_order || DEFAULT_BLOCKS.map((b) => b.id))];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIndex];
    currentOrder[targetIndex] = temp;
    setReceiptConfig({ ...receiptConfig, blocks_order: currentOrder });
  };

  const toggleBlockVisibility = (blockId: string) => {
    const currentOrder = [...(receiptConfig.blocks_order || DEFAULT_BLOCKS.map((b) => b.id))];
    const exists = currentOrder.includes(blockId);
    let newOrder: string[];
    if (exists) {
      newOrder = currentOrder.filter((id) => id !== blockId);
    } else {
      newOrder = [...currentOrder, blockId];
    }
    setReceiptConfig({ ...receiptConfig, blocks_order: newOrder });
  };

  // Custom Line handlers
  const addCustomLine = () => {
    const newLine: ReceiptCustomLine = {
      id: 'cl_' + Date.now(),
      text: 'Nuova riga testo...',
      align: 'center',
      bold: false,
    };
    setReceiptConfig({
      ...receiptConfig,
      custom_lines: [...(receiptConfig.custom_lines || []), newLine],
    });
  };

  const updateCustomLine = (id: string, patch: Partial<ReceiptCustomLine>) => {
    const updated = (receiptConfig.custom_lines || []).map((l) =>
      l.id === id ? { ...l, ...patch } : l
    );
    setReceiptConfig({ ...receiptConfig, custom_lines: updated });
  };

  const removeCustomLine = (id: string) => {
    const updated = (receiptConfig.custom_lines || []).filter((l) => l.id !== id);
    setReceiptConfig({ ...receiptConfig, custom_lines: updated });
  };

  // Translation Update Handler
  const updateTranslationField = (lang: string, field: keyof ReceiptTranslationsMap, value: string) => {
    const currentTranslations = { ...(receiptConfig.translations || DEFAULT_TRANSLATIONS) };
    const langObj = { ...(currentTranslations[lang] || DEFAULT_TRANSLATIONS[lang] || {}) };
    langObj[field] = value;
    currentTranslations[lang] = langObj;
    setReceiptConfig({ ...receiptConfig, translations: currentTranslations });
  };

  // Live simulation of the receipt ticket text
  const sampleOrder: any = useMemo(
    () => ({
      id: 'sample-001',
      order_number: 42,
      order_prefix: 'T1',
      order_type: 'takeaway',
      status: 'pending',
      created_at: new Date().toISOString(),
      total_price: 14.5,
      items: [
        { product_id: 'p1', product_name: 'Classic Burger BBQ', quantity: 2, price: 6.0, removed_ingredients: ['Cipolla'] },
        { product_id: 'p2', product_name: 'Patatine Fritte Maxi', quantity: 1, price: 2.5 },
      ],
    }),
    []
  );

  const previewTicketText = useMemo(() => {
    return generateCourtesyTicketText(
      sampleOrder,
      {
        ...receiptConfig,
        restaurant_name: receiptConfig.header_title,
        receipt_layout: receiptConfig,
      } as any,
      (receiptConfig.paper_width_mm || 58) as PaperWidthMm
    );
  }, [sampleOrder, receiptConfig]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  const currentBlocksOrder = receiptConfig.blocks_order || DEFAULT_BLOCKS.map((b) => b.id);

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Stampanti & Scontrino"
        subtitle="Gestione stampanti termiche LAN/Bluetooth ed editor avanzato scontrino"
        emoji="🖨️"
        showBack={true}
        showTotemButton={true}
        badge={{
          text: unlimited ? 'Totem Multi (Illimitate)' : `Mono (${printers.length}/2)`,
          variant: unlimited ? 'success' : 'primary',
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Banner Quick Open Editor */}
        <TouchableOpacity style={styles.btnOpenEditor} onPress={() => setEditorOpen(true)}>
          <View style={styles.btnOpenEditorLeft}>
            <View style={styles.btnOpenEditorIconBox}>
              <Ionicons name="receipt-outline" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.btnOpenEditorTitle}>⚙️ Personalizza Layout Scontrino & Traduzioni</Text>
              <Text style={styles.btnOpenEditorSubtitle}>
                Riordina le righe, modifica testi, aggiungi messaggi personalizzati e personalizza le traduzioni in 5 lingue.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#99F6E4" />
        </TouchableOpacity>

        {/* Global Printing Toggles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ Automatismi di Stampa Ordini</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Stampa automatica Scontrino di Cortesia (Cassa/Cliente)</Text>
            <Switch
              value={autoPrintCourtesy}
              onValueChange={async (v) => {
                setAutoPrintCourtesy(v);
                await updateSettings({ auto_print_courtesy: v });
              }}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Stampa automatica Comanda Cucina / Reparto</Text>
            <Switch
              value={autoPrintKitchen}
              onValueChange={async (v) => {
                setAutoPrintKitchen(v);
                await updateSettings({ auto_print_kitchen: v });
              }}
              trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
            />
          </View>
        </View>

        {/* Printer Devices List */}
        <View style={styles.card}>
          <View style={[styles.row, { marginBottom: 4 }]}>
            <Text style={styles.cardTitle}>📱 Stampanti Configurate ({printers.length})</Text>
            <TouchableOpacity style={styles.ghost} onPress={handleScan} disabled={scanning}>
              {scanning ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <Ionicons name="bluetooth" size={16} color="#0F766E" />
              )}
              <Text style={styles.ghostText}>{scanning ? 'Ricerca...' : 'Cerca Bluetooth'}</Text>
            </TouchableOpacity>
          </View>

          {printers.length === 0 ? (
            <Text style={styles.hint}>Nessuna stampante associata. Cerca un dispositivo Bluetooth o aggiungine uno manuale.</Text>
          ) : (
            printers.map((p) => (
              <View key={p.id} style={styles.item}>
                <View style={styles.itemHead}>
                  <TextInput
                    style={styles.rename}
                    value={renameDraft[p.id] ?? p.name}
                    onChangeText={(t) => setRenameDraft((d) => ({ ...d, [p.id]: t }))}
                    onBlur={() => saveRename(p)}
                    placeholder="Nome stampante"
                  />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      Alert.alert('Rimuovere stampante?', `Eliminare "${p.name}"?`, [
                        { text: 'Annulla', style: 'cancel' },
                        {
                          text: 'Elimina',
                          style: 'destructive',
                          onPress: async () => {
                            await deletePrinterDevice(p.id);
                            setPrinters((list) => list.filter((x) => x.id !== p.id));
                          },
                        },
                      ]);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.meta}>
                  {p.interface_type || 'bluetooth'} • {p.address || 'Interna / Sunmi'}
                </Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Abilitata</Text>
                  <Switch
                    value={p.enabled !== false}
                    onValueChange={() => toggleRole(p, 'enabled')}
                    trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Scontrino Cortesia</Text>
                  <Switch
                    value={Boolean(p.print_courtesy)}
                    onValueChange={() => toggleRole(p, 'courtesy')}
                    trackColor={{ false: '#CBD5E1', true: '#0F766E' }}
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Comanda Cucina</Text>
                  <Switch
                    value={Boolean(p.print_kitchen)}
                    onValueChange={() => toggleRole(p, 'kitchen')}
                    trackColor={{ false: '#CBD5E1', true: '#EA580C' }}
                  />
                </View>
                
                {Boolean(p.print_kitchen) && categories.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Categorie KDS (Lascia vuoto per stamparle tutte)</Text>
                    <View style={styles.pills}>
                      {categories.map((cat) => {
                        const on = (p.assigned_category_ids || []).includes(cat.id);
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.pill, on && styles.pillOn]}
                            onPress={async () => {
                              const nextIds = on
                                ? (p.assigned_category_ids || []).filter((id) => id !== cat.id)
                                : [...(p.assigned_category_ids || []), cat.id];
                              const saved = await upsertPrinterDevice({ ...p, assigned_category_ids: nextIds });
                              setPrinters((list) => list.map((x) => (x.id === saved.id ? saved : x)));
                            }}
                          >
                            <Text style={[styles.pillText, on && styles.pillTextOn]}>{cat.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Found Bluetooth devices from Scan */}
        {found.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔍 Dispositivi Bluetooth Trovati ({found.length})</Text>
            {found.map((d) => (
              <View key={d.address || d.id} style={styles.scanRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName}>{d.name || 'Dispositivo Sconosciuto'}</Text>
                  <Text style={styles.meta}>{d.address || d.id}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => addFromScan(d)}>
                  <Text style={styles.addBtnText}>+ Associa</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Manual Add Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>➕ Aggiungi Stampante Manuale</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome (es. Cassa Banco, Bar, Forno)"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Indirizzo (MAC Bluetooth o IP LAN es. 192.168.1.100:9100)"
            value={newAddr}
            onChangeText={setNewAddr}
          />
          <TouchableOpacity style={styles.primary} onPress={addManual}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.primaryText}>Aggiungi Stampante</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL: ADVANCED RECEIPT LAYOUT & TRANSLATIONS EDITOR                       */}
      {/* ========================================================================= */}
      <Modal visible={editorOpen} animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditorOpen(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 6 }}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {!isTablet ? 'Editor Scontrino' : 'Editor Layout Scontrino & Traduzioni'}
              </Text>
              {isTablet && (
                <Text style={styles.modalHeaderSub}>Personalizzazione termica completa</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={saveReceiptLayoutHandler}
              disabled={savingLayout}
            >
              {savingLayout ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Salva</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal Tabs Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.modalTabsBar}
            contentContainerStyle={styles.modalTabsBarContent}
          >
            {[
              { id: 'blocks', label: 'Blocchi & Righe', icon: 'reorder-four-outline' },
              { id: 'custom_lines', label: 'Righe Custom', icon: 'create-outline' },
              { id: 'translations', label: 'Traduzioni', icon: 'language-outline' },
              { id: 'style', label: 'Formato Carta', icon: 'options-outline' },
            ].map((tab) => {
              const active = editorTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.modalTabBtn, active && styles.modalTabBtnActive]}
                  onPress={() => setEditorTab(tab.id as any)}
                >
                  <Ionicons name={tab.icon as any} size={15} color={active ? '#FFFFFF' : '#475569'} />
                  <Text style={[styles.modalTabBtnText, active && styles.modalTabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Persistent Live Preview for Mobile (< 768px): Always visible on all tabs */}
          {!isTablet && (
            <View style={styles.mobileLivePreviewContainer}>
              <View style={styles.mobileLivePreviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.mobileLivePreviewTitle}>
                    Anteprima Live ({receiptConfig.paper_width_mm || 58}mm)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {[58, 80].map((w) => (
                    <TouchableOpacity
                      key={w}
                      style={[
                        styles.quickFormatPill,
                        (receiptConfig.paper_width_mm || 58) === w && styles.quickFormatPillActive,
                      ]}
                      onPress={() => setReceiptConfig({ ...receiptConfig, paper_width_mm: w as any })}
                    >
                      <Text
                        style={[
                          styles.quickFormatPillText,
                          (receiptConfig.paper_width_mm || 58) === w && styles.quickFormatPillTextActive,
                        ]}
                      >
                        {w}mm
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.togglePreviewCollapseBtn}
                    onPress={() => setPreviewCollapsed(!previewCollapsed)}
                  >
                    <Ionicons
                      name={previewCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'}
                      size={16}
                      color="#0F766E"
                    />
                    <Text style={styles.togglePreviewCollapseText}>
                      {previewCollapsed ? 'Espandi' : 'Riduci'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {!previewCollapsed && (
                <ScrollView
                  style={styles.mobileThermalReceiptBox}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.previewReceiptTextCompact} selectable>
                    {previewTicketText}
                  </Text>
                </ScrollView>
              )}
            </View>
          )}

          {/* Modal Body: Two column on tablet, single column on phone */}
          <View style={[styles.modalBodyRow, !isTablet && { flexDirection: 'column' }]}>
            {/* Left Column: Editor Controls */}
            <ScrollView style={styles.modalScrollCol} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              {/* TAB 1: BLOCKS ORDERING & EDITING */}
              {editorTab === 'blocks' && (
                <View style={{ gap: 12 }}>
                  {/* Collapsible General Guide */}
                  <TouchableOpacity
                    style={styles.guideCollapsibleBtn}
                    onPress={() => setShowBlocksGuide(!showBlocksGuide)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Ionicons name="help-circle-outline" size={20} color="#0F766E" />
                      <Text style={styles.guideCollapsibleTitle}>
                        Come funzionano i blocchi e cosa puoi personalizzare?
                      </Text>
                    </View>
                    <Ionicons
                      name={showBlocksGuide ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#0F766E"
                    />
                  </TouchableOpacity>

                  {showBlocksGuide && (
                    <View style={styles.guideCollapsibleContent}>
                      <View style={{ gap: 8 }}>
                        <View style={styles.legendRow}>
                          <View style={[styles.legendBadge, styles.badgeCustomizable]}>
                            <Text style={styles.badgeCustomizableText}>🟢 Personalizzabile</Text>
                          </View>
                          <Text style={styles.legendDesc}>
                            Testi modificabili da te (Nome ristorante, indirizzo, P.IVA, note, saluti, righe custom).
                          </Text>
                        </View>
                        <View style={styles.legendRow}>
                          <View style={[styles.legendBadge, styles.badgeSystem]}>
                            <Text style={styles.badgeSystemText}>🔵 Generato dal sistema</Text>
                          </View>
                          <Text style={styles.legendDesc}>
                            Dati dinamici calcolati dal Totem al checkout (data/ora, numero progressivo comanda, piatti scelti, totale euro, linee grafiche).
                          </Text>
                        </View>
                        <Text style={styles.guideTipText}>
                          💡 <Text style={{ fontWeight: '700' }}>Suggerimento:</Text> Usa le frecce ⬆️ e ⬇️ per riordinare la posizione nello scontrino. Usa lo switch per mostrare o nascondere un rigo. Tocca <Text style={{ fontWeight: '700' }}>ℹ️ Info</Text> su ciascun rigo per conoscere la funzione e vederne l'esempio reale di stampa.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Header Title Editor */}
                  <View style={styles.blockItemCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.blockItemTitle}>🏪 Nome Attività (Intestazione)</Text>
                      <View style={[styles.legendBadge, styles.badgeCustomizable]}>
                        <Text style={styles.badgeCustomizableText}>Personalizzabile</Text>
                      </View>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={receiptConfig.header_title}
                      onChangeText={(t) => setReceiptConfig({ ...receiptConfig, header_title: t })}
                      placeholder="Nome Ristorante..."
                    />
                  </View>

                  {/* Header Subtitle Editor */}
                  <View style={styles.blockItemCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.blockItemTitle}>📍 Sottotitolo / Indirizzo</Text>
                      <View style={[styles.legendBadge, styles.badgeCustomizable]}>
                        <Text style={styles.badgeCustomizableText}>Personalizzabile</Text>
                      </View>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={receiptConfig.header_subtitle}
                      onChangeText={(t) => setReceiptConfig({ ...receiptConfig, header_subtitle: t })}
                      placeholder="Via Roma 12, Milano"
                    />
                  </View>

                  {/* Tax ID Editor */}
                  <View style={styles.blockItemCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.blockItemTitle}>🏛️ Partita IVA / Dati Fiscali</Text>
                      <View style={[styles.legendBadge, styles.badgeCustomizable]}>
                        <Text style={styles.badgeCustomizableText}>Personalizzabile</Text>
                      </View>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={receiptConfig.header_tax_id}
                      onChangeText={(t) => setReceiptConfig({ ...receiptConfig, header_tax_id: t })}
                      placeholder="P.IVA 12345678901"
                    />
                  </View>

                  {/* Footer Message Editor */}
                  <View style={styles.blockItemCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.blockItemTitle}>💬 Messaggio di Saluto a Piè di Pagina</Text>
                      <View style={[styles.legendBadge, styles.badgeCustomizable]}>
                        <Text style={styles.badgeCustomizableText}>Personalizzabile</Text>
                      </View>
                    </View>
                    <TextInput
                      style={[styles.input, { height: 54 }]}
                      multiline
                      value={receiptConfig.footer_message}
                      onChangeText={(t) => setReceiptConfig({ ...receiptConfig, footer_message: t })}
                      placeholder="Grazie per la visita! Arrivederci!"
                    />
                  </View>

                  {/* Non-Fiscal Note Editor */}
                  <View style={styles.blockItemCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.blockItemTitle}>📜 Dicitura Non Fiscale</Text>
                      <View style={[styles.legendBadge, styles.badgeCustomizable]}>
                        <Text style={styles.badgeCustomizableText}>Personalizzabile</Text>
                      </View>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={receiptConfig.footer_non_fiscal_note}
                      onChangeText={(t) => setReceiptConfig({ ...receiptConfig, footer_non_fiscal_note: t })}
                      placeholder="DOCUMENTO NON FISCALE"
                    />
                  </View>

                  {/* Reorderable Sequence List with Collapsible Info per Row */}
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.sectionHeaderTitle}>Sequenza, Ruoli e Visibilità Righe Scontrino</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Tocca "Info" per scoprire lo scopo del rigo e come personalizzarlo.
                    </Text>
                  </View>

                  {currentBlocksOrder.map((blockId, idx) => {
                    const blockMeta = DEFAULT_BLOCKS.find((b) => b.id === blockId) || {
                      id: blockId,
                      name: blockId,
                      defaultOn: true,
                      customizable: false,
                      desc: 'Sezione dello scontrino termico.',
                      hint: 'Generata automaticamente.',
                      example: blockId,
                    };
                    const isVisible = (receiptConfig.blocks_order || []).includes(blockId);
                    const isExpanded = expandedBlockInfo === blockId;

                    return (
                      <View key={blockId} style={styles.blockRowContainer}>
                        {/* Main Row */}
                        <View style={styles.blockRowItem}>
                          <View style={styles.blockOrderNum}>
                            <Text style={styles.blockOrderNumText}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.blockRowName}>{blockMeta.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View
                                style={[
                                  styles.legendBadge,
                                  blockMeta.customizable ? styles.badgeCustomizable : styles.badgeSystem,
                                ]}
                              >
                                <Text
                                  style={
                                    blockMeta.customizable
                                      ? styles.badgeCustomizableText
                                      : styles.badgeSystemText
                                  }
                                >
                                  {blockMeta.customizable ? '🟢 Personalizzabile' : '🔵 Generato dal sistema'}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={[styles.infoToggleBtn, isExpanded && styles.infoToggleBtnActive]}
                                onPress={() => setExpandedBlockInfo(isExpanded ? null : blockId)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Ionicons
                                  name={isExpanded ? 'information-circle' : 'information-circle-outline'}
                                  size={13}
                                  color={isExpanded ? '#FFFFFF' : '#0F766E'}
                                />
                                <Text
                                  style={[
                                    styles.infoToggleBtnText,
                                    isExpanded && styles.infoToggleBtnTextActive,
                                  ]}
                                >
                                  {isExpanded ? 'Chiudi' : 'Info'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.blockRowActions}>
                            <TouchableOpacity
                              style={[styles.arrowBtn, idx === 0 && styles.arrowBtnDisabled]}
                              disabled={idx === 0}
                              onPress={() => moveBlock(idx, 'up')}
                            >
                              <Ionicons name="arrow-up" size={16} color={idx === 0 ? '#CBD5E1' : '#0F172A'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.arrowBtn, idx === currentBlocksOrder.length - 1 && styles.arrowBtnDisabled]}
                              disabled={idx === currentBlocksOrder.length - 1}
                              onPress={() => moveBlock(idx, 'down')}
                            >
                              <Ionicons name="arrow-down" size={16} color={idx === currentBlocksOrder.length - 1 ? '#CBD5E1' : '#0F172A'} />
                            </TouchableOpacity>
                            <Switch
                              value={isVisible}
                              onValueChange={() => toggleBlockVisibility(blockId)}
                              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                            />
                          </View>
                        </View>

                        {/* Collapsible Info Drawer for this row */}
                        {isExpanded && (
                          <View style={styles.blockInfoDrawer}>
                            <View style={styles.blockInfoSection}>
                              <Text style={styles.blockInfoLabel}>📌 A COSA SERVE QUESTO RIGO:</Text>
                              <Text style={styles.blockInfoText}>{blockMeta.desc}</Text>
                            </View>
                            <View style={styles.blockInfoSection}>
                              <Text style={styles.blockInfoLabel}>
                                {blockMeta.customizable ? '✏️ COME PERSONALIZZARLO:' : '⚙️ ORIGINE DEL DATO:'}
                              </Text>
                              <Text style={styles.blockInfoText}>{blockMeta.hint}</Text>
                            </View>
                            <View style={styles.blockInfoExampleBox}>
                              <Text style={styles.blockInfoExampleLabel}>📄 Esempio reale di stampa:</Text>
                              <Text style={styles.blockInfoExampleCode}>{blockMeta.example}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* TAB 2: CUSTOM LINES */}
              {editorTab === 'custom_lines' && (
                <View style={{ gap: 12 }}>
                  <View style={styles.editorHelpBox}>
                    <Ionicons name="create-outline" size={18} color="#0F766E" />
                    <Text style={styles.editorHelpText}>
                      Aggiungi righe di testo personalizzate allo scontrino (es. Wi-Fi, Social Network, Orari di apertura, Promozioni).
                    </Text>
                  </View>

                  {(receiptConfig.custom_lines || []).map((line, idx) => (
                    <View key={line.id} style={styles.customLineCard}>
                      <View style={styles.customLineCardHeader}>
                        <Text style={styles.customLineCardTitle}>Riga Personalizzata #{idx + 1}</Text>
                        <TouchableOpacity onPress={() => removeCustomLine(line.id)}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={styles.input}
                        value={line.text}
                        onChangeText={(t) => updateCustomLine(line.id, { text: t })}
                        placeholder="Testo riga..."
                      />

                      <View style={styles.customLineOptionsRow}>
                        <Text style={styles.rowLabel}>Allineamento:</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {(['left', 'center', 'right'] as const).map((aln) => {
                            const isSelected = (line.align || 'center') === aln;
                            return (
                              <TouchableOpacity
                                key={aln}
                                style={[styles.alignBtn, isSelected && styles.alignBtnActive]}
                                onPress={() => updateCustomLine(line.id, { align: aln })}
                              >
                                <Text style={[styles.alignBtnText, isSelected && styles.alignBtnTextActive]}>
                                  {aln === 'left' ? 'SX' : aln === 'center' ? 'Centro' : 'DX'}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.primary} onPress={addCustomLine}>
                    <Ionicons name="add" size={18} color="#FFF" />
                    <Text style={styles.primaryText}>+ Aggiungi Nuova Riga</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* TAB 3: COMPLETE MULTILINGUAL TRANSLATIONS */}
              {editorTab === 'translations' && (
                <View style={{ gap: 12 }}>
                  <View style={styles.editorHelpBox}>
                    <Ionicons name="language-outline" size={18} color="#0F766E" />
                    <Text style={styles.editorHelpText}>
                      Modifica le diciture dello scontrino per ogni lingua supportata. Le traduzioni verranno stampate in base alla lingua dell'ordine o del cliente.
                    </Text>
                  </View>

                  {/* Language Selector Chips */}
                  <View style={styles.langPills}>
                    {[
                      { code: 'it', label: '🇮🇹 Italiano' },
                      { code: 'en', label: '🇬🇧 English' },
                      { code: 'fr', label: '🇫🇷 Français' },
                      { code: 'de', label: '🇩🇪 Deutsch' },
                      { code: 'es', label: '🇪🇸 Español' },
                    ].map((l) => {
                      const active = activeTranslationLang === l.code;
                      return (
                        <TouchableOpacity
                          key={l.code}
                          style={[styles.langPill, active && styles.langPillActive]}
                          onPress={() => setActiveTranslationLang(l.code)}
                        >
                          <Text style={[styles.langPillText, active && styles.langPillTextActive]}>
                            {l.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Translation Fields for Selected Language */}
                  {(() => {
                    const dict = receiptConfig.translations?.[activeTranslationLang] || DEFAULT_TRANSLATIONS[activeTranslationLang] || {};
                    return (
                      <View style={{ gap: 10 }}>
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Titolo Scontrino di Cortesia</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.courtesy || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'courtesy', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Etichetta Numero Ordine</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.order_num || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'order_num', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Dicitura Totale</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.total || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'total', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Dicitura Subtotale</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.subtotal || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'subtotal', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Istruzione Pagamento Cassa</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.pay_at_cash || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'pay_at_cash', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Dicitura Asporto</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.takeaway || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'takeaway', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Dicitura Tavolo / Sul Posto</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.dine_in || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'dine_in', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Prefisso Senza Ingrediente</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.without || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'without', t)}
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Prefisso Note</Text>
                          <TextInput
                            style={styles.input}
                            value={dict.notes || ''}
                            onChangeText={(t) => updateTranslationField(activeTranslationLang, 'notes', t)}
                          />
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* TAB 4: STYLE & PAPER OPTIONS */}
              {editorTab === 'style' && (
                <View style={{ gap: 12 }}>
                  {/* Paper Width */}
                  <View style={styles.editorCard}>
                    <Text style={styles.editorCardTitle}>📏 Larghezza Rotolo Carta Termica</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {[58, 80].map((mm) => {
                        const active = (receiptConfig.paper_width_mm || 58) === mm;
                        return (
                          <TouchableOpacity
                            key={mm}
                            style={[styles.paperWidthBtn, active && styles.paperWidthBtnActive]}
                            onPress={() => setReceiptConfig({ ...receiptConfig, paper_width_mm: mm as any })}
                          >
                            <Text style={[styles.paperWidthBtnText, active && styles.paperWidthBtnTextActive]}>
                              {mm} mm ({mm === 58 ? '32 caratteri' : '48 caratteri'})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Separator Style */}
                  <View style={styles.editorCard}>
                    <Text style={styles.editorCardTitle}>➗ Stile Linee Separatori</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {[
                        { id: 'dashes', label: 'Trattini (- - -)' },
                        { id: 'equals', label: 'Doppia linea (===)' },
                        { id: 'stars', label: 'Stelline (***)' },
                        { id: 'solid', label: 'Continua (___)' },
                      ].map((sep) => {
                        const active = (receiptConfig.separator_style || 'dashes') === sep.id;
                        return (
                          <TouchableOpacity
                            key={sep.id}
                            style={[styles.langPill, active && styles.langPillActive]}
                            onPress={() => setReceiptConfig({ ...receiptConfig, separator_style: sep.id as any })}
                          >
                            <Text style={[styles.langPillText, active && styles.langPillTextActive]}>
                              {sep.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Reset Defaults */}
                  <TouchableOpacity
                    style={styles.btnResetDefaults}
                    onPress={() => {
                      Alert.alert('Ripristino', 'Vuoi ripristinare il layout scontrino e tutte le traduzioni ai valori di fabbrica?', [
                        { text: 'Annulla', style: 'cancel' },
                        {
                          text: 'Ripristina',
                          style: 'destructive',
                          onPress: () => {
                            setReceiptConfig({
                              language: 'auto',
                              paper_width_mm: 58,
                              header_title: 'BURGER FAST FOOD',
                              header_subtitle: 'Via Roma 12, Milano',
                              header_tax_id: 'IT12345678901',
                              show_order_number_big: true,
                              show_order_type: true,
                              show_date_time: true,
                              show_subtotal: false,
                              show_tax_summary: true,
                              item_notes_enabled: true,
                              footer_message: 'Grazie per la visita!\nArrivederci!',
                              footer_non_fiscal_note: 'DOCUMENTO NON FISCALE',
                              separator_style: 'dashes',
                              blocks_order: DEFAULT_BLOCKS.map((b) => b.id),
                              custom_lines: [
                                { id: 'cl_1', text: 'Wi-Fi Clienti: TotemGuest (Pass: 1234)', align: 'center', bold: false },
                              ],
                              translations: DEFAULT_TRANSLATIONS,
                            });
                          },
                        },
                      ]);
                    }}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#EF4444" />
                    <Text style={styles.btnResetDefaultsText}>Ripristina Valori di Fabbrica</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Right Column: Live Monospace Thermal Paper Preview (Always visible on tablet across ALL tabs) */}
            {isTablet && (
              <View style={[styles.modalPreviewCol, { width: 300 }]}>
                <View style={styles.previewReceiptHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.previewReceiptHeaderTitle}>
                      Live Scontrino ({receiptConfig.paper_width_mm || 58}mm)
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {[58, 80].map((w) => (
                      <TouchableOpacity
                        key={w}
                        style={[
                          styles.quickFormatPill,
                          (receiptConfig.paper_width_mm || 58) === w && styles.quickFormatPillActive,
                        ]}
                        onPress={() => setReceiptConfig({ ...receiptConfig, paper_width_mm: w as any })}
                      >
                        <Text
                          style={[
                            styles.quickFormatPillText,
                            (receiptConfig.paper_width_mm || 58) === w && styles.quickFormatPillTextActive,
                          ]}
                        >
                          {w}mm
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <ScrollView style={styles.previewReceiptBox} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  <Text style={styles.previewReceiptTextCompact}>{previewTicketText}</Text>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  content: { flex: 1 },
  scroll: { padding: 14, gap: 12, paddingBottom: 40 },
  headerEditorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerEditorBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  btnOpenEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F766E',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#0F766E',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  btnOpenEditorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  btnOpenEditorIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOpenEditorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnOpenEditorSubtitle: {
    fontSize: 11,
    color: '#CCFBF1',
    marginTop: 2,
    lineHeight: 15,
  },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  hint: { fontSize: 12, color: '#64748B' },
  item: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, gap: 8, marginTop: 6 },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rename: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, height: 40, fontWeight: '700', color: '#0F172A' },
  deleteBtn: { padding: 8 },
  meta: { fontSize: 11, color: '#64748B' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { flex: 1, marginRight: 12, fontSize: 13, fontWeight: '700', color: '#1E293B' },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  pillOn: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  pillTextOn: { color: '#FFF' },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  ghostText: { fontWeight: '700', color: '#0F766E', fontSize: 12 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 10 },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  prodName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  addBtn: { backgroundColor: '#0F172A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, height: 40, backgroundColor: '#F8FAFC', fontSize: 13 },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 36 : 48,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseBtn: { padding: 6 },
  modalHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalHeaderSub: { fontSize: 11, color: '#64748B' },
  modalSaveBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  modalTabsBar: {
    maxHeight: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTabsBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    alignItems: 'center',
  },
  modalTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTabBtnActive: {
    backgroundColor: '#0F766E',
  },
  modalTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalTabBtnTextActive: {
    color: '#FFFFFF',
  },
  mobileOpenPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mobileOpenPreviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  mobilePreviewWrapper: {
    gap: 12,
    paddingBottom: 24,
  },
  previewControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formatPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formatPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  formatPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  formatPillTextActive: {
    color: '#FFFFFF',
  },
  backToEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  backToEditBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  thermalReceiptCard: {
    backgroundColor: '#FFFEF5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modalBodyRow: {
    flex: 1,
    flexDirection: 'row',
  },
  modalScrollCol: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 14,
    gap: 12,
  },
  modalPreviewCol: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 1,
    borderLeftColor: '#FDE68A',
    padding: 10,
  },
  previewReceiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  previewReceiptHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  previewReceiptBox: {
    flex: 1,
  },
  previewReceiptText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10.5,
    lineHeight: 15,
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  previewReceiptTextCompact: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9.5,
    lineHeight: 13.5,
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  quickFormatPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  quickFormatPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  quickFormatPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  quickFormatPillTextActive: {
    color: '#FFFFFF',
  },
  mobileLivePreviewContainer: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mobileLivePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileLivePreviewTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  togglePreviewCollapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#CCFBF1',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  togglePreviewCollapseText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  mobileThermalReceiptBox: {
    maxHeight: 140,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 8,
  },
  editorHelpBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  editorHelpText: {
    fontSize: 12,
    color: '#115E59',
    flex: 1,
    lineHeight: 16,
  },
  blockItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  blockItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  blockRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  blockOrderNum: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockOrderNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  blockRowName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  blockRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.4,
  },
  customLineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  customLineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customLineCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  customLineOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alignBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alignBtnActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  alignBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  alignBtnTextActive: {
    color: '#FFFFFF',
  },
  langPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  langPillTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  editorCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  paperWidthBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  paperWidthBtnActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  paperWidthBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  paperWidthBtnTextActive: {
    color: '#FFFFFF',
  },
  btnResetDefaults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    marginTop: 8,
  },
  btnResetDefaultsText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12,
  },
  guideCollapsibleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 8,
    padding: 10,
  },
  guideCollapsibleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  guideCollapsibleContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
    padding: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  legendBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeCustomizable: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  badgeCustomizableText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  badgeSystem: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  badgeSystemText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  legendDesc: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  guideTipText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0F766E',
    marginTop: 4,
  },
  blockRowContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  infoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  infoToggleBtnActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  infoToggleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  infoToggleBtnTextActive: {
    color: '#FFFFFF',
  },
  blockInfoDrawer: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 10,
    gap: 8,
  },
  blockInfoSection: {
    gap: 2,
  },
  blockInfoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  blockInfoText: {
    fontSize: 11.5,
    color: '#1E293B',
    lineHeight: 16,
  },
  blockInfoExampleBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  blockInfoExampleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  blockInfoExampleCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#78350F',
    backgroundColor: '#FEF3C7',
    padding: 4,
    borderRadius: 4,
  },
});
