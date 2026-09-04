import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from '@/src/components/LocalizedPrimitives';
import { useI18n } from '@/src/utils/i18n';

interface PinPadProps {
  title?: string;
  subtitle?: string;
  pinLength?: number;
  onSuccess: () => void;
  onBack?: () => void;
  onForgotPin?: () => void;
  /** Verifica il PIN tramite un archivio protetto, senza ricevere né confrontare segreti in chiaro. */
  verifyPin: (pin: string) => Promise<boolean>;
}

export default function PinPad({
  title,
  subtitle,
  pinLength = 6,
  onSuccess,
  onBack,
  onForgotPin,
  verifyPin,
}: PinPadProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [shakeAnim] = useState(() => new Animated.Value(0));

  const handleForgotPinPress = useCallback(() => {
    if (onForgotPin) {
      onForgotPin();
    } else {
      router.push({ pathname: '/admin/login', params: { mode: 'recovery' } });
    }
  }, [onForgotPin, router]);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const rejectPin = useCallback((message: string) => {
    setError(message);
    shake();
    setTimeout(() => {
      setPin('');
      setError('');
    }, 1400);
  }, [shake]);

  const submitPin = useCallback(async (currentPin?: string) => {
    const pinToTest = currentPin || pin;
    if (!pinToTest || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const valid = await verifyPin(pinToTest);
      if (valid) {
        onSuccess();
      } else {
        rejectPin('PIN non valido.');
      }
    } catch (e: any) {
      rejectPin(e?.message || 'PIN non valido.');
    } finally {
      setVerifying(false);
    }
  }, [onSuccess, pin, rejectPin, verifyPin, verifying]);

  const handleNumberPress = useCallback((num: string) => {
    if (verifying) return;
    if (pin.length < pinLength) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === pinLength) {
        submitPin(nextPin);
      }
    }
  }, [pin, pinLength, submitPin, verifying]);

  const handleDelete = useCallback(() => {
    if (verifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [verifying]);

  const renderPinDots = () => {
    const dots = [];
    for (let index = 0; index < pinLength; index += 1) {
      dots.push(
        <View
          key={index}
          style={[
            styles.pinDot,
            index < pin.length && styles.pinDotFilled,
            error ? styles.pinDotError : null,
          ]}
        >
          {index < pin.length ? <View style={styles.pinDotInner} /> : null}
        </View>,
      );
    }
    return dots;
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['del', '0', 'ok'],
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.container}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7} disabled={verifying}>
            <Ionicons name="arrow-back" size={26} color="#FF6B6B" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={36} color="#FF6B6B" />
          </View>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <Animated.View style={[styles.pinDotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {renderPinDots()}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorPlaceholder} />}

        <View style={styles.keypadContainer}>
          {keys.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => {
                if (key === 'del') {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.keypadButton, styles.keypadButtonSpecial]}
                      onPress={handleDelete}
                      disabled={verifying}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="backspace-outline" size={28} color="#FF6B6B" />
                    </TouchableOpacity>
                  );
                }
                if (key === 'ok') {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.keypadButton, styles.keypadButtonSpecial]}
                      onPress={() => submitPin()}
                      disabled={verifying || !pin}
                      activeOpacity={0.6}
                    >
                      {verifying ? (
                        <ActivityIndicator color="#4CAF50" />
                      ) : (
                        <Ionicons name="checkmark" size={28} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.keypadButton}
                    onPress={() => handleNumberPress(key)}
                    disabled={verifying}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keypadButtonText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.forgotPinButton}
          onPress={handleForgotPinPress}
          activeOpacity={0.7}
          disabled={verifying}
        >
          <View style={styles.forgotPinIconBox}>
            <Ionicons name="key" size={14} color="#F59E0B" />
          </View>
          <Text style={styles.forgotPinText}>
            {t('welcome.forgot_pin_cta')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButton: {
    position: 'absolute',
    top: -4,
    left: -4,
    padding: 10,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 16,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotFilled: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.25)',
  },
  pinDotError: {
    borderColor: '#FF4444',
  },
  pinDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 16,
    textAlign: 'center',
  },
  errorPlaceholder: {
    height: 16,
    marginBottom: 4,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    marginTop: 2,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  keypadButton: {
    width: 86,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 3,
  },
  keypadButtonSpecial: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  keypadButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  forgotPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  forgotPinIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPinText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
  },
});
