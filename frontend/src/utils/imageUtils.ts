/**
 * Utility per la sanitizzazione, validazione e compressione delle immagini (Base64 e URL)
 * per Android Hermes, Expo Image e Remote Web.
 */

/**
 * Pulisce e valida l'URI o la stringa Base64 di un'immagine per evitare errori di decodifica
 * e garantire la visualizzazione istantanea su Android e Web.
 */
export function sanitizeImageUri(uri?: string | null): string | null {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  // Se è un URI web standard o file:// o content://
  if (/^(https?|file|content|blob):\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Se è già un Data URI ben formato (data:image/...)
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed)) {
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex !== -1) {
      const header = trimmed.substring(0, commaIndex);
      const data = trimmed.substring(commaIndex + 1).replace(/[\r\n\s]+/g, '');
      if (!data) return null;
      return `${header},${data}`;
    }
    return trimmed;
  }

  // Se è una stringa base64 grezza senza header data:image/
  const cleanData = trimmed.replace(/[\r\n\s]+/g, '');
  if (cleanData.length > 50 && /^[A-Za-z0-9+/=]+$/.test(cleanData)) {
    let mime = 'image/jpeg';
    if (cleanData.startsWith('iVBORw0KGgo')) {
      mime = 'image/png';
    } else if (cleanData.startsWith('R0lGOD')) {
      mime = 'image/gif';
    } else if (cleanData.startsWith('UklGR')) {
      mime = 'image/webp';
    } else if (cleanData.startsWith('Qk0')) {
      mime = 'image/bmp';
    }
    return `data:${mime};base64,${cleanData}`;
  }

  return trimmed;
}

/**
 * Verifica se l'immagine è valida e visualizzabile
 */
export function isValidImageUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const cleaned = sanitizeImageUri(uri);
  return Boolean(cleaned && cleaned.length > 15);
}
