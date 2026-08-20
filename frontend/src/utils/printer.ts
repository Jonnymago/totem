import * as Print from 'expo-print';
import { PermissionsAndroid, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, Settings } from '@/src/api/api';

export type PaperWidthMm = 58 | 80;

export const STORAGE_KEY_PRINTER_CONFIG = 'totem_printer_config';
export const STORAGE_KEY_PRINTER_ADDRESS = 'totem_printer_address';
export const STORAGE_KEY_PRINTER_KITCHEN_ADDRESS = 'totem_printer_kitchen_address';

export interface StoredPrinterConfig {
  printer_courtesy?: string;
  printer_kitchen?: string;
  known_printers?: string[];
  paper_width_mm?: PaperWidthMm;
}

export async function savePrinterConfig(config: StoredPrinterConfig): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PRINTER_CONFIG, JSON.stringify(config));
    if (config.printer_courtesy !== undefined) {
      if (config.printer_courtesy) {
        await AsyncStorage.setItem(STORAGE_KEY_PRINTER_ADDRESS, config.printer_courtesy);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_PRINTER_ADDRESS);
      }
    }
    if (config.printer_kitchen !== undefined) {
      if (config.printer_kitchen) {
        await AsyncStorage.setItem(STORAGE_KEY_PRINTER_KITCHEN_ADDRESS, config.printer_kitchen);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_PRINTER_KITCHEN_ADDRESS);
      }
    }
    return true;
  } catch (e) {
    console.warn('[printer] savePrinterConfig error:', e);
    return false;
  }
}

export async function savePrinterAddress(address: string, role: 'courtesy' | 'kitchen' = 'courtesy'): Promise<boolean> {
  try {
    const key = role === 'kitchen' ? STORAGE_KEY_PRINTER_KITCHEN_ADDRESS : STORAGE_KEY_PRINTER_ADDRESS;
    if (address && address.trim()) {
      await AsyncStorage.setItem(key, address.trim());
    } else {
      await AsyncStorage.removeItem(key);
    }
    const existing = await getStoredPrinterConfig();
    const updated: StoredPrinterConfig = {
      ...(existing || {}),
      [role === 'kitchen' ? 'printer_kitchen' : 'printer_courtesy']: address.trim(),
    };
    await AsyncStorage.setItem(STORAGE_KEY_PRINTER_CONFIG, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn(`[printer] savePrinterAddress(${role}) error:`, e);
    return false;
  }
}

export async function getStoredPrinterAddress(role: 'courtesy' | 'kitchen' = 'courtesy'): Promise<string | null> {
  try {
    const key = role === 'kitchen' ? STORAGE_KEY_PRINTER_KITCHEN_ADDRESS : STORAGE_KEY_PRINTER_ADDRESS;
    const direct = await AsyncStorage.getItem(key);
    if (direct && direct.trim()) return direct.trim();
    const config = await getStoredPrinterConfig();
    const fallback = role === 'kitchen' ? config?.printer_kitchen : config?.printer_courtesy;
    return fallback && fallback.trim() ? fallback.trim() : null;
  } catch (e) {
    console.warn(`[printer] getStoredPrinterAddress(${role}) error:`, e);
    return null;
  }
}

export async function getStoredPrinterConfig(): Promise<StoredPrinterConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PRINTER_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[printer] getStoredPrinterConfig error:', e);
    return null;
  }
}

function charsPerLine(mm: PaperWidthMm = 58): number {
  return mm >= 80 ? 48 : 32;
}

function paperDots(mm: PaperWidthMm = 58): number {
  return mm >= 80 ? 576 : 384;
}

function col(left: string, right: string, width: number): string {
  const priceW = Math.min(10, Math.max(7, right.length));
  const nameW = width - priceW;
  let name = left.trim();
  if (name.length > nameW) name = name.slice(0, nameW);
  else name = name.padEnd(nameW, ' ');
  return name + right.trim().padStart(priceW, ' ');
}

function center(text: string, width: number): string {
  const t = text.trim();
  if (t.length >= width) return t.slice(0, width);
  const pad = width - t.length;
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + t + ' '.repeat(pad - left);
}

function wrapIndent(text: string, indent: number, width: number): string[] {
  const out: string[] = [];
  const max = Math.max(6, width - indent);
  let rest = text;
  while (rest.length > 0) {
    out.push(' '.repeat(indent) + rest.slice(0, max));
    rest = rest.slice(max);
  }
  return out;
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (d: Date) =>
  d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

function money(n: number): string {
  return n.toFixed(2);
}

function hr(width: number, ch = '-'): string {
  return ch.repeat(width);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function buildItems(order: Order, width: number): string[] {
  const lines: string[] = [];
  for (const item of order.items) {
    lines.push(col(item.quantity + 'x ' + item.product_name, money(item.price * item.quantity), width));
    if (item.removed_ingredients?.length) {
      lines.push(...wrapIndent('-SENZA: ' + item.removed_ingredients.join(','), 1, width));
    }
    if (item.added_extras?.length) {
      lines.push(
        ...wrapIndent(
          '+' + item.added_extras.map((e) => e.name + ' ' + money(e.price)).join(','),
          1,
          width
        )
      );
    }
    if (item.combo_lines && item.combo_lines.length > 0) {
      const byGroup: Record<string, string[]> = {};
      for (const line of item.combo_lines) {
        if (!byGroup[line.group]) byGroup[line.group] = [];
        byGroup[line.group].push(
          line.price_delta > 0
            ? `${line.name} (+${money(line.price_delta)})`
            : line.name
        );
      }
      for (const [g, opts] of Object.entries(byGroup)) {
        lines.push(...wrapIndent(g + ': ' + opts.join(', '), 1, width));
      }
    } else if (item.combo_selections) {
      for (const [g, opts] of Object.entries(item.combo_selections)) {
        if (!opts || !(opts as string[]).length) continue;
        lines.push(...wrapIndent(g + ': ' + (opts as string[]).join(', '), 1, width));
      }
    }
    if (item.customizations && item.customizations.length > 0) {
      lines.push(
        ...wrapIndent(
          '+' + item.customizations.join(', '),
          1,
          width
        )
      );
    }
    if (item.notes) {
      lines.push(...wrapIndent('Note:' + item.notes, 1, width));
    }
  }
  return lines;
}

export function generateCourtesyTicketText(
  order: Order,
  settings?: Settings,
  paperMm: PaperWidthMm = 58
): string {
  const w = charsPerLine(paperMm);
  const date = order.created_at ? new Date(order.created_at) : new Date();
  const name = (settings?.restaurant_name || 'TOTEM').slice(0, w);
  const L: string[] = [];

  // Nome ristorante grande (niente logo bitmap)
  L.push('@@NAME@@' + name.toUpperCase());
  L.push(center('SCONTRINO CORTESIA', w));
  L.push(hr(w));
  L.push(center(fmtDate(date) + ' ' + fmtTime(date), w));
  L.push(hr(w));
  L.push(center('NUMERO', w));
  L.push('@@NUM@@' + order.order_number);
  L.push(hr(w, '='));

  if (order.items.length > 0) {
    L.push(...buildItems(order, w));
    L.push(hr(w, '='));
    L.push(col('TOTALE', money(order.total_price), w));
    L.push(center('Paga in cassa al ritiro', w));
  } else {
    L.push(center('ORDINE A VOCE', w));
    L.push(center('Presentati al banco', w));
  }
  L.push(hr(w));
  L.push(center('Grazie!', w));
  return L.join('\n');
}

export function generateKitchenTicketText(
  order: Order,
  paperMm: PaperWidthMm = 58
): string {
  const w = charsPerLine(paperMm);
  const date = order.created_at ? new Date(order.created_at) : new Date();
  const L: string[] = [];

  L.push('');
  L.push('');
  L.push(center('*** CUCINA ***', w));
  L.push(hr(w));
  L.push(center(fmtDate(date) + ' ' + fmtTime(date), w));
  L.push(hr(w));
  L.push('@@NUM@@' + order.order_number);
  L.push(hr(w, '='));

  if (order.items.length > 0) {
    L.push(...buildItems(order, w));
    L.push(hr(w, '='));
    L.push(col('TOTALE', money(order.total_price), w));
  } else {
    L.push(center('ORDINE A VOCE', w));
  }
  return L.join('\n');
}

export const generateCourtesyTicketHTML = (order: Order, settings?: Settings): string => {
  const t = generateCourtesyTicketText(order, settings, 58).replace(/@@NUM@@/g, '').replace(/@@NAME@@/g, '');
  return (
    '<html><body style="font-family:monospace;white-space:pre;font-size:11px">' +
    t.replace(/</g, '<') +
    '</body></html>'
  );
};

export const generateKitchenTicketHTML = (order: Order): string => {
  const t = generateKitchenTicketText(order, 58).replace(/@@NUM@@/g, '').replace(/@@NAME@@/g, '');
  return (
    '<html><body style="font-family:monospace;white-space:pre;font-size:11px">' +
    t.replace(/</g, '<') +
    '</body></html>'
  );
};

export interface PairedPrinter {
  name: string;
  address: string;
  type?: 'classic' | 'ble' | 'dual' | 'unknown';
  id: string;
}

const WEB_MOCK: PairedPrinter[] = [
  { name: 'MPT-II', address: 'bt:00:11:22:33:44:55', type: 'classic', id: 'MPT-II' },
];

const MAC_RE = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export function normalizePrinterAddress(input: string, prefer: 'bt' | 'ble' = 'bt'): string {
  const raw = (input || '').trim();
  if (!raw) return '';
  if (/^(bt|ble|tcp):/i.test(raw)) return raw;
  const mac = raw.replace(/-/g, ':');
  if (MAC_RE.test(mac)) return prefer + ':' + mac.toUpperCase();
  return raw;
}

function stripPrefix(a: string) {
  return a.replace(/^(bt|ble|tcp):/i, '');
}

function preferClassic(address: string): string {
  if (!address) return address;
  if (address.toLowerCase().startsWith('ble:')) return address;
  return normalizePrinterAddress(address, 'bt');
}

async function requestBtPerms(): Promise<boolean> {
  console.log('[printer][perms] Checking Bluetooth permissions...', {
    os: Platform.OS,
    version: Platform.Version,
  });
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    const api =
      typeof Platform.Version === 'number'
        ? Platform.Version
        : parseInt(String(Platform.Version), 10);
    if (api >= 31) {
      const hasConnect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      const hasScan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      if (hasConnect && hasScan) {
        return true;
      }
      const toRequest: any[] = [];
      if (!hasConnect) toRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      if (!hasScan) toRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);

      if (toRequest.length > 0) {
        const r = await PermissionsAndroid.requestMultiple(toRequest);
        console.log('[printer][perms] Android >=31 requestMultiple results:', r);
      }
      return true;
    } else {
      const hasLoc = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (!hasLoc) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
      return true;
    }
  } catch (err) {
    console.warn('[printer][perms] Exception requesting Bluetooth permissions:', err);
    return true;
  }
}

let thermalMod: any = null;

async function getTP(): Promise<any | null> {
  if (Platform.OS === 'web') return null;
  if (thermalMod) return thermalMod;
  try {
    const mod = await import('react-native-thermal-printer-driver');
    thermalMod = mod?.default?.ThermalPrinter ?? mod?.ThermalPrinter ?? mod?.default ?? mod;
    if (thermalMod) return thermalMod;
  } catch (e) {
    console.warn('thermal driver import missing', e);
  }
  if (NativeModules && (NativeModules as any).ThermalPrinter) {
    thermalMod = (NativeModules as any).ThermalPrinter;
    return thermalMod;
  }
  if (NativeModules && (NativeModules as any).RNThermalPrinter) {
    thermalMod = (NativeModules as any).RNThermalPrinter;
    return thermalMod;
  }
  return thermalMod || null;
}

function mapDevice(d: any): PairedPrinter | null {
  if (!d) return null;
  const name = String(d.name || d.deviceName || '').trim();
  let address = String(d.address || d.mac || d.deviceAddress || '').trim();
  if (!address && !name) return null;
  const deviceType = String(d.deviceType || d.type || 'unknown');
  if (address && !/^(bt|ble|tcp):/i.test(address) && MAC_RE.test(address.replace(/-/g, ':'))) {
    address = normalizePrinterAddress(address, deviceType === 'ble' ? 'ble' : 'bt');
  }
  return {
    name: name || '(Senza nome)',
    address,
    type:
      deviceType === 'ble'
        ? 'ble'
        : deviceType === 'classic' || deviceType === 'bt'
          ? 'classic'
          : deviceType === 'dual'
            ? 'dual'
            : 'unknown',
    id: name || stripPrefix(address) || address,
  };
}

const getApiBase = (): string => {
  if (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_API_URL) {
    return (process as any).env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:8000';
};

export async function getPairedPrinters(token?: string): Promise<PairedPrinter[]> {
  const isWeb = Platform.OS === 'web' && (typeof navigator === 'undefined' || !(navigator as any).bluetooth);
  console.log('[printer][scan] Starting getPairedPrinters...', {
    os: Platform.OS,
    isWebBridgeBranch: isWeb,
  });

  if (isWeb) {
    console.log('[printer][scan] Entering Web bridge branch via backend /api/admin/bt/printers');
    // Usa il bridge Python via backend
    try {
      const apiBase = getApiBase();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/admin/bt/printers`, {
        headers,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = (data.printers || []).map((p: any) => ({
        name: p.name || '(Senza nome)',
        address: p.address || '',
        type: p.type || 'unknown',
        id: p.name || p.address || '',
      })) as PairedPrinter[];
      console.log('[printer][scan] Web bridge returned printers:', list);
      return list;
    } catch (e) {
      console.warn('Bridge BT non disponibile:', e);
      return WEB_MOCK;
    }
  }

  console.log('[printer][scan] Entering Android/Native Bluetooth branch');
  await requestBtPerms();

  const TP = await getTP();
  if (!TP) {
    console.warn('[printer][scan] getTP() returned null (thermal printer driver module not available)');
    return [];
  }

  try {
    console.log('[printer][scan] Calling TP.scan()...');
    let result: any = null;
    if (typeof TP.scan === 'function') {
      try {
        result = await TP.scan();
      } catch (scanErr) {
        console.warn('[printer][scan] TP.scan() failed, trying alternative methods:', scanErr);
      }
    }
    if (!result && typeof TP.getPairedDevices === 'function') {
      try {
        const paired = await TP.getPairedDevices();
        result = { paired: Array.isArray(paired) ? paired : [] };
      } catch {}
    }
    if (!result && typeof TP.getDeviceList === 'function') {
      try {
        const devs = await TP.getDeviceList();
        result = { paired: Array.isArray(devs) ? devs : [] };
      } catch {}
    }

    console.log('[printer][scan] TP.scan() raw result:', result);
    const pairedCount = result?.paired?.length || 0;
    const foundCount = result?.found?.length || 0;
    console.log('[printer][scan] Devices breakdown:', {
      pairedCount,
      foundCount,
      paired: result?.paired,
      found: result?.found,
    });

    const extraLists = [
      result?.bonded,
      result?.devices,
      result?.printers,
      Array.isArray(result) ? result : null,
    ];
    const list = [
      ...(result?.paired || []),
      ...(result?.found || []),
      ...extraLists.flatMap((x) => (Array.isArray(x) ? x : [])),
    ];
    const map = new Map<string, PairedPrinter>();
    for (const d of list) {
      const m = mapDevice(d);
      const key = (m?.address || m?.id || m?.name || '').toUpperCase();
      if (m && key && !map.has(key)) map.set(key, m);
    }
    const finalPrinters = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'it'));
    console.log('[printer][scan] Final resolved printers list:', finalPrinters);

    if (finalPrinters.length === 0) {
      console.warn(
        'Nessuna stampante trovata. Verifica che:\n' +
          '1. la stampante sia già associata nelle impostazioni Bluetooth di Android,\n' +
          '2. i permessi Bluetooth siano concessi,\n' +
          '3. il Bluetooth del telefono sia attivo.'
      );
    }

    return finalPrinters;
  } catch (e) {
    console.warn('scan failed', e);
    return [];
  }
}

/**
 * Stampa un ticket via bridge Python.
 * lines: usa generateCourtesyTicketText() o generateKitchenTicketText()
 */
export async function printViaBridge(
  address: string,
  lines: string[],
  token?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiBase = getApiBase();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${apiBase}/api/admin/bt/print`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ address, lines }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || 'Errore stampa' };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function scanPrinters(token?: string): Promise<PairedPrinter[]> {
  return getPairedPrinters(token);
}

export async function resolvePrinterAddress(id?: string): Promise<string | null> {
  let targetId = id?.trim();
  if (!targetId) {
    targetId = (await getStoredPrinterAddress('courtesy')) || '';
  }
  if (!targetId) return null;
  const n = preferClassic(normalizePrinterAddress(targetId));
  if (/^(bt|ble|tcp):/i.test(n)) return n;
  const devices = await getPairedPrinters();
  const needle = targetId.trim().toLowerCase();
  const match = devices.find(
    (d) =>
      d.id.toLowerCase() === needle ||
      d.name.toLowerCase() === needle ||
      stripPrefix(d.address).toLowerCase() === needle ||
      d.address.toLowerCase() === needle
  );
  if (match?.address) return preferClassic(match.address);
  if (MAC_RE.test(targetId.replace(/-/g, ':'))) return normalizePrinterAddress(targetId, 'bt');
  return null;
}

export async function connectPrinter(_n: string, addr: string, _t = 'classic'): Promise<boolean> {
  const TP = await getTP();
  if (!TP) return false;
  await requestBtPerms();
  try {
    const a = (await resolvePrinterAddress(addr)) || normalizePrinterAddress(addr, 'bt');
    if (!a) return false;
    await TP.connect(a, { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

export async function disconnectPrinter(address?: string): Promise<boolean> {
  const TP = await getTP();
  if (!TP) return false;
  try {
    if (address) {
      await TP.disconnect((await resolvePrinterAddress(address)) || normalizePrinterAddress(address));
    } else await TP.disconnect();
    return true;
  } catch {
    return false;
  }
}

function getPaperMm(settings?: Settings): PaperWidthMm {
  const v = (settings as any)?.paper_width_mm;
  return v === 80 || v === '80' ? 80 : 58;
}

function extractBase64(logo: string): string | null {
  const raw = (logo || '').trim();
  if (!raw) return null;
  const m = raw.match(/^data:image\/[\w+.-]+;base64,(.+)$/i);
  if (m) return m[1].replace(/\s/g, '');
  if (raw.length > 100 && !raw.startsWith('http') && !raw.startsWith('file')) {
    return raw.replace(/\s/g, '');
  }
  return null;
}

async function buildLogoNodes(logo: string, paperMm: PaperWidthMm): Promise<any[]> {
  const mod = await import('react-native-thermal-printer-driver');
  const imageNode = mod.image;
  const feed = mod.feed;
  if (typeof imageNode !== 'function') return [];

  const fullW = paperDots(paperMm);
  const nodes: any[] = [];

  try {
    const b64 = extractBase64(logo);
    if (b64) {
      nodes.push(imageNode({ base64: b64, width: fullW }));
    } else if (logo.startsWith('http')) {
      nodes.push(imageNode({ url: logo, width: fullW }));
    } else if (logo.startsWith('file:') || logo.startsWith('/')) {
      nodes.push(imageNode({ uri: logo, width: fullW }));
    }
    nodes.push(feed(1));
  } catch (e) {
    console.warn('[print] logo nodes failed', e);
  }
  return nodes;
}

async function buildBodyNodes(
  text: string,
  opts: { paperMm: PaperWidthMm; topMargin?: boolean }
): Promise<any[]> {
  const mod = await import('react-native-thermal-printer-driver');
  const textNode = mod.text;
  const feed = mod.feed;
  const cut = mod.cut;
  const line = mod.line;

  const nodes: any[] = [];

  if (opts.topMargin) {
    nodes.push(feed(2));
  }

  for (const rawLine of text.split('\n')) {
    const row = rawLine;
    const t = row.trim();
    if (!t) {
      nodes.push(feed(1));
      continue;
    }

    if (/^[-*=]+$/.test(t)) {
      nodes.push(line());
      continue;
    }

    if (t.startsWith('@@NUM@@')) {
      const num = t.replace('@@NUM@@', '').trim();
      nodes.push(
        textNode(num, {
          align: 'center',
          bold: true,
          size: 3,
        })
      );
      continue;
    }

    if (t.startsWith('@@NAME@@')) {
      const nm = t.replace('@@NAME@@', '').trim();
      nodes.push(
        textNode(nm, {
          align: 'center',
          bold: true,
          size: 2,
        })
      );
      continue;
    }

    const isTitle =
      t.includes('CUCINA') ||
      t.includes('SCONTRINO') ||
      t.includes('ORDINE A VOCE') ||
      t === 'NUMERO' ||
      t === 'Grazie!';
    const isTotal = t.trimStart().startsWith('TOTALE');
    const hasCols = /\d+\.\d{2}\s*$/.test(t) || isTotal;

    nodes.push(
      textNode(row, {
        align: hasCols ? 'left' : isTitle ? 'center' : 'left',
        bold: isTitle || isTotal,
        size: 1,
      })
    );
  }

  nodes.push(feed(1));
  nodes.push(typeof cut === 'function' ? (cut as any)({ partial: true }) : (cut as any)());
  return nodes;
}

/**
 * Global BT mutex: Android classic Bluetooth often fails with 2 concurrent SPP connections.
 * All print jobs (any printer) go through this single queue so only one is active at a time.
 */
let globalPrintChain: Promise<void> = Promise.resolve();

function enqueuePrint<T>(job: () => Promise<T>): Promise<T> {
  const run = globalPrintChain.then(job, job);
  globalPrintChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/** Retry automatico: fino a 3 tentativi, 3 secondi fissi tra un tentativo e l'altro */
const MAX_RETRIES = 3;
const RETRY_GAP_MS = 3000;

/**
 * Riconnessione pulita: chiude la socket per address e anche la connessione globale,
 * poi attende che lo stack BT Android / stampante si stabilizzi.
 * Necessario perché dopo molte stampe la cucina resta con socket mezza aperta.
 */
async function cleanReconnect(TP: any, address: string, settleMs = 500): Promise<void> {
  try {
    await TP.disconnect(address);
  } catch {
    /* ignore */
  }
  try {
    await TP.disconnect();
  } catch {
    /* ignore */
  }
  await sleep(settleMs);
}

async function printOnce(
  TP: any,
  address: string,
  text: string,
  options?: { logo?: string; paperMm?: PaperWidthMm; topMargin?: boolean; heavy?: boolean }
): Promise<void> {
  const paperMm = options?.paperMm ?? 58;
  const hasLogo = !!options?.logo;
  const heavy = !!(options?.heavy || hasLogo);

  const bodyNodes = await buildBodyNodes(text, {
    paperMm,
    topMargin: options?.topMargin,
  });

  // Riconnessione pulita prima di ogni connessione (evita socket stale sulla cucina)
  await cleanReconnect(TP, address, 800);

  await TP.connect(address, { timeout: 25000 });
  // Molte stampanti MPT/Rongta chiudono il link se si stampa troppo presto dopo il connect
  await sleep(1200);

  try {
    if (hasLogo && options?.logo) {
      const logoNodes = await buildLogoNodes(options.logo, paperMm);
      if (logoNodes.length > 0) {
        await TP.print(address, logoNodes, {
          paperWidthMm: paperMm,
          timeout: 45000,
          keepAlive: true,
        });
        await sleep(1800);
      }
    }

    // keepAlive true anche sul body: alcune stampanti cucina droppano il link con keepAlive false
    await TP.print(address, bodyNodes, {
      paperWidthMm: paperMm,
      timeout: heavy ? 45000 : 35000,
      keepAlive: true,
    });
    await sleep(heavy ? 1600 : 1200);
  } finally {
    await cleanReconnect(TP, address, heavy ? 900 : 700);
  }
}

async function printBluetoothText(
  text: string,
  printerRef?: string,
  options?: { logo?: string; paperMm?: PaperWidthMm; topMargin?: boolean; heavy?: boolean }
): Promise<void> {
  let address: string | null = null;
  if (printerRef) address = await resolvePrinterAddress(printerRef);
  if (!address) {
    const saved = await getStoredPrinterAddress('courtesy');
    if (saved) address = await resolvePrinterAddress(saved);
  }
  if (!address) {
    const devices = await getPairedPrinters();
    const mpt = devices.find(
      (d) =>
        /mpt|xprinter|pos|rongta|xp-/i.test(d.name) ||
        d.address.toLowerCase().startsWith('bt:')
    );
    address = mpt?.address || devices[0]?.address || null;
  }
  if (!address) throw new Error('Nessuna stampante configurata');
  address = preferClassic(address);

  return enqueuePrint(async () => {
    const TP = await getTP();
    if (!TP) throw new Error('Modulo stampante non disponibile');
    if (!(await requestBtPerms())) throw new Error('Permessi Bluetooth negati');

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await printOnce(TP, address!, text, options);
        return;
      } catch (e) {
        lastError = e;
        console.warn(`[print] attempt ${attempt}/${MAX_RETRIES} failed on ${address}`, e);
        // Riconnessione pulita dopo fallimento + attesa 3s prima del prossimo tentativo
        await cleanReconnect(TP, address!, 300);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_GAP_MS);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  });
}

export const printTicket = async (
  html: string,
  text?: string,
  printerName?: string,
  opts?: { logo?: string; paperMm?: PaperWidthMm; topMargin?: boolean; heavy?: boolean }
): Promise<void> => {
  try {
    if (Platform.OS === 'android' && text) {
      try {
        await printBluetoothText(text, printerName, opts);
        return;
      } catch (e) {
        console.warn('BT print failed, PDF fallback', e);
      }
    }
    if (Platform.OS === 'web') {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 400);
      }
    } else {
      await Print.printAsync({ html });
    }
  } catch (error) {
    console.error('Error printing:', error);
    throw error;
  }
};

export const printCourtesyTicket = async (
  order: Order,
  settings?: Settings,
  printerName?: string
): Promise<void> => {
  const paperMm = getPaperMm(settings);
  const html = generateCourtesyTicketHTML(order, settings);
  const text = generateCourtesyTicketText(order, settings, paperMm);
  const target = printerName || settings?.printer_courtesy || (await getStoredPrinterAddress('courtesy')) || undefined;
  const hasItems = (order.items?.length || 0) > 0;
  await printTicket(html, text, target, {
    // Nessun logo sullo scontrino (richiesta: solo testo nome ristorante più grande)
    paperMm,
    heavy: hasItems,
  });
};

export const printKitchenTicket = async (
  order: Order,
  printerName?: string,
  settings?: Settings
): Promise<void> => {
  const paperMm = getPaperMm(settings);
  const html = generateKitchenTicketHTML(order);
  const text = generateKitchenTicketText(order, paperMm);
  const target = printerName || settings?.printer_kitchen || (await getStoredPrinterAddress('kitchen')) || undefined;
  const hasItems = (order.items?.length || 0) > 0;
  await printTicket(html, text, target, {
    paperMm,
    topMargin: true,
    heavy: hasItems,
  });
};
