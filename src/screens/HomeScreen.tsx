import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Quote } from '../types';
import { QuoteCard } from '../components/QuoteCard';
import { quoteService } from '../services/quoteService';

const PAGE_SIZE = 5;

export const HomeScreen: React.FC = () => {
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [displayedQuotes, setDisplayedQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const loadInitialQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quoteService.getQuotes();
      setAllQuotes(data);
      setDisplayedQuotes(data.slice(0, PAGE_SIZE));
      setCurrentPage(1);
      setHasMoreData(data.length > PAGE_SIZE);
    } catch (err) {
      setError('Failed to fetch quotes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreQuotes = useCallback(() => {
    if (loading || !hasMoreData) return;

    setLoading(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    const newQuotes = allQuotes.slice(0, endIndex);
    setDisplayedQuotes(newQuotes);
    setCurrentPage(nextPage);
    setHasMoreData(endIndex < allQuotes.length);
    setLoading(false);
  }, [currentPage, allQuotes, hasMoreData, loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialQuotes();
    setRefreshing(false);
  }, [loadInitialQuotes]);

  useFocusEffect(
    useCallback(() => {
      if (allQuotes.length === 0) {
        loadInitialQuotes();
      }
    }, [allQuotes, loadInitialQuotes])
  );

  const handleEndReached = useCallback(() => {
    if (hasMoreData && !loading) {
      loadMoreQuotes();
    }
  }, [hasMoreData, loading, loadMoreQuotes]);

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4ECDC4" />
        <Text style={styles.loadingMore}>Loading more quotes...</Text>
      </View>
    );
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
          <Text style={styles.title}>Inspirational Daily Quotes</Text>
          <Text style={styles.subtitle}>
            {displayedQuotes.length} of {allQuotes.length} quotes
          </Text>
        </View>

        {error ? (
          <View style={styles.centerContent}>
            <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : allQuotes.length === 0 && loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.loadingText}>Loading quotes...</Text>
          </View>
        ) : displayedQuotes.length === 0 ? (
          <View style={styles.centerContent}>
            <MaterialIcons name="format-quote" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No quotes available</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayedQuotes}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => <QuoteCard quote={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4ECDC4"
              />
            }
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            scrollEventThrottle={16}
          />
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
    paddingVertical: 20,
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#2D3436',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: 12,
  },
  listContent: {
    paddingVertical: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMore: {
    fontSize: 14,
    color: '#4ECDC4',
    marginTop: 8,
  },
});
