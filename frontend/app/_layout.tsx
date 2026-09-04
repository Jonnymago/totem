import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, LogBox, Platform, View } from "react-native";
import * as Network from 'expo-network';

import { startLocalServer, isLocalServerRunning, restartLocalServer } from '@/src/utils/LocalServer';
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import KioskManager from "@/src/components/KioskManager";
import { getSettings, updateSettings, getAdminCredentialStatus } from '@/src/api/api';
import { getCurrentLanguage, initI18n, setLanguage } from '@/src/utils/i18n';
import { installLocalizedAlert, Text } from '@/src/components/LocalizedPrimitives';
import { ensureKioskIfPreferred } from '@/modules/kiosk-mode/src';
import { requestAllAppPermissions } from '@/src/utils/permissions';
import { revalidateGooglePlayEntitlement } from '@/src/utils/license';

LogBox.ignoreAllLogs(true);
installLocalizedAlert();

try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch {}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const pathname = usePathname();
  const router = useRouter();
  const [bootGate, setBootGate] = useState<'loading' | 'setup' | 'ready'>('loading');

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [loaded, error]);

  useEffect(() => {
    let active = true;
    const enforceFirstAccess = async () => {
      try {
        const credentialStatus = await getAdminCredentialStatus();
        if (!active) return;
        if (!credentialStatus.configured) {
          setBootGate('setup');
          if (!(pathname || '').includes('/admin/login')) {
            router.replace('/admin/login');
          }
          return;
        }
        setBootGate('ready');
      } catch (e) {
        console.warn('First-access gate error:', e);
        if (active) setBootGate('ready');
      }
    };
    void enforceFirstAccess();
    return () => { active = false; };
  }, [pathname, router]);

  useEffect(() => {
    const boot = async () => {
      try {
        try {
          await initI18n();
        } catch (e) {
          console.warn('i18n init error:', e);
        }

        try {
          const settings = await getSettings();
          if (settings.language) {
            await setLanguage(settings.language);
          } else {
            await updateSettings({ language: getCurrentLanguage() });
          }
        } catch (e) {
          console.warn('Settings init error:', e);
        }

        if (Platform.OS !== 'web') {
          try {
            if (!isLocalServerRunning()) startLocalServer();
          } catch (e) {
            console.warn('LocalServer start error:', e);
          }
        }

        void revalidateGooglePlayEntitlement();

        if (Platform.OS === 'android') {
          setTimeout(() => {
            requestAllAppPermissions().catch((err) => console.warn('Permissions request error:', err));
            ensureKioskIfPreferred().catch((err) => console.warn('Kiosk mode start error:', err));
          }, 800);
        }
      } catch (e) {
        console.error('Local server / boot error:', e);
      }
    };

    void boot();

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (Platform.OS !== 'web') {
        try {
          if (!isLocalServerRunning()) {
            restartLocalServer();
          }
        } catch (e) {
          console.warn('Restart server error on resume:', e);
        }
      }
      if (Platform.OS === 'android') {
        ensureKioskIfPreferred().catch((err) => console.warn('Kiosk resume error:', err));
      }
      void revalidateGooglePlayEntitlement();
    });

    let hadNetwork: boolean | null = null;
    const networkSub = Network.addNetworkStateListener((state) => {
      const isConnected = state.isConnected === true && state.isInternetReachable !== false;
      if (isConnected && hadNetwork === false) {
        void revalidateGooglePlayEntitlement();
      }
      hadNetwork = isConnected;
    });

    return () => {
      sub.remove();
      networkSub.remove();
    };
  }, []);

  if (!loaded && !error) return null;

  if (bootGate === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B6B" />
        <Text style={{ color: '#F8FAFC', marginTop: 14, fontWeight: '700' }}>Preparazione primo accesso...</Text>
      </View>
    );
  }

  return (
    <KioskManager>
      <Stack screenOptions={{ headerShown: false }} />
    </KioskManager>
  );
}
