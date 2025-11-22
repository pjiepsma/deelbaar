# Notifications & Search Frontend - Implementation Complete

## Overview
Implemented notifications system and search functionality using Payload's built-in REST API. No custom endpoints required!

---

## Features Implemented

### 1. Notifications System

#### **Notification Bell** (`components/NotificationBell.tsx`)
- Bell icon in tab bar header (all tabs)
- Badge showing unread count
- Opens notifications modal on tap
- Auto-refreshes count every 30 seconds

#### **Notifications Modal** (`app/(modals)/notifications.tsx`)
- Full-screen inbox with FlatList
- Icon-based notification types with colors:
  - Photo request (camera, blue)
  - Photo approved (checkmark, green)
  - Photo rejected (close, red)
  - Review (star, yellow)
  - Favorite (heart, pink)
  - Claim approved (trophy, green)
  - Claim rejected (alert, red)
- Time ago formatting (Dutch: "5m geleden", "2u geleden", etc.)
- Unread indicator (left border + dot)
- Pull to refresh
- "Alles gelezen" button in header
- Tap notification → marks as read + navigates via deep link
- Empty state with helpful text

#### **Hooks** (`lib/hooks/useNotifications.ts`)
- `useNotifications()` - Fetch user's notifications (sorted newest first)
- `useUnreadCount()` - Get count (polls every 30s)
- `useMarkAsRead(notificationId)` - Mark single as read
- `useMarkAllAsRead()` - Batch mark all as read

**API Usage:**
```typescript
// Get notifications
GET /api/notifications?where[user][equals]=userId&sort=-createdAt&limit=100

// Mark as read
PATCH /api/notifications/:id
Body: { read: true }

// Count unread
GET /api/notifications?where[user][equals]=userId&where[read][equals]=false&limit=0
```

---

### 2. Search Functionality

#### **Backend Search Hook** (`lib/hooks/useSearch.ts`)
- Text search across name, description, tags
- Category filtering
- Geospatial filtering (near location with radius)
- Distance calculation and sorting
- Debounced queries (500ms)

**Complex Where Query:**
```typescript
const where = {
  and: [
    { publishStatus: { equals: 'live' } },
    {
      or: [
        { name: { contains: query } },
        { description: { contains: query } },
        { 'tags.tag': { contains: query } }
      ]
    },
    { category: { equals: category } }, // optional
    { 'location.coordinates': { near: [lon, lat, radius] } } // optional
  ]
}
```

#### **Map Integration** (`app/(tabs)/index.tsx`)
- Existing search input now uses backend
- 500ms debounce to prevent excessive queries
- Automatically includes user location for distance sorting
- Falls back to bounds query when no search
- Shows loading state while searching

**How it works:**
1. User types in search box
2. After 500ms, backend query executes
3. Results replace map listings
4. Distance calculated for each result
5. Sorted by proximity (if location available)

---

### 3. Deep Linking Support

#### **URL Handler** (`app/_layout.tsx`)
- Listens for deep links on app open and while running
- Scheme: `deelbaar://`

**Supported URLs:**
- `deelbaar://listing/123` → Opens listing detail modal
- `deelbaar://notification/456` → Opens notifications inbox

**Usage in notifications:**
```typescript
// Backend creates notification with:
actionUrl: "deelbaar://listing/abc123"

// Frontend handles tap:
1. Mark notification as read
2. Parse actionUrl
3. Navigate to listing modal
```

---

## How to Test

### Notifications

1. **Create test notification** (via backend admin or hooks):
```bash
POST http://localhost:4000/api/notifications
{
  "user": "USER_ID",
  "type": "favorite",
  "title": "Test Notification",
  "message": "Someone favorited your listing!",
  "read": false,
  "actionUrl": "deelbaar://listing/LISTING_ID"
}
```

2. **In app:**
   - Check bell icon shows badge with count
   - Tap bell → modal opens
   - See notification in list
   - Tap notification → marks as read + navigates
   - Pull to refresh → updates list
   - Tap "Alles gelezen" → all marked as read

### Search

1. **On map screen:**
   - Type "Harry Potter" in search box
   - Wait 500ms → backend query executes
   - See search results on map
   - Results sorted by distance
   - Clear search → returns to bounds view

2. **With filters:**
   - Select category filter
   - Type search query
   - Both applied to backend query

### Deep Linking

1. **From terminal:**
```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "deelbaar://listing/123"

# iOS Simulator
xcrun simctl openurl booted "deelbaar://listing/123"
```

2. **From notification:**
   - Tap push notification
   - App opens to correct screen

---

## Files Created

- `deelbaar/lib/hooks/useNotifications.ts` - Notification hooks
- `deelbaar/lib/hooks/useSearch.ts` - Search hook
- `deelbaar/components/NotificationBell.tsx` - Bell with badge
- `deelbaar/app/(modals)/notifications.tsx` - Inbox modal

## Files Modified

- `deelbaar/app/(tabs)/_layout.tsx` - Added header with bell
- `deelbaar/app/(tabs)/index.tsx` - Integrated backend search
- `deelbaar/app/_layout.tsx` - Added deep linking
- `deelbaar/lib/types/models.ts` - Added NotificationRecord type

---

## Benefits

### Notifications
- Users never miss important events
- Persistent history (not just ephemeral push)
- In-app inbox for better UX
- Deep linking to relevant content
- Respects notification preferences

### Search
- Find specific items across entire map
- Location-aware results with distance
- Fast backend queries with Payload's API
- Category filtering
- Better discovery experience

### Deep Linking
- Seamless navigation from notifications
- Opens app to specific content
- Works from push notifications
- Standard URL scheme

---

## Next Steps (Optional Enhancements)

1. **Search UI Improvements:**
   - Search results overlay with list view
   - "X more results outside map view"
   - Search history

2. **Notification Enhancements:**
   - Group notifications by type
   - Notification preferences UI
   - Mark as read on scroll

3. **Deep Linking:**
   - More URL patterns (reviews, users, etc.)
   - Universal links (HTTPS URLs)

4. **Performance:**
   - Cache search results
   - Optimize notification polling
   - Pagination for notifications

---

## Architecture Decisions

### Why No Custom Endpoints?
- Payload's REST API handles complex queries
- `where` clause supports nested conditions
- `near` operator for geospatial queries
- Less code to maintain
- Automatic validation and access control

### Why Debounced Search?
- Prevents excessive API calls while typing
- Better UX (less flickering)
- Reduces backend load
- 500ms is sweet spot

### Why Modal for Notifications?
- Doesn't add 6th tab (clean UI)
- Full-screen for better readability
- Instagram/Twitter pattern (familiar)
- Easy to dismiss

---

## Troubleshooting

### Bell not showing count
- Check user is authenticated
- Verify notifications collection exists in backend
- Check console for API errors
- Ensure `user` field matches current user ID

### Search not working
- Check PAYLOAD_URL in .env
- Verify listings have coordinates
- Check console for query errors
- Test with simple query first

### Deep linking not working
- Verify `scheme: "deelbaar"` in app.json
- Rebuild app after adding scheme
- Check URL format matches handler
- Look for errors in `handleDeepLink`

---

## API Reference

### Notifications Collection
```typescript
{
  user: string              // User ID
  type: string              // Notification type
  title: string             // Short title
  message: string           // Full message
  read: boolean             // Read status
  data?: object             // Extra data
  actionUrl?: string        // Deep link URL
  createdAt: string         // ISO timestamp
  updatedAt: string         // ISO timestamp
}
```

### Search Query
```typescript
POST /api/listings
{
  where: {
    and: [
      { publishStatus: { equals: 'live' } },
      { or: [{ name: { contains: 'query' } }, ...] },
      { category: { equals: 'book' } },
      { 'location.coordinates': { near: [lon, lat, 50000] } }
    ]
  },
  limit: 50,
  depth: 2
}
```



