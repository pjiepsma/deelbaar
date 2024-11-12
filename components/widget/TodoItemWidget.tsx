import { AttachmentRecord } from '@powersync/attachments';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerResult } from 'expo-image-picker';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Image, ListItem } from 'react-native-elements';

import { AppConfig } from '~/lib/powersync/AppConfig';
import { PictureRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';

export interface TodoItemWidgetProps {
  record: PictureRecord;
  photoAttachment: AttachmentRecord | null;
  onSavePhoto: (data: ImagePickerResult) => Promise<void>;
  // onToggleCompletion: (completed: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const isAndroid = Platform.OS === 'android';

export const TodoItemWidget: React.FC<TodoItemWidgetProps> = (props) => {
  const { record, photoAttachment, onDelete, onSavePhoto } = props;
  const [loading, setLoading] = React.useState(false);
  const system = useSystem();

  const captureImageAsync = async () => {
    const options = {
      base64: true,
      quality: 0.5,
      skipProcessing: isAndroid,
    };
    const photo = await ImagePicker.launchImageLibraryAsync(options);
    await onSavePhoto(photo);
  };

  return (
    <View key={`todo-item-${record.id}`} style={{ padding: 10 }}>
      <ListItem.Swipeable
        bottomDivider
        rightContent={
          <Button
            containerStyle={{
              flex: 1,
              justifyContent: 'center',
              backgroundColor: '#d3d3d3',
            }}
            type="clear"
            icon={{ name: 'delete', color: 'red' }}
            onPress={() => {
              Alert.alert(
                'Confirm',
                'This item will be permanently deleted',
                [{ text: 'Cancel' }, { text: 'Delete', onPress: () => onDelete?.() }],
                { cancelable: true }
              );
            }}
          />
        }>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <ListItem.CheckBox
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            // checked={record.completed}
            // onPress={async () => {
            //   setLoading(true);
            //   await onToggleCompletion(!record.completed);
            //   setLoading(false);
            // }}
          />
        )}
        <ListItem.Content style={{ minHeight: 80 }}>
          <ListItem.Title>{record.created_at}</ListItem.Title>
        </ListItem.Content>
        {AppConfig.SUPABASE_BUCKET &&
          (record.photo_id == null ? (
            <TouchableOpacity onPress={captureImageAsync}>
              <Text>Flip Camera</Text>
            </TouchableOpacity>
          ) : // <Icon name="camera" type="font-awesome" onPress={() => setCameraVisible(true)} /> // Photo window TODO open expo camera
          photoAttachment?.local_uri != null ? (
            <Image
              source={{ uri: system.attachmentQueue?.getLocalUri(photoAttachment.local_uri) }}
              containerStyle={styles.item}
              PlaceholderContent={<ActivityIndicator />}
            />
          ) : (
            <ActivityIndicator />
          ))}
      </ListItem.Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    aspectRatio: 1,
    width: '100%',
    flex: 1,
  },
});
