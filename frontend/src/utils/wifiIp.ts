import * as Network from 'expo-network';
import { getWifiIpv4Address as getNativeWifiIp } from '@/modules/kiosk-mode/src';

/**
 * Validates if an IP address string is a usable IPv4 address on LAN (not loopback, zero, or link-local APIPA)
 */
export function isUsableLanIpv4(value?: string | null): boolean {
  const ip = (value || '').trim();
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;
  const octets = ip.split('.').map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return false;
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('169.254.')) return false;
  return true;
}

/**
 * Resolves WiFi IPv4 address using native kiosk module with fallback to expo-network
 */
export async function getWifiIpv4Address(): Promise<string> {
  try {
    const nativeIp = await getNativeWifiIp().catch(() => '');
    if (isUsableLanIpv4(nativeIp)) {
      return nativeIp.trim();
    }
  } catch {
    // ignore and try fallback
  }

  try {
    const networkIp = await Network.getIpAddressAsync().catch(() => '');
    if (isUsableLanIpv4(networkIp)) {
      return networkIp.trim();
    }
  } catch {
    // ignore
  }

  return '';
}
