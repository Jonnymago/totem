function sanitizeImageUri(uri: string | null): string | null {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (/^(https?|file|content|blob):\/\//i.test(trimmed)) {
    return trimmed;
  }
  return trimmed; // omitted base64 logic for simplicity
}

console.log(sanitizeImageUri('https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=400'));
