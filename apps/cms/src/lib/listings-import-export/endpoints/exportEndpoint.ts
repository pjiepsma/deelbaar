import { Endpoint } from "payload";

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
            const category = body?.category as string | undefined;
            const publishStatus = body?.publishStatus as string | undefined;

            // Build where clause
            const where: any = {};
            if (category) {
                where.category = { equals: category };
            }
            if (publishStatus) {
                where.publishStatus = { equals: publishStatus };
            }

            const data = await req.payload.find({
                collection: "listings",
                depth: 1,
                pagination: false,
                where: Object.keys(where).length > 0 ? where : undefined,
            });

            if (!data || !data.docs) {
                return new Response("No data found", {
                    status: 404,
                });
            }

            // Generate KML
            const kmlPlacemarks = data.docs.map((doc) => {
                const listing = doc as any;
                const coordinates = listing.location?.coordinates;
                
                if (!coordinates || coordinates.length < 2) {
                    return null;
                }

                const [longitude, latitude] = coordinates;
                const name = escapeXml(listing.name || 'Unnamed');
                const description = escapeXml(listing.description || '');
                const address = escapeXml(listing.location?.address || '');

                // Build extended data
                let extendedData = '';
                if (listing.category) {
                    extendedData += `
        <Data name="Category">
          <value>${escapeXml(listing.category)}</value>
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
    <name>Deelbaar Listings Export</name>${kmlPlacemarks}
  </Document>
</kml>`;

            return new Response(kml, {
                headers: {
                    "Content-Type": "application/vnd.google-earth.kml+xml",
                    "Content-Disposition": `attachment; filename="listings-export-${Date.now()}.kml"`,
                },
            });
        } catch (error) {
            req.payload.logger.error("Error exporting listings");
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

