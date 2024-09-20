import { ATTACHMENT_TABLE } from '@powersync/attachments';

import { LISTING_TABLE, PICTURE_TABLE } from '~/lib/powersync/AppSchema';

export const SelectListings = `
    SELECT ${LISTING_TABLE}.*
    FROM ${LISTING_TABLE}
             LEFT JOIN ${PICTURE_TABLE} ON ${LISTING_TABLE}.id = ${PICTURE_TABLE}.listing_id
    GROUP BY ${LISTING_TABLE}.id;
`;

export const InsertListing = `INSERT INTO ${LISTING_TABLE} (id, name, description, location, owner_id, created_at)
                              VALUES (uuid(), ?, ?, ?, ?, datetime()) RETURNING *`;

export const DeleteListingPictures = `DELETE
                                      FROM ${PICTURE_TABLE}
                                      WHERE listing_id = ?`;

export const DeleteListing = `DELETE
                              FROM ${LISTING_TABLE}
                              WHERE id = ?`;

export const SelectListing = `
    SELECT ${LISTING_TABLE}.*,
    FROM ${LISTING_TABLE}
             LEFT JOIN ${PICTURE_TABLE} ON ${LISTING_TABLE}.id = ${PICTURE_TABLE}.listing_id
    WHERE ${LISTING_TABLE}.id = ?
`;

export const UpdatePicture = `UPDATE ${PICTURE_TABLE}
                              SET photo_id = ?
                              WHERE id = ?`;
export const InsertPicture = `INSERT INTO ${PICTURE_TABLE}
                                  (id, created_at, created_by, listing_id)
                              VALUES (uuid(), datetime(), ?, ?)`;
export const DeletePicture = `DELETE
                              FROM ${PICTURE_TABLE}
                              WHERE id = ?`;

export const SelectPictures = `
    SELECT ${PICTURE_TABLE}.id    AS picture_id,
           ${PICTURE_TABLE}.*,
           ${ATTACHMENT_TABLE}.id AS attachment_id,
           ${ATTACHMENT_TABLE}.*
    FROM ${PICTURE_TABLE}
             LEFT JOIN
         ${LISTING_TABLE} ON ${PICTURE_TABLE}.listing_id = ${LISTING_TABLE}.id
             LEFT JOIN
         ${ATTACHMENT_TABLE} ON ${PICTURE_TABLE}.photo_id = ${ATTACHMENT_TABLE}.id
    WHERE ${PICTURE_TABLE}.listing_id = ?`;
