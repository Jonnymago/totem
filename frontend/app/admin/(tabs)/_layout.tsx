import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { translateSourceText, useI18n } from '@/src/utils/i18n';
import { isAdminSessionValid } from '@/src/api/api';
import { storage } from '@/src/utils/storage';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const [authorization, setAuthorization] = useState<'checking' | 'allowed' | 'denied'>('checking');
  useI18n();

  useEffect(() => {
    let active = true;
    const checkAuthorization = async () => {
      try {
        const token = await storage.secureGet('admin_token', '');
        const valid = Boolean(token) && await isAdminSessionValid(String(token));
        if (!valid) await storage.secureRemove('admin_token');
        if (active) setAuthorization(valid ? 'allowed' : 'denied');
      } catch {
        if (active) setAuthorization('denied');
      }
    };
    void checkAuthorization();
    return () => { active = false; };
  }, []);

  if (authorization === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator color="#FF6B6B" />
      </View>
    );
  }
  if (authorization === 'denied') {
    return <Redirect href="/admin/login" />;
  }

  const bottomExtra = Platform.OS === 'android' ? 14 : 6;
  const padBottom = Math.max(insets.bottom, 6) + bottomExtra;
  const barHeight = 52 + padBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: barHeight,
          paddingBottom: padBottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
      initialRouteName="products"
    >
      <Tabs.Screen
        name="products"
        options={{
          title: translateSourceText('Prodotti'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'fast-food' : 'fast-food-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: translateSourceText('Categorie'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: translateSourceText('Varianti'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'layers' : 'layers-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: translateSourceText('Comande & KDS'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translateSourceText('Impostazioni'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={21} color={color} />
          ),
        }}
      />
      {/* Hidden sub-tabs accessible via Comande & Impostazioni */}
      <Tabs.Screen
        name="queue"
        options={{
          href: null,
          title: translateSourceText('Coda'),
        }}
      />
      <Tabs.Screen
        name="signage"
        options={{
          href: null,
          title: translateSourceText('TV'),
        }}
      />
      <Tabs.Screen
        name="printers"
        options={{
          href: null,
          title: translateSourceText('Stampa'),
        }}
      />
      <Tabs.Screen
        name="kds"
        options={{
          href: null,
          title: translateSourceText('KDS'),
        }}
      />
      <Tabs.Screen
        name="license"
        options={{
          href: null,
          title: translateSourceText('Licenza'),
        }}
      />
    </Tabs>
  );
}
