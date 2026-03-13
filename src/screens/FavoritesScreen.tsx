import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { FavoriteQuote } from '../types';
import { QuoteCard } from '../components/QuoteCard';
import { storageService } from '../services/storageService';

export const FavoritesScreen: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteQuote[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storageService.getFavorites();
      setFavorites(data.sort((a, b) => b.savedAt - a.savedAt));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRemove = async (quoteId: string) => {
    await storageService.removeFavorite(quoteId);
    setFavorites((prev) => prev.filter((q) => q.id !== quoteId));
  };

  const handleClearAll = async () => {
    await storageService.clearAll();
    setFavorites([]);
  };

  return (
    <LinearGradient
      colors={['#f0f8f7', '#f0dcd8ff', '#f0f8f7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorite Quotes</Text>
          <Text style={styles.subtitle}>{favorites.length} saved quotes</Text>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="bookmark-border" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Start adding quotes to your favorites!
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={favorites}
              keyExtractor={(item) => item.id || ''}
              renderItem={({ item }) => (
                <View style={styles.favoriteItem}>
                  <QuoteCard
                    quote={item}
                    onFavoriteChange={(isFavorite) => {
                      if (!isFavorite) {
                        handleRemove(item.id || '');
                      }
                    }}
                  />
                </View>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={loadFavorites}
                  tintColor="#4ECDC4"
                />
              }
              contentContainerStyle={styles.listContent}
            />

            {favorites.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <MaterialIcons name="delete-outline" size={20} color="#FF6B6B" />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(78, 205, 196, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a3a3a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#4ECDC4',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listContent: {
    paddingVertical: 12,
  },
  favoriteItem: {
    marginVertical: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
});
