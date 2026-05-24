import { Endpoint } from "payload";
import type { Where } from "payload";
import {
    MAP_PLACE_COLLECTION_SLUGS,
    MAP_PLACE_SUBTYPE_FIELD_BY_COLLECTION,
    MAP_PLACE_SUBTYPE_OPTIONS_BY_COLLECTION,
    type MapPlaceCollectionSlug,
} from "../../../constants/mapPlaces";

function parseCollection(input: unknown): MapPlaceCollectionSlug | null {
    if (input === "kiosks" || input === "markets" || input === "taps") {
        return input;
    }
    return null;
}

function subtypeForCollection(
    collection: MapPlaceCollectionSlug,
    place: Record<string, unknown>,
): string | undefined {
    const fieldName = MAP_PLACE_SUBTYPE_FIELD_BY_COLLECTION[collection];
    const value = place[fieldName];
    return typeof value === "string" ? value : undefined;
}

export const exportEndpoint: Endpoint = {
    path: "/listings-import-export/export",
    method: "post",
    handler: async (req) => {
        try {
            if (!req.user || req.user.role !== "admin") {
                return new Response("Geen toegang.", {
                    status: 403,
                });
            }

            // Get filter options from request body
            const body =
              typeof (req as Request).json === 'function'
                ? await (req as Request).json()
                : {};
            const collectionFilter = parseCollection(body?.collection);
            const subtypeFilter = typeof body?.subtype === "string" ? body.subtype.trim() : undefined;
            const publishStatus = body?.publishStatus as string | undefined;

            const where: Record<string, unknown> = {};
            if (publishStatus) {
                where.publishStatus = { equals: publishStatus };
            }

            const collectionsToExport = collectionFilter
                ? [collectionFilter]
                : [...MAP_PLACE_COLLECTION_SLUGS];
            if (subtypeFilter && collectionsToExport.length !== 1) {
                return new Response("Subtype filter requires a single collection.", {
                    status: 400,
                });
            }
            const allDocs: Array<{ collection: MapPlaceCollectionSlug; doc: Record<string, unknown> }> = [];

            for (const collection of collectionsToExport) {
                const scopedWhere: Where = { ...where } as Where;
                if (subtypeFilter) {
                    const options = MAP_PLACE_SUBTYPE_OPTIONS_BY_COLLECTION[collection];
                    const subtypeAllowed = options.some((option) => option.value === subtypeFilter);
                    if (!subtypeAllowed) {
                        return new Response(
                            `Invalid subtype for ${collection}. Use: ${options.map((option) => option.value).join(", ")}`,
                            { status: 400 },
                        );
                    }
                    scopedWhere[MAP_PLACE_SUBTYPE_FIELD_BY_COLLECTION[collection]] = { equals: subtypeFilter };
                }
                const data = await req.payload.find({
                    collection,
                    depth: 1,
                    pagination: false,
                    where: Object.keys(scopedWhere).length > 0 ? scopedWhere : undefined,
                });
                for (const doc of data.docs as Record<string, unknown>[]) {
                    allDocs.push({ collection, doc });
                }
            }

            if (allDocs.length === 0) {
                return new Response("No data found", { status: 404 });
            }

            // Generate KML
            const kmlPlacemarks = allDocs.map(({ collection, doc }) => {
                const listing = doc as {
                    name?: string;
                    description?: string;
                    location?: { coordinates?: [number, number]; address?: string };
                    facilities?: { contactInfo?: string; openingHours?: string };
                    [key: string]: unknown;
                };
                const coordinates = listing.location?.coordinates;
                
                if (!coordinates || coordinates.length < 2) {
                    return null;
                }

                const [longitude, latitude] = coordinates;
                const name = escapeXml(listing.name || 'Unnamed');
                const description = escapeXml(listing.description || '');
                const address = escapeXml(listing.location?.address || '');

                const subtype = subtypeForCollection(collection, listing);

                // Build extended data
                let extendedData = '';
                extendedData += `
        <Data name="Collection">
          <value>${escapeXml(collection)}</value>
        </Data>`;
                if (subtype) {
                    extendedData += `
        <Data name="PlaceSubtype">
          <value>${escapeXml(subtype)}</value>
        </Data>`;
                }
                if (listing.facilities?.contactInfo) {
                    extendedData += `
        <Data name="Contact">
          <value>${escapeXml(listing.facilities.contactInfo)}</value>
        </Data>`;
                }
                if (listing.facilities?.openingHours) {
                    extendedData += `
        <Data name="OpeningHours">
          <value>${escapeXml(listing.facilities.openingHours)}</value>
        </Data>`;
                }

                return `
    <Placemark>
      <name>${name}</name>
      <address>${address}</address>
      <description><![CDATA[${description}]]></description>
      <Point>
        <coordinates>${longitude},${latitude},0</coordinates>
      </Point>${extendedData ? `
      <ExtendedData>${extendedData}
      </ExtendedData>` : ''}
    </Placemark>`;
            }).filter(Boolean).join('');

            const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Deelbaar Places Export</name>${kmlPlacemarks}
  </Document>
</kml>`;

            return new Response(kml, {
                headers: {
                    "Content-Type": "application/vnd.google-earth.kml+xml",
                    "Content-Disposition": `attachment; filename="places-export-${Date.now()}.kml"`,
                },
            });
        } catch (error) {
            req.payload.logger.error("Error exporting map places");
            req.payload.logger.error(error);
            
            return new Response("Error exporting data", {
                status: 500,
            });
        }
    }
};

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

