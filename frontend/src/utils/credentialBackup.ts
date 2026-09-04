import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

export interface CredentialRecoveryBackup {
  recoveryCode: string;
  username?: string;
  createdAt?: string;
}

export type RecoveryExportMethod = 'saf' | 'share' | 'cache' | 'web' | 'share-text';

function buildRecoveryCard(input: CredentialRecoveryBackup): { fileName: string; text: string; recoveryCode: string } {
  if (!input.recoveryCode || !input.recoveryCode.trim()) {
    throw new Error('Recovery code mancante per il backup');
  }
  const recoveryCode = input.recoveryCode.trim();
  const dateStr = input.createdAt || new Date().toLocaleString('it-IT');
  const safeDate = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const fileName = `totem-pin-recovery-${safeDate}.txt`;
  const text = [
    '=============================================================',
    '  TOTEM QUICKBITE - SCHEDA DI RECUPERO PIN AMMINISTRATORE',
    '=============================================================',
    `Data di generazione: ${dateStr}`,
    '',
    'RECOVERY CODE SEGRETO (Monouso):',
    `  >>>  ${recoveryCode}  <<<`,
    '',
    '-------------------------------------------------------------',
    'COME UTILIZZARE QUESTO CODICE:',
    '1. Sul Totem o dal Pannello Amministratore, premi "Hai smarrito il PIN?".',
    '2. Inserisci il Recovery Code sopra indicato.',
    '3. Imposta un nuovo PIN a 6 cifre.',
    '4. Questo codice verrà invalidato automaticamente e ne riceverai uno nuovo.',
    '',
    'AVVERTENZA DI SICUREZZA:',
    '• Conserva questo documento offline o stampato in un luogo protetto.',
    '• Chiunque possieda questo codice può reimpostare il PIN del Totem.',
    '=============================================================',
  ].join('\n');
  return { fileName, text, recoveryCode };
}

async function copyCode(recoveryCode: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(recoveryCode);
  } catch {
    // Non bloccante
  }
}

async function writeLocalFile(fileName: string, text: string): Promise<string> {
  const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!directory) throw new Error('Memoria dispositivo non disponibile');
  const path = `${directory}${fileName}`;
  try {
    await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    await FileSystem.writeAsStringAsync(path, text);
  }
  return path;
}

async function downloadOnWeb(fileName: string, text: string): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Salva la scheda su file (cartella scelta dall'utente / Download). Non apre la share sheet. */
export async function saveCredentialRecoveryBackup(input: CredentialRecoveryBackup): Promise<{
  path: string;
  method: RecoveryExportMethod;
  recoveryCode: string;
}> {
  const { fileName, text, recoveryCode } = buildRecoveryCard(input);
  await copyCode(recoveryCode);

  if (await downloadOnWeb(fileName, text)) {
    return { path: fileName, method: 'web', recoveryCode };
  }

  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const perms = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perms.granted && perms.directoryUri) {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perms.directoryUri,
          fileName,
          'text/plain'
        );
        await FileSystem.writeAsStringAsync(fileUri, text, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return { path: fileUri, method: 'saf', recoveryCode };
      }
    } catch (safErr) {
      console.warn('[credentialBackup] SAF save error:', safErr);
    }
  }

  const path = await writeLocalFile(fileName, text);
  return { path, method: 'cache', recoveryCode };
}

/** Invia la scheda a un'app di messaggistica, email o condivisione di sistema. */
export async function shareCredentialRecoveryBackup(input: CredentialRecoveryBackup): Promise<{
  path: string;
  method: RecoveryExportMethod;
  recoveryCode: string;
}> {
  const { fileName, text, recoveryCode } = buildRecoveryCard(input);
  await copyCode(recoveryCode);

  if (Platform.OS === 'web') {
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : null;
      if (nav && typeof (nav as any).share === 'function') {
        await (nav as any).share({
          title: 'Scheda Recupero PIN Totem',
          text,
        });
        return { path: fileName, method: 'share-text', recoveryCode };
      }
    } catch {
      // fallback download
    }
    await downloadOnWeb(fileName, text);
    return { path: fileName, method: 'web', recoveryCode };
  }

  const path = await writeLocalFile(fileName, text);
  if (await Sharing.isAvailableAsync()) {
    try {
      await Sharing.shareAsync(path, {
        mimeType: 'text/plain',
        dialogTitle: 'Invia codice di recupero PIN Totem',
      });
      return { path, method: 'share', recoveryCode };
    } catch (shareErr) {
      console.warn('[credentialBackup] Sharing.shareAsync failed:', shareErr);
    }
  }

  try {
    await Share.share({
      title: 'Codice di recupero PIN Totem',
      message: text,
    });
    return { path, method: 'share-text', recoveryCode };
  } catch (shareTextErr) {
    console.warn('[credentialBackup] Share.share failed:', shareTextErr);
  }

  return { path, method: 'cache', recoveryCode };
}

/**
 * Compatibilità: salva su file se possibile, altrimenti apre la condivisione.
 */
export async function exportCredentialRecoveryBackup(input: CredentialRecoveryBackup): Promise<{
  path: string;
  method: RecoveryExportMethod;
  recoveryCode: string;
}> {
  try {
    const saved = await saveCredentialRecoveryBackup(input);
    if (saved.method === 'saf' || saved.method === 'web') return saved;
  } catch {
    // fallback share
  }
  return shareCredentialRecoveryBackup(input);
}
