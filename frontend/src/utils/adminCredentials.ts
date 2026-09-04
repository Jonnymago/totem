import * as Crypto from 'expo-crypto';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { storage } from '@/src/utils/storage';

const CREDENTIAL_RECORD_KEY = 'totem_admin_credentials_v2';
const LOCAL_SESSION_KEY = 'totem_admin_local_session_v2';
const PBKDF2_ITERATIONS = 5_000;
const PBKDF2_LEGACY_ITERATIONS = 310_000;
const DERIVED_KEY_LENGTH = 32;
const SESSION_DURATION_MS = 30 * 60 * 1000;
const MAX_BACKOFF_MS = 60_000;
const RECOVERY_CODE_PREFIX = 'TQB-RC';

export type CredentialPurpose = 'password' | 'pin' | 'recovery';

export interface DerivedSecret {
  salt: string;
  hash: string;
  iterations?: number;
}

export interface AdminCredentialRecord {
  version: 2 | 3;
  username?: string;
  password?: DerivedSecret;
  pin: DerivedSecret;
  recovery?: DerivedSecret;
  recoveryCreatedAt?: string;
  credentialVersion: number;
  updatedAt: string;
}

interface LocalAdminSession {
  token: string;
  credentialVersion: number;
  expiresAt: number;
}

export interface PublicCredentialStatus {
  configured: boolean;
  username: string | null;
  recoveryCodeReady: boolean;
}

interface ThrottleState {
  failures: number;
  retryAt: number;
}

let throttle: ThrottleState = { failures: 0, retryAt: 0 };
const sessionRevokers = new Set<() => void | Promise<void>>();

function normalizePin(value: string): string {
  return (value || '').trim();
}

function normalizeRecoveryCode(value: string): string {
  return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function randomHex(byteCount: number): string {
  return bytesToHex(Crypto.getRandomBytes(byteCount));
}

function constantTimeEqual(a: string, b: string): boolean {
  const maxLength = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

async function deriveSecret(value: string, salt: string, iterations: number = PBKDF2_ITERATIONS): Promise<DerivedSecret> {
  const hash = await pbkdf2Async(sha256, value, hexToBytes(salt), {
    c: iterations,
    dkLen: DERIVED_KEY_LENGTH,
    asyncTick: 256,
  });
  return { salt, hash: bytesToHex(hash), iterations };
}

async function createDerivedSecret(value: string): Promise<DerivedSecret> {
  return deriveSecret(value, randomHex(16), PBKDF2_ITERATIONS);
}

async function matchesSecret(value: string, stored?: DerivedSecret): Promise<boolean> {
  if (!value || !stored?.salt || !stored?.hash) return false;
  const iterations = stored.iterations || PBKDF2_ITERATIONS;
  const derived = await deriveSecret(value, stored.salt, iterations);
  if (constantTimeEqual(derived.hash, stored.hash)) {
    return true;
  }
  if (!stored.iterations) {
    try {
      const legacyDerived = await deriveSecret(value, stored.salt, PBKDF2_LEGACY_ITERATIONS);
      return constantTimeEqual(legacyDerived.hash, stored.hash);
    } catch {
      return false;
    }
  }
  return false;
}

function isCredentialRecord(value: unknown): value is AdminCredentialRecord {
  const record = value as AdminCredentialRecord | null;
  return Boolean(
    record
    && (record.version === 2 || (record as any).version === 3)
    && record.pin?.salt
    && record.pin?.hash
    && Number.isInteger(record.credentialVersion),
  );
}

async function readRecord(): Promise<AdminCredentialRecord | null> {
  const raw = await storage.secureGet(CREDENTIAL_RECORD_KEY, '');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isCredentialRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeRecord(record: AdminCredentialRecord): Promise<void> {
  const saved = await storage.secureSet(CREDENTIAL_RECORD_KEY, JSON.stringify(record));
  if (!saved) throw new Error('Impossibile salvare le credenziali protette');
}

export function assertPin(pin: string): void {
  if (!/^\d{6}$/.test(pin)) {
    throw new Error('Il PIN deve essere composto esattamente da 6 cifre numeriche');
  }
  if (/^(\d)\1{5}$/.test(pin) || pin === '123456' || pin === '654321') {
    throw new Error('Il PIN non può essere una sequenza o una ripetizione banale (es. 123456 o 000000)');
  }
}

function assertReady(): void {
  const now = Date.now();
  if (throttle.retryAt > now) {
    throw new Error(`Troppi tentativi. Riprova tra ${Math.ceil((throttle.retryAt - now) / 1000)} secondi`);
  }
}

function registerFailure(): void {
  throttle.failures += 1;
  const delay = Math.min(MAX_BACKOFF_MS, 1_000 * (2 ** Math.min(throttle.failures - 1, 6)));
  throttle.retryAt = Date.now() + delay;
}

function clearFailures(): void {
  throttle = { failures: 0, retryAt: 0 };
}

export function registerAdminSessionRevoker(revoker: () => void | Promise<void>): () => void {
  sessionRevokers.add(revoker);
  return () => sessionRevokers.delete(revoker);
}

export async function revokeAdminSessions(): Promise<void> {
  await storage.secureRemove('admin_token');
  await storage.secureRemove(LOCAL_SESSION_KEY);
  await Promise.allSettled(Array.from(sessionRevokers).map((revoke) => Promise.resolve(revoke())));
}

async function createLocalSession(record: AdminCredentialRecord): Promise<string> {
  const token = `adm_${Crypto.randomUUID().replace(/-/g, '')}${randomHex(16)}`;
  const session: LocalAdminSession = {
    token,
    credentialVersion: record.credentialVersion,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  const saved = await storage.secureSet(LOCAL_SESSION_KEY, JSON.stringify(session));
  if (!saved) throw new Error('Impossibile creare la sessione amministratore');
  return token;
}

export async function isAdminSessionValid(token: string): Promise<boolean> {
  if (!token) return false;
  const [record, rawSession] = await Promise.all([
    readRecord(),
    storage.secureGet(LOCAL_SESSION_KEY, ''),
  ]);
  if (!record || !rawSession) return false;
  try {
    const session = JSON.parse(rawSession) as LocalAdminSession;
    return Boolean(
      session
      && typeof session.token === 'string'
      && session.expiresAt > Date.now()
      && session.credentialVersion === record.credentialVersion
      && constantTimeEqual(session.token, token),
    );
  } catch {
    return false;
  }
}

export async function getAdminCredentialStatus(): Promise<PublicCredentialStatus> {
  const record = await readRecord();
  return {
    configured: Boolean(record),
    username: null,
    recoveryCodeReady: Boolean(record?.recovery?.hash),
  };
}

export async function migrateLegacyAdminCredentials(legacy: { username?: string; password?: string; pin?: string }): Promise<boolean> {
  if (await readRecord()) return false;
  const pin = normalizePin(legacy.pin || '');
  if (!pin) return false;

  const record: AdminCredentialRecord = {
    version: 3,
    pin: await createDerivedSecret(pin),
    credentialVersion: 1,
    updatedAt: new Date().toISOString(),
  };
  await writeRecord(record);
  return true;
}

export async function configureInitialAdminCredentials(
  pinOrUsername: string,
  maybePassword?: string,
  maybePin?: string
): Promise<{ recoveryCode: string; token: string }> {
  const existing = await readRecord();
  if (existing) throw new Error('Il PIN amministratore è già configurato');
  
  const rawPin = maybePin || (maybePassword ? maybePassword : pinOrUsername);
  const pin = normalizePin(rawPin);
  assertPin(pin);

  const recoveryCode = await createRecoveryCode();
  const record: AdminCredentialRecord = {
    version: 3,
    pin: await createDerivedSecret(pin),
    recovery: await createDerivedSecret(normalizeRecoveryCode(recoveryCode)),
    recoveryCreatedAt: new Date().toISOString(),
    credentialVersion: 1,
    updatedAt: new Date().toISOString(),
  };
  await writeRecord(record);
  const token = await createLocalSession(record);
  clearFailures();
  return { recoveryCode, token };
}

async function createRecoveryCode(): Promise<string> {
  const chunks = bytesToHex(Crypto.getRandomBytes(16)).toUpperCase().match(/.{1,4}/g);
  return `${RECOVERY_CODE_PREFIX}-${chunks?.join('-')}`;
}

export async function generateRecoveryCode(): Promise<{ recoveryCode: string }> {
  const record = await readRecord();
  if (!record) throw new Error('Configura prima il PIN amministratore');
  const recoveryCode = await createRecoveryCode();
  record.recovery = await createDerivedSecret(normalizeRecoveryCode(recoveryCode));
  record.recoveryCreatedAt = new Date().toISOString();
  record.credentialVersion += 1;
  record.updatedAt = new Date().toISOString();
  await writeRecord(record);
  await revokeAdminSessions();
  clearFailures();
  return { recoveryCode };
}

export async function authenticateAdminCredentials(usernameInput: string, password: string): Promise<string> {
  assertReady();
  const record = await readRecord();
  if (!record) {
    registerFailure();
    throw new Error('PIN non configurato');
  }
  const candidatePin = normalizePin(password || usernameInput);
  if (candidatePin && await matchesSecret(candidatePin, record.pin)) {
    clearFailures();
    return createLocalSession(record);
  }
  if (record.password && password && await matchesSecret(password, record.password)) {
    clearFailures();
    return createLocalSession(record);
  }
  registerFailure();
  throw new Error('PIN non valido');
}

export async function authenticateAdminPin(pinInput: string): Promise<string> {
  assertReady();
  const record = await readRecord();
  const pin = normalizePin(pinInput);
  const ok = Boolean(record && pin) && await matchesSecret(pin, record!.pin);
  if (!ok || !record) {
    registerFailure();
    throw new Error('PIN non valido');
  }
  clearFailures();
  return createLocalSession(record);
}

export async function updateAdminPin(currentPinInput: string, newPinInput: string): Promise<void> {
  assertReady();
  const record = await readRecord();
  if (!record) throw new Error('Configura prima il PIN amministratore');
  const current = normalizePin(currentPinInput);
  const validCurrent = await matchesSecret(current, record.pin)
    || (record.password ? await matchesSecret(currentPinInput.trim(), record.password) : false);
  if (!validCurrent) {
    registerFailure();
    throw new Error('Il PIN corrente non è valido');
  }

  const newPin = normalizePin(newPinInput);
  assertPin(newPin);

  record.pin = await createDerivedSecret(newPin);
  record.credentialVersion += 1;
  record.updatedAt = new Date().toISOString();
  await writeRecord(record);
  await revokeAdminSessions();
  clearFailures();
}

export async function updateAdminCredentials(
  currentSecret: string,
  next: { username?: string; password?: string; pin?: string; new_pin?: string }
): Promise<void> {
  const pin = next.pin || next.new_pin || next.password || next.username || '';
  if (!pin) throw new Error('Inserisci il nuovo PIN a 6 cifre');
  return updateAdminPin(currentSecret, pin);
}

export async function resetAdminCredentialsWithRecoveryCode(
  recoveryCodeInput: string,
  arg2: string,
  arg3?: string,
  arg4?: string
): Promise<{ recoveryCode: string; token: string }> {
  assertReady();
  const record = await readRecord();
  const recoveryCode = normalizeRecoveryCode(recoveryCodeInput);
  const rawPin = arg4 || arg3 || arg2;
  const pin = normalizePin(rawPin);
  if (!record?.recovery || !recoveryCode || !(await matchesSecret(recoveryCode, record.recovery))) {
    registerFailure();
    throw new Error('Recovery code non valido');
  }
  assertPin(pin);

  const newRecoveryCode = await createRecoveryCode();
  record.pin = await createDerivedSecret(pin);
  record.recovery = await createDerivedSecret(normalizeRecoveryCode(newRecoveryCode));
  record.recoveryCreatedAt = new Date().toISOString();
  record.credentialVersion += 1;
  record.updatedAt = new Date().toISOString();
  await writeRecord(record);
  await revokeAdminSessions();
  const token = await createLocalSession(record);
  clearFailures();
  return { recoveryCode: newRecoveryCode, token };
}

export async function clearLegacyAdminSecretsFromSettings<T extends Record<string, any>>(settings: T): Promise<T> {
  const next = { ...settings };
  delete next.admin_password;
  delete next.admin_pin;
  delete next.admin_username;
  return next;
}

export const adminCredentialStorageKeys = {
  CREDENTIAL_RECORD_KEY,
  LOCAL_SESSION_KEY,
};
