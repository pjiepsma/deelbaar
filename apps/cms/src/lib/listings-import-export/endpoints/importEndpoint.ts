import { addDataAndFileToRequest, Endpoint } from "payload";
import { parseGoogleKML, cleanHtmlDescription, parseFacilitiesFromBijzonderheid } from "../utils/kmlParser";
import { parseDutchAddress } from "../utils/addressParser";
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const importEndpoint: Endpoint = {
    path: "/listings-import-export/import",
    method: "post",
    handler: async (req) => {
        let tempPath: string | null = null;

        try {
            await addDataAndFileToRequest(req);

            if (!req.user || req.user.role !== "admin") {
                return Response.json(
                    { message: "Geen toegang." },
                    { status: 403 }
                )
            }

            // Read KML file from the request
            if (!req.file?.data) {
                return Response.json(
                    { message: "Geen KML-bestand gevonden." },
                    { status: 400 }
                )
            }

            // Save uploaded file temporarily
            tempPath = join(tmpdir(), `import-${Date.now()}.kml`);
            writeFileSync(tempPath, req.file.data);

            // Parse the KML file
            const parsedData = parseGoogleKML(tempPath);

            if (parsedData.length === 0) {
                return Response.json(
                    { message: "Geen geldige locaties gevonden in KML-bestand." },
                    { status: 400 }
                )
            }

            // Get settings from request
            const defaultCategory = (req.data?.category as string) || 'book';
            const defaultPublishStatus = (req.data?.publishStatus as string) || 'draft';
            const defaultOwnerEmail = (req.data?.ownerEmail as string) || process.env.DEFAULT_OWNER_EMAIL;

            // Get default owner
            let defaultOwner: string | number | null = null;
            if (defaultOwnerEmail) {
                try {
                    const users = await req.payload.find({
                        collection: 'users',
                        where: { email: { equals: defaultOwnerEmail } },
                        limit: 1,
                    });
                    if (users.docs.length > 0) {
                        defaultOwner = users.docs[0].id;
                    }
                } catch (error) {
                    req.payload.logger.warn('Could not find default owner');
                }
            }

            const results = {
                created: 0,
                errors: [] as string[],
            };

            // Transform and import data
            for (let i = 0; i < parsedData.length; i++) {
                const item = parsedData[i];
                const extendedData = item.extendedData || {};

                try {
                    // Parse Dutch address from ExtendedData
                    const parsedAddress = parseDutchAddress(
                        extendedData.Adres,
                        extendedData.Plaatsnaam,
                        extendedData.Provincie
                    );

                    // Fallback to KML address tag if no extended data
                    if (!parsedAddress.fullAddress && item.address) {
                        parsedAddress.fullAddress = item.address;
                    }
                    // Last resort: use name as address
                    if (!parsedAddress.fullAddress) {
                        parsedAddress.fullAddress = item.name;
                    }

                    // Build description: only use Bijzonderheid if it has meaningful content
                    // The KML description field contains structured data we already parse, so skip it
                    let description = '';
                    const bijzonderheid = extendedData.Bijzonderheid?.trim();
                    
                    if (bijzonderheid && bijzonderheid.length > 0) {
                        description = bijzonderheid;
                    }

                    // Fallback description - simple and clean
                    if (!description) {
                        description = `Minibieb locatie in ${parsedAddress.city || item.name}`;
                    }

                    // Build listing object with structured address
                    const listing: any = {
                        name: item.name,
                        description: description.trim(),
                        category: defaultCategory,
                        publishStatus: defaultPublishStatus,
                        location: {
                            street: parsedAddress.street,
                            houseNumber: parsedAddress.houseNumber,
                            zipCode: parsedAddress.zipCode,
                            city: parsedAddress.city,
                            province: parsedAddress.province,
                            country: parsedAddress.country,
                            address: parsedAddress.fullAddress,
                        },
                    };

                    // Add coordinates if available
                    if (item.location?.coordinates) {
                        listing.location.coordinates = item.location.coordinates as [number, number];
                    }

                    if (defaultOwner) {
                        listing.owner = defaultOwner;
                    }

                    // Parse facilities from Bijzonderheid
                    const facilities = parseFacilitiesFromBijzonderheid(bijzonderheid || '');
                    const beheerder = extendedData.Beheerder?.trim();
                    const internet = extendedData.Internet?.trim();

                    if (facilities.length > 0 || internet || beheerder || bijzonderheid) {
                        listing.facilities = {};

                        if (facilities.length > 0) {
                            listing.facilities.facilities = facilities.map((facility) => ({ facility }));
                        }

                        // Build contact info from Beheerder and Internet fields
                        const contactParts: string[] = [];
                        if (beheerder) {
                            contactParts.push(`Beheerder: ${beheerder}`);
                        }
                        if (internet) {
                            contactParts.push(internet);
                        }

                        if (contactParts.length > 0) {
                            listing.facilities.contactInfo = contactParts.join(' | ');
                        }

                        // Add Bijzonderheid as rules if it contains useful info
                        if (bijzonderheid && bijzonderheid.length > 10) {
                            listing.facilities.rules = bijzonderheid;
                        }
                    }

                    // Add tags from ExtendedData
                    const tagFields = ['Adres', 'Plaatsnaam', 'Provincie', 'Bijzonderheid', 'Internet', 'Beheerder'];
                    const remainingData = Object.entries(extendedData)
                        .filter(([key]) => !tagFields.includes(key))
                        .filter(([, value]) => value && value.trim());

                    if (remainingData.length > 0) {
                        listing.tags = [];

                        // Add other remaining fields as tags
                        remainingData.forEach(([key, value]) => {
                            listing.tags.push({ tag: `${key}: ${value}` });
                        });
                    }

                    // Create the listing
                    await req.payload.create({
                        collection: 'listings',
                        data: listing,
                    });

                    results.created++;
                } catch (error: any) {
                    const errorMsg = error?.message || String(error);
                    results.errors.push(`${item.name}: ${errorMsg}`);
                }
            }

            return Response.json(results, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        } catch (err) {
            req.payload.logger.error("Error importing listings data");
            req.payload.logger.error(err);

            return Response.json({ message: "Fout bij importeren van data." }, { status: 500 });
        } finally {
            // Clean up temp file
            if (tempPath) {
                try {
                    unlinkSync(tempPath);
                } catch (error) {
                    req.payload.logger.error('Failed to clean up temp file:', error);
                }
            }
        }
    },
};

