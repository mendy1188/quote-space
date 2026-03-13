import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Quote, FavoriteQuote } from '../types';
import { storageService } from '../services/storageService';

interface QuoteCardProps {
  quote: Quote;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onFavoriteChange }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkFavoriteStatus = useCallback(async () => {
    const favorite = await storageService.isFavorite(quote.id || '');
    setIsFavorite(favorite);
  }, [quote.id]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      if (isFavorite) {
        await storageService.removeFavorite(quote.id || '');
        setIsFavorite(false);
        onFavoriteChange?.(false);
      } else {
        const favorite: FavoriteQuote = {
          ...quote,
          id: quote.id || `${quote.author}-${Date.now()}`,
          savedAt: Date.now(),
        };
        await storageService.addFavorite(favorite);
        setIsFavorite(true);
        onFavoriteChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${quote.text}"\n— ${quote.author}`,
        title: 'Share Quote',
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.quoteText}>{`"${quote.text}"`}</Text>
        <Text style={styles.author}>— {quote.author}</Text>
        {/* {quote.category && <Text style={styles.category}>{quote.category}</Text>} */}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleFavorite}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <MaterialIcons
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={24}
              color={isFavorite ? '#FF6B6B' : '#999'}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <MaterialIcons name="share" size={24} color="#4ECDC4" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(78, 205, 196, 0.1)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  content: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#165252ff',
    lineHeight: 28,
    marginBottom: 12,
  },
  author: {
    fontSize: 14,
    color: '#238f88ff',
    fontStyle: 'italic',
    marginBottom: 8,
    fontWeight: '500',
  },
  category: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    backgroundColor: 'transparent',
  },
  actionButton: {
    padding: 8,
  },
});
