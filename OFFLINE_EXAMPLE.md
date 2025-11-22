# Offline-First Example Usage

## ✅ YES! Your Plan is Realistic

Here's how the offline-first approach works in your scenario:

### User Journey (No Network):

1. **Opens App** → Sees cached listings from SQLite ✅
2. **Views Listing** → Sees cached data ✅
3. **Writes Review** → Queued for sync ✅
4. **Takes Photos** → Saved locally, queued for upload ✅
5. **Closes App** → Everything saved ✅
6. **Gets Network Later** → Auto-syncs in background ✅

---

## Example: Creating a Review with Photos (Offline)

```typescript
import { useCreateReview } from '~/lib/hooks/usePayloadQuery';
import { useSyncStatus } from '~/lib/hooks/useSyncStatus';
import * as ImagePicker from 'expo-image-picker';

function CreateReviewScreen({ listingId }) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  
  const createReview = useCreateReview();
  const syncStatus = useSyncStatus();

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const photo = {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      };
      setPhotos([...photos, photo]);
    }
  };

  const submitReview = async () => {
    try {
      await createReview.mutateAsync({
        rating,
        description,
        listing: listingId,
        photos, // Photos will be queued for upload!
      });

      Alert.alert(
        'Success!',
        syncStatus.hasPendingChanges
          ? 'Review saved! Will sync when online.'
          : 'Review posted!'
      );
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>Rate this listing:</Text>
      <Rating value={rating} onChange={setRating} />

      <TextInput
        placeholder="Write your review..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button title="Add Photo" onPress={pickPhoto} />
      
      {photos.map((photo, index) => (
        <Image key={index} source={{ uri: photo.uri }} style={styles.preview} />
      ))}

      <Button title="Submit Review" onPress={submitReview} />

      {/* Show sync status */}
      {syncStatus.hasPendingChanges && (
        <Text style={styles.offline}>
          📦 {syncStatus.totalPending} items waiting to sync
        </Text>
      )}
    </View>
  );
}
```

---

## Sync Status Component

```typescript
import { useSyncStatus } from '~/lib/hooks/useSyncStatus';

export function SyncStatusIndicator() {
  const { status, hasPendingChanges, totalPending, isSyncing } = useSyncStatus();

  if (!hasPendingChanges && !isSyncing) {
    return null; // Everything synced
  }

  return (
    <View style={styles.syncBar}>
      {isSyncing && (
        <>
          <ActivityIndicator size="small" />
          <Text>Syncing...</Text>
        </>
      )}
      
      {hasPendingChanges && !isSyncing && (
        <>
          <Icon name="cloud-upload-outline" />
          <Text>{totalPending} items will sync when online</Text>
        </>
      )}
    </View>
  );
}
```

---

## How It Works Behind the Scenes

### 1. **User Takes Photo (Offline)**

```typescript
// Photo saved to local file system
const localPath = 'file:///data/offline_uploads/file_123_photo.jpg';

// Added to file queue
fileQueueManager.queueFile({
  uri: localPath,
  type: 'image/jpeg',
  name: 'photo.jpg',
  relatedCollection: 'reviews',
  relatedId: 'temp_review_abc',
});
```

### 2. **User Submits Review (Offline)**

```typescript
// Review saved to SQLite sync queue
sqliteManager.addToSyncQueue({
  collection: 'reviews',
  operation: 'create',
  data: JSON.stringify({
    rating: 5,
    description: 'Great place!',
    listing: 'listing_123',
    _pendingPhotos: ['file_123'], // Reference to queued photo
  }),
});
```

### 3. **User Gets Online Later**

```typescript
// SyncManager detects network
syncManager.sync();

// Step 1: Upload photos first
await fileQueueManager.processQueue();
// ✅ Photo uploaded → mediaId: 'media_xyz'

// Step 2: Create review with uploaded photo reference
await payloadClient.create('reviews', {
  rating: 5,
  description: 'Great place!',
  listing: 'listing_123',
  // Photo ID is updated after upload
});

// Step 3: Create pictures record linking review to media
await payloadClient.create('pictures', {
  photo: 'media_xyz',
  review: 'review_abc',
  created_by: 'user_123',
});
```

---

## What Happens in Different Scenarios

### ✅ Scenario 1: Good 4G Connection
- Photos upload immediately
- Review posted in real-time
- User sees instant feedback

### ✅ Scenario 2: No Network
- Photos saved to device storage
- Review queued in SQLite
- User can keep using app
- Syncs automatically when online

### ✅ Scenario 3: Intermittent Connection
- Some operations succeed immediately
- Failed operations queued and retried
- User doesn't notice the difference

### ✅ Scenario 4: App Closed Before Sync
- All data persisted to disk
- Queue survives app restart
- Syncs next time app opens with network

---

## File Queue Features

### 1. **Local Storage**
Photos are copied to persistent storage, not lost if original is deleted.

### 2. **Automatic Retry**
Failed uploads retried up to 5 times before giving up.

### 3. **Progress Tracking**
```typescript
const { files } = useQueuedFiles();

// Show upload progress
{files.map(file => (
  <View key={file.id}>
    <Text>{file.name}</Text>
    <Text>Retry count: {file.retryCount}/5</Text>
  </View>
))}
```

### 4. **Cleanup**
Successfully uploaded files automatically deleted from local storage.

---

## Best Practices

### 1. **Give Visual Feedback**

```typescript
// Show when offline
if (!networkInfo.isConnected) {
  return <OfflineBanner text="You're offline. Changes will sync later." />;
}

// Show pending items
if (syncStatus.hasPendingChanges) {
  return <SyncIndicator count={syncStatus.totalPending} />;
}
```

### 2. **Handle Photo Compression**

```typescript
const pickPhoto = async () => {
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7, // Compress to 70%
    allowsEditing: true,
    aspect: [4, 3],
  });
  // ...
};
```

### 3. **Show Upload Progress**

```typescript
const { fileQueueSize } = useSyncStatus();

if (fileQueueSize > 0) {
  return (
    <Text>
      📤 Uploading {fileQueueSize} photo{fileQueueSize > 1 ? 's' : ''}...
    </Text>
  );
}
```

### 4. **Handle Storage Limits**

```typescript
// Check available storage before taking photos
const info = await FileSystem.getFreeDiskStorageAsync();
const availableGB = info / (1024 ** 3);

if (availableGB < 0.5) {
  Alert.alert('Low Storage', 'Please free up space before adding more photos');
}
```

---

## Testing Offline Mode

### Airplane Mode Test:

1. ✅ Start app with network
2. ✅ Load some listings
3. ✅ Enable airplane mode
4. ✅ Create review with photo
5. ✅ Close app
6. ✅ Disable airplane mode
7. ✅ Open app → Should auto-sync

### Network Toggle Test:

```typescript
// Manually trigger sync
import { syncManager } from '~/lib/storage/SyncManager';

// In dev menu or settings
<Button title="Force Sync Now" onPress={() => syncManager.sync()} />
<Button title="View Sync Queue" onPress={async () => {
  const queue = await sqliteManager.getSyncQueue();
  const files = fileQueueManager.getQueue();
  console.log('Data queue:', queue);
  console.log('File queue:', files);
}} />
```

---

## Limitations & Trade-offs

### ✅ What Works Great:
- Text data (reviews, comments, etc.)
- Small to medium photos (< 5MB each)
- Moderate queue sizes (< 100 items)
- Single device per user

### ⚠️ Consider for:
- **Large videos** - May want to warn user or prevent offline upload
- **Huge queues** - Could cause battery drain on sync
- **Multi-device** - No cross-device sync of queued items
- **Storage limits** - Photos stored locally until uploaded

---

## Summary

**YES! Your plan is absolutely realistic and works great!**

The architecture handles:
- ✅ Browse cached data offline
- ✅ Create reviews offline
- ✅ Take and queue photos offline
- ✅ Auto-sync when online
- ✅ Survives app restarts
- ✅ Handles intermittent connectivity

The user gets a smooth experience whether online or offline! 🎉











