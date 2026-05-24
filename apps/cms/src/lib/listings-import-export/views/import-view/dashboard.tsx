"use client";
import React, { useState } from "react";
import {
    Button,
    Gutter,
    LoadingOverlay,
    Select,
} from "@payloadcms/ui";
import { Option } from "@payloadcms/ui/elements/ReactSelect";
import {
  MAP_PLACE_COLLECTION_SLUGS,
  MAP_PLACE_LABEL_BY_COLLECTION,
  MAP_PLACE_SUBTYPE_OPTIONS_BY_COLLECTION,
  type MapPlaceCollectionSlug,
} from "../../../../constants/mapPlaces";

class ImportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ImportError";
    }
}

const COLLECTION_OPTIONS = MAP_PLACE_COLLECTION_SLUGS.map((collection) => ({
  label: MAP_PLACE_LABEL_BY_COLLECTION[collection],
  value: collection,
}));

function subtypeSelectOptions(collection: MapPlaceCollectionSlug) {
  return MAP_PLACE_SUBTYPE_OPTIONS_BY_COLLECTION[collection];
}

export const ImportDashboard = () => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [collection, setCollection] = useState<MapPlaceCollectionSlug>("kiosks");
  const [subtype, setSubtype] = useState<string>("books");
  const [publishStatus, setPublishStatus] = useState('draft');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (next) {
      setFile(next);
    }
  };

  const handleCollectionChange = (opt: Option) => {
    const nextType = opt.value as MapPlaceCollectionSlug;
    setCollection(nextType);
    const opts = subtypeSelectOptions(nextType);
    setSubtype(String(opts[0].value));
  };

  const handleSubtypeChange = (opt: Option) => {
    setSubtype(opt.value as string);
  };

  const handleStatusChange = (opt: Option) => {
    setPublishStatus(opt.value as string);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(undefined);
    setErrorMessage(undefined);

    try {
      if (!file) {
        throw new ImportError("Selecteer een KML-bestand");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("_payload", JSON.stringify({
        collection,
        subtype,
        publishStatus,
        ownerEmail: ownerEmail || undefined
      }));

      const response = await fetch('/api/listings-import-export/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new ImportError(errorText.message);
      }

      const result = await response.json();
      if (result.errors && result.errors.length > 0) {
        throw new ImportError(result.errors.join("\n"));
      }

      setMessage(
        `Importeren gelukt\n${result.created} places aangemaakt`
      );
      setFile(undefined);
    } catch (e) {
      if (e instanceof ImportError) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage(
          "Er is een onbekende fout opgetreden tijdens het importeren van places."
        );
      }
    }

    setLoading(false);
  };

  const subtypeOptions = [...subtypeSelectOptions(collection)];

  const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Live', value: 'live' },
  ];

  return (
    <Gutter>
      {loading && (
        <LoadingOverlay loadingText="Places aan het importeren ..." />
      )}
      <h1>Places importeren</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="file" style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--theme-elevation-900)"
          }}>
            KML bestand
          </label>
          <input
            name="file"
            type="file"
            accept=".kml"
            onChange={handleFileChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--theme-elevation-200)",
              borderRadius: "4px",
              fontSize: "13px",
              backgroundColor: "var(--theme-elevation-0)",
              color: "var(--theme-elevation-900)",
              cursor: "pointer"
            }}
          />
          {file && (
            <div style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "var(--theme-elevation-600)"
            }}>
              Geselecteerd: {file.name}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="collection" style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--theme-elevation-900)"
          }}>
            Collectie
          </label>
          <Select
            isClearable={false}
            options={COLLECTION_OPTIONS}
            value={COLLECTION_OPTIONS.find(opt => opt.value === collection)}
            onChange={(e) => handleCollectionChange(e as Option)}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="subtype" style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--theme-elevation-900)"
          }}>
            Subtype
          </label>
          <Select
            isClearable={false}
            options={subtypeOptions}
            value={subtypeOptions.find(opt => opt.value === subtype)}
            onChange={(e) => handleSubtypeChange(e as Option)}
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
            Publicatie Status
          </label>
          <Select
            isClearable={false}
            options={statusOptions}
            value={statusOptions.find(opt => opt.value === publishStatus)}
            onChange={(e) => handleStatusChange(e as Option)}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="ownerEmail" style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--theme-elevation-900)"
          }}>
            Eigenaar Email (optioneel)
          </label>
          <input
            name="ownerEmail"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="info@deelbaar.com"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--theme-elevation-200)",
              borderRadius: "4px",
              fontSize: "13px",
              backgroundColor: "var(--theme-elevation-0)",
              color: "var(--theme-elevation-900)"
            }}
          />
        </div>

        {(errorMessage || message) && (
          <div style={{
            marginTop: "20px",
            padding: "12px 16px",
            borderRadius: "4px",
            backgroundColor: message ? "var(--theme-success-50)" : "var(--theme-error-50)",
            border: `1px solid ${message ? "var(--theme-success-500)" : "var(--theme-error-500)"}`
          }}>
            <div style={{
              fontWeight: 600,
              marginBottom: "8px",
              color: message ? "var(--theme-success-900)" : "var(--theme-error-900)"
            }}>
              {message ? "✓ Succes" : "✗ Fout"}
            </div>
            <pre style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontSize: "12px",
              color: message ? "var(--theme-success-800)" : "var(--theme-error-800)"
            }}>
              {message || errorMessage}
            </pre>
          </div>
        )}
        <div style={{ marginTop: "24px" }}>
          <Button type="submit">Importeren</Button>
        </div>
      </form>
    </Gutter>
  );
};
