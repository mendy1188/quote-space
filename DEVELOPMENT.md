# QuoteSpace Development Guide

## 📚 Complete Technical Documentation

### Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Deep Dives](#component-deep-dives)
3. [Service Layer](#service-layer)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [Storage Management](#storage-management)
7. [Navigation](#navigation)
8. [Styling & Design](#styling--design)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │
│  Screens & Components               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Business Logic Layer              │
│  Hooks & State Management           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Data Layer (Services)             │
│  API & Storage                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   External APIs & Storage           │
│  API Ninjas, AsyncStorage           │
└─────────────────────────────────────┘
```

### Component Dependency Graph

```
HomeScreen
  ├── QuoteCard (multiple)
  │   ├── storageService
  │   └── Share API
  ├── quoteService
  ├── LinearGradient
  └── RefreshControl

FavoritesScreen
  ├── QuoteCard (multiple)
  │   ├── storageService
  │   └── Share API
  ├── storageService
  └── LinearGradient

TabLayout
  ├── HomeScreen
  └── FavoritesScreen
```

---

## Component Deep Dives

### QuoteCard Component

#### Purpose
Reusable component for displaying a single quote with actions.

#### Props Interface
```typescript
interface QuoteCardProps {
  quote: Quote;
  onFavoriteChange?: (isFavorite: boolean) => void;
}
```

#### State Management
```typescript
const [isFavorite, setIsFavorite] = useState(false)  // Favorite status
const [loading, setLoading] = useState(false)       // Button loading state
```

#### Lifecycle
1. **Mount**: `useEffect` calls `checkFavoriteStatus()`
2. **Update**: `quote.id` dependency triggers re-check if quote changes
3. **User Action**: `toggleFavorite()` updates state and AsyncStorage
4. **Cleanup**: Automatic when component unmounts

#### Key Methods
```typescript
checkFavoriteStatus()  // Async check if quote is favorited
toggleFavorite()       // Add/remove from favorites
handleShare()          // Native share sheet
```

#### Styling
- Glass morphism: `backgroundColor: 'transparent'`
- Border: Teal with 20% opacity
- Shadow: Teal-colored elevation effect
- Responsive padding and margins

---

### HomeScreen Component

#### Responsibilities
1. Fetch quotes from API
2. Manage pagination state
3. Display quote list with error handling
4. Handle pull-to-refresh

#### State Variables
```typescript
allQuotes: Quote[]              // Full dataset from API
displayedQuotes: Quote[]        // Current page subset
currentPage: number             // Current pagination page
hasMoreData: boolean            // More quotes available
loading: boolean                // API loading state
refreshing: boolean             // Pull-to-refresh state
error: string | null            // Error message
```

#### Key Functions
```typescript
loadInitialQuotes()    // Fetch initial batch
loadMoreQuotes()       // Load next page
handleEndReached()     // Pagination trigger
onRefresh()           // Pull-to-refresh handler
renderFooter()        // Loading indicator for pagination
```

#### Pagination Logic
```typescript
PAGE_SIZE = 5
displayedQuotes = allQuotes.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
)
```

#### Error States
```typescript
// Error: Show error icon + message + retry via refresh
// Loading: Show spinner + "Loading quotes..." message
// Empty: Show quote icon + "No quotes available" message
// Success: Show quote list
```

---

### FavoritesScreen Component

#### Responsibilities
1. Load favorites from AsyncStorage
2. Display in descending order (newest first)
3. Allow deletion and bulk clearing
4. Handle refresh on screen focus

#### Key Differences from HomeScreen
- No API calls (local storage only)
- Smaller dataset (only saved quotes)
- No pagination needed
- `useFocusEffect` refreshes when tab focused
- Delete functionality on favorite toggle

---

## Service Layer

### quoteService.ts

#### Functions

##### `getQuotes(): Promise<Quote[]>`
Main function to get daily quotes.

```typescript
// Steps:
1. Reset used quotes if new day
2. Fetch 100 quotes from API (with 3 retries)
3. Filter out previously shown quotes
4. Select 10 new quotes
5. Fallback to mock quotes if needed
6. Update AsyncStorage with used quote IDs
7. Return selected quotes
```

##### `getRandomQuote(): Promise<Quote>`
Get a single random quote.

```typescript
// Steps:
1. Fetch with limit=1
2. Parse response
3. Return quote object
4. Fallback to random mock quote
```

#### Helper Functions

##### `getTodayDate(): string`
```typescript
// Returns: "20260313" format
// Used: For daily rotation tracking
```

##### `getUsedQuotes(): Promise<string[]>`
```typescript
// Retrieves: Array of quote IDs already shown
// Storage: USED_QUOTES_KEY
// Fallback: Empty array if not found
```

##### `resetUsedQuotesIfNewDay(): Promise<void>`
```typescript
// Checks: If date changed since last fetch
// Action: Clears used quotes and updates date
// Timing: Called at start of getQuotes()
```

#### API Configuration
```typescript
const apiClient = axios.create({
  timeout: 15000,                    // 15-second timeout
  headers: {
    'User-Agent': 'QuoteSpace/1.0'   // Custom header
  }
})

// API Endpoint
URL: https://api.api-ninjas.com/v2/quotes
Params: {
  category: 'inspirational',
  limit: 100
}
Headers: {
  'X-Api-Key': '<API_KEY>'
}
```

#### Retry Logic
```typescript
let retries = 3
while (retries > 0 && allQuotes.length === 0) {
  try {
    // Fetch attempt
  } catch (err) {
    retries--
    if (retries > 0) {
      // Wait 1 second
      await sleep(1000)
    }
  }
}
// Use mock quotes if all retries failed
```

---

### storageService.ts

#### AsyncStorage Keys
```typescript
FAVORITES_KEY = 'favorites'           // FavoriteQuote[]
USED_QUOTES_KEY = 'used_quotes'       // string[]
LAST_FETCH_DATE_KEY = 'last_fetch_date'  // string (YYYYMMDD)
```

#### Functions

##### `getFavorites(): Promise<FavoriteQuote[]>`
```typescript
// Retrieves: All saved quotes with timestamps
// Returns: Sorted array (newest first)
// Error: Empty array on failure
```

##### `addFavorite(quote: FavoriteQuote): Promise<void>`
```typescript
// Checks: If quote already exists
// Action: Adds quote with current timestamp
// Idempotent: Won't duplicate if re-added
```

##### `removeFavorite(quoteId: string): Promise<void>`
```typescript
// Finds: Quote by ID
// Action: Removes from storage
// Silent: No error if not found
```

##### `isFavorite(quoteId: string): Promise<boolean>`
```typescript
// Checks: If quote ID exists in favorites
// Returns: true if favorited, false otherwise
// Used: By QuoteCard component for UI state
```

##### `clearAll(): Promise<void>`
```typescript
// Action: Removes all favorites
// Use: Via "Clear All" button
// Confirmation: No prompt (implement in UI if needed)
```

#### Data Structures
```typescript
interface FavoriteQuote extends Quote {
  id: string                 // Unique identifier
  text: string              // Quote content
  author: string            // Quote author
  category?: string         // Optional category
  savedAt: number           // Timestamp (Date.now())
}

// Storage Format
{
  "favorites": [
    {
      "id": "Steve Jobs-The only way...",
      "text": "The only way to do great work...",
      "author": "Steve Jobs",
      "category": "inspirational",
      "savedAt": 1678900000000
    }
  ]
}
```

---

## State Management

### State Architecture Pattern

#### Global State (Shared Across Screens)
- None - App uses local component state only
- Benefits: Simpler, no reducer boilerplate, easier debugging

#### Screen-Level State
```
HomeScreen        FavoritesScreen
├── allQuotes     ├── favorites
├── displayedQuotes
├── loading       ├── loading
├── error         └── [refresh state]
└── pagination state
```

#### Component-Level State
```
QuoteCard
├── isFavorite
└── loading
```

#### Persistent State
```
AsyncStorage
├── favorites[]
├── used_quotes[]
└── last_fetch_date
```

### State Update Flow

#### Quote Loading
```
User opens app
     ↓
useFocusEffect triggers
     ↓
loadInitialQuotes()
     ↓
quoteService.getQuotes()
     ↓
setState(allQuotes, displayedQuotes)
     ↓
FlatList re-renders with QuoteCards
```

#### Favoriting a Quote
```
User taps heart icon
     ↓
QuoteCard.toggleFavorite()
     ↓
storageService.addFavorite(quote)
     ↓
AsyncStorage updated
     ↓
setState(isFavorite = true)
     ↓
QuoteCard heart icon fills
```

#### Pagination
```
User scrolls to bottom
     ↓
FlatList.onEndReached()
     ↓
loadMoreQuotes()
     ↓
setState(displayedQuotes += nextPage)
     ↓
FlatList appends new items
```

---

## API Integration

### Request/Response Cycle

#### Request
```typescript
GET /v2/quotes?category=inspirational&limit=100
Headers: {
  'X-Api-Key': 'sdJhUOiOWcD5I0zWURuIdJkJSVTNlf6kGAPrGW5o',
  'User-Agent': 'QuoteSpace/1.0'
}
```

#### Success Response
```typescript
[
  {
    "quote": "The only way to do great work is to love what you do.",
    "author": "Steve Jobs",
    "category": "inspirational"
  },
  // ... 99 more quotes
]
```

#### Error Response
```typescript
// Network Error
Error: Network Error

// Timeout Error
Error: timeout of 15000ms exceeded

// Rate Limit (429)
Error: Too Many Requests

// Invalid Key (401)
Error: Unauthorized
```

### Error Handling Flow

```
API Call
  │
  ├─→ Success? 
  │    ├─→ Parse & Filter
  │    └─→ Return data
  │
  ├─→ Network Error?
  │    ├─→ Retry count > 0?
  │    │    ├─→ Wait 1s
  │    │    └─→ Retry
  │    └─→ Return mock quotes
  │
  └─→ Timeout?
       ├─→ Retry count > 0?
       │    ├─→ Retry
       │    └─→ Return mock quotes
       └─→ Show error message
```

### Data Transformation

```typescript
// Raw API Response
{
  quote: "The only way...",
  author: "Steve Jobs",
  category: "inspirational"
}

// Transform to App Type
{
  id: "Steve Jobs-The only way",  // Generated
  text: "The only way...",        // Renamed from 'quote'
  author: "Steve Jobs",           // Unchanged
  category: "inspirational"       // Unchanged
}
```

### Rate Limiting Considerations
- API Ninjas: Free tier has rate limits
- Current: 100 requests per day
- Solution: Daily quotes reduce requests to 1-3 per day

---

## Storage Management

### AsyncStorage Overview

#### Advantages
✓ Persistent across app launches
✓ Simple key-value interface
✓ Automatic async handling
✓ 10MB size limit (enough for quotes)
✓ No complex migration needed

#### Disadvantages
✗ Not encrypted (sensitive data needs extra handling)
✗ Limited to JSON-serializable data
✗ No built-in searching
✗ Slower than in-memory

### Data Persistence Strategy

#### On App Launch
```
Read LAST_FETCH_DATE
  │
  ├─→ Today? Use cached quotes
  └─→ New day? Fetch new quotes
```

#### On Quote Favorite
```
Get current favorites array
  ↓
Check if quote ID exists
  ↓
If not, add new quote with timestamp
  ↓
Write updated array to AsyncStorage
```

#### On Screen Focus (Favorites)
```
Read AsyncStorage
  ↓
Sort by savedAt (descending)
  ↓
Update component state
  ↓
Re-render UI
```

### Memory Considerations
```
10 quotes × 300 bytes/quote = 3KB
1000 quotes × 300 bytes = 300KB
10,000 quotes × 300 bytes = 3MB
```
Current app: ~10KB used (excellent)

---

## Navigation

### Expo Router Structure

#### File Routing
```
app/
├── _layout.tsx          → RootLayout
└── (tabs)/
    ├── _layout.tsx      → TabLayout (bottom tabs)
    ├── index.tsx        → HomeScreen
    └── favorite.tsx      → FavoritesScreen
```

#### Navigation Flow
```
RootLayout (Stack)
  └── TabLayout (Bottom Tabs)
      ├── Tab 1: HomeScreen
      └── Tab 2: FavoritesScreen
```

#### Tab Configuration
```typescript
// app/(tabs)/_layout.tsx
{
  href: '/',
  title: 'Home',
  icon: 'home',
  tintColor: '#4ECDC4'
},
{
  href: '/favorite',
  title: 'Favorites',
  icon: 'bookmark',
  tintColor: '#4ECDC4'
}
```

#### Screen Transitions
- Default: Fade effect
- Customizable: Can add slide/push animations

---

## Styling & Design

### Glass UI Implementation

#### Glassmorphism Formula
```
Transparency + Border + Shadow + Blur Effect = Glass Look
```

#### CSS-like Properties in React Native
```typescript
// Backdrop blur (not native support, visual approximation)
backgroundColor: 'rgba(255, 255, 255, 0.5)'

// Frosted glass border
borderWidth: 1.5
borderColor: 'rgba(78, 205, 196, 0.3)'

// Glow effect via shadow
shadowColor: '#4ECDC4'
shadowOpacity: 0.2
shadowRadius: 16
elevation: 10  // Android equivalent
```

#### Color System
```
Primary Teal (#4ECDC4)
  └─ Borders: rgba(78, 205, 196, 0.1-0.2)
  └─ Accents: Used throughout UI

Quote Text (#165252ff - Dark Teal)
  └─ Primary content color
  └─ Excellent contrast on light backgrounds

Author Text (#238f88ff - Medium Teal)
  └─ Secondary content color
  └─ Visual hierarchy between quote and author

Background Gradient
  └─ Start: #f0f8f7 (light teal)
  └─ Mid: #f0dcd8ff (warm peach/coral)
  └─ End: #f0f8f7 (light teal)
  └─ Direction: top-left to bottom-right

Card Background
  └─ rgba(255, 255, 255, 0.2) - Semi-transparent white
  └─ Creates glass morphism effect

Accent Red (#FF6B6B)
  └─ Favorites: #FF6B6B
  └─ Errors: #FF6B6B
  └─ Alerts: #FF6B6B
```

#### Responsive Design Approach
```
// Instead of media queries (not native to React Native):
- Flexible: true (most layouts)
- Aspect ratios: For images
- Dynamic font sizes: Based on screen size
- SafeAreaView: For notch handling
```

---

## Performance Optimization

### FlatList Optimization

#### Configuration
```typescript
<FlatList
  // Rendering optimization
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}
  
  // Scroll performance
  scrollEventThrottle={16}  // 60fps target (16ms)
  onEndReachedThreshold={0.5}  // Trigger 50% before end
/>
```

#### How It Works
```
removeClippedSubviews: Don't render items outside viewport
maxToRenderPerBatch: Render 5 items per frame
initialNumToRender: Show 10 items immediately
updateCellsBatchingPeriod: Wait 50ms between batches
```

### React Optimization

#### useCallback Benefits
```typescript
// Without useCallback: Function recreated on every render
const loadMoreQuotes = () => { ... }

// With useCallback: Function identity preserved
const loadMoreQuotes = useCallback(() => { ... }, [deps])

// Result: Child components don't re-render unnecessarily
```

#### Dependency Arrays
```typescript
// QuoteCard dependencies
useEffect(() => {
  checkFavoriteStatus()
}, [checkFavoriteStatus])  // Only run if checkFavoriteStatus changes

// HomeScreen dependencies
useCallback(() => {
  loadInitialQuotes()
}, [])  // Never changes, stable reference
```

### Bundle Size Optimization
```
Vector Icons: ~1.2MB (pre-installed)
Expo Core: ~2.0MB
App Code: ~0.3MB
Total: ~3.5MB (manageable)

Optimizations:
✓ Tree-shaking: Remove unused code
✓ Code splitting: Load on demand
✓ Asset optimization: Minimal images
```

---

## Testing Strategy

### Unit Test Examples

#### Quote Service Tests
```typescript
describe('quoteService', () => {
  test('getQuotes returns array of 10 quotes', async () => {
    const quotes = await quoteService.getQuotes()
    expect(quotes).toHaveLength(10)
  })
  
  test('does not repeat quotes from previous day', async () => {
    // Mock date change
    // Verify different quotes returned
  })
})
```

#### Storage Service Tests
```typescript
describe('storageService', () => {
  test('addFavorite persists to AsyncStorage', async () => {
    const quote = { id: '1', text: '...', author: '...' }
    await storageService.addFavorite(quote)
    const favorites = await storageService.getFavorites()
    expect(favorites).toContainEqual(quote)
  })
})
```

### Integration Tests
```typescript
describe('HomeScreen Integration', () => {
  test('loads and displays quotes on mount', async () => {
    // Render HomeScreen
    // Wait for quotes to load
    // Verify QuoteCards rendered
  })
  
  test('pagination loads more quotes on scroll', async () => {
    // Render and scroll
    // Verify new quotes appended
  })
})
```

### E2E Test Scenario
```
1. App launch
2. HomeScreen displays 5 quotes
3. Scroll to load more
4. Verify 10 quotes total
5. Tap favorite on quote 1
6. Navigate to Favorites
7. Verify quote 1 appears
8. Tap heart to unfavorite
9. Verify quote 1 removed
10. Return to Home
```

---

## Troubleshooting Guide

### Common Issues

#### "Cannot find module" Error
```
Cause: Import path incorrect
Fix: Check file location, use relative paths correctly
```

#### "Network Error" on API Call
```
Cause: No internet, API down, rate limited
Fix: Check connection, verify API key, wait 1 minute
```

#### AsyncStorage Empty on Refresh
```
Cause: Data not persisted properly
Fix: Verify writeAsync was called, check catch blocks
```

#### FlatList Not Rendering
```
Cause: Missing keyExtractor or bad key prop
Fix: Ensure unique keys for each item
```

#### Memory Leak Warning
```
Cause: Unmounted component state update
Fix: Add cleanup in useEffect return
```

---

## Future Roadmap

### Phase 1: Current (MVP)
✓ Quote fetching
✓ Favorites management
✓ Glass UI design

### Phase 2: Polish
- [ ] Animations on quote card
- [ ] Theme toggle (light/dark)
- [ ] Haptic feedback on interactions
- [ ] Quote search functionality

### Phase 3: Features
- [ ] Quote of the Day notifications
- [ ] Share to social media
- [ ] Export favorites as PDF
- [ ] Quote categories browsing

### Phase 4: Analytics
- [ ] Track popular quotes
- [ ] User engagement metrics
- [ ] Most-liked authors
- [ ] Reading time insights

---

## Resources

### Documentation
- [React Native Docs](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Axios Documentation](https://axios-http.com)

### Tools
- [Expo Dev Tools](https://docs.expo.dev/workflow/overview)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [AsyncStorage Browser](https://dev.to/elifirat/async-storage-debugger-for-react-native-36nf)

---

**Last Updated**: March 13, 2026
**Version**: 1.0.0
