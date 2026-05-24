"use client";
import {
    Button,
    Gutter,
    LoadingOverlay,
    Select,
} from "@payloadcms/ui";
import React, { useState } from "react";
import { Option } from "@payloadcms/ui/elements/ReactSelect";
import {
  MAP_PLACE_COLLECTION_SLUGS,
  MAP_PLACE_LABEL_BY_COLLECTION,
  MAP_PLACE_SUBTYPE_OPTIONS_BY_COLLECTION,
  type MapPlaceCollectionSlug,
} from "../../../../constants/mapPlaces";

export const ExportDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [collection, setCollection] = useState<MapPlaceCollectionSlug | undefined>(undefined);
    const [subtype, setSubtype] = useState<string | undefined>(undefined);
    const [publishStatus, setPublishStatus] = useState<string | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    const collectionOptions = [
        { label: 'Alle collecties', value: '' },
        ...MAP_PLACE_COLLECTION_SLUGS.map((row) => ({
          label: MAP_PLACE_LABEL_BY_COLLECTION[row],
          value: row,
        })),
    ];

    const statusOptions = [
        { label: 'Alle statussen', value: '' },
        { label: 'Draft', value: 'draft' },
        { label: 'Live', value: 'live' },
    ];

    async function handleSubmit() {
        setLoading(true);
        setErrorMessage(undefined);

        try {
            const response = await fetch("/api/listings-import-export/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    collection: collection || undefined,
                    subtype: subtype || undefined,
                    publishStatus: publishStatus || undefined,
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");

                a.href = url;
                a.download = `places-export-${Date.now()}.kml`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                setErrorMessage(
                    "Er is een fout opgetreden bij het exporteren van places."
                );
            }
        } catch (_error) {
            setErrorMessage(
                "Er is een fout opgetreden bij het exporteren van places."
            );
        }

        setLoading(false);
    }

    const handleCollectionChange = (opt: Option) => {
        const nextCollection = (opt.value as MapPlaceCollectionSlug) || undefined;
        setCollection(nextCollection);
        setSubtype(undefined);
    };

    const handleSubtypeChange = (opt: Option) => {
        setSubtype((opt.value as string) || undefined);
    };

    const handleStatusChange = (opt: Option) => {
        setPublishStatus(opt.value as string);
    };

    return (
        <Gutter>
            {loading && (
                <LoadingOverlay loadingText="Places aan het exporteren ..." />
            )}
            <h1>Places exporteren</h1>
            
            <div style={{ marginBottom: "20px" }}>
                <label htmlFor="collection" style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--theme-elevation-900)"
                }}>
                    Filter op collectie (optioneel)
                </label>
                <Select
                    isClearable={true}
                    options={collectionOptions}
                    onChange={(e) => handleCollectionChange(e as Option)}
                />
            </div>

            <div style={{ marginBottom: "20px" }}>
                <label htmlFor="publishStatus" style={{ 
                    display: "block", 
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--theme-elevation-900)"
                }}>
                    Filter op Status (optioneel)
                </label>
                <Select
                    isClearable={true}
                    options={statusOptions}
                    onChange={(e) => handleStatusChange(e as Option)}
                />
            </div>

            {collection ? (
                <div style={{ marginBottom: "20px" }}>
                    <label htmlFor="subtype" style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--theme-elevation-900)"
                    }}>
                        Filter op subtype (optioneel)
                    </label>
                    <Select
                        isClearable={true}
                        options={[
                            { label: "Alle subtypes", value: "" },
                            ...MAP_PLACE_SUBTYPE_OPTIONS_BY_COLLECTION[collection].map((row) => ({
                                label: row.label,
                                value: row.value,
                            })),
                        ]}
                        onChange={(e) => handleSubtypeChange(e as Option)}
                    />
                </div>
            ) : null}

            {errorMessage && (
                <div style={{ 
                    marginTop: "20px",
                    padding: "12px 16px",
                    borderRadius: "4px",
                    backgroundColor: "var(--theme-error-50)",
                    border: "1px solid var(--theme-error-500)"
                }}>
                    <div style={{ 
                        fontWeight: 600, 
                        marginBottom: "8px",
                        color: "var(--theme-error-900)"
                    }}>
                        ✗ Fout
                    </div>
                    <div style={{ 
                        fontSize: "12px",
                        color: "var(--theme-error-800)"
                    }}>
                        {errorMessage}
                    </div>
                </div>
            )}
            
            <div style={{ marginTop: "24px" }}>
                <Button onClick={handleSubmit}>Exporteren naar KML</Button>
            </div>
        </Gutter>
    );
};
