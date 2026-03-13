import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoriteQuote } from '../types';

const FAVORITES_KEY = 'quotespace_favorites';

export const storageService = {
  async getFavorites(): Promise<FavoriteQuote[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading favorites:', error);
      return [];
    }
  },

  async addFavorite(quote: FavoriteQuote): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const exists = favorites.some((fav) => fav.id === quote.id);
      if (!exists) {
        favorites.push({ ...quote, savedAt: Date.now() });
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  },

  async removeFavorite(quoteId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter((fav) => fav.id !== quoteId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  },

  async isFavorite(quoteId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some((fav) => fav.id === quoteId);
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  },
};
