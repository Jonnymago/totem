/**
 * Backup / restore Totem via ZIP.
 * Contiene: impostazioni, testi prodotti/categorie, logo e immagini (file separati).
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
  Settings,
} from '@/src/api/api';

const APP = 'totem';
const VERSION = 3;

type ImageRef = string | null;

function parseDataUri(value?: string): { ext: string; base64: string } | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const m = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
  if (m) {
    const mime = m[1].toLowerCase();
    let ext = 'bin';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    return { ext, base64: m[2].replace(/\s/g, '') };
  }

  if (trimmed.length > 64 && /^[A-Za-z0-9+/=\s]+$/.test(trimmed.slice(0, 200))) {
    return { ext: 'jpg', base64: trimmed.replace(/\s/g, '') };
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

async function buildZipBase64(): Promise<{ base64: string; fileName: string }> {
  const snapshot = await getLocalBackupSnapshot();
  const zip = new JSZip();
  const images = zip.folder('images');
  if (!images) throw new Error('Impossibile creare cartella images nello ZIP');

  let logoRef: ImageRef = null;
  const logoParsed = parseDataUri(snapshot.settings?.logo);
  if (logoParsed) {
    const name = `logo.${logoParsed.ext}`;
    images.file(name, logoParsed.base64, { base64: true });
    logoRef = `images/${name}`;
  }

  const categories = (snapshot.categories || []).map((cat: Category) => {
    const parsed = parseDataUri(cat.image);
    let image: ImageRef = null;
    if (parsed) {
      const name = `cat_${safeId(cat.id)}.${parsed.ext}`;
      images.file(name, parsed.base64, { base64: true });
      image = `images/${name}`;
    }
    return { ...cat, image };
  });

  const products = (snapshot.products || []).map((prod: Product) => {
    const parsed = parseDataUri(prod.image);
    let image: ImageRef = null;
    if (parsed) {
      const name = `prod_${safeId(prod.id)}.${parsed.ext}`;
      images.file(name, parsed.base64, { base64: true });
      image = `images/${name}`;
    }
    return { ...prod, image };
  });

  const settings: Settings = {
    ...snapshot.settings,
    logo: logoRef || '',
  };

  const manifest = {
    version: VERSION,
    app: APP,
    exported_at: (snapshot as any).exported_at || new Date().toISOString(),
    settings,
    categories,
    global_groups: snapshot.global_groups || [],
    products,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file(
    'README.txt',
    [
      'Backup Totem Ristorante',
      `Creato: ${manifest.exported_at}`,
      `Categorie: ${categories.length}`,
      `Prodotti: ${products.length}`,
      '',
      'Per ripristinare: Impostazioni → Backup → Importa backup ZIP',
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
 * Salva ZIP:
 * 1) Android: scegli cartella (Download) con Storage Access Framework
 * 2) altrimenti condivisione
 * 3) fallback: file nella memoria app
 */
export async function exportBackupZip(): Promise<{
  path: string;
  size: number;
  method: 'saf' | 'share' | 'cache';
}> {
  const { base64, fileName } = await buildZipBase64();
  const size = Math.round((base64.length * 3) / 4);

  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted && permissions.directoryUri) {
        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/zip'
        );
        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return { path: destUri, size, method: 'saf' };
      }
    } catch (e) {
      console.warn('[backup] SAF save failed, trying share', e);
    }
  }

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
        UTI: 'public.zip-archive',
      });
      return { path, size, method: 'share' };
    }
  } catch (e) {
    console.warn('[backup] share failed', e);
  }

  return { path, size, method: 'cache' };
}

export async function importBackupZip(): Promise<{ products: number; categories: number }> {
  const pick = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (pick.canceled || !pick.assets?.length) {
    throw new Error('CANCELLED');
  }

  const asset = pick.assets[0];
  const uri = asset.uri;
  if (!uri) throw new Error('File non valido');

  const base64Zip = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const zip = await JSZip.loadAsync(base64Zip, { base64: true });
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('ZIP non valido: manca manifest.json');
  }

  const manifestText = await manifestFile.async('string');
  const manifest = JSON.parse(manifestText);

  if (!manifest.settings && !manifest.categories && !manifest.products) {
    throw new Error('ZIP non valido: contenuto backup assente');
  }

  async function resolveImage(ref?: string | null): Promise<string> {
    if (!ref || typeof ref !== 'string') return '';
    if (ref.startsWith('data:')) return ref;
    const path = ref.replace(/^\.\//, '');
    let file = zip.file(path);
    if (!file) {
      const base = path.split('/').pop();
      if (base) file = zip.file(`images/${base}`);
    }
    if (!file) return '';
    const b64 = await file.async('base64');
    const ext = path.split('.').pop() || 'jpg';
    return toDataUri(b64, ext);
  }

  const settings: Settings = { ...(manifest.settings || {}) };
  if (settings.logo) {
    settings.logo = await resolveImage(settings.logo);
  }

  const categories: Category[] = await Promise.all(
    (manifest.categories || []).map(async (c: Category) => ({
      ...c,
      image: await resolveImage(c.image as string),
    }))
  );

  const products: Product[] = await Promise.all(
    (manifest.products || []).map(async (p: Product) => ({
      ...p,
      image: await resolveImage(p.image as string),
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
  });
}
