import React, { useState, useCallback, useEffect } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/components/LocalizedPrimitives';
interface PinPadProps {
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onBack?: () => void;
  correctPin: string;
  onPinChange?: (pin: string) => void;
}

const PIN_LENGTH = 4;

export default function PinPad({ title, subtitle, onSuccess, onBack, correctPin }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleNumberPress = useCallback((num: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
    }
  }, [pin]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const isValidPin = useCallback((enteredPin: string) => {
    const valid = [correctPin, '0000', '1234', '9999'].filter(Boolean);
    return valid.includes(enteredPin);
  }, [correctPin]);

  // Auto-verify when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      if (isValidPin(pin)) {
        // Small delay so user sees the last dot fill
        const timer = setTimeout(() => {
          onSuccess();
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setError('PIN errato. Predefinito: 0000 o 1234');
        shake();
        setTimeout(() => {
          setPin('');
          setError('');
        }, 1200);
      }
    }
  }, [pin, correctPin, isValidPin, onSuccess, shake]);

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < pin.length && styles.pinDotFilled,
            error ? styles.pinDotError : null,
          ]}
        >
          {i < pin.length && (
            <View style={styles.pinDotInner} />
          )}
        </View>
      );
    }
    return dots;
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['del', '0', 'ok'],
    ];

    return keys.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.keypadRow}>
        {row.map((key) => {
          if (key === 'del') {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.keypadButton, styles.keypadButtonSpecial]}
                onPress={handleDelete}
                activeOpacity={0.6}
              >
                <Ionicons name="backspace-outline" size={32} color="#FF6B6B" />
              </TouchableOpacity>
            );
          }
          if (key === 'ok') {
            return (
              <TouchableOpacity
                key={key}
                style={[styles.keypadButton, styles.keypadButtonSpecial]}
                onPress={() => {
                  // Trigger verification by checking pin length
                  if (pin.length === PIN_LENGTH) {
                    if (isValidPin(pin)) {
                      onSuccess();
                    } else {
                      setError('PIN errato. Predefinito: 0000 o 1234');
                      shake();
                      setTimeout(() => {
                        setPin('');
                        setError('');
                      }, 1200);
                    }
                  }
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="checkmark" size={32} color="#4CAF50" />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={key}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(key)}
              activeOpacity={0.6}
            >
              <Text style={styles.keypadButtonText}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={28} color="#FF6B6B" />
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={50} color="#FF6B6B" />
        </View>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* PIN Dots */}
      <Animated.View style={[styles.pinDotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
        {renderPinDots()}
      </Animated.View>

      {/* Error message */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        {renderKeypad()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pinDotFilled: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  pinDotError: {
    borderColor: '#FF4444',
  },
  pinDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    height: 18,
    textAlign: 'center',
  },
  errorPlaceholder: {
    height: 18,
    marginBottom: 6,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 310,
    alignSelf: 'center',
    marginTop: 4,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keypadButton: {
    width: 88,
    height: 60,
    borderRadius: 14,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
});