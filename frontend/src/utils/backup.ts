/**
 * Backup / restore Totem via ZIP ad altissima fedeltà.
 * Salva e ripristina: impostazioni complete (incluso Logo in qualsiasi formato),
 * categorie, prodotti, gruppi opzioni globali, ingredienti, immagini e glossario traduzioni.
 */
import { Platform } from 'react-native';
import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  getLocalBackupSnapshot,
  restoreLocalBackupSnapshot,
  Category,
  Product,
  Order,
  Settings,
} from '@/src/api/api';

const APP = 'totem';
const VERSION = 3;

type ImageRef = string | null;

/**
 * Converte qualsiasi sorgente immagine (data URI, file locale, URI content, base64 raw)
 * in estensione e stringa base64 pura per l'archiviazione nello ZIP.
 */
async function extractBase64AndExt(value?: string | null): Promise<{ ext: string; base64: string } | null> {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // 1. Data URI es: data:image/png;base64,iVBORw...
  const m = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
  if (m) {
    const mime = m[1].toLowerCase();
    let ext = 'png';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    return { ext, base64: m[2].replace(/\s/g, '') };
  }

  // 2. File locale del filesystem (es: file:///... o content://...)
  if (trimmed.startsWith('file:') || trimmed.startsWith('content:') || trimmed.startsWith('/')) {
    try {
      const b64 = await FileSystem.readAsStringAsync(trimmed, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (b64 && b64.length > 10) {
        const ext = trimmed.split('.').pop()?.toLowerCase() || 'png';
        const cleanExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'png';
        return { ext: cleanExt, base64: b64 };
      }
    } catch (e) {
      console.warn('[backup] Impossibile leggere file locale per zip:', trimmed, e);
    }
  }

  // 3. Stringa Base64 pura
  if (trimmed.length > 64 && /^[A-Za-z0-9+/=\s]+$/.test(trimmed.slice(0, 200))) {
    return { ext: 'png', base64: trimmed.replace(/\s/g, '') };
  }

  return null;
}

function toDataUri(base64: string, ext: string): string {
  const mime =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

function safeId(id: string): string {
  return String(id || 'x').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function buildZipBase64(): Promise<{ base64: string; fileName: string }> {
  const snapshot = await getLocalBackupSnapshot();
  const zip = new JSZip();
  const images = zip.folder('images');
  if (!images) throw new Error('Impossibile creare cartella images nello ZIP');

  // Gestione Logo
  let logoRef: ImageRef = null;
  const logoExtracted = await extractBase64AndExt(snapshot.settings?.logo);
  if (logoExtracted) {
    const name = `logo.${logoExtracted.ext}`;
    images.file(name, logoExtracted.base64, { base64: true });
    logoRef = `images/${name}`;
  }

  // Gestione Categorie
  const categories: Category[] = [];
  for (const cat of snapshot.categories || []) {
    const extracted = await extractBase64AndExt(cat.image);
    let image: ImageRef = null;
    if (extracted) {
      const name = `cat_${safeId(cat.id)}.${extracted.ext}`;
      images.file(name, extracted.base64, { base64: true });
      image = `images/${name}`;
    }
    categories.push({ ...cat, image: image || undefined });
  }

  // Gestione Prodotti
  const products: Product[] = [];
  for (const prod of snapshot.products || []) {
    const extracted = await extractBase64AndExt(prod.image);
    let image: ImageRef = null;
    if (extracted) {
      const name = `prod_${safeId(prod.id)}.${extracted.ext}`;
      images.file(name, extracted.base64, { base64: true });
      image = `images/${name}`;
    }
    products.push({ ...prod, image: image || undefined });
  }

  const settings: Settings = {
    ...snapshot.settings,
    logo: logoRef || (snapshot.settings?.logo ? 'images/logo.png' : ''),
  };

  const manifest = {
    version: VERSION,
    app: APP,
    exported_at: (snapshot as any).exported_at || new Date().toISOString(),
    settings,
    categories,
    global_groups: snapshot.global_groups || [],
    products,
    orders: snapshot.orders || [],
    translation_glossary: snapshot.translation_glossary || {},
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file(
    'README.txt',
    [
      'Backup Totem Ristorante Completo',
      `Creato: ${manifest.exported_at}`,
      `Categorie: ${categories.length}`,
      `Prodotti: ${products.length}`,
      `Gruppi Globali: ${(manifest.global_groups || []).length}`,
      `Comande archiviate: ${(manifest.orders || []).length}`,
      `Logo Incluso: ${logoRef ? 'Sì' : 'No'}`,
      '',
      'Per ripristinare: Impostazioni → Backup & Ripristino → Importa backup ZIP',
    ].join('\n')
  );

  const base64 = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const fileName = `totem-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`;
  return { base64, fileName };
}

/**
 * Salva ZIP su dispositivo Android (SAF o Condivisione nativa) o Web.
 */
export async function exportBackupZip(): Promise<{
  path: string;
  size: number;
  method: 'saf' | 'share' | 'cache' | 'web';
}> {
  const { base64, fileName } = await buildZipBase64();
  const size = Math.round((base64.length * 3) / 4);

  // 1. Web browser download
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { path: fileName, size, method: 'web' };
    } catch (webErr) {
      console.warn('[backup] Web download fallback failed:', webErr);
    }
  }

  // 2. Android SAF (Storage Access Framework)
  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const perms = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perms.granted && perms.directoryUri) {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perms.directoryUri,
          fileName,
          'application/zip'
        );
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return { path: fileUri, size, method: 'saf' };
      }
    } catch (e) {
      console.warn('[backup] SAF export failed, fallback to share', e);
    }
  }

  // 3. Native FileSystem + Share
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) {
    throw new Error('Memoria dispositivo non disponibile');
  }
  const path = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'application/zip',
        dialogTitle: 'Salva backup Totem',
      });
      return { path, size, method: 'share' };
    }
  } catch (e) {
    console.warn('[backup] share failed', e);
  }

  return { path, size, method: 'cache' };
}

/**
 * Seleziona un file ZIP in modo sicuro e compatibile con tutte le versioni di Expo e Android.
 */
async function selectZipFile(): Promise<{ uri: string; name?: string; base64Data?: string }> {
  // 1. Gestione Web tramite input HTML file
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip,application/zip,application/x-zip-compressed';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('CANCELLED'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const b64 = result.includes('base64,') ? result.split('base64,')[1] : result;
          resolve({ uri: file.name, name: file.name, base64Data: b64 });
        };
        reader.onerror = () => reject(new Error('Impossibile leggere il file selezionato'));
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  // 2. Gestione nativa DocumentPicker con fallback progressivo e supporto formati
  let pick: DocumentPicker.DocumentPickerResult | null = null;
  let lastError: any = null;

  try {
    pick = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
  } catch (err: any) {
    lastError = err;
    try {
      pick = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
    } catch (fallbackErr: any) {
      lastError = fallbackErr;
    }
  }

  if (pick) {
    if (pick.canceled || (pick as any).type === 'cancel') {
      throw new Error('CANCELLED');
    }
    const assetUri = pick.assets?.[0]?.uri || (pick as any).uri;
    const assetName = pick.assets?.[0]?.name || (pick as any).name;
    if (assetUri) {
      return { uri: assetUri, name: assetName };
    }
  }

  // 3. Fallback SAF su Android se DocumentPicker nativo fallisce
  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const perms = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perms.granted && perms.directoryUri) {
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(perms.directoryUri);
        const zipFiles = files.filter((f) => decodeURIComponent(f).toLowerCase().endsWith('.zip') || decodeURIComponent(f).toLowerCase().includes('.zip'));
        if (zipFiles.length > 0) {
          const targetZipUri = zipFiles[zipFiles.length - 1];
          const base64Data = await FileSystem.readAsStringAsync(targetZipUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return { uri: targetZipUri, name: 'backup.zip', base64Data };
        } else {
          throw new Error('Nessun file .zip trovato nella cartella selezionata.');
        }
      } else {
        throw new Error('CANCELLED');
      }
    } catch (safErr: any) {
      if (safErr?.message === 'CANCELLED') throw safErr;
      lastError = safErr;
    }
  }

  throw new Error(`Impossibile aprire il selettore file: ${lastError?.message || 'errore nativo'}`);
}

export async function importBackupZip(): Promise<{ products: number; categories: number; global_groups: number }> {
  const selected = await selectZipFile();

  let base64Zip: string;
  if (selected.base64Data) {
    base64Zip = selected.base64Data;
  } else {
    try {
      base64Zip = await FileSystem.readAsStringAsync(selected.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (readErr: any) {
      console.error('[backup] Errore lettura file ZIP:', readErr);
      throw new Error(`Impossibile leggere il file ZIP selezionato: ${readErr?.message || 'errore I/O'}`);
    }
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(base64Zip, { base64: true });
  } catch (zipErr: any) {
    console.error('[backup] Errore decompressione JSZip:', zipErr);
    throw new Error(`File non riconosciuto come archivio ZIP valido: ${zipErr?.message || 'formato corrotto'}`);
  }

  const manifestFile = zip.file('manifest.json') || zip.file(/^manifest\.json$/i)?.[0];
  if (!manifestFile) {
    throw new Error('File di backup non valido: manifest.json mancante.');
  }

  let manifest: any;
  try {
    const manifestText = await manifestFile.async('string');
    manifest = JSON.parse(manifestText);
  } catch (parseErr: any) {
    throw new Error('File di backup non valido: manifest.json corrotto.');
  }

  if (!manifest || (!manifest.settings && !manifest.categories && !manifest.products)) {
    throw new Error('File di backup non valido: nessun dato ristorante trovato nel file.');
  }

  /**
   * Risolve un'immagine dallo ZIP con fallback flessibile.
   */
  async function resolveImage(ref?: string | null, isLogo: boolean = false): Promise<string> {
    if (ref && typeof ref === 'string' && ref.startsWith('data:image')) {
      return ref;
    }

    let file: JSZip.JSZipObject | null = null;

    if (ref && typeof ref === 'string') {
      const cleanPath = ref.replace(/^\.\//, '');
      file = zip.file(cleanPath);
      if (!file) {
        const base = cleanPath.split('/').pop();
        if (base) file = zip.file(`images/${base}`);
      }
      if (!file) {
        file = zip.file(cleanPath.replace(/^images\//, ''));
      }
    }

    // Se è un logo e non è stato trovato con il percorso esatto, cerca qualsiasi file logo nello zip
    if (!file && isLogo) {
      const possibleLogoFiles = [
        'images/logo.png',
        'images/logo.jpg',
        'images/logo.jpeg',
        'images/logo.webp',
        'images/logo.gif',
        'logo.png',
        'logo.jpg',
        'logo.jpeg',
        'logo.webp',
        'logo.gif',
      ];
      for (const candidate of possibleLogoFiles) {
        const f = zip.file(candidate);
        if (f) {
          file = f;
          break;
        }
      }
      if (!file) {
        const logoMatches = zip.file(/^(images\/)?logo\.(png|jpg|jpeg|webp|gif)$/i);
        if (logoMatches && logoMatches.length > 0) {
          file = logoMatches[0];
        }
      }
    }

    if (!file) {
      // Se era un data URI o stringa passata nel manifest, mantienila
      return ref && typeof ref === 'string' && !ref.startsWith('images/') ? ref : '';
    }

    const b64 = await file.async('base64');
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'png';
    return toDataUri(b64, ext);
  }

  // Risoluzione Logo nelle Impostazioni
  const settings: Settings = { ...(manifest.settings || {}) };
  const restoredLogo = await resolveImage(settings.logo, true);
  if (restoredLogo) {
    settings.logo = restoredLogo;
  }

  // Risoluzione Categorie
  const categories: Category[] = await Promise.all(
    (manifest.categories || []).map(async (c: Category) => ({
      ...c,
      image: await resolveImage(c.image as string, false),
    }))
  );

  // Risoluzione Prodotti (inclusi opzioni e ingredienti)
  const products: Product[] = await Promise.all(
    (manifest.products || []).map(async (p: Product) => ({
      ...p,
      image: await resolveImage(p.image as string, false),
    }))
  );

  return restoreLocalBackupSnapshot({
    version: manifest.version || VERSION,
    app: APP,
    exported_at: manifest.exported_at || new Date().toISOString(),
    settings,
    categories,
    global_groups: manifest.global_groups || [],
    products,
    orders: Array.isArray(manifest.orders) ? (manifest.orders as Order[]) : [],
    translation_glossary: manifest.translation_glossary || {},
  });
}
