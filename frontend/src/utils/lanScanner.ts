import * as Network from 'expo-network';
import { getWifiIpv4Address, isUsableLanIpv4 } from './wifiIp';
import { getSettings, updateSettings } from '@/src/api/api';

export interface DiscoveredStation {
  ip: string;
  port: number;
  role: 'master' | 'satellite' | 'mono';
  station_id: string;
  station_name: string;
  isMaster: boolean;
  latencyMs: number;
}

/**
 * Fast resolution of local IP address with timeout
 */
export async function getFastLocalIp(timeoutMs: number = 1500): Promise<string> {
  try {
    const wifiPromise = getWifiIpv4Address().catch(() => '');
    const netPromise = Network.getIpAddressAsync().catch(() => '');

    const [wifiIp, netIp] = await Promise.race([
      Promise.all([wifiPromise, netPromise]),
      new Promise<[string, string]>((resolve) =>
        setTimeout(() => resolve(['', '']), timeoutMs)
      ),
    ]);

    if (isUsableLanIpv4(wifiIp)) return wifiIp;
    if (isUsableLanIpv4(netIp)) return netIp;

    // Check stored manual override
    const settings = await getSettings().catch(() => null);
    if (settings && isUsableLanIpv4(settings.remote_ip_override || '')) {
      return settings.remote_ip_override?.trim() || '';
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Probes a specific IP on port 3000 to see if a Totem Master/Satellite is running
 */
export async function probeStationIp(
  ip: string,
  port: number = 3000,
  timeoutMs: number = 600
): Promise<DiscoveredStation | null> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`http://${ip}:${port}/api/station-info`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      return {
        ip,
        port,
        role: data.role || (data.is_master ? 'master' : 'mono'),
        station_id: data.station_id || 'TOTEM',
        station_name: data.station_name || `Totem (${ip})`,
        isMaster: data.role === 'master' || data.is_master === true || data.role === 'mono',
        latencyMs: Date.now() - start,
      };
    }
  } catch {
    // Port closed or unreachable
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Scans the local /24 subnet for active Totem devices
 */
export async function scanSubnetForTotems(
  onProgress?: (scanned: number, total: number) => void
): Promise<DiscoveredStation[]> {
  const myIp = await getFastLocalIp(1200);
  if (!isUsableLanIpv4(myIp)) {
    return [];
  }

  const parts = myIp.split('.');
  const subnetPrefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
  const found: DiscoveredStation[] = [];

  const BATCH_SIZE = 25;
  const ipsToScan: string[] = [];
  for (let i = 1; i <= 254; i++) {
    const target = `${subnetPrefix}${i}`;
    if (target !== myIp) {
      ipsToScan.push(target);
    }
  }

  let completed = 0;
  for (let i = 0; i < ipsToScan.length; i += BATCH_SIZE) {
    const batch = ipsToScan.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((ip) => probeStationIp(ip, 3000, 500)));
    results.forEach((r) => {
      if (r) found.push(r);
    });
    completed += batch.length;
    if (onProgress) onProgress(completed, ipsToScan.length);
  }

  return found;
}

/**
 * 1-Click Auto Configuration:
 * Scans LAN -> If Master found: configures as Satellite hooked to Master.
 * If NO Master found: configures this device as Master / Server Centrale.
 */
export async function autoConfigureTopology(
  onLog?: (msg: string) => void
): Promise<{ success: boolean; role: 'master' | 'satellite' | 'mono'; message: string; targetIp?: string }> {
  if (onLog) onLog('🔍 Rilevamento indirizzo di rete locale...');
  const myIp = await getFastLocalIp(1500);

  if (onLog) onLog(`🌐 IP Locale: ${myIp || 'Non rilevato'}. Ricerca Totem Master in rete...`);
  const devices = await scanSubnetForTotems((scanned, total) => {
    if (onLog && scanned % 50 === 0) {
      onLog(`📡 Scansione rete in corso... (${scanned}/${total})`);
    }
  });

  const masterDevice = devices.find((d) => d.isMaster || d.role === 'master');

  if (masterDevice) {
    if (onLog) onLog(`✅ Trovato Totem Master all'indirizzo ${masterDevice.ip} (${masterDevice.station_name})!`);
    if (onLog) onLog('🔗 Aggancio automatico in modalità Satellite...');

    const settings = await getSettings();
    const currentTopology = settings.station_topology || {};

    const updatedTopology = {
      ...currentTopology,
      role: 'satellite' as const,
      master_server_ip: masterDevice.ip,
      master_server_port: masterDevice.port || 3000,
      auto_discovery: true,
      station_name: (currentTopology as any).station_name || 'Totem Satellite',
      station_id: (currentTopology as any).station_id || `SAT-${Math.floor(100 + Math.random() * 900)}`,
      order_prefix: (currentTopology as any).order_prefix || 'T2',
      sync_interval_sec: 10,
    };

    await updateSettings({
      station_topology: updatedTopology,
      remote_ip_override: myIp || settings.remote_ip_override,
    });

    return {
      success: true,
      role: 'satellite',
      targetIp: masterDevice.ip,
      message: `Agganciato con successo al Master ${masterDevice.ip} (${masterDevice.station_name}). Questo totem è ora configurato come Satellite con prefisso ${updatedTopology.order_prefix}.`,
    };
  } else {
    if (onLog) onLog('ℹ️ Nessun altro Totem Master attivo trovato nella rete.');
    if (onLog) onLog('👑 Configurazione di questo dispositivo come Totem Master Principale...');

    const settings = await getSettings();
    const currentTopology = settings.station_topology || {};

    const updatedTopology = {
      ...currentTopology,
      role: 'master' as const,
      master_server_ip: '',
      master_server_port: 3000,
      auto_discovery: true,
      station_name: (currentTopology as any).station_name || 'Totem Master Principale',
      station_id: (currentTopology as any).station_id || 'MASTER-01',
      order_prefix: 'T1',
      sync_interval_sec: 10,
    };

    await updateSettings({
      station_topology: updatedTopology,
      remote_ip_override: myIp || settings.remote_ip_override,
    });

    return {
      success: true,
      role: 'master',
      targetIp: myIp,
      message: `Configurato come Totem Master Principale & Hub Server. I totem satelliti e i KDS nella stessa rete Wi-Fi si agganceranno automaticamente a questo IP (${myIp || 'localhost'}).`,
    };
  }
}
