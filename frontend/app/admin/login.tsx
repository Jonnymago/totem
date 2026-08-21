import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminLogin } from '@/src/api/api';
import { storage } from '@/src/utils/storage';
import { useI18n } from '@/src/utils/i18n';
import LanguageSelector from '@/src/components/LanguageSelector';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  // Precompilati: funzionano sempre anche senza backend / WiFi
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t('admin.credentials_required') || 'Inserisci username e password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = await adminLogin(username, password);
      await storage.secureSet('admin_token', token);
      router.replace('/admin/products');
    } catch (err) {
      setError('Credenziali non valide. Usa admin / admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#FF6B6B" />
          </TouchableOpacity>
          <LanguageSelector compact theme="dark" />
        </View>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={60} color="#FF6B6B" />
          </View>
          <Text style={styles.title}>{t('admin.login_title')}</Text>
          <Text style={styles.subtitle}>{t('admin.login_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={24} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('admin.username')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="key" size={24} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('admin.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor="#666"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            Offline: admin / admin123 (o PIN 1234)
          </Text>

          <TouchableOpacity 
            testID="admin-login-submit"
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>{t('admin.login_btn')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 56,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#FFF',
    height: '100%',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#8B3A3A',
  },
  loginButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});
