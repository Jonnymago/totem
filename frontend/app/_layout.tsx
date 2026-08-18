import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, LogBox, Platform } from "react-native";
import { useKeepAwake } from "expo-keep-awake";

import { startLocalServer, isLocalServerRunning, restartLocalServer } from '@/src/utils/LocalServer';
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ensureKioskIfPreferred } from "../modules/kiosk-mode/src";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  useKeepAwake();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    ensureKioskIfPreferred();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") ensureKioskIfPreferred();
    });
    return () => sub.remove();
  }, []);

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
      // Do not blindly create a second socket. LocalServer handles its own recovery
      // after socket/port errors; this only repairs a missing instance.
      if (!isLocalServerRunning()) {
        try { restartLocalServer(); } catch { boot(); }
      }
    });

    return () => sub.remove();
  }, []);

  if (!loaded && !error) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
