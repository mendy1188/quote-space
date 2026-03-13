import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quote } from '../types';

// Using API Ninjas Quotes API v2
const API_KEY = 'sdJhUOiOWcD5I0zWURuIdJkJSVTNlf6kGAPrGW5o';

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'QuoteSpace/1.0',
  },
});

const USED_QUOTES_KEY = 'used_quotes';
const LAST_FETCH_DATE_KEY = 'last_fetch_date';

// Get today's date as YYYYMMDD string
const getTodayDate = (): string => {
  const today = new Date();
  return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
};

// Get used quotes from storage
const getUsedQuotes = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(USED_QUOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading used quotes:', error);
    return [];
  }
};

// Save used quotes to storage
const saveUsedQuotes = async (quoteIds: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(USED_QUOTES_KEY, JSON.stringify(quoteIds));
  } catch (error) {
    console.error('Error saving used quotes:', error);
  }
};

// Clear used quotes on new day
const resetUsedQuotesIfNewDay = async (): Promise<void> => {
  try {
    const lastFetchDate = await AsyncStorage.getItem(LAST_FETCH_DATE_KEY);
    const todayDate = getTodayDate();
    
    if (lastFetchDate !== todayDate) {
      await AsyncStorage.setItem(LAST_FETCH_DATE_KEY, todayDate);
      await AsyncStorage.setItem(USED_QUOTES_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error resetting used quotes:', error);
  }
};

export const quoteService = {
  async getQuotes(): Promise<Quote[]> {
    try {
      // Reset used quotes if it's a new day
      await resetUsedQuotesIfNewDay();

      let allQuotes: Quote[] = [];
      let retries = 3;

      // Retry logic for network resilience
      while (retries > 0 && allQuotes.length === 0) {
        try {
          const response = await apiClient.get('https://api.api-ninjas.com/v2/quotes', {
            params: { 
              category: 'inspirational',
              limit: 100,
            },
            headers: {
              'X-Api-Key': API_KEY,
            },
          });

          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            allQuotes = response.data.map((quote: any) => ({
              id: `${quote.author}-${quote.quote.substring(0, 20)}`,
              text: quote.quote,
              author: quote.author,
              category: quote.category || 'inspirational',
            }));
          }
        } catch (err) {
          retries--;
          if (retries > 0) {
            console.warn(`Retry attempt ${4 - retries} failed, retrying...`, err);
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (allQuotes.length === 0) {
        console.error('Failed to fetch quotes after retries, using mock quotes');
        return getMockQuotes().slice(0, 10);
      }

      // Get already used quote IDs
      const usedQuoteIds = await getUsedQuotes();

      // Filter out quotes that have already been shown
      const availableQuotes = allQuotes.filter(
        (quote: Quote) => !quote.id || !usedQuoteIds.includes(quote.id)
      );

      // Select 10 new quotes
      const selectedQuotes = availableQuotes.slice(0, 10);

      // If not enough new quotes, mix with used ones
      if (selectedQuotes.length < 10) {
        const remainingQuotes = allQuotes
          .filter((q) => !selectedQuotes.some((sq) => sq.id === q.id))
          .slice(0, 10 - selectedQuotes.length);
        selectedQuotes.push(...remainingQuotes);
      }

      // Update used quotes list
      const newUsedIds = [...usedQuoteIds, ...selectedQuotes.map((q: Quote) => q.id || '')];
      await saveUsedQuotes(newUsedIds);

      return selectedQuotes.length > 0 ? selectedQuotes : getMockQuotes().slice(0, 10);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // Return mock quotes if API fails
      return getMockQuotes().slice(0, 10);
    }
  },

  async getRandomQuote(): Promise<Quote> {
    try {
      const response = await apiClient.get('https://api.api-ninjas.com/v2/quotes', {
        params: { 
          category: 'inspirational',
          limit: 1,
        },
        headers: {
          'X-Api-Key': API_KEY,
        },
      });

      const quote = response.data[0];
      return {
        id: `${quote.author}-${Date.now()}`,
        text: quote.quote,
        author: quote.author,
        category: quote.category || 'inspirational',
      };
    } catch (error) {
      console.error('Error fetching quote:', error);
      const mocks = getMockQuotes();
      return mocks[Math.floor(Math.random() * mocks.length)];
    }
  },
};

// Mock quotes for development/fallback
export const getMockQuotes = (): Quote[] => [
  {
    id: '1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'success',
  },
  {
    id: '2',
    text: 'Innovation distinguishes between a leader and a follower.',
    author: 'Steve Jobs',
    category: 'leadership',
  },
  {
    id: '3',
    text: 'Life is what happens when you\'re busy making other plans.',
    author: 'John Lennon',
    category: 'life',
  },
  {
    id: '4',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    category: 'inspirational',
  },
  {
    id: '5',
    text: 'It is during our darkest moments that we must focus to see the light.',
    author: 'Aristotle',
    category: 'inspirational',
  },
  {
    id: '6',
    text: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
    category: 'motivational',
  },
  {
    id: '7',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'success',
  },
  {
    id: '8',
    text: 'Believe you can and you\'re halfway there.',
    author: 'Theodore Roosevelt',
    category: 'motivational',
  },
];

