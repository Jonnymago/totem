import React, { useEffect, useState } from 'react';
import { View, Text as NativeText, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, Category, subscribeToDbChanges } from '@/src/api/api';
import { useCartStore } from '@/src/store/cartStore';
import { useI18n } from '@/src/utils/i18n';
import { translateCustomerMenuText, useCustomerMenuGlossary } from '@/src/utils/customerMenuTranslation';

import { Text } from '@/src/components/LocalizedPrimitives';
export default function CategoriesScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  useCustomerMenuGlossary();
  const menuText = (value?: string) => translateCustomerMenuText(value, lang);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const cartItems = useCartStore(state => state.getTotalItems());
  const { width: winW, height: winH } = useWindowDimensions();
  // Allineato a homepage: solo tablet/FydeOS/totem (lato corto >= 600)
  const isLarge = Math.min(winW, winH) >= 600;

  // Padding orizzontale + gap tra le 2 colonne
  const hPad = isLarge ? 28 : 16;
  const gap = isLarge ? 16 : 12;
  const cardWidth = (winW - hPad * 2 - gap) / 2;

  useEffect(() => {
    loadCategories();
    const unsubscribe = subscribeToDbChanges((type) => {
      if (type === 'categories' || type === 'all') {
        loadCategories();
      }
    });
    const interval = setInterval(() => {
      loadCategories();
    }, 3000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    const icons: { [key: string]: any } = {
      'Panini': 'fast-food',
      'Pizze': 'pizza',
      'Insalate': 'leaf',
      'Bevande': 'beer',
      'Dolci': 'ice-cream',
      'Combo': 'star'
    };
    return icons[name] || 'restaurant';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, isLarge && styles.headerLarge]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, isLarge && styles.headerBtnLarge]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={isLarge ? 40 : 26} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isLarge ? { fontSize: 32 } : { fontSize: 20 }]}>
          {t('categories.title')}
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/cart')}
          style={[styles.headerBtn, isLarge && styles.headerBtnLarge]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="cart" size={isLarge ? 40 : 26} color="white" />
          {cartItems > 0 && (
            <View style={[styles.badge, isLarge && styles.badgeLarge]}>
              <Text style={[styles.badgeText, isLarge && { fontSize: 16 }]}>{cartItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: hPad, paddingBottom: isLarge ? 48 : (Platform.OS === 'android' ? 40 : 24) },
          isLarge && { paddingTop: 28 },
        ]}
      >
        <Text style={[styles.subtitle, isLarge ? { fontSize: 28, marginBottom: 24 } : { fontSize: 18, marginBottom: 14 }]}>
          {t('categories.subtitle')}
        </Text>

        <View style={[styles.grid, { gap }]}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { width: cardWidth },
                isLarge && styles.categoryCardLarge,
              ]}
              onPress={() => router.push(`/products/${category.id}`)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconContainer, isLarge && styles.iconContainerLarge]}>
                {category.image ? (
                  <Image
                    source={{ uri: category.image }}
                    style={[styles.categoryImage, isLarge && styles.categoryImageLarge]}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name={getCategoryIcon(category.name)}
                    size={isLarge ? 52 : 36}
                    color="#FF6B6B"
                  />
                )}
              </View>
              <Text style={[styles.categoryName, isLarge ? { fontSize: 26 } : { fontSize: 16 }]} numberOfLines={2}>
                {menuText(category.name)}
              </Text>
              {!!category.description && (
                <Text style={[styles.categoryDescription, isLarge ? { fontSize: 18 } : { fontSize: 12 }]} numberOfLines={2}>
                  {menuText(category.description)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? 44 : 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLarge: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerBtnLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFE66D',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLarge: {
    top: 4,
    right: 4,
    minWidth: 30,
    height: 30,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 4,
  },
  categoryCardLarge: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE4E4',
  },
  iconContainerLarge: {
    width: 96,
    height: 96,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  categoryImageLarge: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
