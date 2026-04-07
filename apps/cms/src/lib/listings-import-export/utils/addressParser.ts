/**
 * Parse Dutch address format from KML extended data
 * 
 * Expected format:
 * - Adres: "Nieuwe Markt 5" (street + house number)
 * - Plaatsnaam: "3771 CB Barneveld" (zipcode + city)
 * - Provincie: "Gelderland"
 */

export interface ParsedAddress {
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  province?: string;
  country: string;
  fullAddress: string;
}

export function parseDutchAddress(
  adres?: string,
  plaatsnaam?: string,
  provincie?: string
): ParsedAddress {
  const result: ParsedAddress = {
    country: 'Netherlands',
    fullAddress: '',
  };

  // Parse "Adres" field (e.g., "Nieuwe Markt 5")
  if (adres) {
    // Match street name and house number
    // House number can be: "5", "5A", "5-7", "5 A", etc.
    const adresMatch = adres.match(/^(.+?)\s+(\d+[\w\-\s]*)$/);
    if (adresMatch) {
      result.street = adresMatch[1].trim();
      result.houseNumber = adresMatch[2].trim();
    } else {
      // If no number found, treat entire string as street
      result.street = adres.trim();
    }
  }

  // Parse "Plaatsnaam" field (e.g., "3771 CB Barneveld")
  if (plaatsnaam) {
    // Dutch zipcode format: "1234 AB" (4 digits, space, 2 letters)
    const plaatsnaamMatch = plaatsnaam.match(/^(\d{4}\s*[A-Z]{2})?\s*(.+)$/i);
    if (plaatsnaamMatch) {
      if (plaatsnaamMatch[1]) {
        result.zipCode = plaatsnaamMatch[1].trim().toUpperCase();
      }
      if (plaatsnaamMatch[2]) {
        result.city = plaatsnaamMatch[2].trim();
      }
    } else {
      // If no zipcode pattern found, treat entire string as city
      result.city = plaatsnaam.trim();
    }
  }

  // Add province
  if (provincie) {
    result.province = provincie.trim();
  }

  // Build full address string
  const parts: string[] = [];
  if (result.street) {
    let streetPart = result.street;
    if (result.houseNumber) {
      streetPart += ` ${result.houseNumber}`;
    }
    parts.push(streetPart);
  }
  if (result.zipCode && result.city) {
    parts.push(`${result.zipCode} ${result.city}`);
  } else if (result.city) {
    parts.push(result.city);
  }
  if (result.country) {
    parts.push(result.country);
  }

  result.fullAddress = parts.join(', ');

  return result;
}

