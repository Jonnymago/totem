export function startLocalServer() {}
export function stopLocalServer() {}
export function restartLocalServer() {}
export function isLocalServerRunning() {
  return false;
}
export async function saveStoredServerIp(_ip: string): Promise<boolean> {
  return true;
}
export async function getStoredServerIp(): Promise<string | null> {
  return null;
}
