# QuoteSpace - Daily Quote App

A React Native Expo application that displays motivational quotes with a clean, modern UI.

## Project Structure

```
QuoteSpace/
├── app/                          # Expo Router app directory
│   ├── (tabs)/
│   │   ├── index.tsx            # Home/Quotes screen
│   │   ├── favorite.tsx          # Favorites screen
│   │   └── _layout.tsx          # Tab navigation layout
│   └── _layout.tsx              # Root layout
├── src/
│   ├── components/
│   │   └── QuoteCard.tsx        # Reusable quote card component
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Main quotes display screen
│   │   └── FavoritesScreen.tsx  # Saved favorites screen
│   ├── services/
│   │   ├── quoteService.ts      # API service for fetching quotes
│   │   └── storageService.ts    # AsyncStorage service for favorites
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── utils/                   # Utility functions (for future use)
├── assets/                       # App images and icons
├── package.json
├── tsconfig.json
└── app.json
```

## Features Implemented

### Core Features ✅
- **Fetch quotes from API**: Integration with API Ninjas quotes API
- **Show daily quotes**: Random quote display with refresh capability
- **Favorite quotes**: Save and manage favorite quotes locally
- **Favorite screen**: Dedicated screen to view all saved favorites
- **Share quotes**: Built-in share functionality for each quote
- **AsyncStorage**: Local persistence for favorites

### UI/UX Features ✅
- Clean, modern interface with smooth animations
- Responsive card-based design
- Tab navigation (Home & Favorites)
- Pull-to-refresh functionality
- Error handling and loading states
- Empty state UI for favorites

### Tech Stack ✅
- **React Native** with Expo
- **Expo Router** for navigation
- **TypeScript** for type safety
- **AsyncStorage** for local data persistence
- **Axios** for API calls
- **Material Icons** for UI elements
- **React Navigation** for tab navigation

## Development

### Prerequisites
- Node.js and npm installed
- Expo Go app on Android/iOS device or emulator
- Expo CLI

### Installation

```bash
cd QuoteSpace
npm install
```

### Running the App

```bash
# Start the development server
npm start

# Or with cache cleared
npx expo start -c
```

Then scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app (opens Expo Go automatically)

### Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Component Architecture

### QuoteCard Component
Displays a single quote with:
- Quote text
- Author attribution
- Category tag
- Favorite button (with local state sync)
- Share button

### HomeScreen
Shows:
- Daily quote display
- Next button to fetch new quotes
- Pull-to-refresh
- Loading and error states

### FavoritesScreen
Features:
- List of all saved favorites
- Remove from favorites functionality
- Clear all button
- Empty state messaging

## API Integration

Uses [API Ninjas Quotes API](https://api-ninjas.com/api/quotes)

```typescript
// Example quote format
{
  id: string,
  text: string,
  author: string,
  category?: string
}
```

## State Management

- **Local Component State**: React hooks (useState, useCallback)
- **Async Storage**: Persistent favorite quotes storage
- **AsyncStorage Service**: Centralized data management

## Styling

- **StyleSheet**: React Native built-in styling
- **Colors**: 
  - Primary: #4ECDC4 (Teal)
  - Accent: #FF6B6B (Red/Pink)
  - Background: #F8F9FA (Light Gray)
- **Responsive**: Adapts to different screen sizes

## Future Enhancements

- [ ] Gradient backgrounds (linear gradient)
- [ ] Quote categories filter
- [ ] Daily notification reminders
- [ ] Quote statistics
- [ ] Theme customization
- [ ] Search functionality
- [ ] Quote history
- [ ] Cloud sync with authentication

## Notes

- The app uses mock quotes as fallback when API is unavailable
- All favorites are stored locally on device
- No authentication/backend required for core functionality
- Fully TypeScript for type safety and better DX
