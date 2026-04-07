"use client";
import {
    Button,
    Gutter,
    LoadingOverlay,
    Select,
} from "@payloadcms/ui";
import React, { useState } from "react";
import { Option } from "@payloadcms/ui/elements/ReactSelect";

export const ExportDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<string | undefined>(undefined);
    const [publishStatus, setPublishStatus] = useState<string | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    const categoryOptions = [
        { label: 'Alle categorieën', value: '' },
        { label: 'Book', value: 'book' },
        { label: 'Food', value: 'food' },
        { label: 'Hygiene', value: 'hygiene' },
        { label: 'Community', value: 'community' },
        { label: 'Other', value: 'other' },
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
                    category: category || undefined,
                    publishStatus: publishStatus || undefined,
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");

                a.href = url;
                a.download = `listings-export-${Date.now()}.kml`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                setErrorMessage(
                    "Er is een fout opgetreden bij het exporteren van listings."
                );
            }
        } catch (error) {
            setErrorMessage(
                "Er is een fout opgetreden bij het exporteren van listings."
            );
        }

        setLoading(false);
    }

    const handleCategoryChange = (opt: Option) => {
        setCategory(opt.value as string);
    };

    const handleStatusChange = (opt: Option) => {
        setPublishStatus(opt.value as string);
    };

    return (
        <Gutter>
            {loading && (
                <LoadingOverlay loadingText="Listings aan het exporteren ..." />
            )}
            <h1>Listings exporteren</h1>
            
            <div style={{ marginBottom: "20px" }}>
                <label htmlFor="category" style={{ 
                    display: "block", 
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--theme-elevation-900)"
                }}>
                    Filter op Categorie (optioneel)
                </label>
                <Select
                    isClearable={true}
                    options={categoryOptions}
                    onChange={(e) => handleCategoryChange(e as Option)}
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
