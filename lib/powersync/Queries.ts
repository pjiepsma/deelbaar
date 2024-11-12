import { ATTACHMENT_TABLE } from '@powersync/attachments';

import {
  LISTING_TABLE,
  PICTURE_TABLE,
  PROFILES_TABLE,
  REVIEW_TABLE,
} from '~/lib/powersync/AppSchema';

export const SelectListings = `
    SELECT ${LISTING_TABLE}.*
    FROM ${LISTING_TABLE}
             LEFT JOIN ${PICTURE_TABLE} ON ${LISTING_TABLE}.id = ${PICTURE_TABLE}.listing_id
    GROUP BY ${LISTING_TABLE}.id;
`;

export const InsertListing = `INSERT INTO ${LISTING_TABLE} (id, name, description, location, owner_id, created_at, category)
                              VALUES (uuid(), ?, ?, ?, ?, datetime(), ?) RETURNING *`;

export const DeleteListingPictures = `DELETE
                                      FROM ${PICTURE_TABLE}
                                      WHERE listing_id = ?`;

export const DeleteListing = `DELETE
                              FROM ${LISTING_TABLE}
                              WHERE id = ?`;

export const SelectListing = `
    SELECT *
    FROM ${LISTING_TABLE}
    WHERE id = ?
`;

export const SelectFavoriteListings = `
    SELECT *
    FROM ${LISTING_TABLE}
    WHERE id = ?
`;

export const SelectProfile = `
    SELECT P.*, A.id AS attachment_id, A.*
    FROM ${PROFILES_TABLE} AS P
             LEFT JOIN ${ATTACHMENT_TABLE} AS A ON P.avatar = A.id
    WHERE P.id = ?
`;

export const SelectReviews = `
    SELECT ${REVIEW_TABLE}.*, P.name, A.id AS attachment_id, A.*
    FROM ${REVIEW_TABLE}
             LEFT JOIN ${PROFILES_TABLE} AS P ON ${REVIEW_TABLE}.created_by = P.id
             LEFT JOIN ${ATTACHMENT_TABLE} AS A ON P.avatar = A.id
    WHERE ${REVIEW_TABLE}.listing_id = ?
`;

export const UpdatePicture = `UPDATE ${PICTURE_TABLE}
                              SET photo_id = ?
                              WHERE id = ?`;

export const InsertPicture = `INSERT INTO ${PICTURE_TABLE}
                                  (id, created_at, created_by, listing_id, photo_id, review_id)
                              VALUES (uuid(), datetime(), ?, ?, ?, ?) RETURNING *`;

export const InsertReview = `INSERT INTO ${REVIEW_TABLE}
                                 (id, created_at, rating, description, created_by, listing_id)
                             VALUES (uuid(), datetime(), ?, ?, ?, ?) RETURNING *`;

export const DeletePicture = `DELETE
                              FROM ${PICTURE_TABLE}
                              WHERE id = ?`;

export const SelectLatestImages = (listing_ids: string[]) => `
    SELECT P.id AS picture_id,
           P.*,
           A.id AS attachment_id,
           A.*
    FROM ${PICTURE_TABLE} AS P
             LEFT JOIN ${ATTACHMENT_TABLE} AS A ON P.photo_id = A.id
    WHERE P.id IN (SELECT P1.id
                   FROM ${PICTURE_TABLE} AS P1
                   WHERE P1.listing_id IN (${listing_ids.map(() => '?').join(',')})
                     AND P1.created_at = (SELECT MAX(P2.created_at)
                                          FROM ${PICTURE_TABLE} AS P2
                                          WHERE P2.listing_id = P1.listing_id))
    ORDER BY P.created_at DESC
`;

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
    WHERE ${PICTURE_TABLE}.listing_id = ?
    ORDER BY ${PICTURE_TABLE}.created_at DESC`;

export const AddFavorite = `
    INSERT INTO favorites (id, created_by, listing_id)
    VALUES (uuid(), ?, ?) RETURNING *;
`;

export const RemoveFavorite = `
    DELETE
    FROM favorites
    WHERE created_by = ?
      AND listing_id = ? RETURNING *;
`;

export const GetFavoriteListings = `
    SELECT l.*
    FROM listings l
             JOIN favorites f ON l.id = f.listing_id
    WHERE f.created_by = ?;
`;
