import { ATTACHMENT_TABLE, AttachmentRecord } from '@powersync/attachments';
import { usePowerSync, useQuery } from '@powersync/react-native';
import { ImagePickerResult } from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react'; // @ts-ignore
import { Omit, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FAB } from 'react-native-elements';

import { TodoItemWidget } from '~/components/widget/TodoItemWidget';
import { LISTING_TABLE, PICTURE_TABLE } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { DeletePicture, InsertPicture, UpdatePicture } from '~/lib/powersync/Queries';
import { PictureEntry } from '~/lib/types/types';
import { toAttachmentRecord } from '~/lib/util/util';

const TodoView: React.FC = () => {
  const { connector, powersync, attachmentQueue } = useSystem();
  const powerSync = usePowerSync();
  const params = useLocalSearchParams<{ id: string }>();
  const listID = params.id;

  console.log('Executing SQL query:', 'ListingRecords');
  const {
    data: [listRecord],
  } = useQuery<{ name: string }>(
    `SELECT name
         FROM ${LISTING_TABLE}
         WHERE id = ?`,
    [listID]
  );

  const { data: todos, isLoading } = useQuery<PictureEntry>(
    `
            SELECT ${PICTURE_TABLE}.id    AS picture_id,
                   ${PICTURE_TABLE}.*,
                   ${ATTACHMENT_TABLE}.id AS attachment_id,
                   ${ATTACHMENT_TABLE}.*
            FROM ${PICTURE_TABLE}
                     LEFT JOIN
                 ${LISTING_TABLE} ON ${PICTURE_TABLE}.listing_id = ${LISTING_TABLE}.id
                     LEFT JOIN
                 ${ATTACHMENT_TABLE} ON ${PICTURE_TABLE}.photo_id = ${ATTACHMENT_TABLE}.id
            WHERE ${PICTURE_TABLE}.listing_id = ?`,
    [listID]
  );

  const savePhoto = async (id: string, data: ImagePickerResult) => {
    // We are sure the base64 is not null, as we are using the base64 option in the CameraWidget
    const { id: photoId } = await attachmentQueue!.savePhoto(data.assets![0].base64!);

    await powersync.execute(UpdatePicture, [photoId, id]);
  };

  const createNewImage = async (description: string) => {
    const { userID } = await connector.fetchCredentials();

    await powerSync.execute(InsertPicture, [userID, listID!]);
  };

  const deleteImage = async (id: string, photoRecord?: AttachmentRecord) => {
    await powersync.writeTransaction(async (tx) => {
      if (photoRecord != null) {
        await attachmentQueue!.delete(photoRecord, tx);
      }
      await tx.execute(DeletePicture, [id]);
    });
  };

  if (isLoading) {
    <View>
      <Text>Loading...</Text>
    </View>;
  }

  if (listRecord == null) {
    return (
      <View>
        <Stack.Screen
          options={{
            title: 'List not found',
          }}
        />
        <Text>No matching List found, please navigate back...</Text>
      </View>
    );
  }

  return (
    <View style={{ flexGrow: 1 }}>
      <Stack.Screen
        options={{
          title: listRecord.name,
        }}
      />
      {/*<FAB*/}
      {/*  style={{ zIndex: 99, bottom: 0 }}*/}
      {/*  icon={{ name: 'add', color: 'white' }}*/}
      {/*  size="small"*/}
      {/*  placement="right"*/}
      {/*  onPress={() => {*/}
      {/*    prompt(*/}
      {/*      'Add a new Image',*/}
      {/*      '',*/}
      {/*      (text) => {*/}
      {/*        if (!text) {*/}
      {/*          return;*/}
      {/*        }*/}

      {/*        return createNewImage(text);*/}
      {/*      },*/}
      {/*      { placeholder: 'Todo description', style: 'shimo' }*/}
      {/*    );*/}
      {/*  }}*/}
      {/*/>*/}
      <ScrollView style={{ maxHeight: '90%' }}>
        {todos.map((r) => {
          const record = { ...r, id: r.picture_id };
          const photoRecord = toAttachmentRecord(r);
          return (
            <TodoItemWidget
              key={r.picture_id}
              record={record}
              photoAttachment={photoRecord}
              // onToggleCompletion={(completed) => toggleCompletion(record, completed)}
              onSavePhoto={(data) => savePhoto(r.picture_id, data)}
              onDelete={() => deleteImage(r.picture_id, photoRecord ?? undefined)}
            />
          );
        })}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
};

export default TodoView;
