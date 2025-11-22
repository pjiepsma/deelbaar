# Login Test Guide

## ✅ Login is Now Set Up with Payload CMS!

Your React Native app now authenticates against the Payload CMS backend.

---

## Where to Find Login Screens

### Option 1: Profile Tab → Auth Screen
Navigate in app: **Profile Tab** → **Auth** button

File: `app/(tabs)/profile/auth.tsx`

### Option 2: Hidden Login Screen
File: `hidden/login.tsx`

---

## Test Users (From Seed)

Use these credentials created by `pnpm seed`:

| Email | Password | Type |
|-------|----------|------|
| `admin@example.com` | `password123` | Admin |
| `john.doe@example.com` | `password123` | User |
| `jane.smith@example.com` | `password123` | User |
| `bob.wilson@example.com` | `password123` | User |

---

## Testing Login Flow

### 1. Make Sure Backend is Running

```bash
cd deelbaar-api
pnpm dev

# Should show:
# ○ Compiling / ...
# ✓ Compiled / in XXms
# ✓ Ready on http://localhost:4000
```

### 2. Make Sure .env is Configured

`deelbaar/.env`:
```
EXPO_PUBLIC_PAYLOAD_URL=http://192.168.1.186:4000
```

### 3. Open the App

```bash
cd deelbaar
yarn start
```

### 4. Navigate to Login

**Path 1:** Bottom tabs → Profile → Auth button  
**Path 2:** If you set up hidden route → /hidden/login

### 5. Test Login

**Enter:**
- Email: `john.doe@example.com`
- Password: `password123`

**Tap:** "Sign in" button

**Expected Result:**
- ✅ Alert: "Success - Logged in successfully!"
- ✅ User object populated in context
- ✅ Token stored in AsyncStorage
- ✅ Sync manager initialized

---

## What Happens Behind the Scenes

```typescript
// User taps "Sign in"
signIn(email, password)
  ↓
payloadClient.login(email, password)
  ↓
POST http://192.168.1.186:4000/api/users/login
  ↓
Payload CMS validates credentials
  ↓
Returns: { token: "JWT...", user: {...} }
  ↓
Token saved to AsyncStorage
  ↓
User state updated in context
  ↓
SyncManager initialized
  ↓
Auto-sync starts fetching data
```

---

## Debugging Login Issues

### Issue: "Cannot connect to Payload API"

**Check:**
1. Backend is running: `http://192.168.1.186:4000`
2. Test in browser on phone: Open browser and go to `http://192.168.1.186:4000/api/users`
3. Both devices on same WiFi network

**Solution:**
```bash
# On phone browser, should see JSON response
# If not, check firewall or IP address
```

### Issue: "Invalid credentials"

**Check:**
1. User exists in Payload CMS
2. Password is correct (`password123` for seed users)
3. Check Payload admin: `http://localhost:4000/admin`

**Solution:**
```bash
# Re-run seed to ensure users exist
cd deelbaar-api
pnpm seed
```

### Issue: "Login succeeds but no data loads"

**Check:**
1. Console logs for errors
2. Press `j` in Expo terminal to open debugger
3. Check network tab for API calls

**Solution:**
```typescript
// In AuthProvider, check initAuth()
// Should see sync manager initialization
```

### Issue: "Token expired"

Payload tokens expire after 2 hours. The app should handle this automatically.

**Manual refresh:**
```typescript
// Sign out and sign back in
await signOut();
await signIn(email, password);
```

---

## Testing Different Scenarios

### 1. Test New Account Creation

```typescript
// In auth screen
Email: newuser@example.com
Password: mypassword123

// Tap "Sign Up"
// Should create user in Payload
// Then you can sign in with those credentials
```

### 2. Test Anonymous Login

```typescript
// Tap "Anonymously" button
// Should create anonymous user
// Can browse app without email/password
```

### 3. Test Sign Out

```typescript
// Tap "Sign out"
// Should clear token
// Should create new anonymous user
// Should clear sync data
```

### 4. Test Token Persistence

```typescript
// Sign in
// Close app completely
// Reopen app
// Should still be signed in (token persists in AsyncStorage)
```

---

## Verify Login Worked

After successful login, check:

### In React DevTools:
```typescript
// AuthContext should have:
{
  user: {
    id: "...",
    email: "john.doe@example.com",
    username: "johndoe",
    ...
  },
  token: "eyJhbGc...",
  isLoading: false
}
```

### In AsyncStorage:
```typescript
// Check stored data
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = await AsyncStorage.getItem('auth_token');
const user = await AsyncStorage.getItem('auth_user');
console.log('Token:', token);
console.log('User:', JSON.parse(user));
```

### In Network Tab:
Should see successful POST to:
```
POST http://192.168.1.186:4000/api/users/login
Status: 200
Response: { token: "...", user: {...} }
```

---

## Console Commands for Testing

Add these to a dev menu for easy testing:

```typescript
import { payloadClient } from '~/lib/api/PayloadClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check current auth state
console.log('User:', payloadClient.getUser());
console.log('Token:', payloadClient.getToken());
console.log('Is Authenticated:', payloadClient.isAuthenticated());

// Check stored data
const token = await AsyncStorage.getItem('auth_token');
const user = await AsyncStorage.getItem('auth_user');
console.log('Stored token:', token);
console.log('Stored user:', user);

// Test API call
const { data, error } = await payloadClient.me();
console.log('Me endpoint:', data, error);
```

---

## Expected Flow

### On App Launch:
1. ✅ AuthProvider initializes
2. ✅ Checks for stored token in AsyncStorage
3. ✅ If found → auto-login
4. ✅ If not found → create anonymous user
5. ✅ Sync manager starts

### On Manual Login:
1. ✅ User enters email/password
2. ✅ Taps "Sign in"
3. ✅ POST to `/api/users/login`
4. ✅ Token stored in AsyncStorage
5. ✅ User state updated
6. ✅ Sync starts fetching data

### On Sign Out:
1. ✅ Clear AsyncStorage
2. ✅ Clear sync data
3. ✅ Create new anonymous user
4. ✅ User can continue using app

---

## Quick Test Checklist

- [ ] Backend running (`pnpm dev`)
- [ ] Seed data created (`pnpm seed`)
- [ ] Mobile app running (`yarn start`)
- [ ] .env file configured
- [ ] Navigate to auth screen
- [ ] Enter: `john.doe@example.com` / `password123`
- [ ] Tap "Sign in"
- [ ] See success message
- [ ] Check user is logged in
- [ ] Data should start loading

---

## Next Steps After Login Works

1. Test creating a listing
2. Test adding favorites
3. Test creating reviews with photos
4. Test offline mode
5. Test sign out and re-login

---

**Try it now!** Open the app, go to Profile → Auth, and login with:
- Email: `john.doe@example.com`
- Password: `password123`

Should work! 🎉











