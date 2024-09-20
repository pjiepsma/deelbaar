import { AttachmentRecord } from '@powersync/attachments';
import _ from 'lodash';

import { PictureEntry } from '~/lib/types/types';

export const toAttachmentRecord = _.memoize((entry: PictureEntry): AttachmentRecord | null => {
  return entry.attachment_id == null
    ? null
    : {
        id: entry.attachment_id,
        filename: entry.filename!,
        state: entry.state!,
        timestamp: entry.timestamp,
        local_uri: entry.local_uri,
        media_type: entry.media_type,
        size: entry.size,
      };
});
