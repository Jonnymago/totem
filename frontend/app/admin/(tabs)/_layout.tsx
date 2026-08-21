import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  // Extra spazio sotto: gabbia totem / FydeOS taglia il bordo inferiore
  const bottomExtra = Platform.OS === 'android' ? 28 : 12;
  const padBottom = Math.max(insets.bottom, 12) + bottomExtra;
  const barHeight = 56 + padBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: barHeight,
          paddingBottom: padBottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
      initialRouteName="products"
    >
      
      <Tabs.Screen
        name="products"
        options={{
          title: 'Prodotti',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fast-food" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorie',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Gruppi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Impostazioni',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="license"
        options={{
          title: 'Licenza & Info',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="kitchen"
        options={{
          href: null,
          title: 'Cucina',
        }}
      />
    </Tabs>
  );
}
