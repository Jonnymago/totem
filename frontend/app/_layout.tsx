import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, LogBox, Platform } from "react-native";
import { useKeepAwake } from "expo-keep-awake";

import { startLocalServer } from '../src/utils/LocalServer';
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ensureKioskIfPreferred } from "../modules/kiosk-mode/src";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useKeepAwake();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Kiosk aggressivo: all'avvio e a ogni return in foreground
  useEffect(() => {
    if (Platform.OS !== "android") return;

    ensureKioskIfPreferred();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        ensureKioskIfPreferred();
      }
    });

    return () => sub.remove();
  }, []);


  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        startLocalServer();
      } catch (e) {
        console.error('Local server error:', e);
      }
    }
  }, []);

  if (!loaded && !error) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
