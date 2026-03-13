export interface Quote {
  id?: string;
  text: string;
  author: string;
  category?: string;
}

export interface FavoriteQuote extends Quote {
  savedAt: number;
}
