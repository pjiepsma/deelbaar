# Getting Started - Deelbaar Mobile App

## Prerequisites

- Node.js installed (v18+)
- Yarn installed
- For iOS: macOS with Xcode
- For Android: Android Studio installed

## Quick Start

### 1. Install Dependencies

```bash
cd deelbaar
yarn install
```

### 2. Set Up Environment Variables

Create `.env` file:

```bash
# For Android Emulator
EXPO_PUBLIC_PAYLOAD_URL=http://10.0.2.2:4000

# For iOS Simulator
# EXPO_PUBLIC_PAYLOAD_URL=http://localhost:4000

# For Physical Device (replace with your computer's IP)
# EXPO_PUBLIC_PAYLOAD_URL=http://192.168.1.XXX:4000
```

To find your computer's IP:
- **Windows**: `ipconfig` (look for IPv4 Address)
- **Mac/Linux**: `ifconfig` (look for inet)

### 3. Start the Development Server

```bash
yarn start
```

This will open the Expo Dev Tools in your browser.

### 4. Run on Device/Emulator

**Option A: Use Expo Go App (Easiest)**

1. Install "Expo Go" app on your phone from App Store / Play Store
2. Scan the QR code shown in terminal
3. Make sure phone and computer are on same WiFi

**Option B: Android Emulator**

1. Make sure Android Studio is installed
2. Start an Android emulator (AVD)
3. In terminal, press `a` to open on Android

```bash
# Or run directly
yarn android
```

**Option C: iOS Simulator (Mac only)**

```bash
yarn ios
```

### 5. Development Build (If Expo Go doesn't work)

Some native modules require a development build:

```bash
# Build for Android
yarn eas

# Or for iOS
npx expo run:ios
```

## Common Issues & Solutions

### "Unable to connect to Payload API"

**Problem**: App can't reach backend  
**Solution**: Check your `EXPO_PUBLIC_PAYLOAD_URL` in `.env`

- Android Emulator: `http://10.0.2.2:4000`
- iOS Simulator: `http://localhost:4000`
- Physical Device: `http://YOUR_COMPUTER_IP:4000`

Make sure backend is running:
```bash
cd deelbaar-api
pnpm dev
```

### "Location permission denied"

**Problem**: Map not showing user location  
**Solution**: Grant location permissions in device settings

### Metro bundler stuck

**Problem**: Changes not reflecting  
**Solution**: Clear cache and restart

```bash
yarn start --clear
```

### Dependencies installation fails

**Problem**: Yarn/npm errors  
**Solution**: 

```bash
# Clear cache
rm -rf node_modules
yarn cache clean
yarn install
```

## Project Structure

```
deelbaar/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Map screen
│   │   ├── favorites/     # Favorites
│   │   └── profile/       # Profile & auth
│   ├── (modals)/          # Modal screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # Core functionality
│   ├── api/              # Payload API client
│   ├── storage/          # SQLite & sync
│   ├── hooks/            # React hooks
│   └── providers/        # Context providers
└── constants/            # Colors, styles, types
```

## Development Workflow

1. **Backend Running**
   ```bash
   cd deelbaar-api
   pnpm dev
   ```

2. **Mobile App Running**
   ```bash
   cd deelbaar
   yarn start
   ```

3. **Make Changes**
   - Edit files
   - Save (Metro will auto-reload)
   - Shake device for dev menu

## Testing Features

### Test Authentication
- App auto-signs in anonymously
- Go to Profile tab to sign in with:
  - Email: `john.doe@example.com`
  - Password: `password123`

### Test Map View
- Should show 5 listings across Netherlands
- Tap markers to see listing details

### Test Offline Mode
1. Open app (loads data)
2. Enable airplane mode
3. Browse listings (works offline!)
4. Create review with photo
5. Disable airplane mode
6. Data syncs automatically

### Test Favorites
- Tap heart icon on listings
- View in Favorites tab
- Works offline!

## Useful Commands

```bash
# Start development server
yarn start

# Run on Android
yarn android

# Run on iOS
yarn ios

# Clear cache and restart
yarn start --clear

# Check for issues
npx expo-doctor

# Update dependencies
yarn upgrade-interactive
```

## Debugging

### Enable Remote Debugging

1. Shake device
2. Tap "Debug Remote JS"
3. Opens Chrome DevTools

### View Logs

```bash
# React Native logs
npx react-native log-android
npx react-native log-ios

# Or use Expo
yarn start
# Then press 'j' to open debugger
```

### Inspect Network Requests

Use React Native Debugger or Reactotron:

```bash
# Install Reactotron (optional)
brew install --cask reactotron
```

## Production Build

### Android APK

```bash
yarn eas
```

### iOS IPA

```bash
npx expo build:ios
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_PAYLOAD_URL` | Backend API URL | `http://10.0.2.2:4000` |

## Next Steps

1. ✅ Run `yarn install`
2. ✅ Create `.env` file
3. ✅ Start backend (`pnpm dev` in deelbaar-api)
4. ✅ Run `yarn start`
5. ✅ Scan QR code with Expo Go app
6. ✅ Test the app!

## Need Help?

- Expo Docs: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/
- Payload Docs: https://payloadcms.com/docs

Happy coding! 🚀











