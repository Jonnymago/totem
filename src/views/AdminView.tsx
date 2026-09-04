import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import {
  Product,
  Category,
  Settings,
  GlobalOptionGroup,
  KioskSettings,
  LicenseInfo,
  Order,
  OrderStatus,
  PrinterDevice,
  StationTopologyConfig,
  StationRole,
} from '../types';
import {
  Ticket,
  FastForward,
  Grid,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Save,
  Lock,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  UtensilsCrossed,
  Layers,
  Volume2,
  Moon,
  Clock,
  Copy,
  Monitor,
  CheckCheck,
  Sparkles,
  RotateCcw,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Wifi,
  Shield,
  KeyRound,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  ShieldAlert,
  Star,
  Printer,
  Network,
  Radio,
  Server,
  Tv,
  Flame,
  Coffee,
  Receipt,
  ChefHat,
  Store,
  Laptop,
  Cpu,
  Menu,
  X,
  ChevronRight,
  SlidersHorizontal,
  VolumeX,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuideHelper } from '../components/GuideHelper';
import { playBeep, playSuccessBeep, playQueueCallSound } from '../utils/audio';
import { Screensaver } from '../components/Screensaver';
import { useI18n } from '../utils/i18n';
import { LanguageSelector } from '../components/LanguageSelector';

type AdminTab =
  | 'products'
  | 'categories'
  | 'groups'
  | 'orders'
  | 'queue'
  | 'signage'
  | 'printers'
  | 'topology'
  | 'kiosk'
  | 'settings'
  | 'license'
  | 'compliance'
  | 'remote'
  | 'guide';

export const AdminView: React.FC = () => {
  const { adminToken, logoutAdmin, fetchSettings, settings } = useStore();
  const [tab, setTab] = useState<AdminTab>('products');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // Products
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState<string>('all');

  // Categories
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Groups & Modifiers
  const [adminGroups, setAdminGroups] = useState<GlobalOptionGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<Partial<GlobalOptionGroup> | null>(null);

  // Orders
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Printers & Multi-Department Routing
  const [adminPrinters, setAdminPrinters] = useState<PrinterDevice[]>([]);
  const [editingPrinter, setEditingPrinter] = useState<Partial<PrinterDevice> | null>(null);
  const [testPrintLoadingId, setTestPrintLoadingId] = useState<string | null>(null);

  // Topology & Station Network
  const [stationTopology, setStationTopology] = useState<StationTopologyConfig>({
    role: 'mono',
    station_id: 'TOTEM-01',
    station_name: 'Totem Principale Cassa',
    order_prefix: '',
    master_server_ip: '192.168.1.100',
    master_server_port: 3000,
    auto_discovery_enabled: true,
    sync_interval_sec: 30,
    sync_interval_seconds: 30,
    last_sync_timestamp: undefined,
  });
  const [lanMasters, setLanMasters] = useState<{ ip: string; name: string; port: number; is_master: boolean }[]>([]);
  const [isScanningLan, setIsScanningLan] = useState(false);
  const [isSyncingMaster, setIsSyncingMaster] = useState(false);

  // Kiosk & Hardware
  const [kioskConfig, setKioskConfig] = useState<KioskSettings>({
    kiosk_enabled: true,
    screen_orientation: 'portrait',
    secret_taps_count: 7,
    secret_taps_position: 'top-right',
    admin_pin_required: true,
    screensaver_timeout_minutes: 3,
    dimming_timeout_minutes: 5,
    local_api_enabled: true,
  });

  // License & Subscriptions
  const [licenseData, setLicenseData] = useState<LicenseInfo>({
    status: 'active',
    plan_name: 'Piano Base Totem (Google Play)',
    hardware_id: 'TOTEM-HW-88F4-A92B',
    expiry_date: '2026-12-31',
    trial_days_left: 30,
    allowed_totems: 1,
  });

  // Settings
  const [settingsForm, setSettingsForm] = useState<Partial<Settings>>({
    restaurant_name: 'TOTEM RISTORANTE',
    admin_username: 'admin',
    admin_password: '',
    admin_pin: '1234',
    kitchen_display_enabled: true,
    auto_print_courtesy: false,
    auto_print_kitchen: true,
    order_reset_mode: 'daily',
    order_reset_time: '00:00',
  });

  // Screensaver Preview Modal
  const [isTestScreensaverOpen, setIsTestScreensaverOpen] = useState(false);

  // I18n
  const { t } = useI18n();

  // Auth & Mode Selection
  const [authTab, setAuthTab] = useState<'first_access' | 'login' | 'pin' | 'recovery'>(() => {
    if (settings && (settings.is_first_access_completed || settings.admin_password)) {
      return 'login';
    }
    return 'first_access';
  });

  // First Access Setup Form State
  const [setupUser, setSetupUser] = useState('admin');
  const [setupPass, setSetupPass] = useState('');
  const [setupConfirmPass, setSetupConfirmPass] = useState('');
  const [setupPin, setSetupPin] = useState('1234');
  const [setupRecoveryCode, setSetupRecoveryCode] = useState(() => {
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    return `TOTEM-REC-${p1}-${p2}`;
  });
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);
  const [showSetupPass, setShowSetupPass] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [setupError, setSetupError] = useState('');

  // Quick PIN Login Form State
  const [pinLoginInput, setPinLoginInput] = useState('');
  const [pinLoginError, setPinLoginError] = useState('');

  // Recovery Reset Form State
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [recoveryNewConfirmPass, setRecoveryNewConfirmPass] = useState('');
  const [recoveryNewPin, setRecoveryNewPin] = useState('1234');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // Auth & UI feedback
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [statusNotice, setStatusNotice] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);

  const showNotification = (msg: string, type: 'success' | 'info' = 'success') => {
    setStatusNotice({ msg, type });
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Display Queue & Digital Signage state
  const [dqCallingNum, setDqCallingNum] = useState<number | null>(null);
  const [dqManualInput, setDqManualInput] = useState<string>('');
  const [dqTheme, setDqTheme] = useState<'dark' | 'light'>('dark');
  const [dqMode, setDqMode] = useState<'full' | 'products'>('full');
  const [dqCols, setDqCols] = useState<number>(4);
  const [dqHero, setDqHero] = useState<boolean>(true);
  const [dqDaypart, setDqDaypart] = useState<boolean>(true);
  const [dqInterval, setDqInterval] = useState<number>(9000);
  const [dqLang, setDqLang] = useState<string>('it');
  const [dqAnim, setDqAnim] = useState<'kenburns' | 'slide' | 'fade'>('kenburns');
  const [kdsDepartments, setKdsDepartments] = useState<{ id: string; name: string; assigned_category_ids: string[]; printer_id?: string }[]>([]);
  const [kdsDeptFilter, setKdsDeptFilter] = useState<string>('all');
  const [newKdsName, setNewKdsName] = useState('');

  const fetchDisplayQueueCalling = async () => {
    try {
      const res = await fetch('/api/display-queue/calling');
      if (res.ok) {
        const data = await res.json();
        setDqCallingNum(data?.number ?? null);
      }
    } catch {
      // ignore
    }
  };

  const updateDisplayQueueCalling = async (num: number | null) => {
    try {
      const res = await fetch('/api/display-queue/calling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num }),
      });
      if (res.ok) {
        const data = await res.json();
        setDqCallingNum(data?.number ?? null);
        showNotification(num != null ? `Chiamato numero ${num}` : 'Chiamata azzerata', 'success');
        if (num != null) playQueueCallSound();
        else playSuccessBeep();
      }
    } catch {
      showNotification('Errore aggiornamento numero chiamata', 'info');
    }
  };

  useEffect(() => {
    if (tab === 'remote' || tab === 'signage' || tab === 'queue') {
      fetchDisplayQueueCalling();
      const interval = setInterval(fetchDisplayQueueCalling, 5000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedRecovery(true);
      playBeep(880, 0.08);
      setTimeout(() => setCopiedRecovery(false), 2500);
    } catch {
      // Fallback
    }
  };

  const regenerateRecoveryCode = () => {
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    setSetupRecoveryCode(`TOTEM-REC-${p1}-${p2}`);
    playBeep(600, 0.06);
  };

  const loadAdminData = async () => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const [prods, cats, groups, ords, sets, kiosk, lic, prns, topo, kdsList] = await Promise.all([
        api.getAdminProducts(),
        api.getAdminCategories(),
        api.getGlobalGroups(),
        api.getAdminOrders(),
        api.getSettings(),
        api.getKioskSettings(),
        api.getLicenseInfo(),
        api.getPrinters(),
        api.getStationTopology(),
        fetch('/api/admin/department-kds', { headers: { Authorization: `Bearer ${adminToken}` } }).then((r) => r.ok ? r.json() : []).catch(() => []),
      ]);
      setAdminProducts(prods);
      setAdminCategories(cats);
      setAdminGroups(groups);
      setAdminOrders(ords);
      setSettingsForm(sets);
      setKioskConfig(kiosk);
      setLicenseData(lic);
      setAdminPrinters(prns);
      setStationTopology(topo);
      if (Array.isArray(kdsList)) setKdsDepartments(kdsList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadAdminData();
    }
  }, [adminToken]);

  // Standard Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await api.adminLogin(loginUser, loginPass);
      useStore.getState().setAdminToken(data.access_token);
      playSuccessBeep();
    } catch (err: any) {
      setLoginError(err.message || 'Credenziali errate');
    }
  };

  // Quick PIN Login
  const handlePinLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinLoginError('');
    if (!pinLoginInput || pinLoginInput.length < 3) {
      setPinLoginError('Inserisci un PIN valido');
      return;
    }
    try {
      const data = await api.adminPinLogin(pinLoginInput);
      useStore.getState().setAdminToken(data.access_token);
      playSuccessBeep();
    } catch (err: any) {
      setPinLoginError(err.message || 'PIN non valido');
    }
  };

  // Complete First Access Wizard
  const handleCompleteFirstAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (setupUser.trim().length < 3) {
      setSetupError(t('auth.err_username_short'));
      return;
    }
    if (setupPass.length < 6) {
      setSetupError(t('auth.err_password_short'));
      return;
    }
    if (setupPass !== setupConfirmPass) {
      setSetupError(t('auth.err_password_match'));
      return;
    }
    if (!/^\d{3,4}$/.test(setupPin.trim())) {
      setSetupError(t('auth.err_pin_invalid'));
      return;
    }
    if (!recoveryConfirmed) {
      setSetupError(t('auth.err_recovery_check'));
      return;
    }

    try {
      const res = await api.completeFirstAccess({
        username: setupUser.trim(),
        password: setupPass,
        pin: setupPin.trim(),
        recovery_code: setupRecoveryCode,
      });
      useStore.getState().setAdminToken(res.access_token);
      setSettingsForm(res.settings);
      playSuccessBeep();
      showNotification('Configurazione completata con successo!');
    } catch (err: any) {
      setSetupError(err.message || 'Errore durante la configurazione');
    }
  };

  // Recovery Emergency Reset
  const handleRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryInput.trim()) {
      setRecoveryError('Inserisci il Recovery Code');
      return;
    }
    if (recoveryNewPass.length < 6) {
      setRecoveryError(t('auth.err_password_short'));
      return;
    }
    if (recoveryNewPass !== recoveryNewConfirmPass) {
      setRecoveryError(t('auth.err_password_match'));
      return;
    }
    if (!/^\d{3,4}$/.test(recoveryNewPin.trim())) {
      setRecoveryError(t('auth.err_pin_invalid'));
      return;
    }

    try {
      await api.verifyRecoveryCode(recoveryInput.trim());
      const p1 = Math.floor(1000 + Math.random() * 9000);
      const p2 = Math.floor(1000 + Math.random() * 9000);
      const newRecCode = `TOTEM-REC-${p1}-${p2}`;

      const res = await api.completeFirstAccess({
        username: loginUser || 'admin',
        password: recoveryNewPass,
        pin: recoveryNewPin.trim(),
        recovery_code: newRecCode,
      });
      useStore.getState().setAdminToken(res.access_token);
      setSettingsForm(res.settings);
      playSuccessBeep();
      showNotification('Accesso ripristinato con successo!');
    } catch (err: any) {
      setRecoveryError(err.message || 'Recovery Code errato o non valido');
    }
  };

  if (!adminToken) {
    return (
      <div className="min-h-[calc(100vh-70px)] bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative selection:bg-rose-500 selection:text-white">
        {/* Background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Top bar with Language Selector */}
        <div className="w-full max-w-lg flex items-center justify-between mb-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
              Totem Security Hub
            </span>
          </div>
          <LanguageSelector mode="persistent" />
        </div>

        {/* Main Authentication Container */}
        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              {authTab === 'first_access' ? (
                <Sparkles className="w-7 h-7" />
              ) : authTab === 'pin' ? (
                <KeyRound className="w-7 h-7" />
              ) : authTab === 'recovery' ? (
                <ShieldAlert className="w-7 h-7" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {authTab === 'first_access'
                ? t('auth.first_access_title')
                : authTab === 'pin'
                ? t('auth.tab_pin')
                : authTab === 'recovery'
                ? t('auth.tab_recovery')
                : t('auth.login_title')}
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {authTab === 'first_access'
                ? t('auth.first_access_subtitle')
                : authTab === 'pin'
                ? t('auth.pin_login_desc')
                : authTab === 'recovery'
                ? t('auth.recovery_desc')
                : t('auth.login_subtitle')}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setAuthTab('first_access');
                setSetupError('');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                authTab === 'first_access'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('auth.tab_first_access')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setLoginError('');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                authTab === 'login'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('auth.tab_login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('pin');
                setPinLoginError('');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                authTab === 'pin'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('auth.tab_pin')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('recovery');
                setRecoveryError('');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                authTab === 'recovery'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('auth.tab_recovery')}
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB: PRIMO ACCESSO WIZARD */}
          {/* ========================================================= */}
          {authTab === 'first_access' && (
            <form onSubmit={handleCompleteFirstAccess} className="space-y-4">
              {setupError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    {t('auth.username_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={setupUser}
                    onChange={(e) => setSetupUser(e.target.value)}
                    placeholder={t('auth.username_placeholder')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 font-medium"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    {t('auth.username_hint')}
                  </span>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      {t('auth.password_label')}
                    </label>
                    <div className="relative">
                      <input
                        type={showSetupPass ? 'text' : 'password'}
                        required
                        value={setupPass}
                        onChange={(e) => setSetupPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPass(!showSetupPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showSetupPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      {t('auth.confirm_password_label')}
                    </label>
                    <input
                      type={showSetupPass ? 'text' : 'password'}
                      required
                      value={setupConfirmPass}
                      onChange={(e) => setSetupConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-zinc-800 border rounded-xl p-3 text-sm text-white focus:outline-none ${
                        setupConfirmPass && setupConfirmPass !== setupPass
                          ? 'border-rose-500'
                          : 'border-zinc-700 focus:border-rose-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
                  <span>{t('auth.password_hint')}</span>
                  {setupPass.length >= 6 && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Valida
                    </span>
                  )}
                </div>

                {/* PIN Amministratore */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    {t('auth.pin_label')}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Es. 1234"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 font-mono tracking-widest text-center text-lg font-bold"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block text-center">
                    {t('auth.pin_hint')}
                  </span>
                </div>

                {/* Recovery Code Box */}
                <div className="p-4 bg-zinc-950 border border-amber-500/30 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> {t('auth.recovery_code_label')}
                    </span>
                    <button
                      type="button"
                      onClick={regenerateRecoveryCode}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> {t('auth.regenerate_btn')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <span className="font-mono font-black text-white text-sm sm:text-base tracking-wider">
                      {setupRecoveryCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(setupRecoveryCode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        copiedRecovery
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {copiedRecovery ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> {t('auth.copied_toast')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> {t('auth.copy_btn')}
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    {t('auth.recovery_warning')}
                  </p>

                  <label className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recoveryConfirmed}
                      onChange={(e) => setRecoveryConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 text-rose-600 focus:ring-rose-500 bg-zinc-800 w-4 h-4"
                    />
                    <span className="text-[11px] text-zinc-300 font-semibold select-none">
                      {t('auth.recovery_confirm_check')}
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-rose-600/20 text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('auth.setup_btn')}</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB: LOGIN STANDARD */}
          {/* ========================================================= */}
          {authTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-bold flex items-center gap-2 text-center justify-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    {t('auth.username_label')}
                  </label>
                  <input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    {t('auth.password_label')}
                  </label>
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Lascia vuoto o inserisci password"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-rose-600/20 text-sm"
              >
                {t('auth.login_btn')}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB: PIN RAPIDO */}
          {/* ========================================================= */}
          {authTab === 'pin' && (
            <form onSubmit={handlePinLogin} className="space-y-5">
              {pinLoginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-bold text-center">
                  {pinLoginError}
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pinLoginInput}
                  onChange={(e) => setPinLoginInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white text-center text-3xl font-mono tracking-widest focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Virtual keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => {
                      if (pinLoginInput.length < 4) {
                        setPinLoginInput((prev) => prev + digit);
                      }
                    }}
                    className="h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-rose-600 text-white text-xl font-bold transition-all flex items-center justify-center border border-zinc-700/50"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinLoginInput('')}
                  className="h-14 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center"
                >
                  CANCELLA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinLoginInput.length < 4) {
                      setPinLoginInput((prev) => prev + '0');
                    }
                  }}
                  className="h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-rose-600 text-white text-xl font-bold transition-all flex items-center justify-center border border-zinc-700/50"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPinLoginInput((prev) => prev.slice(0, -1))}
                  className="h-14 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-sm font-bold flex items-center justify-center border border-zinc-700/50"
                >
                  ⌫
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-rose-600/20 text-sm"
              >
                {t('auth.pin_btn')}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB: RECUPERO EMERGENZA */}
          {/* ========================================================= */}
          {authTab === 'recovery' && (
            <form onSubmit={handleRecoveryReset} className="space-y-4">
              {recoveryError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-bold text-center">
                  {recoveryError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    {t('auth.recovery_code_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                    placeholder="TOTEM-REC-XXXX-XXXX"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white font-mono tracking-wider focus:outline-none focus:border-rose-500 uppercase"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Inserisci il codice di emergenza generato durante il primo accesso
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Nuova Password
                    </label>
                    <input
                      type="password"
                      required
                      value={recoveryNewPass}
                      onChange={(e) => setRecoveryNewPass(e.target.value)}
                      placeholder="Min. 6 caratteri"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      Conferma Nuova Password
                    </label>
                    <input
                      type="password"
                      required
                      value={recoveryNewConfirmPass}
                      onChange={(e) => setRecoveryNewConfirmPass(e.target.value)}
                      placeholder="Ripeti password"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Nuovo PIN Amministratore (4 cifre)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={recoveryNewPin}
                    onChange={(e) => setRecoveryNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Es. 1234"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-center font-mono tracking-widest text-lg font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-amber-600/20 text-sm flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Reimposta Credenziali & Accedi</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Handle Product Save
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, editingProduct);
      } else {
        await api.createProduct(editingProduct);
      }
      setEditingProduct(null);
      await loadAdminData();
      playSuccessBeep();
      showNotification('Prodotto salvato con successo!');
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio prodotto');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    try {
      await api.deleteProduct(id);
      await loadAdminData();
      showNotification('Prodotto eliminato');
    } catch (err: any) {
      alert('Errore eliminazione');
    }
  };

  // Move Product Position
  const handleMoveProductPosition = async (id: string, delta: number) => {
    const prods = [...adminProducts];
    const idx = prods.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= prods.length) return;

    const currentPos = prods[idx].order_position ?? idx + 1;
    const targetPos = prods[targetIdx].order_position ?? targetIdx + 1;

    await api.updateProduct(prods[idx].id, { order_position: targetPos });
    await api.updateProduct(prods[targetIdx].id, { order_position: currentPos });
    await loadAdminData();
  };

  // Handle Category Save
  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory);
      } else {
        await api.createCategory(editingCategory);
      }
      setEditingCategory(null);
      await loadAdminData();
      playSuccessBeep();
      showNotification('Categoria salvata con successo!');
    } catch (err: any) {
      alert('Errore salvataggio categoria');
    }
  };

  // Handle Category Delete
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Eliminare questa categoria?')) return;
    try {
      await api.deleteCategory(id);
      await loadAdminData();
      showNotification('Categoria eliminata');
    } catch (err: any) {
      alert('Errore eliminazione categoria');
    }
  };

  // Move Category Position
  const handleMoveCategoryPosition = async (id: string, delta: number) => {
    const cats = [...adminCategories];
    const idx = cats.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= cats.length) return;

    const currentPos = cats[idx].order_position ?? idx + 1;
    const targetPos = cats[targetIdx].order_position ?? targetIdx + 1;

    await api.updateCategory(cats[idx].id, { order_position: targetPos });
    await api.updateCategory(cats[targetIdx].id, { order_position: currentPos });
    await loadAdminData();
  };

  // Handle Group Save
  const handleSaveGroup = async () => {
    if (!editingGroup) return;
    try {
      if (editingGroup.id) {
        await api.updateGlobalGroup(editingGroup.id, editingGroup);
      } else {
        await api.createGlobalGroup(editingGroup);
      }
      setEditingGroup(null);
      await loadAdminData();
      playSuccessBeep();
      showNotification('Gruppo opzioni salvato!');
    } catch (err: any) {
      alert('Errore salvataggio gruppo');
    }
  };

  // Handle Group Delete
  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Eliminare questo gruppo opzioni?')) return;
    try {
      await api.deleteGlobalGroup(id);
      await loadAdminData();
      showNotification('Gruppo eliminato');
    } catch (err: any) {
      alert('Errore eliminazione gruppo');
    }
  };

  // Move Group Position
  const handleMoveGroupPosition = async (id: string, delta: number) => {
    const grps = [...adminGroups];
    const idx = grps.findIndex((g) => g.id === id);
    if (idx < 0) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= grps.length) return;

    const currentPos = grps[idx].order_position ?? idx + 1;
    const targetPos = grps[targetIdx].order_position ?? targetIdx + 1;

    await api.updateGlobalGroup(grps[idx].id, { order_position: targetPos });
    await api.updateGlobalGroup(grps[targetIdx].id, { order_position: currentPos });
    await loadAdminData();
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    try {
      if (settingsForm.admin_password && settingsForm.admin_password.length > 0 && settingsForm.admin_password.length < 6) {
        alert('La nuova password deve contenere almeno 6 caratteri.');
        return;
      }
      if (settingsForm.admin_pin && !/^\d{3,4}$/.test(settingsForm.admin_pin.trim())) {
        alert('Il PIN deve essere composto da 3 o 4 cifre numeriche.');
        return;
      }

      await api.updateSettings(settingsForm);
      await fetchSettings();
      playSuccessBeep();
      showNotification('Impostazioni e credenziali salvate con successo!');
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio impostazioni');
    }
  };

  // Handle Kiosk Config Update
  const handleUpdateKiosk = async (patch: Partial<KioskSettings>) => {
    try {
      const updated = { ...kioskConfig, ...patch };
      setKioskConfig(updated);
      await api.updateKioskSettings(patch);
      showNotification('Configurazione Kiosk aggiornata!');
    } catch (err) {
      alert('Errore salvataggio kiosk');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadAdminData();
      showNotification(`Stato ordine aggiornato a: ${newStatus}`);
    } catch (err) {
      alert('Errore aggiornamento ordine');
    }
  };

  // Handle Restore Subscriptions
  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const lic = await api.getLicenseInfo();
      setLicenseData(lic);
      showNotification('Stato abbonamento Google Play verificato e aggiornato!');
    } catch (err) {
      alert('Impossibile verificare lo stato abbonamento.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Trial
  const handleResetTrial = async () => {
    try {
      const res = await api.resetTrialLicense();
      setLicenseData(res);
      showNotification('Periodo di prova ripristinato (30 giorni)');
    } catch (err) {
      alert('Errore ripristino prova');
    }
  };

  // Handle Save Topology
  const handleSaveTopology = async (patch: Partial<StationTopologyConfig>) => {
    try {
      const updated = { ...stationTopology, ...patch };
      setStationTopology(updated);
      await api.updateStationTopology(patch);
      await useStore.getState().fetchStationTopology();
      playSuccessBeep();
      showNotification('Topologia di rete della postazione aggiornata!');
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio topologia');
    }
  };

  // Scan LAN for Masters
  const handleScanLan = async () => {
    try {
      setIsScanningLan(true);
      const list = await api.scanLanMasters();
      setLanMasters(list);
      playSuccessBeep();
      showNotification(`Scansione completata: trovati ${list.length} dispositivi in LAN`);
    } catch (err: any) {
      alert('Errore durante la scansione LAN');
    } finally {
      setIsScanningLan(false);
    }
  };

  // Sync Satellite with Master
  const handleSyncSatellite = async (ipTarget?: string) => {
    try {
      setIsSyncingMaster(true);
      const targetIp = ipTarget || stationTopology.master_server_ip;
      const res = await api.syncSatelliteWithMaster(targetIp);
      if (res.success) {
        await loadAdminData();
        await useStore.getState().fetchProducts();
        await useStore.getState().fetchCategories();
        await useStore.getState().fetchPrinters();
        playSuccessBeep();
        showNotification(
          `Sincronizzazione completata! Ricevuti ${res.productsCount} prodotti e ${res.categoriesCount} categorie dal Master.`
        );
      } else {
        alert(res.message || 'Errore sincronizzazione con Master');
      }
    } catch (err: any) {
      alert(err.message || 'Impossibile contattare il Totem Master');
    } finally {
      setIsSyncingMaster(false);
    }
  };

  // Save Printer Device
  const handleSavePrinter = async () => {
    if (!editingPrinter) return;
    try {
      let updatedList: PrinterDevice[];
      if (editingPrinter.id) {
        updatedList = adminPrinters.map((p) =>
          p.id === editingPrinter.id ? ({ ...p, ...editingPrinter } as PrinterDevice) : p
        );
      } else {
        const newP: PrinterDevice = {
          id: `prn-${Date.now()}`,
          name: editingPrinter.name || 'Nuova Stampante',
          department: editingPrinter.department || 'Cucina',
          type: editingPrinter.type || 'tcp_raw',
          connection_string: editingPrinter.connection_string || '192.168.1.200:9100',
          paper_width: editingPrinter.paper_width || '80mm',
          is_courtesy: editingPrinter.is_courtesy ?? false,
          is_kitchen: editingPrinter.is_kitchen ?? true,
          assigned_category_ids: editingPrinter.assigned_category_ids || [],
          enabled: editingPrinter.enabled ?? true,
        };
        updatedList = [...adminPrinters, newP];
      }
      setAdminPrinters(updatedList);
      await api.savePrinters(updatedList);
      await useStore.getState().fetchPrinters();
      setEditingPrinter(null);
      playSuccessBeep();
      showNotification('Stampante salvata con successo!');
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio stampante');
    }
  };

  // Delete Printer
  const handleDeletePrinter = async (id: string) => {
    if (!confirm('Eliminare questa stampante?')) return;
    try {
      const updated = adminPrinters.filter((p) => p.id !== id);
      setAdminPrinters(updated);
      await api.savePrinters(updated);
      await useStore.getState().fetchPrinters();
      showNotification('Stampante rimossa');
    } catch (err: any) {
      alert('Errore rimozione stampante');
    }
  };

  // Toggle Printer Enabled
  const handleTogglePrinter = async (id: string) => {
    try {
      const updated = adminPrinters.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      );
      setAdminPrinters(updated);
      await api.savePrinters(updated);
      await useStore.getState().fetchPrinters();
      showNotification('Stato stampante aggiornato');
    } catch (err: any) {
      alert('Errore aggiornamento stampante');
    }
  };

  // Test Print
  const handleTestPrint = async (printer: PrinterDevice) => {
    try {
      setTestPrintLoadingId(printer.id);
      const res = await api.testPrintDevice(printer.id);
      playSuccessBeep();
      showNotification(`Test inviato con successo a ${printer.name} (${res.target})`);
    } catch (err: any) {
      alert(err.message || 'Errore test stampa');
    } finally {
      setTestPrintLoadingId(null);
    }
  };

  // Filtered Products
  const filteredProducts = adminProducts.filter((p) => {
    if (prodCatFilter !== 'all' && p.category_id !== prodCatFilter) return false;
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Filtered Orders
  const filteredOrders = adminOrders.filter((o: any) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (kdsDeptFilter !== 'all') {
      const dept = kdsDepartments.find((d) => d.id === kdsDeptFilter);
      const cats = new Set(dept?.assigned_category_ids || []);
      if (cats.size && !(o.items || []).some((it: any) => cats.has(String(it.category_id || it.product_category_id || '')))) return false;
    }
    return true;
  });

  const currentHost = typeof window !== 'undefined' ? window.location.hostname || '127.0.0.1' : '127.0.0.1';
  const currentPort = typeof window !== 'undefined' ? window.location.port || '3000' : '3000';
  const remoteAccessUrl = typeof window !== 'undefined' ? `${window.location.origin}/remote/` : '/remote/';

  // Primary Tabs for Bottom Navigation (Core Catalog & Operations)
  const primaryTabs: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'products', label: 'Prodotti', icon: FastForward, count: adminProducts.length },
    { id: 'categories', label: 'Categorie', icon: Grid, count: adminCategories.length },
    { id: 'groups', label: 'Ingredienti', icon: Layers, count: adminGroups.length },
    {
      id: 'orders',
      label: 'KDS Comande',
      icon: UtensilsCrossed,
      count:
        adminOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length ||
        adminOrders.length,
    },
    { id: 'queue', label: 'Coda', icon: Ticket },
    { id: 'signage', label: 'Vetrina TV', icon: Tv },
  ];

  // Secondary Sections for Slide-over Side Drawer Menu
  const sideDrawerSections: {
    title: string;
    description: string;
    items: { id: AdminTab; label: string; sub: string; icon: any; count?: number; badge?: string }[];
  }[] = [
    {
      title: '📺 Schermi, TV & Reparti',
      description: 'Configura la visualizzazione TV e la gestione cucine',
      items: [
        {
          id: 'signage',
          label: 'Digital Signage & TV',
          sub: 'Vetrina prodotti, animazioni e pubblicità in sala',
          icon: Tv,
          badge: 'Smart TV',
        },
        {
          id: 'queue',
          label: 'Contacoda numerico',
          sub: 'Chiamata ritiro e tabellone sala, sezione separata dalla vetrina',
          icon: Ticket,
        },
        {
          id: 'printers',
          label: 'Multi-Stampanti & Reparti',
          sub: 'Routing comande e stampanti termiche ESC/POS',
          icon: Printer,
          count: adminPrinters.length,
        },
      ],
    },
    {
      title: '🌐 Rete, Totem & Dispositivi',
      description: 'Architettura di rete e controllo postazioni',
      items: [
        {
          id: 'topology',
          label: 'Topologia & Rete Multi-Totem',
          sub: 'Architettura Master/Satellite e sync locale LAN',
          icon: Network,
        },
        {
          id: 'remote',
          label: 'Pannello Remoto Web & QR',
          sub: 'Accesso da smartphone via QR code e URL diretta',
          icon: Smartphone,
          badge: 'Mobile',
        },
        {
          id: 'kiosk',
          label: 'Controllo Kiosk & Hardware',
          sub: 'Blocco schermo, timeout, screensaver e tap segreti',
          icon: Monitor,
        },
      ],
    },
    {
      title: '⚙️ Configurazione & Sistema',
      description: 'Impostazioni generali, licenze e sicurezza',
      items: [
        {
          id: 'settings',
          label: 'Dati Locale & Numerazione',
          sub: 'Intestazione scontrino, orari, valuta e reset comande',
          icon: SettingsIcon,
        },
        {
          id: 'license',
          label: 'Licenza & Multi-Postazione',
          sub: 'Piano Google Play, postazioni autorizzate e ID hardware',
          icon: ShieldCheck,
        },
        {
          id: 'compliance',
          label: 'Sicurezza, PIN & Privacy',
          sub: 'Modifica credenziali, PIN master e recovery code',
          icon: Shield,
        },
        {
          id: 'guide',
          label: 'Guida Operativa & Manuale',
          sub: 'Manuale completo, risoluzione problemi e istruzioni',
          icon: BookOpen,
        },
      ],
    },
  ];

  const isSecondaryActive = !primaryTabs.some((t) => t.id === tab);
  const activeSecondaryItem = sideDrawerSections
    .flatMap((s) => s.items)
    .find((item) => item.id === tab);

  const getTabTitleInfo = (currentTab: AdminTab) => {
    switch (currentTab) {
      case 'products':
        return { title: 'Gestione Catalogo & Prodotti', sub: 'Crea, modifica prezzi, allergeni e disponibilità piatti' };
      case 'categories':
        return { title: 'Gestione Categorie & Menù', sub: 'Ordina e organizza le categorie del menù visualizzate al cliente' };
      case 'groups':
        return { title: 'Gruppi Opzioni & Ingredienti', sub: 'Personalizzazioni, varianti, salse ed esclusioni' };
      case 'orders':
        return { title: 'Monitor Comande & KDS Cucina', sub: 'Flusso ordini in tempo reale, avanzamento stato e ristampa' };
      case 'queue':
        return { title: 'Contacoda numerico', sub: 'Chiamata ritiro in sala — sezione separata dal Digital Signage' };
      case 'signage':
        return { title: 'Digital Signage & Vetrina Smart TV', sub: 'Carosello prodotti, animazioni Ken Burns/Slide/Fade e pubblicità in evidenza' };
      case 'printers':
        return { title: 'Configurazione Multi-Stampanti & Reparti', sub: 'Routing comande per cucina, bar, pizzeria e cassa' };
      case 'topology':
        return { title: 'Topologia & Rete Multi-Totem LAN', sub: 'Architettura Master/Satellite e sincronizzazione cassa locale' };
      case 'kiosk':
        return { title: 'Controllo Kiosk & Blocco Hardware', sub: 'Timeout inattività, screensaver video, blocco uscite e tap segreti' };
      case 'settings':
        return { title: 'Impostazioni Totem & Numerazione', sub: 'Intestazione ricevute, orari del locale e modalità reset ordine' };
      case 'license':
        return { title: 'Licenza & Multi-Postazione', sub: 'Gestione piano Google Play, hardware ID e postazioni abilitate' };
      case 'compliance':
        return { title: 'Sicurezza, PIN Master & Privacy', sub: 'Modifica credenziali, codice di recupero e conformità locale' };
      case 'remote':
        return { title: 'Pannello Web Remoto & Accesso Smartphone', sub: 'Gestione da cellulare in Wi-Fi e collegamenti rapidi LAN' };
      case 'guide':
        return { title: 'Guida Operativa & Manuale Utente', sub: 'Procedure rapide, risoluzione problemi e istruzioni per lo staff' };
      default:
        return { title: 'Pannello Amministratore', sub: 'Configurazione totem e gestione locale' };
    }
  };

  const titleInfo = getTabTitleInfo(tab);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-zinc-950 p-4 sm:p-8 max-w-7xl mx-auto text-white pb-32">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
              Pannello Totem Unificato
            </span>
            <span className="text-[11px] font-bold text-zinc-500">v2.0 • Local-First</span>
            {isSecondaryActive && activeSecondaryItem && (
              <span className="text-[11px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span>⚙️ {activeSecondaryItem.label}</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            {titleInfo.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            {titleInfo.sub}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-2 py-1 flex items-center">
            <LanguageSelector compact mode="persistent" />
          </div>
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizza</span>
          </button>
          <button
            onClick={() => {
              setIsSettingsMenuOpen(true);
              playBeep(880, 0.05);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
              isSecondaryActive
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
            <span>Menu Impostazioni</span>
            {isSecondaryActive && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
          <button
            onClick={logoutAdmin}
            className="px-3.5 py-2.5 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/40 text-rose-400 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Esci</span>
          </button>
        </div>
      </div>

      {/* Floating Status Notification */}
      <AnimatePresence>
        {statusNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 shadow-lg shadow-emerald-950/20"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{statusNotice.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Drawer: Slide-Over Settings & Advanced Tools */}
      <AnimatePresence>
        {isSettingsMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Menu Impostazioni & Strumenti</h3>
                    <p className="text-[11px] text-zinc-400">Configurazioni avanzate, schermi e hardware</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsMenuOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                  aria-label="Chiudi menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-10">
                {sideDrawerSections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-2.5">
                    <div className="px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400">
                        {section.title}
                      </span>
                      <p className="text-[11px] text-zinc-500">{section.description}</p>
                    </div>

                    <div className="space-y-1.5">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isSelected = tab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setTab(item.id);
                              setIsSettingsMenuOpen(false);
                              playBeep(880, 0.05);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-rose-600/15 border-rose-500/50 text-white shadow-md'
                                : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2 rounded-xl flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold truncate text-white">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                                      {item.badge}
                                    </span>
                                  )}
                                  {typeof item.count === 'number' && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-full font-bold">
                                      {item.count}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{item.sub}</p>
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                                isSelected ? 'text-rose-400 translate-x-0.5' : 'text-zinc-600'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between">
                <div className="text-[11px] text-zinc-500 font-medium">
                  Totem QuickBite Pro • v2.0
                </div>
                <button
                  onClick={logoutAdmin}
                  className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-900/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Esci</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Bar: Ergonomic Fixed Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] px-2 sm:px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  playBeep(800, 0.04);
                }}
                className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
                  isActive
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/25'
                    : 'bg-zinc-900/70 border-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {typeof item.count === 'number' && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 text-[9px] px-1 py-0.2 rounded-full font-black min-w-[14px] text-center ${
                        isActive ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-bold truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th Button: Menu Impostazioni */}
          <button
            onClick={() => {
              setIsSettingsMenuOpen(true);
              playBeep(880, 0.05);
            }}
            className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
              isSecondaryActive
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/25'
                : 'bg-zinc-900/70 border-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <div className="relative">
              {isSecondaryActive && activeSecondaryItem ? (
                <activeSecondaryItem.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {isSecondaryActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-zinc-950 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-bold truncate max-w-full">
              {isSecondaryActive && activeSecondaryItem
                ? activeSecondaryItem.label.split(' ')[0]
                : 'Impostazioni'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRODOTTI */}
      {/* ========================================================= */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Elenco Prodotti ({adminProducts.length})</h3>
              <p className="text-xs text-zinc-400">Gestisci posizioni, ingredienti, prezzi, varianti ed extra</p>
            </div>

            <button
              onClick={() =>
                setEditingProduct({
                  name: '',
                  description: '',
                  price: 6.5,
                  category_id: adminCategories[0]?.id || 'cat-1',
                  is_available: true,
                  available: true,
                  product_type: 'simple',
                  base_ingredients: ['Pane', 'Carne', 'Salsa'],
                  extra_additions: [{ name: 'Extra Formaggio', price: 1.0 }],
                  order_position: adminProducts.length + 1,
                  allergens: [],
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Prodotto</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              placeholder="🔍 Cerca prodotto o ingrediente..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
            <select
              value={prodCatFilter}
              onChange={(e) => setProdCatFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">Tutte le Categorie ({adminProducts.length})</option>
              {adminCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p, idx) => {
              const catName = adminCategories.find((c) => c.id === p.category_id)?.name || 'Generale';
              return (
                <div
                  key={p.id}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex flex-col justify-between gap-4 hover:border-zinc-700 transition-all shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-2xl bg-zinc-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-xs text-zinc-600 flex-shrink-0 font-bold">
                        #{p.order_position ?? idx + 1}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-white text-base truncate">{p.name}</h4>
                        <span className="font-black text-rose-400 text-sm">€{p.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{p.description}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md font-semibold">
                          {catName}
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono">
                          Pos: {p.order_position ?? idx + 1}
                        </span>
                        {p.product_type === 'combo' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md">
                            Combo
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            p.is_available !== false && p.available !== false
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {p.is_available !== false && p.available !== false ? 'Disponibile' : 'Esaurito'}
                        </span>
                        {(p.is_featured || p.isFeatured) && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Screensaver</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newFeatured = !(p.is_featured ?? p.isFeatured);
                          await api.updateProduct(p.id, { is_featured: newFeatured, isFeatured: newFeatured });
                          await loadAdminData();
                        }}
                        className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${
                          p.is_featured || p.isFeatured
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30'
                        }`}
                        title={p.is_featured || p.isFeatured ? 'In rotazione screensaver (Clicca per togliere)' : 'Aggiungi a screensaver pubblicità'}
                      >
                        <Star className={`w-3.5 h-3.5 ${p.is_featured || p.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleMoveProductPosition(p.id, -1)}
                        disabled={idx === 0}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300"
                        title="Sposta Su"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveProductPosition(p.id, 1)}
                        disabled={idx === filteredProducts.length - 1}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300"
                        title="Sposta Giù"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingProduct({ ...p })}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifica</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CATEGORIE */}
      {/* ========================================================= */}
      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Categorie Menù ({adminCategories.length})</h3>
              <p className="text-xs text-zinc-400">Ordina la sequenza di visualizzazione delle categorie nel totem</p>
            </div>
            <button
              onClick={() =>
                setEditingCategory({
                  name: '',
                  description: '',
                  order_position: adminCategories.length + 1,
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Categoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminCategories.map((c, idx) => (
              <div
                key={c.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold">
                      #{c.order_position ?? idx + 1}
                    </span>
                    <h4 className="font-extrabold text-white text-base">{c.name}</h4>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{c.description || 'Nessuna descrizione'}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveCategoryPosition(c.id, -1)}
                    disabled={idx === 0}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-xl text-zinc-300"
                    title="Sposta Su"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveCategoryPosition(c.id, 1)}
                    disabled={idx === adminCategories.length - 1}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-xl text-zinc-300"
                    title="Sposta Giù"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingCategory({ ...c })}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GRUPPI & INGREDIENTI */}
      {/* ========================================================= */}
      {tab === 'groups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Gruppi Varianti & Ingredienti ({adminGroups.length})</h3>
              <p className="text-xs text-zinc-400">Configura ordine di visualizzazione per salse a scelta, cotture ed extra</p>
            </div>
            <button
              onClick={() =>
                setEditingGroup({
                  name: '',
                  title: '',
                  type: 'free_chips',
                  chips: ['Opzione 1', 'Opzione 2'],
                  min_selection: 0,
                  max_selection: 2,
                  order_position: adminGroups.length + 1,
                })
              }
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Gruppo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminGroups.map((g, idx) => (
              <div
                key={g.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-4 hover:border-zinc-700 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold">
                        #{g.order_position ?? idx + 1}
                      </span>
                      <h4 className="font-extrabold text-white text-base">{g.name}</h4>
                    </div>
                    <p className="text-xs text-zinc-400">{g.title || 'Titolo non specificato'}</p>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md mt-1 inline-block">
                      Tipo: {g.type}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveGroupPosition(g.id, -1)}
                      disabled={idx === 0}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-xl text-zinc-300"
                      title="Sposta Su"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveGroupPosition(g.id, 1)}
                      disabled={idx === adminGroups.length - 1}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-xl text-zinc-300"
                      title="Sposta Giù"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingGroup({ ...g })}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {g.chips && g.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {g.chips.map((chip, chipIdx) => (
                      <span
                        key={chipIdx}
                        className="text-[11px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {g.extras && g.extras.length > 0 && (
                  <div className="space-y-1 text-xs">
                    {g.extras.map((ex, exIdx) => (
                      <div key={exIdx} className="flex justify-between text-zinc-300">
                        <span>{ex.name}</span>
                        <span className="font-bold text-rose-400">+€{ex.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: COMANDE & KDS */}
      {/* ========================================================= */}
      {tab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Comande & Monitor KDS ({adminOrders.length})</h3>
              <p className="text-xs text-zinc-400">Visualizza tutte le comande ricevute e gestisci gli stati</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 self-start sm:self-auto overflow-x-auto">
              {['all', 'pending', 'preparing', 'ready', 'completed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    orderFilter === f
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tutti' : f}
                </button>
              ))}
            </div>
          </div>

          {kdsDepartments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              <button onClick={() => setKdsDeptFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${kdsDeptFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Tutti i reparti</button>
              {kdsDepartments.map((d) => (
                <button key={d.id} onClick={() => setKdsDeptFilter(d.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${kdsDeptFilter === d.id ? 'bg-amber-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>{d.name}</button>
              ))}
            </div>
          )}

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl">
              <UtensilsCrossed className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="font-bold text-zinc-300">Nessuna comanda trovata</h4>
              <p className="text-xs text-zinc-500 mt-1">Le nuove comande inviate dal totem appariranno qui in tempo reale</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((ord: any) => (
                <div
                  key={ord.id}
                  className={`bg-zinc-900 border p-5 rounded-3xl space-y-4 shadow-lg ${
                    ord.status === 'pending'
                      ? 'border-amber-500/40'
                      : ord.status === 'preparing'
                      ? 'border-blue-500/40'
                      : ord.status === 'ready'
                      ? 'border-emerald-500/40'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Comanda</span>
                      <h4 className="text-2xl font-black text-rose-500">
                        #{String(ord.order_number).padStart(3, '0')}
                      </h4>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                        ord.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : ord.status === 'preparing'
                          ? 'bg-blue-500/20 text-blue-400'
                          : ord.status === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {ord.order_type === 'number-only' ? (
                      <div className="p-3 bg-amber-500/10 text-amber-300 rounded-xl font-bold">
                        Ticket Solo Numero (ordinazione in cassa)
                      </div>
                    ) : (
                      ord.items?.map((it: any, i: number) => (
                        <div key={i} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                          <span className="font-bold text-white">
                            <span className="text-rose-400 mr-1">{it.quantity}x</span> {it.product_name}
                          </span>
                          {it.removed_ingredients && it.removed_ingredients.length > 0 && (
                            <p className="text-[11px] text-rose-400 font-medium">
                              Senza: {it.removed_ingredients.join(', ')}
                            </p>
                          )}
                          {it.added_extras && it.added_extras.length > 0 && (
                            <p className="text-[11px] text-emerald-400 font-medium">
                              + {it.added_extras.map((e: any) => e.name).join(', ')}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-800">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Inizia Preparazione</span>
                      </button>
                    )}
                    {ord.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Segna Pronto</span>
                      </button>
                    )}
                    {ord.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                        className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>Completa</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: TOPOLOGIA & RETE TOTEM (MONO / MULTI TOTEM) */}
      {/* ========================================================= */}
      {tab === 'topology' && (
        <div className="space-y-6 max-w-5xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                Multi-Postazione & Rete Locale
              </span>
              <span className="text-xs text-zinc-400">Architettura Master / Satellite</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Topologia di Rete & Configurazione Postazioni
            </h3>
            <p className="text-xs text-zinc-400">
              Configura questa postazione come Totem Singolo (Mono), Totem Master (Coordinatore LAN e Licenza Play Store) o Totem Satellite.
            </p>
          </div>

          {/* Topology Role Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'mono' as StationRole,
                title: 'Mono Totem Autonomo',
                desc: 'Unica postazione kiosk. Gestisce catalogo, ordini, KDS e stampe in locale.',
                icon: Store,
                badge: 'Default Singolo',
                color: 'zinc',
              },
              {
                id: 'master' as StationRole,
                title: 'Totem Master (Server LAN)',
                desc: 'Totem Principale / Cassa. Contiene la licenza Google Play, coordina i Satelliti e sincronizza i dati.',
                icon: Server,
                badge: 'Master Coordina Rete',
                color: 'rose',
              },
              {
                id: 'satellite' as StationRole,
                title: 'Totem Satellite (Client LAN)',
                desc: 'Postazione secondaria kiosk o cassa rapida. Eredita licenza, catalogo e sincronizza le comande.',
                icon: Laptop,
                badge: 'Satellite Senza Limiti',
                color: 'cyan',
              },
            ].map((roleOpt) => {
              const isSelected = stationTopology.role === roleOpt.id;
              const IconComp = roleOpt.icon;
              return (
                <div
                  key={roleOpt.id}
                  onClick={() => handleSaveTopology({ role: roleOpt.id })}
                  className={`cursor-pointer p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-rose-500 shadow-xl shadow-rose-950/30 ring-2 ring-rose-500/20'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-3 rounded-2xl ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {roleOpt.badge}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-base text-white">{roleOpt.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{roleOpt.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-500">Stato:</span>
                    <span
                      className={`font-black ${
                        isSelected ? 'text-emerald-400 flex items-center gap-1' : 'text-zinc-500'
                      }`}
                    >
                      {isSelected ? '✓ Selezionato' : 'Inattivo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Station Identity & Prefix Settings */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Identificativo Postazione & Prefisso Comande</h4>
                <p className="text-xs text-zinc-400">Personalizza il nome del totem e il prefisso numerazione ordini</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">ID Univoco Postazione</label>
                <input
                  type="text"
                  value={stationTopology.station_id}
                  onChange={(e) => setStationTopology({ ...stationTopology, station_id: e.target.value })}
                  onBlur={() => handleSaveTopology({ station_id: stationTopology.station_id })}
                  placeholder="TOTEM-01"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Nome Descrittivo Postazione</label>
                <input
                  type="text"
                  value={stationTopology.station_name}
                  onChange={(e) => setStationTopology({ ...stationTopology, station_name: e.target.value })}
                  onBlur={() => handleSaveTopology({ station_name: stationTopology.station_name })}
                  placeholder="Totem Cassa 1"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white text-sm font-semibold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Prefisso Numero Ordine (Opzionale)
                </label>
                <input
                  type="text"
                  value={stationTopology.order_prefix || ''}
                  onChange={(e) => setStationTopology({ ...stationTopology, order_prefix: e.target.value })}
                  onBlur={() => handleSaveTopology({ order_prefix: stationTopology.order_prefix })}
                  placeholder="Es. T1- oppure CASSA-"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Es. "T1-042" per distinguere la postazione</span>
              </div>
            </div>
          </div>

          {/* Master Connection & Sync Section (for Satellites & Network Discovery) */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">Connessione al Totem Master in LAN</h4>
                  <p className="text-xs text-zinc-400">
                    Indirizzo IP del Master per sincronizzazione catalogo e stato licenza Google Play
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleScanLan}
                  disabled={isScanningLan}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningLan ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{isScanningLan ? 'Scansione in corso...' : '🔍 Cerca Master in Rete (LAN)'}</span>
                </button>

                <button
                  onClick={() => handleSyncSatellite()}
                  disabled={isSyncingMaster}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMaster ? 'animate-spin' : ''}`} />
                  <span>{isSyncingMaster ? 'Sincronizzazione...' : '🔄 Sincronizza Adesso'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-400 mb-1">Indirizzo IP del Totem Master (LAN)</label>
                <input
                  type="text"
                  value={stationTopology.master_server_ip}
                  onChange={(e) => setStationTopology({ ...stationTopology, master_server_ip: e.target.value })}
                  onBlur={() => handleSaveTopology({ master_server_ip: stationTopology.master_server_ip })}
                  placeholder="192.168.1.100"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Porta HTTP Server</label>
                <input
                  type="number"
                  value={stationTopology.master_server_port}
                  onChange={(e) =>
                    setStationTopology({ ...stationTopology, master_server_port: Number(e.target.value) || 3000 })
                  }
                  onBlur={() => handleSaveTopology({ master_server_port: stationTopology.master_server_port })}
                  placeholder="3000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-mono text-sm font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* LAN Discovered Nodes */}
            {lanMasters.length > 0 && (
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-400 block">Dispositivi Rilevati sulla Rete Locale:</span>
                <div className="space-y-2">
                  {lanMasters.map((node, i) => (
                    <div
                      key={i}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Server className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-xs font-bold text-white">{node.name}</p>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {node.ip}:{node.port} {node.is_master ? '• (Master)' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleSaveTopology({ master_server_ip: node.ip, master_server_port: node.port });
                          handleSyncSatellite(node.ip);
                        }}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 rounded-lg text-xs font-bold transition-all"
                      >
                        Collega & Sincronizza
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: MULTI-STAMPANTI & ROUTING REPARTI */}
      {/* ========================================================= */}
      {tab === 'printers' && (
        <div className="space-y-6 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                  Multi-Stampanti Illimitate
                </span>
                <span className="text-xs text-zinc-400">ESC/POS • Termiche TCP/IP & USB</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                Gestione Stampanti Termiche & Routing Reparti
              </h3>
              <p className="text-xs text-zinc-400">
                Collega quante stampanti desideri (Cucina, Pizzeria, Bar, Griglieria, Cassa Cortesia) e assegna a ciascuna le proprie categorie.
              </p>
            </div>

            <button
              onClick={() =>
                setEditingPrinter({
                  name: 'Nuova Stampante',
                  department: 'Cucina',
                  type: 'tcp_raw',
                  connection_string: '192.168.1.200:9100',
                  paper_width: '80mm',
                  is_kitchen: true,
                  is_courtesy: false,
                  assigned_category_ids: [],
                  enabled: true,
                })
              }
              className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-rose-950/40 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Stampante</span>
            </button>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-start gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 mt-0.5">
              <Printer className="w-5 h-5" />
            </div>
            <div className="text-xs text-zinc-300 space-y-1">
              <p className="font-bold text-white">Come funziona il routing delle stampanti e dei KDS:</p>
              <p className="text-zinc-400 leading-relaxed">
                Ogni stampante è associata a un <strong>Reparto</strong> e alle relative <strong>Categorie</strong> di prodotti. All'emissione di un ordine, il sistema invia la stampa termica solo alla stampante competente (es. le pizze al Forno, le bibite al Bar) e contemporaneamente sincronizza la scheda sul KDS di quel reparto.
              </p>
            </div>
          </div>

          {/* Printers List */}
          {adminPrinters.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
              <Printer className="w-12 h-12 text-zinc-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Nessuna Stampante Configurato</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Aggiungi la tua prima stampante termica di rete (porta 9100 Raw ESC/POS) o USB/Sunmi per abilitare la stampa automatica delle comande.
              </p>
              <button
                onClick={() =>
                  setEditingPrinter({
                    name: 'Stampante Cucina Principale',
                    department: 'Cucina',
                    type: 'tcp_raw',
                    connection_string: '192.168.1.200:9100',
                    paper_width: '80mm',
                    is_kitchen: true,
                    is_courtesy: false,
                    assigned_category_ids: [],
                    enabled: true,
                  })
                }
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                + Configura Stampante Default
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminPrinters.map((prn) => {
                const assignedCats = adminCategories.filter((c) =>
                  (prn.assigned_category_ids || []).includes(c.id)
                );
                return (
                  <div
                    key={prn.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                      prn.enabled
                        ? 'bg-zinc-900 border-zinc-800 shadow-md'
                        : 'bg-zinc-900/40 border-zinc-850 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-rose-500">
                            <Printer className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-white text-base">{prn.name}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                                {prn.paper_width}
                              </span>
                            </div>
                            <p className="text-xs text-rose-400 font-bold mt-0.5">
                              Reparto: {prn.department}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTogglePrinter(prn.id)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all border ${
                            prn.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          {prn.enabled ? 'Attiva' : 'Disattivata'}
                        </button>
                      </div>

                      <div className="mt-4 p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Connessione:</span>
                          <span className="font-mono text-zinc-300 font-bold">{prn.connection_string}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Tipo Protocollo:</span>
                          <span className="font-bold text-zinc-300 uppercase">{prn.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Ruolo Stampa:</span>
                          <span className="font-bold text-zinc-300">
                            {prn.is_kitchen && prn.is_courtesy
                              ? 'Comande Cucina + Scontrino Cortesia'
                              : prn.is_kitchen
                              ? 'Comande Cucina / Reparto'
                              : 'Solo Scontrino Cortesia'}
                          </span>
                        </div>
                      </div>

                      {/* Assigned Categories */}
                      <div className="mt-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block mb-1.5">
                          Categorie Prodotti Assegnate:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {assignedCats.length === 0 ? (
                            <span className="text-[11px] text-zinc-500 italic">
                              Tutte le categorie (Default fallback)
                            </span>
                          ) : (
                            assignedCats.map((cat) => (
                              <span
                                key={cat.id}
                                className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-300"
                              >
                                {cat.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTestPrint(prn)}
                        disabled={testPrintLoadingId === prn.id}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-700"
                      >
                        <Receipt className="w-3.5 h-3.5 text-rose-400" />
                        <span>{testPrintLoadingId === prn.id ? 'Invio in corso...' : 'Test Stampa'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingPrinter(prn)}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePrinter(prn.id)}
                          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-white">Reparti KDS</h4>
                <p className="text-xs text-zinc-400">Ogni reparto filtra le comande per categoria e ha un URL LAN dedicato.</p>
              </div>
            </div>
            {kdsDepartments.map((dept) => (
              <div key={dept.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{dept.name}</span>
                  <button
                    className="text-rose-400 text-xs font-bold"
                    onClick={async () => {
                      const next = kdsDepartments.filter((d) => d.id !== dept.id);
                      setKdsDepartments(next);
                      await fetch('/api/admin/department-kds', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(next) }).catch(() => {});
                    }}
                  >
                    Elimina
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {adminCategories.map((cat) => {
                    const on = (dept.assigned_category_ids || []).includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${on ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                        onClick={async () => {
                          const ids = on ? (dept.assigned_category_ids || []).filter((id) => id !== cat.id) : [...(dept.assigned_category_ids || []), cat.id];
                          const next = kdsDepartments.map((d) => d.id === dept.id ? { ...d, assigned_category_ids: ids } : d);
                          setKdsDepartments(next);
                          await fetch('/api/admin/department-kds', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(next) }).catch(() => {});
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                <code className="block text-[11px] text-sky-400 break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/kitchen/?department={dept.id}</code>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newKdsName} onChange={(e) => setNewKdsName(e.target.value)} placeholder="Es. Pizzeria" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              <button
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                onClick={async () => {
                  if (!newKdsName.trim()) return;
                  const next = [...kdsDepartments, { id: 'kds_' + Date.now().toString(36), name: newKdsName.trim(), assigned_category_ids: [] }];
                  setKdsDepartments(next);
                  setNewKdsName('');
                  await fetch('/api/admin/department-kds', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(next) }).catch(() => {});
                }}
              >
                + Reparto
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === 'kiosk' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-bold text-white">Controllo Totem Kiosk & Hardware</h3>
            <p className="text-xs text-zinc-400">
              Parametri hardware del totem, orientamento, indirizzi di rete e diagnostica
            </p>
          </div>

          {/* Network IP & Diagnostic Status Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base">Diagnostica Indirizzo IP & Rete</h4>
                <p className="text-xs text-zinc-400">Indirizzo IP per accesso e configurazione locale</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Indirizzo Host / IP</span>
                <code className="text-sm text-emerald-400 font-mono font-bold mt-1 block">
                  {currentHost}
                </code>
                <span className="text-[11px] text-zinc-400">Porta: {currentPort}</span>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Pannello Remoto LAN</span>
                <code className="text-xs text-rose-400 font-mono font-bold mt-1 block truncate">
                  {remoteAccessUrl}
                </code>
                <span className="text-[11px] text-zinc-400">Accesso wireless</span>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Stato Modalità Kiosk</span>
                <span className="text-xs text-emerald-400 font-bold mt-1 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Attivo & Protetto
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Local-First Sandbox</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blocco Schermo & Kiosk Mode */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">Modalità Kiosk & Blocco Task</h4>
                  <p className="text-xs text-zinc-400">Nasconde la navigation bar e blocca l'uscita</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-300">Stato Blocco Kiosk</span>
                <button
                  onClick={() => handleUpdateKiosk({ kiosk_enabled: !kioskConfig.kiosk_enabled })}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    kioskConfig.kiosk_enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {kioskConfig.kiosk_enabled ? '🔒 Attivo' : '🔓 Disattivato'}
                </button>
              </div>

              {/* Secret Taps Settings */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-zinc-400">
                  Trigger Tocco Segreto per Admin (Numero Tocchi)
                </label>
                <div className="flex gap-2">
                  {[5, 7, 10].map((taps) => (
                    <button
                      key={taps}
                      onClick={() => handleUpdateKiosk({ secret_taps_count: taps })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                        kioskConfig.secret_taps_count === taps
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {taps} Tocchi
                    </button>
                  ))}
                </div>
              </div>

              {/* Touch Position */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-400">Posizione Tocco Segreto</label>
                <div className="flex gap-2">
                  {[
                    { id: 'top-right', label: 'In alto a destra' },
                    { id: 'top-center', label: 'In alto al centro' },
                    { id: 'top-left', label: 'In alto a sinistra' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => handleUpdateKiosk({ secret_taps_position: pos.id as any })}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                        kioskConfig.secret_taps_position === pos.id
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orientamento & Screensaver */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">Display, Audio & Risparmio</h4>
                  <p className="text-xs text-zinc-400">Orientamento schermo, timeout salvaschermo e audio beep</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400">Orientamento Schermo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateKiosk({ screen_orientation: 'portrait' })}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center gap-2 ${
                      kioskConfig.screen_orientation === 'portrait'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>Verticale (Totem)</span>
                  </button>
                  <button
                    onClick={() => handleUpdateKiosk({ screen_orientation: 'landscape' })}
                    className={`py-3 rounded-2xl text-xs font-extrabold transition-all border flex items-center justify-center gap-2 ${
                      kioskConfig.screen_orientation === 'landscape'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>Orizzontale (Tablet)</span>
                  </button>
                </div>
              </div>

              {/* Screensaver Timeout */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400">Timeout Salvaschermo Inattività</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 3, 5, 10].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleUpdateKiosk({ screensaver_timeout_minutes: mins })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        kioskConfig.screensaver_timeout_minutes === mins
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Test Tool Buttons */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-zinc-400">Test Strumenti Hardware</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      playBeep(880, 200);
                      showNotification('Segnale acustico riprodotto con successo!');
                    }}
                    className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white"
                  >
                    <Volume2 className="w-4 h-4 text-rose-500" />
                    <span>Test Beep Acustico</span>
                  </button>
                  <button
                    onClick={() => setIsTestScreensaverOpen(true)}
                    className="p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white"
                  >
                    <Moon className="w-4 h-4 text-purple-400" />
                    <span>Test Salvaschermo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: IMPOSTAZIONI & NUMERAZIONE */}
      {/* ========================================================= */}
      {tab === 'settings' && (
        <div className="max-w-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Impostazioni Ristorante & Numerazione</h3>
            <p className="text-xs text-zinc-400">Parametri di base, KDS display, azzeramento ordini e stampanti termiche</p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Nome Ristorante</label>
              <input
                type="text"
                value={settingsForm.restaurant_name || ''}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, restaurant_name: e.target.value })
                }
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 text-sm font-semibold"
              />
            </div>

            {/* KDS Enable / Disable Toggle */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Monitor Cucina KDS (Comande)</span>
                <span className="text-[11px] text-zinc-400">Abilita o disabilita il display comande della cucina</span>
              </div>
              <button
                onClick={() =>
                  setSettingsForm({
                    ...settingsForm,
                    kitchen_display_enabled: !settingsForm.kitchen_display_enabled,
                  })
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  settingsForm.kitchen_display_enabled !== false
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {settingsForm.kitchen_display_enabled !== false ? 'Attivo' : 'Disattivato'}
              </button>
            </div>

            {/* Order Numbering Configuration */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <span className="text-xs font-bold text-white block">Modalità Numerazione Comande</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSettingsForm({ ...settingsForm, order_reset_mode: 'daily' })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    settingsForm.order_reset_mode !== 'manual'
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Automatico Giornaliero
                </button>
                <button
                  onClick={() => setSettingsForm({ ...settingsForm, order_reset_mode: 'manual' })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    settingsForm.order_reset_mode === 'manual'
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Manuale
                </button>
              </div>

              {settingsForm.order_reset_mode !== 'manual' && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Orario di Azzeramento Automatico Giornaliero
                  </label>
                  <input
                    type="time"
                    value={settingsForm.order_reset_time || '00:00'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, order_reset_time: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-sm"
                  />
                </div>
              )}
            </div>

            {/* Security & Credentials Card */}
            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-500" />
                <h4 className="text-sm font-bold text-white">Sicurezza & Credenziali Amministratore</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Username Amministratore
                  </label>
                  <input
                    type="text"
                    value={settingsForm.admin_username || 'admin'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admin_username: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Nuova Password (opzionale)
                  </label>
                  <input
                    type="password"
                    value={settingsForm.admin_password || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admin_password: e.target.value })
                    }
                    placeholder="Lascia vuoto per non cambiare"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  PIN Amministratore (4 cifre per accesso rapido)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={settingsForm.admin_pin || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, admin_pin: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="Es. 1234"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 font-mono tracking-widest text-center text-lg font-bold"
                />
              </div>

              {/* Recovery Code */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Emergency Recovery Code
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const p1 = Math.floor(1000 + Math.random() * 9000);
                      const p2 = Math.floor(1000 + Math.random() * 9000);
                      setSettingsForm({ ...settingsForm, recovery_code: `TOTEM-REC-${p1}-${p2}` });
                      playBeep(600, 0.06);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Rigenera
                  </button>
                </div>

                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
                  <span className="font-mono font-bold text-white text-xs sm:text-sm tracking-wider">
                    {settingsForm.recovery_code || 'TOTEM-REC-8842-1920'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(settingsForm.recovery_code || 'TOTEM-REC-8842-1920')
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      copiedRecovery
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {copiedRecovery ? (
                      <>
                        <Check className="w-3 h-3" /> Copiato
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copia
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Printing Switches */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Stampa Automatica Ticket Cortesia</span>
                  <span className="text-[11px] text-zinc-400">Rilascia scontrino con numero per il cliente</span>
                </div>
                <button
                  onClick={() =>
                    setSettingsForm({
                      ...settingsForm,
                      auto_print_courtesy: !settingsForm.auto_print_courtesy,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settingsForm.auto_print_courtesy ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {settingsForm.auto_print_courtesy ? 'Attivo' : 'Spento'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <div>
                  <span className="text-xs font-bold text-white block">Stampa Automatica Comanda Cucina</span>
                  <span className="text-[11px] text-zinc-400">Invia ticket direttamente al banco di preparazione</span>
                </div>
                <button
                  onClick={() =>
                    setSettingsForm({
                      ...settingsForm,
                      auto_print_kitchen: !settingsForm.auto_print_kitchen,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settingsForm.auto_print_kitchen !== false ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {settingsForm.auto_print_kitchen !== false ? 'Attivo' : 'Spento'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Salva Modifiche</span>
            </button>

            {/* Dangerous Actions */}
            <div className="pt-6 border-t border-zinc-800 space-y-3">
              <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider">
                Manutenzione & Azzeramento
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    if (confirm('Resettare il contatore ordini a 1?')) {
                      await api.resetOrderNumber(1);
                      playSuccessBeep();
                      showNotification('Contatore numero ordini reimpostato a 1!');
                    }
                  }}
                  className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Azzera Numero Ordini a 1</span>
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Ripristinare il database e i piatti di default?')) {
                      await api.seedDatabase();
                      await loadAdminData();
                      playSuccessBeep();
                      showNotification('Database reinizializzato con successo!');
                    }
                  }}
                  className="py-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-seed Dati Default</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: LICENZA & ABBONAMENTI */}
      {/* ========================================================= */}
      {tab === 'license' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="text-xl font-bold text-white">Licenza & Abbonamenti Google Play</h3>
            <p className="text-xs text-zinc-400">
              Verifica lo stato di attivazione del dispositivo e i piani di sottoscrizione
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-xs text-zinc-400">Dispositivo Hardware</span>
                  <p className="font-mono text-white text-sm font-bold">{licenseData.hardware_id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    licenseData.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {licenseData.status === 'active' ? 'Licenza Attiva' : 'Periodo di Prova'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Piano Attivo:</span>
                  <span className="font-bold text-white">{licenseData.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Scadenza:</span>
                  <span className="font-bold text-white">{licenseData.expiry_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Totem Autorizzati:</span>
                  <span className="font-bold text-white">{licenseData.allowed_totems} Postazione</span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRestorePurchases}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  🔄 Verifica & Ripristina Abbonamento
                </button>
                <button
                  onClick={handleResetTrial}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Ripristina prova (30 giorni)
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <h4 className="font-extrabold text-white text-base">Piani Abbonamento Google Play Store</h4>
              <p className="text-xs text-zinc-400">
                Tutti i piani includono Kiosk, KDS cucina, stampe termiche e controllo remoto LAN.
              </p>
              <div className="space-y-3">
                {[
                  {
                    title: 'Totem Mono',
                    price: '9,99 € / mese',
                    desc: 'Funzioni base: 1 totem, 1 KDS, 2 stampanti, 1 vetrina TV, stampa e backup.',
                    badge: 'Base',
                  },
                  {
                    title: 'Totem Multi',
                    price: '19,99 € / mese',
                    desc: 'Funzioni avanzate: totem, KDS, stampanti e TV illimitati, master/satellite.',
                    badge: 'Avanzato',
                    popular: true,
                  },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border ${
                      plan.popular
                        ? 'bg-rose-950/20 border-rose-500/40 text-white shadow-lg'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm">{plan.title}</h5>
                        {plan.badge && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            plan.popular ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-rose-400 text-xs">{plan.price}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{plan.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: CONFORMITÀ & PRIVACY */}
      {/* ========================================================= */}
      {tab === 'compliance' && (
        <div className="max-w-4xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Conformità Normativa, GDPR & Privacy</h3>
              <p className="text-xs text-zinc-400">Trattamento dati, accessibilità Kiosk e gestione fiscale</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <h4 className="font-bold text-white text-sm">🔒 Protezione Dati Personali (GDPR 2016/679)</h4>
              <p className="text-zinc-400 leading-relaxed">
                Il totem non raccoglie né trasmette dati sensibili dei clienti (nomi, indirizzi email, numeri telefonici o dettagli carte di credito). Ogni comanda è identificata esclusivamente da un numero sequenziale progressivo temporaneo.
              </p>
            </div>

            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <h4 className="font-bold text-white text-sm">🛡️ Cancellazione Automatica Sessione</h4>
              <p className="text-zinc-400 leading-relaxed">
                Dopo l'emissione del ticket o trascorsi 60 secondi di inattività dello schermo, la sessione e il carrello vengono azzerati all'istante per salvaguardare la totale riservatezza del cliente successivo.
              </p>
            </div>

            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <h4 className="font-bold text-white text-sm">🧾 Separazione Fiscale & HACCP</h4>
              <p className="text-zinc-400 leading-relaxed">
                Gli scontrini emessi dal totem fungono da promemoria di cortesia e comande interne per la cucina. La memorizzazione fiscale definitiva e la trasmissione telematica dei corrispettivi sono affidate al Registratore Telematico di cassa.
              </p>
            </div>

            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
              <h4 className="font-bold text-white text-sm">♿ Accessibilità & Contrasto WCAG</h4>
              <p className="text-zinc-400 leading-relaxed">
                Interfaccia progettata con aree di tocco touch minime superiori a 48px, elevato contrasto visivo e traduzione multilingua istantanea in 5 idiomi europei (Italiano, English, Español, Français, Deutsch).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: CONTACODA NUMERICO (sezione separata dal signage)    */}
      {/* ========================================================= */}
      {tab === 'queue' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5">
            <div>
              <h3 className="text-xl font-black text-white">Contacoda numerico</h3>
              <p className="text-xs text-zinc-400 mt-1">La vetrina prodotti e le animazioni sono nella tab Vetrina TV. Qui si chiama il numero di ritiro.</p>
            </div>
            <div className="flex items-center justify-center p-8 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="text-center">
                <span className="text-[11px] uppercase tracking-widest text-zinc-400 block font-bold mb-1">Numero in chiamata</span>
                <div className="text-6xl font-black font-mono text-rose-400">
                  {dqCallingNum != null ? `#${dqCallingNum}` : '—'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateDisplayQueueCalling((dqCallingNum ?? 0) + 1)} className="p-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">+1 Chiama</button>
              <button onClick={() => updateDisplayQueueCalling(Math.max(1, (dqCallingNum ?? 1) - 1))} disabled={!dqCallingNum || dqCallingNum <= 1} className="p-3.5 bg-zinc-800 disabled:opacity-40 text-zinc-200 font-bold rounded-xl text-xs">-1 Prec.</button>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Es. 42" value={dqManualInput} onChange={(e) => setDqManualInput(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono" />
              <button onClick={() => { const n = parseInt(dqManualInput, 10); if (!isNaN(n) && n >= 0) { updateDisplayQueueCalling(n); setDqManualInput(''); } }} className="px-4 py-2.5 bg-zinc-800 text-white font-bold rounded-xl text-xs">Chiama</button>
              <button onClick={() => updateDisplayQueueCalling(null)} className="px-3 py-2.5 text-red-400 border border-red-900/30 font-bold rounded-xl text-xs">Azzera</button>
            </div>
            <div className="text-xs text-zinc-500 font-mono break-all">
              Tabellone: {typeof window !== 'undefined' ? `${window.location.origin}/display-queue/?mode=full` : '/display-queue/?mode=full'}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DIGITAL SIGNAGE & TV DISPLAY QUEUE (15% / 85%)       */}
      {/* ========================================================= */}
      {tab === 'signage' && (() => {
        const dqBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/display-queue/` : '/display-queue/';
        const dqParams = new URLSearchParams();
        if (dqMode === 'products') dqParams.set('mode', 'products');
        if (dqTheme === 'light') dqParams.set('theme', 'light');
        if (dqCols !== 4) dqParams.set('cols', String(dqCols));
        if (!dqHero) dqParams.set('hero', 'false');
        if (!dqDaypart) dqParams.set('daypart', 'false');
        if (dqInterval !== 9000) dqParams.set('rotate', String(dqInterval));
        if (dqLang !== 'it') dqParams.set('lang', dqLang);
        if (dqAnim !== 'kenburns') dqParams.set('anim', dqAnim);
        const dqQueryStr = dqParams.toString();
        const dqGeneratedUrl = dqQueryStr ? `${dqBaseUrl}?${dqQueryStr}` : dqBaseUrl;

        return (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl shadow-inner">
                    <Tv className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-white text-xl">
                        Digital Signage & Segna-Coda Smart TV
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                        Smart TV • Firestick • Android TV
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Visualizzatore sala con striscia superiore segna-coda in tempo reale (15%) e carosello vetrina prodotti dinamico (85%).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(dqGeneratedUrl);
                      showNotification('Link Schermo TV copiato negli appunti!');
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia URL TV</span>
                  </button>
                  <a
                    href={dqGeneratedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-600/25"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Apri Schermo TV Schermo Intero</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Controls & Configuration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Live Calling Controller */}
                <div className="lg:col-span-5 p-5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-300 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                      Controllo Chiamata Sala
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ● Live Sync LAN
                    </span>
                  </div>

                  <div className="flex items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl relative overflow-hidden shadow-inner">
                    <div className="text-center">
                      <span className="text-[11px] uppercase tracking-widest text-zinc-400 block font-bold mb-1">
                        Numero Attualmente in Chiamata
                      </span>
                      <div className="text-5xl font-black font-mono text-white tracking-tight flex items-center justify-center gap-2">
                        {dqCallingNum != null ? (
                          <span className="text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                            #{dqCallingNum}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-normal text-2xl">— In Attesa —</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calling Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateDisplayQueueCalling((dqCallingNum ?? 0) + 1)}
                      className="p-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Chiama Succ. (+1)</span>
                    </button>

                    <button
                      onClick={() => updateDisplayQueueCalling(Math.max(1, (dqCallingNum ?? 1) - 1))}
                      disabled={!dqCallingNum || dqCallingNum <= 1}
                      className="p-3.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span>Precedente (-1)</span>
                    </button>
                  </div>

                  {/* Manual Number Form & Clear */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      placeholder="Imposta n. comanda..."
                      value={dqManualInput}
                      onChange={(e) => setDqManualInput(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <button
                      onClick={() => {
                        const n = parseInt(dqManualInput, 10);
                        if (!isNaN(n) && n > 0) {
                          updateDisplayQueueCalling(n);
                          setDqManualInput('');
                        }
                      }}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      Imposta
                    </button>
                    <button
                      onClick={() => updateDisplayQueueCalling(null)}
                      className="px-3 py-2.5 bg-zinc-900 hover:bg-red-950/40 text-red-400 border border-red-900/30 font-bold rounded-xl text-xs transition-all"
                      title="Azzera chiamata"
                    >
                      Azzera
                    </button>
                  </div>
                </div>

                {/* TV Display Configuration & QR Code */}
                <div className="lg:col-span-7 p-5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl space-y-4">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-zinc-300 block">
                    Parametri & Aspetto Schermo TV
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {/* Mode */}
                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-medium">Layout Display</label>
                      <select
                        value={dqMode}
                        onChange={(e) => setDqMode(e.target.value as 'full' | 'products')}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-medium"
                      >
                        <option value="full">15% Coda + 85% Vetrina</option>
                        <option value="products">Solo Vetrina Prodotti</option>
                      </select>
                    </div>

                    {/* Theme */}
                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-medium">Tema Grafico</label>
                      <select
                        value={dqTheme}
                        onChange={(e) => setDqTheme(e.target.value as 'dark' | 'light')}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-medium"
                      >
                        <option value="dark">Sala scura</option>
                        <option value="light">Sala chiara</option>
                      </select>
                    </div>

                    {/* Columns */}
                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-medium">Griglia Prodotti</label>
                      <select
                        value={dqCols}
                        onChange={(e) => setDqCols(parseInt(e.target.value, 10))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-medium"
                      >
                        <option value={2}>2 Colonne (Verticale)</option>
                        <option value={3}>3 Colonne (Media)</option>
                        <option value={4}>4 Colonne (Standard 16:9)</option>
                        <option value={6}>6 Colonne (UltraWide / 4K)</option>
                      </select>
                    </div>

                    {/* Rotation Interval */}
                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-medium">Rotazione Slide</label>
                      <select
                        value={dqInterval}
                        onChange={(e) => setDqInterval(parseInt(e.target.value, 10))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-medium"
                      >
                        <option value={6000}>6 secondi (Veloce)</option>
                        <option value={9000}>9 secondi (Consigliato)</option>
                        <option value={15000}>15 secondi (Lento)</option>
                        <option value={30000}>30 secondi (Statico)</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-medium">Lingua Schermo</label>
                      <select
                        value={dqLang}
                        onChange={(e) => setDqLang(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-medium"
                      >
                        <option value="it">Italiano (IT)</option>
                        <option value="en">English (EN)</option>
                        <option value="es">Español (ES)</option>
                        <option value="fr">Français (FR)</option>
                        <option value="de">Deutsch (DE)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400 block font-medium">Animazione</label>
                      <select
                        value={dqAnim}
                        onChange={(e) => setDqAnim(e.target.value as 'kenburns' | 'slide' | 'fade')}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-medium"
                      >
                        <option value="kenburns">Cinema (consigliata)</option>
                        <option value="slide">Scorrimento</option>
                        <option value="fade">Dissolvenza</option>
                      </select>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-1 flex flex-col justify-center">
                      <label className="text-zinc-400 block font-medium mb-1">Opzioni Vetrina</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-300 font-medium">
                          <input
                            type="checkbox"
                            checked={dqHero}
                            onChange={(e) => setDqHero(e.target.checked)}
                            className="rounded accent-rose-600 w-4 h-4"
                          />
                          <span>Hero Banner</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-300 font-medium">
                          <input
                            type="checkbox"
                            checked={dqDaypart}
                            onChange={(e) => setDqDaypart(e.target.checked)}
                            className="rounded accent-rose-600 w-4 h-4"
                          />
                          <span>Dayparting</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* QR & TV URL Preview */}
                  <div className="flex items-center gap-4 pt-3 border-t border-zinc-800">
                    <div className="bg-white p-2 rounded-2xl shrink-0 shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                          dqGeneratedUrl
                        )}`}
                        alt="QR Code Display Queue"
                        className="w-16 h-16"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-400 block">
                        URL Smart TV & Firestick (Scansiona QR o incolla nel browser TV)
                      </span>
                      <code className="text-xs text-zinc-300 font-mono mt-1 break-all block bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                        {dqGeneratedUrl}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                    <span>Anteprima Live Schermo TV</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">
                      Risoluzione Automatica 16:9
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Visualizzazione in tempo reale di quanto mostrato sullo schermo in sala o sulla Smart TV.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={dqGeneratedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/20"
                  >
                    <span>Schermo Intero</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="w-full h-[580px] border border-zinc-800 rounded-3xl overflow-hidden bg-black shadow-2xl">
                <iframe src={dqGeneratedUrl} className="w-full h-full border-none" title="Live Display Queue Preview" />
              </div>
            </div>

            {/* Quick Setup Instructions Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>🔥 Amazon Fire TV Stick</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Apri l'app <strong>Amazon Silk Browser</strong> sulla Fire TV, digita l'URL o imposta l'avvio automatico a tutto schermo (Kiosk mode).
                </p>
              </div>

              <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>📺 Smart TV (LG / Samsung / Android)</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Apri il browser integrato nella Smart TV connessa alla stessa rete Wi-Fi/LAN e inserisci l'indirizzo del totem.
                </p>
              </div>

              <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>🍓 Raspberry Pi / PC Mini</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Avvia Chromium in modalità <code>--kiosk</code> all'avvio del sistema puntando all'indirizzo TV del totem master.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* TAB: PANNELLO REMOTO WEB & QR PER SMARTPHONE              */}
      {/* ========================================================= */}
      {tab === 'remote' && (() => {
        const kitchenUrl = typeof window !== 'undefined' ? `${window.location.origin}/kitchen/` : '/kitchen/';
        const hubUrl = typeof window !== 'undefined' ? `${window.location.origin}/hub/` : '/hub/';

        return (
          <div className="space-y-6">
            {/* Header & Quick Status */}
            <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl shadow-inner">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xl">
                      Pannello Web Remoto & Accesso Smartphone
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Accedi all'amministrazione, alle comande e al listino da qualsiasi smartphone o PC connesso alla rete Wi-Fi locale.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(remoteAccessUrl);
                      showNotification('URL Pannello Remoto copiato negli appunti!');
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia Link</span>
                  </button>
                  <a
                    href="/remote/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-600/25"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Apri in nuova scheda</span>
                  </a>
                </div>
              </div>

              {/* QR Code and Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-xl text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        remoteAccessUrl
                      )}`}
                      alt="QR Code Accesso Remoto"
                      className="w-44 h-44 mx-auto"
                    />
                    <span className="text-[10px] font-black uppercase text-zinc-800 block mt-2 tracking-wider">
                      Inquadra con la Fotocamera
                    </span>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 block">
                      Indirizzo di Rete Locale (LAN)
                    </span>
                    <code className="text-sm font-mono text-white block bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-800 break-all font-bold">
                      {remoteAccessUrl}
                    </code>
                    <p className="text-xs text-zinc-400">
                      Dispositivo Master attivo su porta <span className="font-mono text-white font-bold">{currentPort}</span> ({currentHost}).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                      <span className="text-xs font-bold text-white block">📱 Gestione da Smartphone</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Modifica prezzi, disattiva piatti esauriti e visualizza comande in tempo reale.</p>
                    </div>
                    <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                      <span className="text-xs font-bold text-white block">🔒 Nessuna Installazione</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Funziona direttamente tramite Safari o Chrome senza scaricare app terze.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Hub Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">KDS Cucina Web</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">Schermo ordini per reparto cuochi</p>
                </div>
                <a
                  href={kitchenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-bold text-white">Hub Servizi LAN</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">Portale collegamenti e diagnostica</p>
                </div>
                <a
                  href={hubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-bold text-white">Pannello Remoto SPA</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">Gestione prodotti e comande da mobile</p>
                </div>
                <a
                  href="/remote/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Embedded Remote SPA View */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Pannello Web Admin Remoto Completo</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Applicazione reattiva ottimizzata per touch smartphone e tablet.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/remote/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/20"
                  >
                    <span>Apri in nuova scheda</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="w-full h-[650px] border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-950 shadow-2xl">
                <iframe src="/remote/" className="w-full h-full border-none" title="Remote Admin" />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* TAB 10: GUIDA OPERATIVA & MANUALE */}
      {/* ========================================================= */}
      {tab === 'guide' && (
        <div className="space-y-6">
          <GuideHelper embedded />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT PRODUCT */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg space-y-4 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-lg text-white">
              {editingProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-400 font-bold mb-1">Nome Prodotto</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Posizione</label>
                  <input
                    type="number"
                    value={editingProduct.order_position ?? 1}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, order_position: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descrizione</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white resize-none h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Prezzo (€)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Categoria</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category_id: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  >
                    {adminCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">URL Immagine</label>
                <input
                  type="text"
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Ingredienti Base (separati da virgola, es: Pane, Carne, Formaggio)
                </label>
                <input
                  type="text"
                  value={editingProduct.base_ingredients?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      base_ingredients: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Es. Carne, Pomodoro, Salsa"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-bold text-zinc-300">Disponibilità Prodotto</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      ...editingProduct,
                      is_available: !editingProduct.is_available,
                      available: !editingProduct.is_available,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                    editingProduct.is_available !== false
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {editingProduct.is_available !== false ? 'Disponibile' : 'Esaurito'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${editingProduct.is_featured || editingProduct.isFeatured ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'}`} />
                  <div>
                    <span className="font-bold text-zinc-300 text-xs block">Screensaver / Pubblicità</span>
                    <span className="text-[10px] text-zinc-500">Mostra questo prodotto nella rotazione salvaschermo</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !(editingProduct.is_featured || editingProduct.isFeatured);
                    setEditingProduct({
                      ...editingProduct,
                      is_featured: nextVal,
                      isFeatured: nextVal,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                    editingProduct.is_featured || editingProduct.isFeatured
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {editingProduct.is_featured || editingProduct.isFeatured ? '⭐ In Evidenza' : 'Normale'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT CATEGORY */}
      {/* ========================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-white">
              {editingCategory.id ? 'Modifica Categoria' : 'Nuova Categoria'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-400 font-bold mb-1">Nome Categoria</label>
                  <input
                    type="text"
                    value={editingCategory.name || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Posizione</label>
                  <input
                    type="number"
                    value={editingCategory.order_position ?? 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        order_position: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Descrizione</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">URL Immagine</label>
                <input
                  type="text"
                  value={editingCategory.image || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, image: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveCategory}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT OPTION GROUP */}
      {/* ========================================================= */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-white">
              {editingGroup.id ? 'Modifica Gruppo' : 'Nuovo Gruppo Opzioni'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-400 font-bold mb-1">Nome Gruppo Interno</label>
                  <input
                    type="text"
                    value={editingGroup.name || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    placeholder="Es. Salse a Scelta"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Posizione</label>
                  <input
                    type="number"
                    value={editingGroup.order_position ?? 1}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        order_position: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Titolo Visibile al Cliente</label>
                <input
                  type="text"
                  value={editingGroup.title || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, title: e.target.value })}
                  placeholder="Es. Scegli le tue salse preferite"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Opzioni (separate da virgola)</label>
                <input
                  type="text"
                  value={editingGroup.chips?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      chips: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Es. Ketchup, Maionese, BBQ"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Min Selezioni</label>
                  <input
                    type="number"
                    value={editingGroup.min_selection ?? 0}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, min_selection: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Max Selezioni</label>
                  <input
                    type="number"
                    value={editingGroup.max_selection ?? 1}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, max_selection: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingGroup(null)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveGroup}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / CREATE PRINTER */}
      {editingPrinter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingPrinter.id ? 'Modifica Stampante' : 'Nuova Stampante Termica'}
                  </h3>
                  <p className="text-xs text-zinc-400">Configura reparto e instradamento comande</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPrinter(null)}
                className="text-zinc-500 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nome Identificativo Stampante</label>
                <input
                  type="text"
                  value={editingPrinter.name || ''}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                  placeholder="Es. Stampante Pizzeria / Forno"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-semibold text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nome Reparto (KDS / Stampa)</label>
                  <input
                    type="text"
                    value={editingPrinter.department || ''}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, department: e.target.value })}
                    placeholder="Cucina / Bar / Pizza"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-semibold focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Formato Carta</label>
                  <select
                    value={editingPrinter.paper_width || '80mm'}
                    onChange={(e) =>
                      setEditingPrinter({ ...editingPrinter, paper_width: e.target.value as '80mm' | '58mm' })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-semibold focus:border-rose-500 focus:outline-none"
                  >
                    <option value="80mm">80mm (Standard Termico)</option>
                    <option value="58mm">58mm (Compatta / Mobile)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Tipo Connessione / Driver</label>
                <select
                  value={editingPrinter.type || 'tcp_raw'}
                  onChange={(e) =>
                    setEditingPrinter({
                      ...editingPrinter,
                      type: e.target.value as 'tcp_raw' | 'bluetooth' | 'usb' | 'sunmi_internal',
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-semibold focus:border-rose-500 focus:outline-none"
                >
                  <option value="tcp_raw">Ethernet / Wi-Fi (TCP Port 9100 Raw ESC/POS)</option>
                  <option value="sunmi_internal">Sunmi / Android Built-in Stampante Interna</option>
                  <option value="usb">USB Diretta / Seriale Virtuale</option>
                  <option value="bluetooth">Bluetooth ESC/POS</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Stringa di Connessione (IP:Porta o Percorso Device)
                </label>
                <input
                  type="text"
                  value={editingPrinter.connection_string || ''}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, connection_string: e.target.value })}
                  placeholder="Es. 192.168.1.200:9100 oppure built-in"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white font-mono font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Roles Toggles */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 block mb-1">Funzionalità di Stampa:</span>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
                  <input
                    type="checkbox"
                    checked={editingPrinter.is_kitchen ?? true}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, is_kitchen: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Stampa Comande Cucina / Reparto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
                  <input
                    type="checkbox"
                    checked={editingPrinter.is_courtesy ?? false}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, is_courtesy: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Stampa Scontrino di Cortesia / Ricevuta Cliente</span>
                </label>
              </div>

              {/* Categories Assignment Multi-Select */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">
                  Assegna Categorie Prodotti a questa stampante:
                </label>
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 max-h-36 overflow-y-auto space-y-1.5">
                  {adminCategories.map((cat) => {
                    const isChecked = editingPrinter.assigned_category_ids?.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = editingPrinter.assigned_category_ids || [];
                            const updated = e.target.checked
                              ? [...current, cat.id]
                              : current.filter((id) => id !== cat.id);
                            setEditingPrinter({ ...editingPrinter, assigned_category_ids: updated });
                          }}
                          className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-xs font-semibold">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Se non selezioni alcuna categoria, la stampante riceverà tutti i prodotti (modalità globale).
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setEditingPrinter(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSavePrinter}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Salva Stampante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screensaver Test Overlay */}
      <Screensaver
        isActive={isTestScreensaverOpen}
        onDismiss={() => setIsTestScreensaverOpen(false)}
      />
    </div>
  );
};
