import { create } from 'zustand';
import {
  KioskConfig,
  DEFAULT_KIOSK_CONFIG,
  getKioskConfig,
  saveKioskConfig,
  applyKioskHardwareSettings,
  isNightDimmingTime,
  playKioskBeep,
} from '@/src/utils/kiosk';
import { setNativeScreenBrightness } from '../../modules/kiosk-mode/src';

interface KioskStore {
  config: KioskConfig;
  isInitialized: boolean;
  screensaverActive: boolean;
  dimmedActive: boolean;
  nightDimmingActive: boolean;
  lastActivityTimestamp: number;

  initKiosk: () => Promise<void>;
  updateConfig: (patch: Partial<KioskConfig>) => Promise<KioskConfig>;
  recordActivity: () => void;
  triggerWake: () => void;
  triggerScreensaver: () => void;
  triggerDim: (val?: number) => void;
  triggerBeep: () => void;
  getEffectiveBrightness: () => number;
}

export const useKioskStore = create<KioskStore>((set, get) => ({
  config: DEFAULT_KIOSK_CONFIG,
  isInitialized: false,
  screensaverActive: false,
  dimmedActive: false,
  nightDimmingActive: false,
  lastActivityTimestamp: Date.now(),

  initKiosk: async () => {
    try {
      const cfg = await getKioskConfig();
      const isNight = cfg.nightDimmingEnabled && isNightDimmingTime(cfg.nightDimmingStart, cfg.nightDimmingEnd);
      set({
        config: cfg,
        isInitialized: true,
        nightDimmingActive: isNight,
        lastActivityTimestamp: Date.now(),
      });
      await applyKioskHardwareSettings(cfg);
    } catch (e) {
      console.warn('Errore inizializzazione KioskStore:', e);
    }
  },

  updateConfig: async (patch: Partial<KioskConfig>) => {
    const updated = await saveKioskConfig(patch);
    const isNight = updated.nightDimmingEnabled && isNightDimmingTime(updated.nightDimmingStart, updated.nightDimmingEnd);
    set({
      config: updated,
      nightDimmingActive: isNight,
    });
    return updated;
  },

  recordActivity: () => {
    const { screensaverActive, dimmedActive, config } = get();
    if (screensaverActive || dimmedActive) {
      set({
        screensaverActive: false,
        dimmedActive: false,
        lastActivityTimestamp: Date.now(),
      });
      setNativeScreenBrightness(config.brightnessLevel || 90).catch(() => {});
    } else {
      set({ lastActivityTimestamp: Date.now() });
    }
  },

  triggerWake: () => {
    const { config } = get();
    set({
      screensaverActive: false,
      dimmedActive: false,
      lastActivityTimestamp: Date.now(),
    });
    playKioskBeep();
    applyKioskHardwareSettings(config).catch(() => {});
  },

  triggerScreensaver: () => {
    set({
      screensaverActive: true,
      dimmedActive: false,
    });
  },

  triggerDim: (val?: number) => {
    const target = val ?? 10;
    set({
      dimmedActive: true,
      screensaverActive: false,
    });
    setNativeScreenBrightness(target).catch(() => {});
  },

  triggerBeep: () => {
    playKioskBeep();
  },

  getEffectiveBrightness: () => {
    const { config, dimmedActive, nightDimmingActive } = get();
    if (dimmedActive || nightDimmingActive) {
      return 10;
    }
    return config.brightnessLevel || 90;
  },
}));
