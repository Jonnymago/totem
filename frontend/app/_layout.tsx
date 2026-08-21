import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, LogBox, Platform } from "react-native";

import { startLocalServer, isLocalServerRunning, restartLocalServer } from '@/src/utils/LocalServer';
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import KioskManager from "@/src/components/KioskManager";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const boot = () => {
      try {
        if (!isLocalServerRunning()) startLocalServer();
      } catch (e) {
        console.error('Local server boot error:', e);
      }
    };

    boot();

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!isLocalServerRunning()) {
        try { restartLocalServer(); } catch { boot(); }
      }
    });

    return () => sub.remove();
  }, []);

  if (!loaded && !error) return null;

  return (
    <KioskManager>
      <Stack screenOptions={{ headerShown: false }} />
    </KioskManager>
  );
}
